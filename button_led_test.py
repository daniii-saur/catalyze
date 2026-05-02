"""Repo-root wrapper for thesis_catalyze/button_led_test.py."""

from __future__ import annotations

from pathlib import Path
import runpy


if __name__ == "__main__":
    script_path = Path(__file__).parent / "thesis_catalyze" / "button_led_test.py"
    runpy.run_path(str(script_path), run_name="__main__")