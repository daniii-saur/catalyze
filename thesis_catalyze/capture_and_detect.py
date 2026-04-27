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


def save_to_db(image, timestamp, confidence, bbox):
    # TODO: implement persistence
    pass


def capture_image(picam2, out_path):
    frame = picam2.capture_array()
    cv2.imwrite(str(out_path), frame)
    return frame


def main():
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)

    picam2 = Picamera2()
    config = picam2.create_still_configuration(
        main={"size": (1536, 864), "format": "RGB888"},
    )
    picam2.configure(config)
    picam2.start()
    time.sleep(2)  # AE/AWB settle

    model = YOLO(WEIGHTS)
    names = model.names

    timestamp = datetime.now()
    stamp = timestamp.strftime("%Y%m%d_%H%M%S")
    img_path = CAPTURE_DIR / f"capture_{stamp}.jpg"

    try:
        frame = capture_image(picam2, img_path)
    finally:
        picam2.stop()

    print(f"[{stamp}] Saved capture to {img_path}")

    results = model.predict(str(img_path), imgsz=IMGSZ, conf=0.0, verbose=False)[0]

    if len(results.boxes) == 0:
        print("No detections.")
        return

    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        cls_name = names[cls_id]
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        bbox = (x1, y1, x2, y2)

        print(f"  detect: class={cls_name} conf={conf:.3f} bbox={bbox}")

        if cls_name == TARGET_CLASS and conf >= CONF_THRESHOLD:
            h, w = frame.shape[:2]
            x1c, y1c = max(0, x1), max(0, y1)
            x2c, y2c = min(w, x2), min(h, y2)
            crop = frame[y1c:y2c, x1c:x2c].copy()
            save_to_db(crop, timestamp, conf, bbox)
            print(f"    -> save_to_db called (conf {conf:.3f} ≥ {CONF_THRESHOLD})")


if __name__ == "__main__":
    main()
