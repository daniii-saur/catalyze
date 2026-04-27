import json
import threading
import time
from datetime import datetime
from pathlib import Path

import cv2
from picamera2 import Picamera2
from ultralytics import YOLO

WEIGHTS = "/home/catalyze/catalyze/runs/detect/train/weights/best.pt"
CONF_THRESHOLD = 0.40
TARGET_CLASS = "poop"
CAPTURE_DIR = Path("/home/catalyze/catalyze/captures")
IMGSZ = 640
POLL_INTERVAL = 5         # seconds between inference checks
POST_CLEAN_COOLDOWN = 30  # seconds to wait after box is clean before re-arming
DISPLAY_WIDTH = 768       # scale preview down to reduce rendering load

STATE_COLOR = {
    "MONITORING":        (0, 255, 0),
    "WAITING_FOR_CLEAN": (0, 165, 255),
    "COOLDOWN":          (255, 255, 0),
}


def draw_overlay(frame, state, detections, cooldown_remaining=None):
    disp = frame.copy()
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        label = f"{d['class']} {d['confidence']:.2f}"
        cv2.rectangle(disp, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(disp, label, (x1, max(0, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)

    status_text = f"{state} ({cooldown_remaining}s)" if state == "COOLDOWN" and cooldown_remaining else state
    color = STATE_COLOR.get(state, (255, 255, 255))
    cv2.putText(disp, status_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2, cv2.LINE_AA)
    return disp


def save_detection(frame, timestamp, detections):
    stamp = timestamp.strftime("%Y%m%d_%H%M%S")
    img_path = CAPTURE_DIR / f"capture_{stamp}.jpg"
    json_path = CAPTURE_DIR / f"capture_{stamp}.json"
    cv2.imwrite(str(img_path), frame)
    data = {
        "timestamp": timestamp.isoformat(),
        "image": img_path.name,
        "detections": detections,
    }
    json_path.write_text(json.dumps(data, indent=2))
    print(f"[{stamp}] Saved {img_path.name} + sidecar JSON ({len(detections)} detection(s))", flush=True)


def inference_loop(model, names, shared, lock, stop_event):
    while not stop_event.is_set():
        with lock:
            frame = shared["frame"]
        if frame is None:
            time.sleep(0.1)
            continue

        timestamp = datetime.now()
        t = timestamp.strftime("%H:%M:%S")
        results = model.predict(frame, imgsz=IMGSZ, conf=CONF_THRESHOLD, verbose=False)[0]

        detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            cls_name = names[cls_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            if cls_name == TARGET_CLASS:
                detections.append({
                    "class": cls_name,
                    "confidence": round(conf, 4),
                    "bbox": [x1, y1, x2, y2],
                })

        poop_present = len(detections) > 0

        with lock:
            state = shared["state"]
            if state == "MONITORING":
                if poop_present:
                    save_detection(frame, timestamp, detections)
                    shared["state"] = "WAITING_FOR_CLEAN"
                    shared["detections"] = detections
                    print(f"[{t}] Poop detected — waiting for cleaning cycle", flush=True)
                else:
                    shared["detections"] = []
                    print(f"[{t}] No detection", flush=True)

            elif state == "WAITING_FOR_CLEAN":
                if poop_present:
                    shared["detections"] = detections
                    print(f"[{t}] Still dirty — waiting for clean", flush=True)
                else:
                    shared["detections"] = []
                    shared["clean_since"] = time.time()
                    shared["state"] = "COOLDOWN"
                    print(f"[{t}] Box is clean — cooldown {POST_CLEAN_COOLDOWN}s before re-arming", flush=True)

            elif state == "COOLDOWN":
                elapsed = time.time() - shared["clean_since"]
                if elapsed >= POST_CLEAN_COOLDOWN:
                    shared["state"] = "MONITORING"
                    print(f"[{t}] Re-armed", flush=True)

            # Signal inference done so main loop waits for next interval
            shared["next_poll"] = time.time() + POLL_INTERVAL


def main():
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)

    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (1536, 864), "format": "RGB888"},
        buffer_count=4,
    )
    picam2.configure(config)
    picam2.start()
    time.sleep(2)  # AE/AWB settle

    model = YOLO(WEIGHTS)
    names = model.names

    lock = threading.Lock()
    shared = {
        "frame": None,
        "state": "MONITORING",
        "detections": [],
        "clean_since": None,
        "next_poll": 0.0,
    }
    stop_event = threading.Event()

    t = threading.Thread(target=inference_loop, args=(model, names, shared, lock, stop_event), daemon=True)
    t.start()

    win = "Catalyze — Litter Monitor"
    cv2.namedWindow(win, cv2.WINDOW_NORMAL)
    print("Monitoring for poop detections... (press Q or Esc to stop)", flush=True)

    try:
        while True:
            frame = picam2.capture_array()

            with lock:
                if time.time() >= shared["next_poll"]:
                    shared["frame"] = frame.copy()
                state = shared["state"]
                detections = list(shared["detections"])
                clean_since = shared["clean_since"]

            cooldown_remaining = None
            if state == "COOLDOWN" and clean_since:
                cooldown_remaining = max(0, int(POST_CLEAN_COOLDOWN - (time.time() - clean_since)))

            disp = draw_overlay(frame, state, detections, cooldown_remaining)

            # Scale down for display only
            h, w = disp.shape[:2]
            display_h = int(h * DISPLAY_WIDTH / w)
            disp = cv2.resize(disp, (DISPLAY_WIDTH, display_h))

            cv2.imshow(win, disp)
            if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
                break

    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        picam2.stop()
        cv2.destroyAllWindows()
        print("Stopped.", flush=True)


if __name__ == "__main__":
    main()
