1. Give VSCode Local Network access

source .venv/bin/activate
python -m spaghettimonster

The daemon now also runs an HTTP API on `0.0.0.0:8000` for the frontend:

- `GET /api/health`
- `GET /api/snapshot` — merged printer state
- `GET /api/events?limit=N` — recent events (ring buffer, max 200)
- `GET /api/stream` — Server-Sent Events of live events
- `GET /api/frame.jpg` — last captured camera frame
- `GET /api/detector` — AI detector status

Override host/port with `API_HOST` / `API_PORT` env vars.

Optional AI spaghetti detection:

- Requires Bambu Studio installed locally so `libBambuSource.dylib` is present.
- Requires `ffmpeg` on your `PATH` to decode the printer's liveview H.264 stream into a JPEG frame for the detector.
- Runs fully locally after the model file is downloaded once.
- Requires the printer liveview camera to be enabled on the printer.
- The A1 liveview path only supports one active client well, so close any competing liveview session first.
- On first use it downloads Obico's published ONNX failure-detection weights to `~/.cache/spaghettimonster/`.

Add these to `.env` to enable it:

```bash
SPAGHETTI_AI_ENABLED=true
SPAGHETTI_INTERVAL_SEC=30
SPAGHETTI_CONSECUTIVE_HITS=2
SPAGHETTI_MIN_CONFIDENCE=0.85
SPAGHETTI_DETECTION_THRESHOLD=0.08
# Optional override:
# CAMERA_LIBRARY_PATH=/Users/you/Library/Application Support/BambuStudio/plugins/libBambuSource.dylib
# SPAGHETTI_MODEL_PATH=/path/to/local/model.onnx
# SPAGHETTI_MODEL_URL=https://...
```

Quick one-shot test:

```bash
python -m spaghettimonster.detect_once --save /tmp/a1-frame.jpg
```

That will:

- capture and decode one frame from the A1 local camera stream
- run the local failure model once
- print a JSON result
- save the captured frame if you pass `--save`
