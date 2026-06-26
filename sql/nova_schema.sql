-- Nova Brain external-API mirror schema (Novita read-only data synced from
-- the internal API via 185). Lives in the Tencent pixdesk-pg synapse DB.
-- Contains customer PII (name/email) — internal access only.
CREATE SCHEMA IF NOT EXISTS nova;

-- 4.2 customer revenue/cost/margin (card 2100 resale). Per (uuid, window).
CREATE TABLE IF NOT EXISTS nova.customer_revenue (
  uuid              text NOT NULL,
  window_period     text NOT NULL,            -- 1d / 7d / 30d
  rank              int,
  name              text,
  email             text,
  sales             text,
  revenue_usd       double precision,
  revenue_cny       double precision,
  cost_cny          double precision,
  gross_margin_cny  double precision,
  gross_margin_rate double precision,
  rate_usd_cny      double precision,
  fetched_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (uuid, window_period)
);
CREATE INDEX IF NOT EXISTS nova_revenue_window_idx ON nova.customer_revenue(window_period, revenue_usd DESC);

-- 4.3 SLA / model capacity. One row per model.
CREATE TABLE IF NOT EXISTS nova.sla_model (
  model         text PRIMARY KEY,
  main_tpm      double precision,
  peak24h       double precision,
  peak_p90      double precision,
  peak_p95      double precision,
  headroom      double precision,
  headroom_p90  double precision,
  headroom_p95  double precision,
  n_main        int,
  main_rpm      double precision,
  rpm_peak24h   double precision,
  rpm_peak_p90  double precision,
  rpm_peak_p95  double precision,
  rpm_headroom  double precision,
  raw           jsonb NOT NULL DEFAULT '{}',
  fetched_at    timestamptz NOT NULL DEFAULT now()
);

-- 4.4 pricing / discounts. One row per product (displayName).
CREATE TABLE IF NOT EXISTS nova.pricing_model (
  display_name        text PRIMARY KEY,
  llm_series          text,
  context_size        bigint,
  cache_hit_rate_24h  double precision,
  price_unit          text,
  base_price          jsonb,
  redline_price       jsonb,
  input_discount_pct  double precision,
  output_discount_pct double precision,
  fetched_at          timestamptz NOT NULL DEFAULT now()
);

-- 4.5 OR competitor intel. One row per data_date (whole snapshot as jsonb).
CREATE TABLE IF NOT EXISTS nova.or_intel_snapshot (
  data_date   text PRIMARY KEY,
  snapshot    jsonb NOT NULL,
  scraped_at  timestamptz,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);
