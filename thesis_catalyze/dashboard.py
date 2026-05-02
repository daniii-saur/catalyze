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
import threading

# Try to import local motor controller
try:
  import gallon_rotate as gr
  HAS_LOCAL_ROTATE = True
except Exception:
  gr = None
  HAS_LOCAL_ROTATE = False

try:
  import raspi_tb6600_control as tb
  HAS_FULL_CYCLE = True
except Exception:
  tb = None
  HAS_FULL_CYCLE = False

MOTOR_LOCK = threading.Lock()

# Load environment variables if python-dotenv is available; otherwise rely on env
try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

if load_dotenv:
    load_dotenv()

RASPI_HOST = os.getenv('RASPI_HOST', '127.0.0.1')
RASPI_PORT = os.getenv('RASPI_PORT', '5000')  # default Pi app port (change if needed)
RASPI_PROTOCOL = os.getenv('RASPI_PROTOCOL', 'http')
RASPI_BASE = f"{RASPI_PROTOCOL}://{RASPI_HOST}:{RASPI_PORT}"
RASPI_API_PORT = os.getenv('RASPI_API_PORT', '8000')
RASPI_STREAM_URL = f"{RASPI_PROTOCOL}://{RASPI_HOST}:{RASPI_API_PORT}/stream"
FIXED_ROTATE_CCW_SECONDS = float(os.getenv('FIXED_ROTATE_CCW_SECONDS', '7'))
FIXED_ROTATE_CW_SECONDS = float(os.getenv('FIXED_ROTATE_CW_SECONDS', '8'))
FULL_CYCLE_SECONDS = float(os.getenv('FULL_CYCLE_SECONDS', '9'))
# Step delay in seconds fed to every gr.rotate() call.
BASE_STEP_DELAY = 0.001
# Run local motor at 30% of full speed (delay = 3× baseline).
LOCAL_DELAY_SCALE = 3.0


