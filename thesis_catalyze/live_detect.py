import argparse
import threading
import time
from pathlib import Path

import cv2
from picamera2 import Picamera2
from ultralytics import YOLO

DEFAULT_WEIGHTS = str(Path(__file__).parent / "best.pt")


def main():
    ap = argparse.ArgumentParser(description="Real-time YOLO inference on Pi Camera Module 3 Wide")
    ap.add_argument("--weights", default=DEFAULT_WEIGHTS, help="Path to YOLO .pt weights")
    ap.add_argument("--imgsz", type=int, default=640, help="Inference image size (pixels)")
    ap.add_argument("--conf", type=float, default=0.35, help="Confidence threshold (0–1)")
    args = ap.parse_args()

    model = YOLO(args.weights)
    names = model.names

    # imx708_wide native mode: 1536×864 @ 120 fps — lowest-latency option before 4K
    # NOTE: picamera2 "RGB888" stores bytes in BGR order (libcamera quirk) — no cvtColor needed
    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (1536, 864), "format": "RGB888"},
        buffer_count=4,
    )
    picam2.configure(config)
    picam2.start()

    # Shared state between capture thread and inference thread
    lock = threading.Lock()
    latest_frame = [None]   # most recent camera frame
    latest_boxes = [[]]     # (x1,y1,x2,y2,cls,conf) tuples from last inference
    stop_event = threading.Event()

    def inference_loop():
        while not stop_event.is_set():
            with lock:
                frame = latest_frame[0]
            if frame is None:
                time.sleep(0.01)
                continue
            results = model.predict(frame, imgsz=args.imgsz, conf=args.conf, verbose=False)[0]
            boxes = []
            for box in results.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                boxes.append((x1, y1, x2, y2, int(box.cls[0]), float(box.conf[0])))
            with lock:
                latest_boxes[0] = boxes

    infer_thread = threading.Thread(target=inference_loop, daemon=True)
    infer_thread.start()

    win = "YOLO live"
    cv2.namedWindow(win, cv2.WINDOW_NORMAL)

    fps_t0 = time.time()
    frames = 0

    try:
        while True:
            # frame bytes are BGR despite the "RGB888" format name
            frame = picam2.capture_array()
            with lock:
                latest_frame[0] = frame.copy()
                boxes = list(latest_boxes[0])

            disp = frame.copy()
            for (x1, y1, x2, y2, cls, conf) in boxes:
                label = f"{names[cls]} {conf:.2f}"
                cv2.rectangle(disp, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    disp, label, (x1, max(0, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA,
                )

            frames += 1
            if frames % 30 == 0:
                fps = frames / (time.time() - fps_t0)
                cv2.setWindowTitle(win, f"YOLO live  {fps:.1f} fps (display)")

            cv2.imshow(win, disp)
            if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
                break
    finally:
        stop_event.set()
        picam2.stop()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
