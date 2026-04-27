"""Maps color percentages to a human-readable remark + severity."""

from typing import Dict, Tuple

# Tunable thresholds (percent of crop pixels)
RED_CRITICAL    = 10.0
GREEN_WARNING   = 15.0
YELLOW_WARNING  = 20.0
BROWN_NORMAL    = 50.0
RED_SAFE_BELOW  = 5.0


def evaluate(pcts: Dict[str, float]) -> Tuple[str, str]:
    """Return (remark, severity). severity in {'normal','warning','critical'}."""
    red    = pcts.get("red", 0.0)
    green  = pcts.get("green", 0.0)
    yellow = pcts.get("yellow", 0.0)
    brown  = pcts.get("brown", 0.0)

    if red >= RED_CRITICAL:
        return ("Possible blood detected — consult a vet.", "critical")
    if green >= GREEN_WARNING:
        return ("Possible bile / unusual pigment — monitor.", "warning")
    if yellow >= YELLOW_WARNING:
        return ("Yellowish stool — possible diarrhea or diet issue.", "warning")
    if brown >= BROWN_NORMAL and red < RED_SAFE_BELOW:
        return ("Looks healthy.", "normal")
    return ("Inconclusive — keep monitoring.", "warning")
