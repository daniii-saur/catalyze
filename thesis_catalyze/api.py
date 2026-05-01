"""FastAPI read-side for the web app. Runs in a background thread."""

import threading
from pathlib import Path
from typing import Any, Callable, Dict, Optional

import cv2
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

import db


_VALID_SEVERITY = {"normal", "warning", "critical"}


def build_app(
    captures_dir: Path,
    status_provider: Callable[[], Dict[str, Any]],
    frame_provider: Optional[Callable[[], Any]] = None,
) -> FastAPI:
    app = FastAPI(title="Catalyze API")

    # Allow browser requests from any origin (needed for the live stream in the web app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    @app.get("/status")
    def status():
        return status_provider()

    @app.get("/health")
    def health():
        return db.health()

    @app.get("/detections")
    def list_detections(
        limit: int = Query(50, ge=1, le=500),
        offset: int = Query(0, ge=0),
        since: Optional[str] = None,
        until: Optional[str] = None,
        severity: Optional[str] = None,
        kind: Optional[str] = None,
    ):
        if severity is not None and severity not in _VALID_SEVERITY:
            raise HTTPException(
                status_code=400,
                detail=f"severity must be one of {sorted(_VALID_SEVERITY)}",
            )
        return {
            "items": db.list_detections(
                limit=limit, offset=offset,
                since=since, until=until,
                severity=severity, kind=kind,
            )
        }

    @app.get("/detections/{detection_id}")
    def get_detection(detection_id: int):
        rec = db.get_detection(detection_id)
        if not rec:
            raise HTTPException(status_code=404, detail="not found")
        return rec

    @app.get("/stats/by-day")
    def stats_by_day(days: int = Query(30, ge=1, le=365)):
        return {"items": db.stats_by_day(days=days)}

    @app.get("/stream")
    def mjpeg_stream():
        if frame_provider is None:
            raise HTTPException(status_code=503, detail="stream not available")

        def generate():
            while True:
                frame = frame_provider()
                if frame is None:
                    import time; time.sleep(0.05)
                    continue
                ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if not ok:
                    continue
                yield (
                    b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                    + buf.tobytes()
                    + b"\r\n"
                )
                import time; time.sleep(0.1)  # ~10 fps

        return StreamingResponse(
            generate(), media_type="multipart/x-mixed-replace; boundary=frame"
        )

    @app.get("/image/{filename}")
    def get_image(filename: str):
        # prevent path traversal
        if "/" in filename or "\\" in filename or ".." in filename:
            raise HTTPException(status_code=400, detail="invalid filename")
        path = captures_dir / filename
        if not path.exists():
            raise HTTPException(status_code=404, detail="not found")
        return FileResponse(str(path))

    return app


def run_in_background(
    captures_dir: Path,
    status_provider: Callable[[], Dict[str, Any]],
    frame_provider: Optional[Callable[[], Any]] = None,
    host: str = "0.0.0.0",
    port: int = 8000,
) -> threading.Thread:
    app = build_app(captures_dir, status_provider, frame_provider)
    config = uvicorn.Config(app, host=host, port=port, log_level="warning")
    server = uvicorn.Server(config)
    t = threading.Thread(target=server.run, daemon=True)
    t.start()
    return t
