import os, sqlite3, psycopg2

PG = os.environ["DATABASE_URL"]
SLACK = os.environ.get("SLACK_DB", "/opt/beeper-matrix/data/mautrix-slack/slack.db")
DISCORD = os.environ.get("DISCORD_DB", "/opt/beeper-matrix/data/mautrix-discord/discord.db")


def open_ro(path):
    uri = f"file:{path}?mode=ro&immutable=0"
    con = sqlite3.connect(uri, uri=True, timeout=10.0)
    con.row_factory = sqlite3.Row
    return con


def slack_rows(con):
    out = []
    for r in con.execute("select id, receiver, name, mxid from portal"):
        pid = r["id"] or ""
        if "-" not in pid:
            continue
        team, channel = pid.split("-", 1)
        if not team or not channel:
            continue
        out.append(("slack", team, channel, r["name"] or "", r["mxid"] or None))
    return out


def discord_rows(con):
    login = ""
    try:
        row = con.execute(
            'select dcid from "user" where discord_token is not null limit 1'
        ).fetchone()
        if row and row["dcid"]:
            login = row["dcid"]
    except Exception:
        pass
    out = []
    for r in con.execute(
        "select dcid, receiver, dc_guild_id, name, plain_name, mxid from portal"
    ):
        chan = r["dcid"] or ""
        if not chan:
            continue
        ws = r["dc_guild_id"] or r["receiver"] or ""
        if not ws and login:
            ws = f"direct:{login}"
        if not ws:
            continue
        name = r["name"] or r["plain_name"] or ""
        out.append(("discord", ws, chan, name, r["mxid"] or None))
    return out


SQL = """
insert into agent.channels
  (platform, workspace_id, channel_id, channel_name, matrix_room_id, updated_at)
values (%s, %s, %s, %s, %s, now())
on conflict (platform, workspace_id, channel_id) do update set
  channel_name = coalesce(nullif(excluded.channel_name, ''), agent.channels.channel_name),
  matrix_room_id = coalesce(excluded.matrix_room_id, agent.channels.matrix_room_id),
  updated_at = now()
where agent.channels.channel_name is distinct from coalesce(nullif(excluded.channel_name, ''), agent.channels.channel_name)
   or agent.channels.matrix_room_id is distinct from coalesce(excluded.matrix_room_id, agent.channels.matrix_room_id)
returning xmax = 0 as is_insert
"""

slack = open_ro(SLACK)
discord = open_ro(DISCORD)
sr = slack_rows(slack)
dr = discord_rows(discord)
print(f"candidates: slack={len(sr)}, discord={len(dr)}")

pg = psycopg2.connect(PG)
pg.autocommit = True
ins = upd = noop = 0
with pg.cursor() as cur:
    for row in sr + dr:
        cur.execute(SQL, row)
        r = cur.fetchone()
        if r is None:
            noop += 1
        elif r[0]:
            ins += 1
        else:
            upd += 1
print(f"inserted={ins} updated={upd} noop={noop}")
