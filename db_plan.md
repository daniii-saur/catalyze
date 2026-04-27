We're setting up the SQLite database for the Catalyze project — an
automated litterbox prototype on a Raspberry Pi. The detection loop
in thesis_catalyze/capture_and_detect.py already calls into a thin
db.py module (insert_detection, list_detections, get_detection) that
writes to captures/catalyze.db.

Goal: harden and finalize the database setup so it's production-ready
for the Pi prototype and consumable by the future web app.

Please plan the following, in this order:

1. SCHEMA REVIEW
   - Read thesis_catalyze/db.py and confirm the `detections` table
     covers everything the teammate's vision needs: timestamp, image
     paths (full / crop / overlay), bbox, color percentages (red,
     yellow, green, brown), remark text, severity.
   - Decide whether to split color percentages into typed columns
     (red_pct REAL, etc.) instead of a JSON blob — typed columns make
     trend queries ("avg red% this week") much easier. Recommend an
     approach.
   - Add any missing fields the web app's "Health report" screen
     would need (e.g., per-day aggregates, cat_present flag).

2. RELIABILITY
   - Enable WAL mode (`PRAGMA journal_mode=WAL`) so the API can read
     while the detection loop writes without blocking.
   - Set `PRAGMA synchronous=NORMAL` (good balance for SD card wear
     vs. crash-safety). Justify the choice.
   - Confirm the existing threading.Lock in db.py is still needed
     once WAL is on.

3. MIGRATIONS
   - We'll change the schema as the project grows. Plan a tiny
     migration system — either a `schema_version` table + a list of
     up-migration SQL strings, or adopt a small library (yoyo,
     alembic). Recommend the lightest option for a single-file Pi
     prototype.

4. RETENTION / DISK BUDGET
   - The Pi's SD card is finite. Plan a retention policy: e.g., keep
     full images for 7 days, crops + overlays for 30 days, DB rows
     forever (they're tiny). Decide where the cleanup runs (cron? in
     the API thread on a timer?).

5. BACKUP
   - Plan a simple backup: `sqlite3 catalyze.db ".backup ..."` to a
     timestamped file once a day, kept for N days. Optional: rsync
     to a second machine.

6. WEB APP READ ACCESS
   - Confirm the FastAPI endpoints in thesis_catalyze/api.py expose
     everything the web app needs. Plan any missing endpoints (e.g.,
     `/stats/weekly` for the Health report).

7. VERIFICATION PLAN
   - How to test the schema, migrations, WAL, retention, and backup
     end-to-end on the Pi.

Out of scope:
- Switching away from SQLite.
- Cloud sync (Supabase / Firebase) — leave a one-paragraph note on
  how we'd add it later, but don't plan it now.
- Auth on the API (LAN prototype).

Critical files to read first:
- thesis_catalyze/db.py
- thesis_catalyze/api.py
- thesis_catalyze/capture_and_detect.py (for how db.insert_detection
  is called and what fields actually get populated)
