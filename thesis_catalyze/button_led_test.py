"""
button_led_test.py

Simple Raspberry Pi GPIO test for a manual button and three status LEDs.

Wiring (BCM numbering):
- GREEN LED  : GPIO 13
- YELLOW LED : GPIO 6
- RED LED    : GPIO 5
- BUTTON     : GPIO 0

Behavior:
- When the button is pressed, print a message in the terminal.
- While the button is held, turn all LEDs on.
- When released, turn all LEDs off.

Usage on the Pi:
  python3 button_led_test.py

If RPi.GPIO is not available, the script exits with a clear message.
"""

from __future__ import annotations

import time
import argparse

try:
    import RPi.GPIO as GPIO
except Exception as exc:  # pragma: no cover - hardware-only script
    raise SystemExit(
        "RPi.GPIO is not available. Run this script on the Raspberry Pi with the GPIO library installed."
    ) from exc

GREEN_LED_PIN = 13
YELLOW_LED_PIN = 6
RED_LED_PIN = 5
BUTTON_PIN = 0
POLL_INTERVAL = 0.05
DEBOUNCE_SECONDS = 0.2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Test GPIO 0 button and status LEDs")
    parser.add_argument(
        "--active-high",
        action="store_true",
        help="Treat button press as GPIO HIGH instead of LOW",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print the raw GPIO 0 state whenever it changes",
    )
    return parser.parse_args()


def setup_gpio(active_high: bool) -> None:
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(GREEN_LED_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(YELLOW_LED_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(RED_LED_PIN, GPIO.OUT, initial=GPIO.LOW)
    pull_mode = GPIO.PUD_DOWN if active_high else GPIO.PUD_UP
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=pull_mode)


def set_leds(state: bool) -> None:
    value = GPIO.HIGH if state else GPIO.LOW
    GPIO.output(GREEN_LED_PIN, value)
    GPIO.output(YELLOW_LED_PIN, value)
    GPIO.output(RED_LED_PIN, value)


def cleanup_gpio() -> None:
    try:
        set_leds(False)
    except Exception:
        pass
    GPIO.cleanup()


def main() -> None:
    args = parse_args()
    active_high = args.active_high
    setup_gpio(active_high=active_high)
    mode_text = "HIGH" if active_high else "LOW"
    print(
        f"Button/LED test ready. GPIO 0 is treated as active-{mode_text.lower()}. Press the manual button to light the LEDs.",
        flush=True,
    )

    button_was_pressed = False
    last_press_time = 0.0
    last_raw_state = None

    try:
        while True:
            raw_state = GPIO.input(BUTTON_PIN)
            pressed = raw_state == GPIO.HIGH if active_high else raw_state == GPIO.LOW

            if args.debug and raw_state != last_raw_state:
                print(f"GPIO 0 raw state: {'HIGH' if raw_state else 'LOW'}", flush=True)
                last_raw_state = raw_state

            if pressed and not button_was_pressed:
                now = time.time()
                if now - last_press_time >= DEBOUNCE_SECONDS:
                    print("Button pressed", flush=True)
                    set_leds(True)
                    button_was_pressed = True
                    last_press_time = now
            elif not pressed and button_was_pressed:
                print("Button released", flush=True)
                set_leds(False)
                button_was_pressed = False

            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print("Interrupted by user", flush=True)
    finally:
        cleanup_gpio()


if __name__ == "__main__":
    main()
