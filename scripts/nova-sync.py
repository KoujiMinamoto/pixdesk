#!/usr/bin/env python3
"""Nova Brain external-API → Tencent pixdesk-pg sync (runs on 185).

Pulls the 4 read-only Novita endpoints from the internal API and upserts them
into the nova.* schema on the Tencent mirror, reached via the existing
SSH-out trust (no new ports). Stdlib only (urllib) so 185 needs no pip.

Config via env (see /etc/nova-sync.env, mode 600):
  NOVA_EXTERNAL_API_KEY   bearer token
  NOVA_BASE_MAIN          default http://192.168.72.190:3000
  NOVA_BASE_ORINTEL       default http://192.168.70.123:3000
  NOVA_TENCENT_SSH        default root@124.221.98.230
  NOVA_TENCENT_SSH_KEY    default /root/.ssh/pixdesk-pg-tunnel
  NOVA_PG_CONTAINER       default pixdesk-pg
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

KEY = os.environ.get("NOVA_EXTERNAL_API_KEY", "")
BASE_MAIN = os.environ.get("NOVA_BASE_MAIN", "http://192.168.72.190:3000")
BASE_ORINTEL = os.environ.get("NOVA_BASE_ORINTEL", "http://192.168.70.123:3000")
SSH_HOST = os.environ.get("NOVA_TENCENT_SSH", "root@124.221.98.230")
SSH_KEY = os.environ.get("NOVA_TENCENT_SSH_KEY", "/root/.ssh/pixdesk-pg-tunnel")
SSH_KNOWN = os.environ.get("NOVA_TENCENT_SSH_KNOWN", "/root/.ssh/pixdesk-pg-tunnel.known_hosts")
PG_CONTAINER = os.environ.get("NOVA_PG_CONTAINER", "pixdesk-pg")
PG_USER = os.environ.get("NOVA_PG_USER", "synapse")
PG_DB = os.environ.get("NOVA_PG_DB", "synapse")


def log(msg):
    print(f"{time.strftime('%Y-%m-%dT%H:%M:%S')} {msg}", flush=True)


def fetch(base, path, timeout=40):
    """GET a JSON endpoint with bearer auth. Returns parsed dict or None."""
    url = f"{base}{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {KEY}"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode())
        except Exception as exc:
            log(f"fetch {path} attempt {attempt+1} failed: {exc}")
            time.sleep(2 * (attempt + 1))
    return None


def q(v):
    """SQL-literal a Python value (None->NULL, numbers raw, else quoted text)."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def run_sql(sql):
    """Pipe SQL into the Tencent pixdesk-pg via the existing SSH-out trust."""
    ssh = [
        "ssh", "-i", SSH_KEY, "-o", "IdentitiesOnly=yes",
        "-o", f"UserKnownHostsFile={SSH_KNOWN}", "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=15", SSH_HOST,
        f"docker exec -i {PG_CONTAINER} psql -U {PG_USER} -d {PG_DB} -v ON_ERROR_STOP=1",
    ]
    p = subprocess.run(ssh, input=sql.encode(), capture_output=True)
    if p.returncode != 0:
        log(f"psql failed rc={p.returncode}: {p.stderr.decode()[:400]}")
        return False
    return True


