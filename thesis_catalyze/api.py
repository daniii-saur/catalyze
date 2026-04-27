"""FastAPI read-side for the web app. Runs in a background thread."""

import threading
from pathlib import Path
from typing import Any, Callable, Dict

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

import db


def build_app(captures_dir: Path, status_provider: Callable[[], Dict[str, Any]]) -> FastAPI:
    app = FastAPI(title="Catalyze API")

    @app.get("/status")
    def status():
        return status_provider()

    @app.get("/detections")
    def list_detections(limit: int = 50, offset: int = 0):
        return {"items": db.list_detections(limit=limit, offset=offset)}

    @app.get("/detections/{detection_id}")
    def get_detection(detection_id: int):
        rec = db.get_detection(detection_id)
        if not rec:
            raise HTTPException(status_code=404, detail="not found")
        return rec

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
    host: str = "0.0.0.0",
    port: int = 8000,
) -> threading.Thread:
    app = build_app(captures_dir, status_provider)
    config = uvicorn.Config(app, host=host, port=port, log_level="warning")
    server = uvicorn.Server(config)
    t = threading.Thread(target=server.run, daemon=True)
    t.start()
    return t
