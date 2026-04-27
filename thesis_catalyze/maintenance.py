"""Background retention sweep + daily SQLite hot backup.

Runs as a single hourly thread alongside the detection loop. Deletes old
captures by mtime (never touches the live DB files), and once per
calendar day takes a hot backup of catalyze.db using
sqlite3.Connection.backup() — safe to call while the writer is active.
"""

import sqlite3
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

KEEP_FULL_DAYS    = 7    # capture_*_full.jpg (largest files)
KEEP_DETAIL_DAYS  = 30   # capture_*_crop.jpg, *_overlay.jpg, *.json
KEEP_BACKUP_DAYS  = 14

SWEEP_INTERVAL_S  = 3600

# Files the sweep must NEVER delete.
_DB_FILE_NAMES = {"catalyze.db", "catalyze.db-wal", "catalyze.db-shm", "catalyze.db-journal"}


def maintenance_loop(captures_dir: Path, db_path: Path, stop_event: threading.Event) -> None:
    backup_dir = captures_dir / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    last_backup_date: Optional[str] = None

    while not stop_event.is_set():
        try:
            sweep_old_files(captures_dir)
            today = datetime.now().strftime("%Y%m%d")
            if today != last_backup_date and backup_db(db_path, backup_dir, today):
                last_backup_date = today
            prune_old_backups(backup_dir)
        except Exception as e:
            print(f"[maintenance] tick failed: {e}", flush=True)
        stop_event.wait(SWEEP_INTERVAL_S)


def sweep_old_files(captures_dir: Path) -> int:
    if not captures_dir.exists():
        return 0
    now = time.time()
    full_cutoff   = now - KEEP_FULL_DAYS   * 86400
    detail_cutoff = now - KEEP_DETAIL_DAYS * 86400
    deleted = 0
    for p in captures_dir.iterdir():
        if not p.is_file():
            continue
        if p.name in _DB_FILE_NAMES:
            continue
        try:
            mtime = p.stat().st_mtime
        except FileNotFoundError:
            continue
        cutoff = full_cutoff if p.name.endswith("_full.jpg") else detail_cutoff
        if mtime < cutoff:
            try:
                p.unlink()
                deleted += 1
            except OSError as e:
                print(f"[maintenance] could not delete {p.name}: {e}", flush=True)
    if deleted:
        print(f"[maintenance] swept {deleted} old capture files", flush=True)
    return deleted


def backup_db(db_path: Path, backup_dir: Path, date_stamp: str) -> bool:
    if not db_path.exists():
        return False
    dst_path = backup_dir / f"catalyze-{date_stamp}.db"
    if dst_path.exists():
        return True  # already backed up today
    src = sqlite3.connect(str(db_path))
    dst = sqlite3.connect(str(dst_path))
    try:
        with dst:
            src.backup(dst)
    finally:
        src.close()
        dst.close()
    print(f"[maintenance] backup written: {dst_path.name}", flush=True)
    return True


def prune_old_backups(backup_dir: Path) -> int:
    if not backup_dir.exists():
        return 0
    cutoff = time.time() - KEEP_BACKUP_DAYS * 86400
    deleted = 0
    for p in backup_dir.glob("catalyze-*.db"):
        try:
            if p.stat().st_mtime < cutoff:
                p.unlink()
                deleted += 1
        except FileNotFoundError:
            continue
    if deleted:
        print(f"[maintenance] pruned {deleted} old backups", flush=True)
    return deleted


def start(captures_dir: Path, db_path: Path) -> Tuple[threading.Thread, threading.Event]:
    stop_event = threading.Event()
    t = threading.Thread(
        target=maintenance_loop,
        args=(captures_dir, db_path, stop_event),
        daemon=True,
    )
    t.start()
    return t, stop_event


# To rsync backups off-Pi later, add something like:
#   subprocess.run(["rsync", "-a", str(backup_dir) + "/", "user@host:/path/"])
# at the end of maintenance_loop.
