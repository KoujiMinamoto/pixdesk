#!/usr/bin/env python3
"""Expand the Novita duty roster (排班表 + 轮班表) into absolute on-duty intervals.

Two source tables:
  1) 排班表: shift-letter per weekday + time slot.
  2) 轮班表: which letter each person holds, rotating every 4 weeks.

Combine -> for any timestamp we know who was at the keyboard. support is a SHARED
login, so the roster is the only way to attribute work to a real person.

Decisions (from user):
  - 凌晨班 "周一早结束": the letter in column 周W covers (W-1) 23:01 -> W 07:00.
  - timezone = Asia/Shanghai (UTC+8); messages.ts is UTC, so we emit UTC bounds.
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Asia/Shanghai")
UTC = ZoneInfo("UTC")

# Rotation blocks: 8 blocks of exactly 28 days from 2026-06-15.
BLOCK_START = datetime(2026, 6, 15, tzinfo=TZ)
N_BLOCKS = 8
# letter held by each person per block index 0..7
ROTATION = {
    "绿巨人": ["B", "D", "A", "C", "E", "B", "D", "A"],
    "阿杰":   ["D", "A", "C", "E", "B", "D", "A", "C"],
    "温迪":   ["E", "B", "D", "A", "C", "E", "B", "D"],
    "火娃":   ["A", "C", "E", "B", "D", "A", "C", "E"],
    "迪卢克": ["C", "E", "B", "D", "A", "C", "E", "B"],
}

# Shift templates per weekday (Mon=0 .. Sun=6).
# Each entry: (shift_name, letter, (start_day_delta,"HH:MM"), (end_day_delta,"HH:MM"))
WD = {
    0: [("凌晨", "B", (-1, "23:01"), (0, "07:00")), ("白班1", "D", (0, "07:01"), (0, "13:00")),
        ("白班2", "E", (0, "13:00"), (0, "21:00")), ("晚班", "A", (0, "21:01"), (0, "23:00"))],
    1: [("凌晨", "B", (-1, "23:01"), (0, "07:00")), ("白班1", "D", (0, "07:01"), (0, "13:00")),
        ("白班2", "E", (0, "13:00"), (0, "21:00")), ("晚班", "A", (0, "21:01"), (0, "23:00"))],
    2: [("凌晨", "B", (-1, "23:01"), (0, "07:00")), ("白班1", "D", (0, "07:01"), (0, "13:00")),
        ("白班2", "E", (0, "13:00"), (0, "21:00")), ("晚班", "A", (0, "21:01"), (0, "23:00"))],
    3: [("凌晨", "C", (-1, "23:01"), (0, "07:00")), ("白班1", "D", (0, "07:01"), (0, "13:00")),
        ("白班2", "E", (0, "13:00"), (0, "21:00")), ("晚班", "B", (0, "21:01"), (0, "23:00"))],
    4: [("凌晨", "C", (-1, "23:01"), (0, "07:00")), ("白班1", "D", (0, "07:01"), (0, "13:00")),
        ("白班2", "E", (0, "13:00"), (0, "21:00")), ("晚班", "B", (0, "21:01"), (0, "23:00"))],
    # weekend: 2 shifts cover the full day. C starts the night before (consistent
    # with the 凌晨 "morning of" reading), A is same-day midday->night.
    5: [("周末夜", "C", (-1, "23:00"), (0, "11:00")), ("周末日", "A", (0, "11:30"), (0, "23:00"))],
    6: [("周末夜", "C", (-1, "23:00"), (0, "11:00")), ("周末日", "A", (0, "11:30"), (0, "23:00"))],
}


def block_index(d: datetime) -> int | None:
    days = (d.date() - BLOCK_START.date()).days
    if days < 0:
        return None
    bi = days // 28
    return bi if bi < N_BLOCKS else None


def letter_to_person(letter: str, bi: int) -> str | None:
    for person, letters in ROTATION.items():
        if letters[bi] == letter:
            return person
    return None


def _dt(label_date, day_delta, hhmm):
    h, m = map(int, hhmm.split(":"))
    return datetime.combine((label_date + timedelta(days=day_delta)), datetime.min.time(),
                            tzinfo=TZ).replace(hour=h, minute=m)


def expand():
    intervals = []
    cur = BLOCK_START.date()
    end = (BLOCK_START + timedelta(days=28 * N_BLOCKS)).date()
    while cur < end:
        wd = cur.weekday()
        bi = block_index(datetime.combine(cur, datetime.min.time(), tzinfo=TZ))
        for shift_name, letter, s_off, e_off in WD[wd]:
            person = letter_to_person(letter, bi) if bi is not None else None
            start = _dt(cur, *s_off)
            endt = _dt(cur, *e_off)
            intervals.append((start, endt, letter, person, shift_name, cur.isoformat()))
        cur += timedelta(days=1)
    return intervals


if __name__ == "__main__":
    import sys
    iv = expand()
    if len(sys.argv) > 1 and sys.argv[1] == "--sql":
        print("CREATE TABLE IF NOT EXISTS agent.shift_roster ("
              "start_ts timestamptz NOT NULL, end_ts timestamptz NOT NULL, "
              "person text NOT NULL, shift_letter text, shift_name text, "
              "duty_date date, PRIMARY KEY (start_ts, person));")
        print("CREATE INDEX IF NOT EXISTS shift_roster_range "
              "ON agent.shift_roster (start_ts, end_ts);")
        print("TRUNCATE agent.shift_roster;")
        vals = []
        for s, e, L, p, name, lbl in iv:
            if not p:
                continue
            su = s.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S+00")
            eu = e.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S+00")
            pp = p.replace("'", "''"); nm = name.replace("'", "''")
            vals.append(f"('{su}','{eu}','{pp}','{L}','{nm}','{lbl}')")
        for i in range(0, len(vals), 200):
            print("INSERT INTO agent.shift_roster "
                  "(start_ts,end_ts,person,shift_letter,shift_name,duty_date) VALUES "
                  + ",".join(vals[i:i + 200]) + ";")
        print("SELECT count(*) AS rows, min(start_ts) f, max(end_ts) t FROM agent.shift_roster;")
        sys.exit(0)
    print(f"total intervals {BLOCK_START.date()} .. {end if False else ''}: {len(iv)}")
    # 1) block->person->letter table
    print("\n=== rotation blocks (letter per person) ===")
    for bi in range(N_BLOCKS):
        bs = (BLOCK_START + timedelta(days=28 * bi)).date()
        be = (BLOCK_START + timedelta(days=28 * (bi + 1) - 1)).date()
        mapping = {letter_to_person(L, bi): L for L in "ABCDE"}
        print(f"  block{bi} {bs}~{be}: " + " ".join(f"{p}={l}" for p, l in
              sorted(mapping.items(), key=lambda x: x[1])))
    # 2) one sample week (first full Mon-Sun in range), local time + who
    print("\n=== sample week (local time, person on duty) ===")
    sample = [i for i in iv if datetime(2026, 6, 22, tzinfo=TZ) <= i[0] < datetime(2026, 6, 29, tzinfo=TZ)]
    wkd = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    for s, e, L, p, name, lbl in sample:
        d = datetime.fromisoformat(lbl)
        print(f"  {wkd[d.weekday()]} {lbl} {name:6} {L} -> {p or '(?)':5} "
              f"[{s.strftime('%m-%d %H:%M')} ~ {e.strftime('%m-%d %H:%M')}]")
    # 3) coverage check for that week: total covered hours (should be ~ 7*24 minus gaps)
    covered = sum((e - s).total_seconds() for s, e, *_ in sample) / 3600
    print(f"\n  sample-week covered hours: {covered:.1f} (7*24=168; small gaps expected)")
