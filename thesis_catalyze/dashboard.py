r"""
pc_client.py

Flask app to run on your PC. Serves a web UI that forwards motor control
commands to your Raspberry Pi's Flask app by sending form-encoded POSTs to
`http://<RASPI_HOST>:<RASPI_PORT>/` (the Pi's root route) and polling
`/motor_status` on the Pi for the running state.

This matches the RasPi code you provided which expects:
- POST / (form): contains 'level' to trigger levelling
- POST / (form): contains 'direction' (int) to rotate (1 => CW, 0 => CCW)
- GET /motor_status: returns JSON {running: true/false}

Usage (PowerShell):
  cd "c:\Users\DANIEL\OneDrive\Documents\Sample Projects\raspi-web"
  python -m venv .venv
  . .\.venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  # optionally copy/edit .env.example and set RASPI_HOST
  python pc_client.py

Open http://localhost:5001/ in your browser (note default port 5001).

Security: This is a LAN-only convenience proxy. Do not expose it publicly
without proper authentication and HTTPS.
"""

import os
import time
from flask import Flask, request, jsonify, Response
import requests

# Load environment variables if python-dotenv is available; otherwise rely on env
try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

if load_dotenv:
    load_dotenv()

RASPI_HOST = os.getenv('RASPI_HOST', '192.168.1.16')
RASPI_PORT = os.getenv('RASPI_PORT', '5000')  # default Pi app port (change if needed)
RASPI_PROTOCOL = os.getenv('RASPI_PROTOCOL', 'http')
RASPI_BASE = f"{RASPI_PROTOCOL}://{RASPI_HOST}:{RASPI_PORT}"

app = Flask(__name__)

INDEX_HTML = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PC Motor Controller</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;margin:0;padding:20px}
    main{max-width:1100px;margin:24px auto;background:#fff;padding:18px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.06);display:flex;gap:18px}
    .left{flex:1;min-width:420px}
    .right{width:420px}
    h1{margin-top:0}
    .controls{display:flex;gap:12px;margin:12px 0}
    button{flex:1;padding:10px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;font-weight:700}
    button.cw{background:#dbffe6}
    button.ccw{background:#ffe6e6}
    
    label{display:block;margin-top:8px;font-weight:600}
    input[type=number]{width:100%;padding:8px;border-radius:6px;border:1px solid #ddd}
  </style>
</head>
<body>
  <main>
    <div class="left">
    <h1>PC → Raspberry Pi Motor Control</h1>
    <p>This page sends commands to your Raspberry Pi's Flask app at <code>%RASPI_BASE%</code>.</p>

    <label>Duration (seconds)</label>
    <input id="duration" type="number" min="0" step="0.1" value="1" />

    <div class="controls">
      <button id="btn-level">Level Litterbox</button>
      <button id="btn-cw" class="cw">Rotate CW</button>
      <button id="btn-ccw" class="ccw">Rotate CCW</button>
    </div>

    <!-- Pi camera monitor removed; local webcam remains on the right -->

    
    </div>

    <div class="right">
      <h2>Local Webcam</h2>
      <video id="localVideo" autoplay muted playsinline style="width:100%;border:1px solid #ddd;border-radius:6px;background:#000"></video>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button id="startLocal">Start Local Camera</button>
        <button id="stopLocal">Stop Local Camera</button>
      </div>
    </div>
  </main>

  <script>
    const base = '%RASPI_BASE%';
    
    const durationEl = document.getElementById('duration');
    const btnLevel = document.getElementById('btn-level');
    const btnCW = document.getElementById('btn-cw');
    const btnCCW = document.getElementById('btn-ccw');

    async function postFormToPi(formData) {
      // POST to the Pi's root path as form-encoded data
      const body = new URLSearchParams();
      for (const [k,v] of Object.entries(formData)) body.append(k, v);

      const res = await fetch(base + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    }

    // Pi status polling removed (messages shown in the Messages box)

    btnLevel.addEventListener('click', async () => {
      console.log('Sending level command...');
      const r = await postFormToPi({ level: '1' });
      console.log(`Response ${r.status}\n\n${r.text}`);
    });

    btnCW.addEventListener('click', async () => {
      const d = parseFloat(durationEl.value) || 0;
      console.log('Sending CW...');
      const r = await postFormToPi({ direction: '1', duration: String(d) });
      console.log(`Response ${r.status}\n\n${r.text}`);
    });

    btnCCW.addEventListener('click', async () => {
      const d = parseFloat(durationEl.value) || 0;
      console.log('Sending CCW...');
      const r = await postFormToPi({ direction: '0', duration: String(d) });
      console.log(`Response ${r.status}\n\n${r.text}`);
    });

    // Pi status polling removed
    // Pi camera monitor removed; local webcam remains
    // Local webcam (browser getUserMedia)
    const startLocalBtn = document.getElementById('startLocal');
    const stopLocalBtn = document.getElementById('stopLocal');
    const localVideo = document.getElementById('localVideo');
    let localStream = null;

    async function startLocalCamera() {
      if (localStream) return;
      try {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          localVideo.srcObject = localStream;
        } catch (e) {
          console.log('Local camera error: ' + e.message);
        }
    }

    function stopLocalCamera() {
      if (!localStream) return;
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
      localVideo.srcObject = null;
    }

    startLocalBtn.addEventListener('click', startLocalCamera);
    stopLocalBtn.addEventListener('click', stopLocalCamera);
  </script>
</body>
</html>
"""


@app.route('/', methods=['GET'])
def index():
    html = INDEX_HTML.replace('%RASPI_BASE%', RASPI_BASE)
    return Response(html, mimetype='text/html')


@app.route('/api/level', methods=['POST'])
def api_level():
    """Trigger the Pi levelling action by POSTing form data to Pi root."""
    try:
        r = requests.post(RASPI_BASE + '/', data={'level': '1'}, timeout=10)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502
    return (r.text, r.status_code)


@app.route('/api/rotate', methods=['POST'])
def api_rotate():
    """Rotate gallon on Pi by sending form data 'direction' (1 or 0) and optional duration."""
    data = request.get_json() or {}
    direction = str(int(data.get('direction', 1)))
    duration = data.get('duration')
    form = {'direction': direction}
    if duration is not None:
        form['duration'] = str(duration)
    try:
        r = requests.post(RASPI_BASE + '/', data=form, timeout=10)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502
    return (r.text, r.status_code)


# /api/status removed — PC client no longer proxies Pi status


@app.route('/api/camera', methods=['GET'])
def api_camera():
  return jsonify({'error': 'camera proxy removed'}), 410


if __name__ == '__main__':
    port = int(os.getenv('PC_CLIENT_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
