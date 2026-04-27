import argparse
import json
import threading
import time
from datetime import datetime
from pathlib import Path

import cv2
from picamera2 import Picamera2
from ultralytics import YOLO

import color_analyzer
import db
import gallon_rotate
import remark_engine
from api import run_in_background as run_api

CAT_WEIGHTS  = "/home/catalyze/catalyze/yolov8n.pt"
POOP_WEIGHTS = "/home/catalyze/catalyze/runs/detect/train/weights/best.pt"
CAT_CLASS    = "cat"
POOP_CLASS   = "poop"
CAT_CONF     = 0.25   # low — top-view cats score lower in COCO-trained model
POOP_CONF    = 0.40
CAT_IMGSZ    = 320
POOP_IMGSZ   = 640
CAPTURE_DIR  = Path("/home/catalyze/catalyze/captures")
DB_PATH      = CAPTURE_DIR / "catalyze.db"

# Cadence: faster idle polling + faster fallback so the box is never blind for long
POLL_INTERVAL          = 1     # was 3
POST_CLEAN_COOLDOWN    = 30
FALLBACK_POOP_INTERVAL = 30    # was 60

# Motor cleaning cycle defaults (tunable; see gallon_rotate.py)
MOTOR_DIRECTION = 1            # 1=CW, 0=CCW
MOTOR_STEPS     = 2000
MOTOR_DELAY     = gallon_rotate.STEP_DELAY
CROP_PADDING    = 20

STATE_COLOR = {
    "IDLE":     (0, 255, 0),    # green
    "OCCUPIED": (0, 255, 255),  # yellow
    "CHECKING": (255, 255, 0),  # cyan
    "DIRTY":    (0, 0, 255),    # red
    "COOLDOWN": (0, 165, 255),  # orange
}