def _use_local_rotate() -> bool:
  """Resolve local-rotate behavior from env with sensible localhost defaults."""
  raw = os.getenv('USE_LOCAL_ROTATE')
  if raw is not None:
    return raw.strip().lower() in {'1', 'true', 'yes', 'on'}
  # If running on the Pi/host itself, prefer local control when available.
  return HAS_LOCAL_ROTATE and RASPI_HOST in {'127.0.0.1', 'localhost'}

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
    button.full{background:#e9f0ff;border-color:#98b1ff}
    
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
    <p style="margin:8px 0 0;color:#555;font-size:12px;">CCW: 7s at 30% speed | CW: 8s at 30% speed | Full Cycle: CCW 7s → CW 8s at 30% speed.</p>

    <div class="controls">
      <button id="btn-level">Level Litterbox</button>
      <button id="btn-cw" class="cw">Rotate CW (8s)</button>
      <button id="btn-ccw" class="ccw">Rotate CCW (7s)</button>
    </div>

    <div class="controls">
      <button id="btn-full-cycle" class="full">Full Cycle Clean (CCW 9s -> CW 9s)</button>
    </div>

    <div id="messages" style="margin-top:12px;padding:10px;border:1px solid #ddd;border-radius:6px;background:#fafafa;font-size:13px;white-space:pre-wrap">Ready</div>

    </div>

    <div class="right">
      <h2>Pi Camera Stream</h2>
      <img id="piCamera" alt="Pi camera stream" style="width:100%;border:1px solid #ddd;border-radius:6px;background:#000" />
      <div style="display:flex;gap:8px;margin-top:8px;margin-bottom:12px;">
        <button id="startPiCam">Start Pi Stream</button>
        <button id="stopPiCam">Stop Pi Stream</button>
      </div>

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
    const streamUrl = '%RASPI_STREAM_URL%';
    
    const durationEl = document.getElementById('duration');
    const btnLevel = document.getElementById('btn-level');
    const btnCW = document.getElementById('btn-cw');
    const btnCCW = document.getElementById('btn-ccw');
    const btnFullCycle = document.getElementById('btn-full-cycle');
    const messagesEl = document.getElementById('messages');

    function setMessage(msg) {
      messagesEl.textContent = msg;
    }

    // Use server endpoints rather than posting directly to the Pi.
    async function postToServer(path, data) {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    }

    // Pi status polling removed (messages shown in the Messages box)

    btnLevel.addEventListener('click', async () => {
      setMessage('Sending level command...');
      const d = parseFloat(durationEl.value) || 1;
      const r = await postToServer('/api/level', { level: 1, duration: d });
      setMessage(`Level response ${r.status}\n${r.text}`);
    });

    btnCW.addEventListener('click', async () => {
      setMessage('Sending CW for 8 seconds (at 30% speed)...');
      const r = await postToServer('/api/rotate', { direction: 1, duration: 8 });
      setMessage(`CW response ${r.status}\n${r.text}`);
    });

    btnCCW.addEventListener('click', async () => {
      setMessage('Sending CCW for 7 seconds (at 30% speed)...');
      const r = await postToServer('/api/rotate', { direction: 0, duration: 7 });
      setMessage(`CCW response ${r.status}\n${r.text}`);
    });

    btnFullCycle.addEventListener('click', async () => {
      setMessage('Starting one full cycle clean (CCW 7s → CW 8s, at 30% speed)...');
      const r = await postToServer('/api/full-cycle-clean', { duration: 8 });
      setMessage(`Full cycle response ${r.status}\n${r.text}`);
    });

    // Pi camera stream controls
    const piCamera = document.getElementById('piCamera');
    const startPiCamBtn = document.getElementById('startPiCam');
    const stopPiCamBtn = document.getElementById('stopPiCam');

    function startPiCam() {
      // Add cache buster so browser reconnects cleanly
      piCamera.src = `${streamUrl}?t=${Date.now()}`;
      setMessage(`Pi stream started: ${streamUrl}`);
    }

    function stopPiCam() {
      piCamera.src = '';
      setMessage('Pi stream stopped');
    }

    startPiCamBtn.addEventListener('click', startPiCam);
    stopPiCamBtn.addEventListener('click', stopPiCam);

    piCamera.addEventListener('error', () => {
      setMessage(`Pi stream unavailable: ${streamUrl}`);
    });

    // Auto-start Pi stream on page load
    startPiCam();

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
    html = INDEX_HTML.replace('%RASPI_BASE%', RASPI_BASE).replace('%RASPI_STREAM_URL%', RASPI_STREAM_URL)
    return Response(html, mimetype='text/html')


@app.route('/api/level', methods=['POST'])
def api_level():
    """Trigger the Pi levelling action by POSTing form data to Pi root."""
    data = request.get_json(silent=True) or {}
  
    # If configured to use local rotation, invoke it directly.
    use_local = _use_local_rotate()
    if use_local and HAS_LOCAL_ROTATE:
      try:
        dur = float(data.get('duration', 1))
      except Exception:
        dur = 1
  
      # levelling: run a short CW rotate in background
      def _run():
        with MOTOR_LOCK:
          gr.rotate(
            1,
            duration=dur,
            delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
            simulate=(os.getenv('LOCAL_SIMULATE', '0') == '1'),
          )
  
      t = threading.Thread(target=_run, daemon=True)
      t.start()
      return jsonify({'started': True}), 202
  
    try:
      r = requests.post(RASPI_BASE + '/', data={'level': '1'}, timeout=10)
    except requests.RequestException as e:
      if HAS_LOCAL_ROTATE:
        try:
          dur = float(data.get('duration', 1))
        except Exception:
          dur = 1

        def _run_local_fallback():
          gr.rotate(
            1,
            duration=dur,
            delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
            simulate=(os.getenv('LOCAL_SIMULATE', '0') == '1'),
          )

        t = threading.Thread(target=_run_local_fallback, daemon=True)
        t.start()
        return jsonify({'started': True, 'fallback': 'local', 'warning': str(e)}), 202
      return jsonify({'error': str(e)}), 502
    return (r.text, r.status_code)


@app.route('/api/rotate', methods=['POST'])
def api_rotate():
    """Rotate gallon on Pi by sending form data 'direction' (1 or 0) and optional duration."""
    data = request.get_json() or {}
    direction = int(data.get('direction', 1))
    # Use direction-specific duration: 0=CCW (7s), 1=CW (8s)
    duration = FIXED_ROTATE_CCW_SECONDS if direction == 0 else FIXED_ROTATE_CW_SECONDS

    # If configured to use local rotation, run local motor driver in background
    use_local = _use_local_rotate()
    if use_local and HAS_LOCAL_ROTATE:
        def _run():
            try:
                dur = float(duration) if duration is not None else None
            except Exception:
                dur = None
            try:
                with MOTOR_LOCK:
                    if dur is None:
                        gr.rotate(
                            direction,
                            delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
                            simulate=(os.getenv('LOCAL_SIMULATE', '0') == '1'),
                        )
                    else:
                        gr.rotate(
                            direction,
                            duration=dur,
                            delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
                            simulate=(os.getenv('LOCAL_SIMULATE', '0') == '1'),
                        )
            except Exception as e:
                # log to stdout — Flask will capture
                print('Local rotate error:', e)

        t = threading.Thread(target=_run, daemon=True)
        t.start()
        return jsonify({'started': True}), 202

    form = {'direction': str(int(direction))}
    if duration is not None:
        form['duration'] = str(duration)
    try:
      r = requests.post(RASPI_BASE + '/', data=form, timeout=10)
    except requests.RequestException as e:
      if HAS_LOCAL_ROTATE:
        def _run_local_fallback():
          try:
            dur = float(duration) if duration is not None else None
          except Exception:
            dur = None
          with MOTOR_LOCK:
            if dur is None:
              gr.rotate(
                direction,
                delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
                simulate=(os.getenv('LOCAL_SIMULATE', '0') == '1'),
              )
            else:
              gr.rotate(
                direction,
                duration=dur,
                delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
                simulate=(os.getenv('LOCAL_SIMULATE', '0') == '1'),
              )

        t = threading.Thread(target=_run_local_fallback, daemon=True)
        t.start()
        return jsonify({'started': True, 'fallback': 'local', 'warning': str(e)}), 202
      return jsonify({'error': str(e)}), 502
    return (r.text, r.status_code)


@app.route('/api/full-cycle-clean', methods=['POST'])
def api_full_cycle_clean():
    """Run exactly one full clean cycle: CCW for duration, then CW for duration."""
    data = request.get_json(silent=True) or {}
    try:
        duration = float(data.get('duration', FULL_CYCLE_SECONDS))
    except (TypeError, ValueError):
        duration = FULL_CYCLE_SECONDS

    # Prefer local motor full-cycle routine when available.
    use_local = _use_local_rotate()
    if use_local and HAS_LOCAL_ROTATE:
        simulate = (os.getenv('LOCAL_SIMULATE', '0') == '1')

        def _run_local_full_cycle():
            try:
                with MOTOR_LOCK:
                    # Exactly one cycle per request: CCW once, then CW once.
                    gr.rotate(
                        0,
                        duration=duration,
                        delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
                        simulate=simulate,
                    )
                    time.sleep(2)
                    gr.rotate(
                        1,
                        duration=duration,
                        delay=BASE_STEP_DELAY * LOCAL_DELAY_SCALE,
                        simulate=simulate,
                    )
            except Exception as e:
                print('Full cycle error:', e)

        t = threading.Thread(target=_run_local_full_cycle, daemon=True)
        t.start()
        return jsonify({'started': True, 'mode': 'local', 'duration': duration, 'cycles': 1}), 202

    # Remote fallback: sequence two rotate requests to Pi root route.
    try:
        r1 = requests.post(RASPI_BASE + '/', data={'direction': '0', 'duration': str(duration)}, timeout=10)
        r2 = requests.post(RASPI_BASE + '/', data={'direction': '1', 'duration': str(duration)}, timeout=10)
        return jsonify({
            'started': True,
            'mode': 'remote-sequence',
            'ccw_status': r1.status_code,
            'cw_status': r2.status_code,
        }), 202
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502


# /api/status removed - PC client no longer proxies Pi status


@app.route('/api/camera', methods=['GET'])
def api_camera():
    return jsonify({'stream_url': RASPI_STREAM_URL})


if __name__ == '__main__':
    port = int(os.getenv('PC_CLIENT_PORT', 5001))
    debug = os.getenv('DASHBOARD_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=debug)