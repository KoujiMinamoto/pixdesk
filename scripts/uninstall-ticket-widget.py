#!/usr/bin/env python3
"""Remove the PixDesk ticket widget from every room admin is in.

Sends an empty content for the m.widget / im.vector.modular.widgets state
events with state_key=pixdesk-tickets, which Element interprets as "widget
removed". Idempotent.
"""
import os
import sys

# Reuse helpers from install-ticket-widget.py via import-from-path.
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import importlib.util
spec = importlib.util.spec_from_file_location(
    "install_ticket_widget", os.path.join(HERE, "install-ticket-widget.py"),
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def main() -> int:
    rooms = mod.joined_rooms()
    removed = 0
    for room_id in rooms:
        existing = mod.get_state(room_id, "im.vector.modular.widgets", mod.WIDGET_STATE_KEY)
        if not existing:
            continue
        for ev_type in ("m.widget", "im.vector.modular.widgets"):
            code, body = mod.put_state(room_id, ev_type, mod.WIDGET_STATE_KEY, {})
            if code != 200:
                print(f"  [FAIL] {room_id} {ev_type}: {code} {body}", file=sys.stderr)
        print(f"  [REMOVED] {room_id}")
        removed += 1
    print(f"\nDONE. removed from {removed} room(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
