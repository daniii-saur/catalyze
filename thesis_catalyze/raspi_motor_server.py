import argparse
import requests
import sys
import os

# Simple RasPi client for testing motor endpoints on the Pi.
# Defaults point to your Pi at 192.168.1.16:5000 — change with env vars or args.

PI_HOST = os.getenv('RASPI_HOST', '192.168.1.16')
PI_PORT = int(os.getenv('RASPI_PORT', '5000'))
PI_BASE = f"http://{PI_HOST}:{PI_PORT}"


def post_root_form(form: dict, timeout: float = 10.0):
    """POST form-encoded data to Pi root ('/'). Returns (ok, status_code, text)."""
    try:
        r = requests.post(PI_BASE + '/', data=form, timeout=timeout)
        return True, r.status_code, r.text
    except requests.RequestException as e:
        return False, None, str(e)


def post_api_motor(json_data: dict, timeout: float = 10.0):
    """POST JSON to /api/motor if your Pi exposes that API."""
    try:
        r = requests.post(PI_BASE + '/api/motor', json=json_data, timeout=timeout)
        try:
            return True, r.status_code, r.json()
        except ValueError:
            return True, r.status_code, r.text
    except requests.RequestException as e:
        return False, None, str(e)


def get_status(timeout: float = 5.0):
    try:
        r = requests.get(PI_BASE + '/motor_status', timeout=timeout)
        try:
            return True, r.status_code, r.json()
        except ValueError:
            return True, r.status_code, r.text
    except requests.RequestException as e:
        return False, None, str(e)


def main(argv=None):
    p = argparse.ArgumentParser(description='RasPi motor test client')
    p.add_argument('action', choices=['level', 'cw', 'ccw', 'status'], help='Action to perform')
    p.add_argument('--duration', '-d', type=float, help='Duration in seconds (optional)')
    p.add_argument('--steps', '-s', type=int, help='Number of steps (optional)')
    p.add_argument('--use-api', action='store_true', help='Send JSON to /api/motor instead of form to /')
    p.add_argument('--host', help='RasPi host (overrides env RASPI_HOST)')
    p.add_argument('--port', type=int, help='RasPi port (overrides env RASPI_PORT)')
    args = p.parse_args(argv)

    global PI_BASE
    if args.host:
        PI_HOST_LOCAL = args.host
    else:
        PI_HOST_LOCAL = PI_HOST
    if args.port:
        PI_PORT_LOCAL = args.port
    else:
        PI_PORT_LOCAL = PI_PORT
    PI_BASE = f"http://{PI_HOST_LOCAL}:{PI_PORT_LOCAL}"

    if args.action == 'status':
        ok, code, data = get_status()
        if not ok:
            print('Error contacting Pi:', data)
            return 2
        print('Status:', data)
        return 0

    if args.use_api:
        if args.action == 'level':
            ok, code, data = post_api_motor({'action': 'level', 'duration': args.duration})
        else:
            direction = 1 if args.action == 'cw' else 0
            ok, code, data = post_api_motor({'action': 'rotate', 'direction': direction, 'duration': args.duration, 'steps': args.steps})
    else:
        if args.action == 'level':
            ok, code, data = post_root_form({'level': '1', 'duration': str(args.duration) if args.duration else ''})
        else:
            direction = '1' if args.action == 'cw' else '0'
            form = {'direction': direction}
            if args.duration is not None:
                form['duration'] = str(args.duration)
            if args.steps is not None:
                form['steps'] = str(args.steps)
            ok, code, data = post_root_form(form)

    if not ok:
        print('Request failed:', data)
        return 2

    print(f'HTTP {code} —', data)
    return 0


if __name__ == '__main__':
    sys.exit(main())
import requests

PI_URL = "http://192.168.1.16:5000/api/motor"

def level_litterbox():
    resp = requests.post(PI_URL, json={"action": "level"})
    print(resp.json())

def rotate_gallon(direction=1):
    resp = requests.post(PI_URL, json={"action": "rotate", "direction": direction})
    print(resp.json())

# Example usage:
level_litterbox()         # To level the litterbox
rotate_gallon(direction=1)  # To rotate CW
rotate_gallon(direction=0)  # To rotate CCW