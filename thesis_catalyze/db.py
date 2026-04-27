"""SQLite store for detection events. Single-file db at captures/catalyze.db."""

import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

_LOCK = threading.Lock()
_DB_PATH: Optional[Path] = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS detections (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp     TEXT    NOT NULL,
    image_full    TEXT,
    image_crop    TEXT,
    image_overlay TEXT,
    bbox_json     TEXT,
    color_json    TEXT,
    remark        TEXT,
    severity      TEXT
);
CREATE INDEX IF NOT EXISTS idx_detections_ts ON detections(timestamp DESC);
"""


def init(db_path: Path) -> None:
    global _DB_PATH
    _DB_PATH = Path(db_path)
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.executescript(SCHEMA)


@contextmanager
def _connect():
    if _DB_PATH is None:
        raise RuntimeError("db.init(path) must be called first")
    with _LOCK:
        conn = sqlite3.connect(str(_DB_PATH))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def insert_detection(
    timestamp: str,
    image_full: str,
    image_crop: Optional[str],
    image_overlay: Optional[str],
    bbox: Any,
    color_pcts: Dict[str, float],
    remark: str,
    severity: str,
) -> int:
    with _connect() as conn:
        cur = conn.execute(
            """INSERT INTO detections
               (timestamp, image_full, image_crop, image_overlay,
                bbox_json, color_json, remark, severity)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                timestamp,
                image_full,
                image_crop,
                image_overlay,
                json.dumps(bbox),
                json.dumps(color_pcts),
                remark,
                severity,
            ),
        )
        return cur.lastrowid


def list_detections(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM detections ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [_row_to_dict(r) for r in rows]


def get_detection(detection_id: int) -> Optional[Dict[str, Any]]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM detections WHERE id = ?", (detection_id,)
        ).fetchone()
        return _row_to_dict(row) if row else None


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    for k in ("bbox_json", "color_json"):
        if d.get(k):
            try:
                d[k.replace("_json", "")] = json.loads(d.pop(k))
            except json.JSONDecodeError:
                d.pop(k)
    return d