def sync_revenue():
    """customer revenue for 1d/7d/30d. Empty windows are skipped (don't wipe)."""
    n = 0
    for win in ("1d", "7d", "30d"):
        d = fetch(BASE_MAIN, f"/api/external/customers/revenue?window={win}&limit=200")
        if not d or not d.get("ok"):
            log(f"revenue {win}: fetch failed/!ok")
            continue
        rate = d.get("rate_usd_cny")
        rows = d.get("data") or []
        if not rows:
            log(f"revenue {win}: empty, skip")
            continue
        # dedupe by uuid (PK is uuid+window) — keep last
        rows = list({r.get("uuid"): r for r in rows if r.get("uuid")}.values())
        vals = []
        for r in rows:
            vals.append("(" + ",".join([
                q(r.get("uuid")), q(win), q(r.get("rank")), q(r.get("name")),
                q(r.get("email")), q(r.get("sales")), q(r.get("revenue_usd")),
                q(r.get("revenue_cny")), q(r.get("cost_cny")),
                q(r.get("gross_margin_cny")), q(r.get("gross_margin_rate")),
                q(rate), "now()",
            ]) + ")")
        sql = (
            "INSERT INTO nova.customer_revenue (uuid,window_period,rank,name,email,"
            "sales,revenue_usd,revenue_cny,cost_cny,gross_margin_cny,"
            "gross_margin_rate,rate_usd_cny,fetched_at) VALUES\n"
            + ",\n".join(vals) +
            "\nON CONFLICT (uuid,window_period) DO UPDATE SET "
            "rank=EXCLUDED.rank,name=EXCLUDED.name,email=EXCLUDED.email,"
            "sales=EXCLUDED.sales,revenue_usd=EXCLUDED.revenue_usd,"
            "revenue_cny=EXCLUDED.revenue_cny,cost_cny=EXCLUDED.cost_cny,"
            "gross_margin_cny=EXCLUDED.gross_margin_cny,"
            "gross_margin_rate=EXCLUDED.gross_margin_rate,"
            "rate_usd_cny=EXCLUDED.rate_usd_cny,fetched_at=now();"
        )
        if run_sql(sql):
            n += len(rows)
            log(f"revenue {win}: upserted {len(rows)}")
    return n


def sync_sla():
    """Model capacity. List models, then fetch each model's detail (rate-limited)."""
    lst = fetch(BASE_MAIN, "/api/external/sla/model")
    if not lst or not lst.get("ok"):
        log("sla: model list fetch failed")
        return 0
    models = ((lst.get("data") or {}).get("models")) or []
    # dedupe model names (list may repeat) to avoid ON CONFLICT double-hit
    models = list(dict.fromkeys(models))
    log(f"sla: {len(models)} models to fetch")
    vals = []
    for i, m in enumerate(models):
        d = fetch(BASE_MAIN, f"/api/external/sla/model?model={urllib.parse.quote(m)}")
        time.sleep(0.3)  # be gentle per docs
        if not d or not d.get("ok"):
            continue
        it = (d.get("data") or {}).get("item") or {}
        if not it:
            continue
        vals.append("(" + ",".join([
            q(m), q(it.get("mainTpm")), q(it.get("peak24h")), q(it.get("peakP90")),
            q(it.get("peakP95")), q(it.get("headroom")), q(it.get("headroomP90")),
            q(it.get("headroomP95")), q(it.get("nMain")), q(it.get("mainRpm")),
            q(it.get("rpmPeak24h")), q(it.get("rpmPeakP90")), q(it.get("rpmPeakP95")),
            q(it.get("rpmHeadroom")), q(it), "now()",
        ]) + ")")
    if not vals:
        log("sla: no model details collected")
        return 0
    sql = (
        "INSERT INTO nova.sla_model (model,main_tpm,peak24h,peak_p90,peak_p95,"
        "headroom,headroom_p90,headroom_p95,n_main,main_rpm,rpm_peak24h,"
        "rpm_peak_p90,rpm_peak_p95,rpm_headroom,raw,fetched_at) VALUES\n"
        + ",\n".join(vals) +
        "\nON CONFLICT (model) DO UPDATE SET main_tpm=EXCLUDED.main_tpm,"
        "peak24h=EXCLUDED.peak24h,peak_p90=EXCLUDED.peak_p90,"
        "peak_p95=EXCLUDED.peak_p95,headroom=EXCLUDED.headroom,"
        "headroom_p90=EXCLUDED.headroom_p90,headroom_p95=EXCLUDED.headroom_p95,"
        "n_main=EXCLUDED.n_main,main_rpm=EXCLUDED.main_rpm,"
        "rpm_peak24h=EXCLUDED.rpm_peak24h,rpm_peak_p90=EXCLUDED.rpm_peak_p90,"
        "rpm_peak_p95=EXCLUDED.rpm_peak_p95,rpm_headroom=EXCLUDED.rpm_headroom,"
        "raw=EXCLUDED.raw,fetched_at=now();"
    )
    if run_sql(sql):
        log(f"sla: upserted {len(vals)}")
        return len(vals)
    return 0


