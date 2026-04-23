RasPi Web Proxy (Flask)

Overview
- Small Flask app that serves a static frontend and provides a proxy endpoint to forward requests to a Raspberry Pi on the same LAN.
- Intended as a local prototype. Do not expose to the public internet without adding auth/TLS and request validation.

Quick start (Windows PowerShell)
1. Copy `.env.example` to `.env` and set `RASPI_HOST` to your Pi's IP.

2. Create and activate a virtual environment, then install (for PC development):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-pc.txt
```

For Raspberry Pi deployment, use `pip install -r requirements-pi.txt`.

3. Run the app:

```powershell
python app.py
```

4. Open the UI in your browser at `http://localhost:5000/` and use the form to forward requests to your Pi.

Notes and next steps
- If the Pi's API requires authentication, you can add headers in the UI or modify `app.py` to include tokens from environment variables.
- For production use: add authentication, input validation, and run behind HTTPS.