def draw_overlay(frame, state, detections, cooldown_remaining=None):
    disp = frame.copy()
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        label = f"{d['class']} {d['confidence']:.2f}"
        cv2.rectangle(disp, (x1, y1), (x2, y2), STATE_COLOR.get(state, (255, 255, 255)), 2)
        cv2.putText(disp, label, (x1, max(0, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, STATE_COLOR.get(state, (255, 255, 255)), 1, cv2.LINE_AA)
    text = f"{state} ({cooldown_remaining}s)" if state == "COOLDOWN" and cooldown_remaining else state
    cv2.putText(disp, text, (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, STATE_COLOR.get(state, (255, 255, 255)), 2, cv2.LINE_AA)
    return disp


def _tightest_bbox(detections):
    """Pick the highest-confidence detection's bbox."""
    if not detections:
        return None
    best = max(detections, key=lambda d: d["confidence"])
    return best["bbox"]


def _crop_with_padding(frame, bbox, padding):
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = bbox
    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(w, x2 + padding)
    y2 = min(h, y2 + padding)
    return frame[y1:y2, x1:x2], [x1, y1, x2, y2]


def save_detection(frame, timestamp, detections):
    """Save full + cropped + overlay images, run color analysis, write db row.

    Returns the inserted db row id (or None on failure to crop).
    """
    stamp = timestamp.strftime("%Y%m%d_%H%M%S")
    full_path    = CAPTURE_DIR / f"capture_{stamp}_full.jpg"
    crop_path    = CAPTURE_DIR / f"capture_{stamp}_crop.jpg"
    overlay_path = CAPTURE_DIR / f"capture_{stamp}_overlay.jpg"
    json_path    = CAPTURE_DIR / f"capture_{stamp}.json"

    cv2.imwrite(str(full_path), frame)

    bbox = _tightest_bbox(detections)
    color_pcts = {}
    remark, severity = "No bbox available", "warning"
    crop_bbox = None
    crop_name = None
    overlay_name = None

    if bbox is not None:
        crop, crop_bbox = _crop_with_padding(frame, bbox, CROP_PADDING)
        if crop.size > 0:
            cv2.imwrite(str(crop_path), crop)
            crop_name = crop_path.name

            result = color_analyzer.analyze(crop)
            color_pcts = result.percentages
            overlay_img = color_analyzer.make_overlay(crop, result.masks)
            cv2.imwrite(str(overlay_path), overlay_img)
            overlay_name = overlay_path.name

            remark, severity = remark_engine.evaluate(color_pcts)

    json_path.write_text(json.dumps({
        "timestamp":  timestamp.isoformat(),
        "image_full": full_path.name,
        "image_crop": crop_name,
        "image_overlay": overlay_name,
        "detections": detections,
        "crop_bbox":  crop_bbox,
        "colors":     color_pcts,
        "remark":     remark,
        "severity":   severity,
    }, indent=2))

    row_id = db.insert_detection(
        timestamp=timestamp.isoformat(),
        image_full=full_path.name,
        image_crop=crop_name,
        image_overlay=overlay_name,
        bbox=crop_bbox,
        color_pcts=color_pcts,
        remark=remark,
        severity=severity,
    )

    print(f"[{stamp}] Saved id={row_id} {full_path.name} severity={severity} colors={color_pcts}", flush=True)
    return row_id


def trigger_motor(dry_run: bool):
    """Run cleaning cycle in a background thread so detection isn't blocked."""
    def _run():
        try:
            gallon_rotate.rotate(
                direction=MOTOR_DIRECTION,
                steps=MOTOR_STEPS,
                delay=MOTOR_DELAY,
                simulate=dry_run,
            )
            print(f"[motor] cleaning cycle done (dry_run={dry_run})", flush=True)
        except Exception as e:
            print(f"[motor] cleaning cycle FAILED: {e}", flush=True)

    threading.Thread(target=_run, daemon=True).start()


def inference_loop(cat_model, poop_model, shared, lock, stop_event, dry_run):
    while not stop_event.is_set():
        time.sleep(POLL_INTERVAL)

        with lock:
            frame = shared["frame"].copy() if shared["frame"] is not None else None
            state = shared["state"]
        if frame is None:
            continue

        timestamp = datetime.now()
        t = timestamp.strftime("%H:%M:%S")

        if state in ("IDLE", "OCCUPIED"):
            results_raw = cat_model.predict(frame, imgsz=CAT_IMGSZ, conf=0.01,
                                            classes=[15], verbose=False)[0]
            top_conf = max((float(b.conf[0]) for b in results_raw.boxes), default=0.0)
            print(f"[{t}] Cat model top conf: {top_conf:.3f} (threshold {CAT_CONF})", flush=True)

            detections = []
            for box in results_raw.boxes:
                cls_name = cat_model.names[int(box.cls[0])]
                conf = float(box.conf[0])
                if cls_name != CAT_CLASS or conf < CAT_CONF:
                    continue
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                detections.append({"class": cls_name, "confidence": round(conf, 4), "bbox": [x1, y1, x2, y2]})
            cat_detected = bool(detections)

            with lock:
                last_poop_scan = shared["last_poop_scan"]
                fallback_due = (time.time() - last_poop_scan) >= FALLBACK_POOP_INTERVAL

            if state == "IDLE" and fallback_due:
                print(f"[{t}] Fallback poop scan (no cat trigger)", flush=True)
                with lock:
                    shared["state"] = "CHECKING"
            else:
                with lock:
                    if state == "IDLE":
                        if cat_detected:
                            shared["state"] = "OCCUPIED"
                            shared["detections"] = detections
                            print(f"[{t}] Cat entered — monitoring", flush=True)
                    elif state == "OCCUPIED":
                        if cat_detected:
                            shared["detections"] = detections
                            print(f"[{t}] Cat still in box", flush=True)
                        else:
                            shared["detections"] = []
                            shared["state"] = "CHECKING"
                            print(f"[{t}] Cat left — scanning for poop", flush=True)

        elif state == "CHECKING":
            results = poop_model.predict(frame, imgsz=POOP_IMGSZ, conf=POOP_CONF, verbose=False)[0]
            detections = []
            for box in results.boxes:
                cls_name = poop_model.names[int(box.cls[0])]
                if cls_name != POOP_CLASS:
                    continue
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                detections.append({"class": cls_name, "confidence": round(conf, 4), "bbox": [x1, y1, x2, y2]})

            with lock:
                shared["last_poop_scan"] = time.time()
                if detections:
                    save_detection(frame, timestamp, detections)
                    shared["state"] = "DIRTY"
                    shared["detections"] = detections
                    print(f"[{t}] Poop detected — firing motor", flush=True)
                    trigger_motor(dry_run=dry_run)
                else:
                    shared["state"] = "IDLE"
                    shared["detections"] = []
                    print(f"[{t}] No poop — back to idle", flush=True)

        elif state == "DIRTY":
            results = poop_model.predict(frame, imgsz=POOP_IMGSZ, conf=POOP_CONF, verbose=False)[0]
            poop_present = any(
                poop_model.names[int(b.cls[0])] == POOP_CLASS for b in results.boxes
            )
            with lock:
                if poop_present:
                    print(f"[{t}] Still dirty", flush=True)
                else:
                    shared["clean_since"] = time.time()
                    shared["state"] = "COOLDOWN"
                    shared["detections"] = []
                    print(f"[{t}] Box clean — cooldown {POST_CLEAN_COOLDOWN}s", flush=True)

        elif state == "COOLDOWN":
            with lock:
                if time.time() - shared["clean_since"] >= POST_CLEAN_COOLDOWN:
                    shared["state"] = "IDLE"
                    print(f"[{t}] Re-armed", flush=True)


def parse_args():
    p = argparse.ArgumentParser(description="Catalyze detection + cleaning loop")
    p.add_argument("--dry-run", action="store_true",
                   help="Simulate motor calls instead of driving GPIO (safe on PC / no driver)")
    p.add_argument("--api-port", type=int, default=8000)
    p.add_argument("--no-api", action="store_true", help="Don't start the FastAPI server")
    return p.parse_args()


def main():
    args = parse_args()
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    db.init(DB_PATH)

    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (640, 360), "format": "RGB888"},
        buffer_count=4,
    )
    picam2.configure(config)
    picam2.start()
    picam2.set_controls({"FrameDurationLimits": (100000, 100000)})  # 10 fps
    time.sleep(2)

    print("Loading models...", flush=True)
    cat_model  = YOLO(CAT_WEIGHTS)
    poop_model = YOLO(POOP_WEIGHTS)
    print("Models ready.", flush=True)

    lock = threading.Lock()
    shared = {
        "frame":            None,
        "state":            "IDLE",
        "detections":       [],
        "clean_since":      None,
        "last_poop_scan":   0.0,
    }
    stop_event = threading.Event()

    if not args.no_api:
        def status_provider():
            with lock:
                return {
                    "state":          shared["state"],
                    "detections":     shared["detections"],
                    "last_poop_scan": shared["last_poop_scan"],
                }
        run_api(CAPTURE_DIR, status_provider, port=args.api_port)
        print(f"API listening on :{args.api_port}", flush=True)

    infer_thread = threading.Thread(
        target=inference_loop,
        args=(cat_model, poop_model, shared, lock, stop_event, args.dry_run),
        daemon=True,
    )
    infer_thread.start()

    cv2.namedWindow("Catalyze — Litter Monitor", cv2.WINDOW_NORMAL)
    print(f"Monitoring... dry_run={args.dry_run} (Q or Esc to stop)", flush=True)

    try:
        while True:
            frame = picam2.capture_array()

            with lock:
                shared["frame"] = frame.copy()
                state = shared["state"]
                detections = list(shared["detections"])
                clean_since = shared["clean_since"]

            cooldown_remaining = (
                max(0, int(POST_CLEAN_COOLDOWN - (time.time() - clean_since)))
                if state == "COOLDOWN" and clean_since else None
            )

            cv2.imshow("Catalyze — Litter Monitor",
                       draw_overlay(frame, state, detections, cooldown_remaining))
            if cv2.waitKey(100) & 0xFF in (ord("q"), 27):
                break

    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        infer_thread.join(timeout=15)
        picam2.stop()
        cv2.destroyAllWindows()
        print("Stopped.", flush=True)


if __name__ == "__main__":
    main()
