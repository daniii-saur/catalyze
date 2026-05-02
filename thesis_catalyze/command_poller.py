"""
command_poller.py

Background thread that polls the Supabase `commands` table every
POLL_INTERVAL seconds for rows where type='clean' and status='pending'.

When a matching row is found:
  1. Immediately marks it 'running' (prevents duplicate execution)
  2. Calls motor.run_cleaning_cycle()
  3. Marks it 'done' with executed_at timestamp, or 'failed' on error

This module is entirely independent of the detection loop — it runs as a
separate daemon thread that can be started/stopped cleanly.
"""
from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Optional, Tuple

from dotenv import load_dotenv

load_dotenv()

POLL_INTERVAL = 3   # seconds between Supabase polls


def _get_client():
    """Build and return a Supabase client, or None if env vars are missing."""
    try:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            print("[cmd] SUPABASE_URL / SUPABASE_KEY not set — command polling disabled", flush=True)
            return None
        return create_client(url, key)
    except Exception as exc:
        print(f"[cmd] failed to init Supabase client: {exc}", flush=True)
        return None


def _handle_one(client, dry_run: bool) -> bool:
    """Claim and execute the oldest pending clean command.

    Returns True if a command was processed, False if the queue was empty.
    """
    try:
        resp = (
            client.table("commands")
            .select("id")
            .eq("type", "clean")
            .eq("status", "pending")
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        print(f"[cmd] poll error: {type(exc).__name__}: {exc}", flush=True)
        return False

    if not resp.data:
        # Silently skip if no pending commands (avoid spam)
        return False

    cmd_id = resp.data[0]["id"]
    print(f"[cmd] claiming command id={cmd_id} dry_run={dry_run}", flush=True)

    # Atomically mark as 'running' so a second Pi instance won't duplicate it
    try:
        client.table("commands").update({"status": "running"}).eq("id", cmd_id).eq("status", "pending").execute()
    except Exception as exc:
        print(f"[cmd] could not claim command {cmd_id}: {exc}", flush=True)
        return False

    # Execute the motor cycle
    try:
        import motor
        motor.run_cleaning_cycle(simulate=dry_run)
        executed_at = datetime.now(timezone.utc).isoformat()
        client.table("commands").update({
            "status":      "done",
            "executed_at": executed_at,
        }).eq("id", cmd_id).execute()
        print(f"[cmd] command {cmd_id} completed at {executed_at}", flush=True)
    except Exception as exc:
        try:
            client.table("commands").update({"status": "failed"}).eq("id", cmd_id).execute()
        except Exception:
            pass
        print(f"[cmd] command {cmd_id} FAILED: {exc}", flush=True)

    return True


def _poll_loop(stop_event: threading.Event, dry_run: bool) -> None:
    client = _get_client()
    if client is None:
        return

    print("[cmd] command poller started", flush=True)
    while not stop_event.is_set():
        _handle_one(client, dry_run)
        stop_event.wait(POLL_INTERVAL)
    print("[cmd] command poller stopped", flush=True)


def start(dry_run: bool = False) -> Tuple[threading.Thread, threading.Event]:
    """Start the command polling background thread.

    Returns (thread, stop_event).  Call stop_event.set() to shut it down.
    """
    stop_event = threading.Event()
    t = threading.Thread(
        target=_poll_loop,
        args=(stop_event, dry_run),
        daemon=True,
        name="command-poller",
    )
    t.start()
    return t, stop_event