def sync_pricing():
    d = fetch(BASE_MAIN, "/api/external/pricing/models")
    if not d or not d.get("ok"):
        log("pricing: fetch failed")
        return 0
    prods = (d.get("data") or {}).get("products") or []
    if not prods:
        log("pricing: empty")
        return 0
    # Dedupe by displayName (API can list the same product twice) — keep last,
    # else ON CONFLICT errors on duplicate PK within one INSERT.
    by_name = {}
    for p in prods:
        if p.get("displayName"):
            by_name[p["displayName"]] = p
    vals = []
    for p in by_name.values():
        vals.append("(" + ",".join([
            q(p.get("displayName")), q(p.get("llmSeries")), q(p.get("contextSize")),
            q(p.get("cacheHitRate24h")), q(p.get("priceUnit")),
            q(p.get("basePrice")), q(p.get("redlinePrice")),
            q(p.get("inputDiscountRatePct")), q(p.get("outputDiscountRatePct")),
            "now()",
        ]) + ")")
    sql = (
        "INSERT INTO nova.pricing_model (display_name,llm_series,context_size,"
        "cache_hit_rate_24h,price_unit,base_price,redline_price,"
        "input_discount_pct,output_discount_pct,fetched_at) VALUES\n"
        + ",\n".join(vals) +
        "\nON CONFLICT (display_name) DO UPDATE SET llm_series=EXCLUDED.llm_series,"
        "context_size=EXCLUDED.context_size,"
        "cache_hit_rate_24h=EXCLUDED.cache_hit_rate_24h,"
        "price_unit=EXCLUDED.price_unit,base_price=EXCLUDED.base_price,"
        "redline_price=EXCLUDED.redline_price,"
        "input_discount_pct=EXCLUDED.input_discount_pct,"
        "output_discount_pct=EXCLUDED.output_discount_pct,fetched_at=now();"
    )
    if run_sql(sql):
        log(f"pricing: upserted {len(vals)}")
        return len(vals)
    return 0


def sync_orintel():
    d = fetch(BASE_ORINTEL, "/api/external/or-intel", timeout=60)
    if not d or not d.get("ok"):
        log("or-intel: fetch failed")
        return 0
    data = d.get("data") or {}
    data_date = data.get("dataDate") or time.strftime("%Y-%m-%d")
    scraped = (data.get("meta") or {}).get("lastScrapedAt")
    sql = (
        "INSERT INTO nova.or_intel_snapshot (data_date,snapshot,scraped_at,fetched_at) "
        f"VALUES ({q(data_date)},{q(data)},{q(scraped)},now()) "
        "ON CONFLICT (data_date) DO UPDATE SET snapshot=EXCLUDED.snapshot,"
        "scraped_at=EXCLUDED.scraped_at,fetched_at=now();"
    )
    if run_sql(sql):
        log(f"or-intel: upserted snapshot {data_date}")
        return 1
    return 0


def main():
    if not KEY:
        log("FATAL: NOVA_EXTERNAL_API_KEY not set")
        return 2
    log("nova-sync start")
    try:
        sync_revenue()
    except Exception as exc:
        log(f"revenue error: {exc}")
    try:
        sync_pricing()
    except Exception as exc:
        log(f"pricing error: {exc}")
    try:
        sync_orintel()
    except Exception as exc:
        log(f"or-intel error: {exc}")
    try:
        sync_sla()
    except Exception as exc:
        log(f"sla error: {exc}")
    log("nova-sync done")
    return 0


if __name__ == "__main__":
    sys.exit(main())



