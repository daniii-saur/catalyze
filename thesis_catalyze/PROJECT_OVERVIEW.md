# Catalyze Project Overview

## What this project is
Catalyze is a prototype system for an automated litterbox workflow that combines:
- computer vision model training (YOLO)
- Raspberry Pi motor control (stepper driver/TB6600)
- a small Flask-based web interface/proxy for sending motor commands over a local network

In short: this repository contains both the AI training side and the hardware control side of the thesis prototype.

## What it does
The project supports two major capabilities:

1. Train a YOLO object detection model on a custom litterbox dataset.
- Dataset classes include `litter_sand` and `poop`.
- Training experiments and weights are saved under `runs/`.
- Pretrained model files (for example YOLOv8/YOLO11 nano variants) are used as starting points.

2. Control a stepper-motor mechanism on a Raspberry Pi.
- Sends rotate or leveling commands.
- Drives GPIO pins connected to a TB6600 stepper driver.
- Supports quick local testing via command-line scripts and a Flask web UI.

## High-level architecture
- PC side:
  - Flask app serves a browser UI.
  - Forwards user actions (rotate/level commands) to Raspberry Pi HTTP endpoints.
  - Optional simple local webcam preview in browser.
- Raspberry Pi side:
  - Receives HTTP requests.
  - Converts commands into GPIO pulse sequences for the stepper motor.
  - Can expose status endpoints for motor state checks.
- ML side:
  - Uses Ultralytics YOLO for training/inference.
  - Dataset is stored in YOLO format under `catalyze_dataset/`.
  - Trained outputs are stored in `runs/` directories.

## Important files and their roles
- `dashboard.py`
  - Main Flask PC client/proxy.
  - Serves the control page and forwards rotate/level requests to Raspberry Pi.
- `raspi_motor_server.py`
  - Command-line client for testing Raspberry Pi motor endpoints (`/`, `/api/motor`, `/motor_status`).
- `gallon_rotate.py`
  - Direct GPIO stepper control script (CW/CCW, by steps or duration).
- `raspi_tb6600_control.py`
  - TB6600-oriented GPIO control example, including LED/buzzer behavior.
- `poop_detect_train.py`
  - Minimal YOLO training script using `yolo11n.pt` and dataset YAML.
- `catalyze_dataset/data.yaml`
  - YOLO dataset config (train/val/test paths, classes).
- `requirements-pc.txt`
  - Dependencies for development/PC-side Flask proxy.
- `requirements-pi.txt`
  - Pi runtime dependencies, including `RPi.GPIO`.
- `runs/`
  - Saved training runs, arguments, metrics, and best/last model weights.

## Typical workflow
1. Prepare dataset and `data.yaml`.
2. Train YOLO model and evaluate results.
3. Deploy/control Raspberry Pi motor scripts.
4. Use Flask dashboard on PC to issue commands to Pi over LAN.
5. Iterate on model and motor behavior based on test results.

## Current state notes
- The repository includes both active code and some legacy/in-progress pieces.
- Some paths/docs still reference older names (for example `raspi-web` or `app.py`) while the current Flask entry file is `dashboard.py`.
- This is structured as a local/LAN prototype and is not production-hardened (authentication/TLS/input hardening are minimal).

## Summary
Catalyze is a thesis prototype that links computer vision detection training and Raspberry Pi motor actuation into one workflow. It is designed to help detect litterbox conditions (via YOLO) and run motorized mechanical actions (via GPIO/TB6600) through script or web-based control.
