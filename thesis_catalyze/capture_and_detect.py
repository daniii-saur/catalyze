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
POLL_INTERVAL = 5
POST_CLEAN_COOLDOWN = 30

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
    text = f"{state} ({cooldown_remaining}s)" if state == "COOLDOWN" and cooldown_remaining else state
    cv2.putText(disp, text, (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, STATE_COLOR.get(state, (255, 255, 255)), 2, cv2.LINE_AA)
    return disp


def save_detection(frame, timestamp, detections):
    stamp = timestamp.strftime("%Y%m%d_%H%M%S")
    img_path = CAPTURE_DIR / f"capture_{stamp}.jpg"
    json_path = CAPTURE_DIR / f"capture_{stamp}.json"
    cv2.imwrite(str(img_path), frame)
    json_path.write_text(json.dumps({
        "timestamp": timestamp.isoformat(),
        "image": img_path.name,
        "detections": detections,
    }, indent=2))
    print(f"[{stamp}] Saved {img_path.name} ({len(detections)} detection(s))", flush=True)


def inference_loop(model, names, shared, lock, stop_event):
    while not stop_event.is_set():
        time.sleep(POLL_INTERVAL)

        with lock:
            frame = shared["frame"].copy() if shared["frame"] is not None else None
        if frame is None:
            continue

        timestamp = datetime.now()
        t = timestamp.strftime("%H:%M:%S")
        results = model.predict(frame, imgsz=IMGSZ, conf=CONF_THRESHOLD, verbose=False)[0]

        detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            cls_name = names[cls_id]
            if cls_name != TARGET_CLASS:
                continue
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            detections.append({"class": cls_name, "confidence": round(conf, 4), "bbox": [x1, y1, x2, y2]})

        poop_present = bool(detections)

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
                    print(f"[{t}] Still dirty", flush=True)
                else:
                    shared["detections"] = []
                    shared["clean_since"] = time.time()
                    shared["state"] = "COOLDOWN"
                    print(f"[{t}] Box clean — cooldown {POST_CLEAN_COOLDOWN}s", flush=True)
            elif state == "COOLDOWN":
                if time.time() - shared["clean_since"] >= POST_CLEAN_COOLDOWN:
                    shared["state"] = "MONITORING"
                    print(f"[{t}] Re-armed", flush=True)


def main():
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)

    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (640, 360), "format": "RGB888"},
        buffer_count=4,
    )
    picam2.configure(config)
    picam2.start()
    picam2.set_controls({"FrameDurationLimits": (100000, 100000)})  # 10 fps
    time.sleep(2)

    model = YOLO(WEIGHTS)
    names = model.names

    lock = threading.Lock()
    shared = {
        "frame": None,
        "state": "MONITORING",
        "detections": [],
        "clean_since": None,
    }
    stop_event = threading.Event()

    threading.Thread(
        target=inference_loop, args=(model, names, shared, lock, stop_event), daemon=True
    ).start()

    cv2.namedWindow("Catalyze — Litter Monitor", cv2.WINDOW_NORMAL)
    print("Monitoring... (Q or Esc to stop)", flush=True)

    try:
        while True:
            frame = picam2.capture_array()

            with lock:
                shared["frame"] = frame.copy()  # copy immediately — releases the DMA buffer
                state = shared["state"]
                detections = list(shared["detections"])
                clean_since = shared["clean_since"]

            cooldown_remaining = (
                max(0, int(POST_CLEAN_COOLDOWN - (time.time() - clean_since)))
                if state == "COOLDOWN" and clean_since else None
            )

            cv2.imshow("Catalyze — Litter Monitor",
                       draw_overlay(frame, state, detections, cooldown_remaining))
            if cv2.waitKey(100) & 0xFF in (ord("q"), 27):  # 10 fps
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
