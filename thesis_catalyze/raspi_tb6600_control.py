"""
raspi_tb6600_control.py

Control script for a stepper driver (TB6600) connected to a Raspberry Pi.

Wiring (BCM numbering):
- PUL : GPIO 17
- DIR : GPIO 27
- RED_LED : GPIO 22
- GREEN_LED : GPIO 5
- BUZZER : GPIO 6

Behavior: rotate CW for 3 seconds, then CCW for 3 seconds. Lights GREEN
during motion, toggles RED on error, and pulses BUZZER while running.

Usage:
  python raspi_tb6600_control.py
  python raspi_tb6600_control.py --simulate

"""

from __future__ import annotations

import time
import argparse
import sys

try:
    import RPi.GPIO as GPIO
    IS_RPI = True
except Exception:
    IS_RPI = False


# BCM pin assignments
PUL_PIN = 17
DIR_PIN = 27
RED_LED_PIN = 22
GREEN_LED_PIN = 5
BUZZER_PIN = 6

# Step timing: half-pulse delay in seconds (full pulse = 2 * STEP_DELAY)
STEP_DELAY = 0.001


class _FakeGPIO:
    BCM = 'BCM'
    OUT = 'OUT'
    HIGH = 1
    LOW = 0

    def __init__(self):
        self._state = {}

    def setmode(self, mode):
        print(f'[SIM] setmode({mode})')

    def setup(self, pin, mode, initial=None):
        self._state[pin] = initial if initial is not None else self.LOW
        print(f'[SIM] setup(pin={pin}, mode={mode}, initial={initial})')

    def output(self, pin, value):
        self._state[pin] = value

    def cleanup(self):
        print('[SIM] cleanup()')


def init_gpio(simulate: bool):
    global GPIO
    if simulate or not IS_RPI:
        GPIO = _FakeGPIO()
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(PUL_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(DIR_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(RED_LED_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(GREEN_LED_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(BUZZER_PIN, GPIO.OUT, initial=GPIO.LOW)


def cleanup_gpio(simulate: bool):
    try:
        GPIO.output(PUL_PIN, GPIO.LOW)
        GPIO.output(DIR_PIN, GPIO.LOW)
        GPIO.output(RED_LED_PIN, GPIO.LOW)
        GPIO.output(GREEN_LED_PIN, GPIO.LOW)
        GPIO.output(BUZZER_PIN, GPIO.LOW)
    except Exception:
        pass
    if not (simulate or not IS_RPI):
        GPIO.cleanup()


def pulse_steps(direction: int, duration_s: float, step_delay: float = STEP_DELAY, simulate: bool = False):
    """Pulse the PUL pin for the given duration while holding direction on DIR pin.

    direction: 1 => CW (DIR HIGH), 0 => CCW (DIR LOW)
    """
    # Set direction
    GPIO.output(DIR_PIN, GPIO.HIGH if direction else GPIO.LOW)
    # Indicate running
    GPIO.output(GREEN_LED_PIN, GPIO.HIGH)
    GPIO.output(RED_LED_PIN, GPIO.LOW)
    GPIO.output(BUZZER_PIN, GPIO.HIGH)

    end_time = time.time() + duration_s
    steps = 0
    try:
        while time.time() < end_time:
            GPIO.output(PUL_PIN, GPIO.HIGH)
            time.sleep(step_delay)
            GPIO.output(PUL_PIN, GPIO.LOW)
            time.sleep(step_delay)
            steps += 1
            # occasional progress print in simulation mode
            if simulate and (steps % 500 == 0):
                print(f'[SIM] pulses: {steps}')
    finally:
        GPIO.output(BUZZER_PIN, GPIO.LOW)
        GPIO.output(GREEN_LED_PIN, GPIO.LOW)

    return steps


def main(argv=None):
    p = argparse.ArgumentParser(description='Control TB6600 stepper: CW 3s then CCW 3s')
    p.add_argument('--simulate', action='store_true', help='Run without accessing real GPIO')
    p.add_argument('--duration', type=float, default=3.0, help='Duration per direction in seconds')
    p.add_argument('--delay', type=float, default=STEP_DELAY, help='Half-pulse delay in seconds')
    args = p.parse_args(argv)

    simulate = args.simulate
    init_gpio(simulate=simulate)

    try:
        print('Rotate CW for', args.duration, 'seconds')
        steps_cw = pulse_steps(1, args.duration, step_delay=args.delay, simulate=simulate)
        print('CW pulses:', steps_cw)

        time.sleep(0.25)

        print('Rotate CCW for', args.duration, 'seconds')
        steps_ccw = pulse_steps(0, args.duration, step_delay=args.delay, simulate=simulate)
        print('CCW pulses:', steps_ccw)

    except KeyboardInterrupt:
        print('Interrupted by user')
        GPIO.output(RED_LED_PIN, GPIO.HIGH)
    except Exception as e:
        print('Error:', e)
        try:
            GPIO.output(RED_LED_PIN, GPIO.HIGH)
        except Exception:
            pass
    finally:
        cleanup_gpio(simulate=simulate)


if __name__ == '__main__':
    main()
