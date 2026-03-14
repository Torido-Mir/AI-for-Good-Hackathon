# Object Detector - AI for Good Hackathon

A React Native (Expo) app that captures photos and detects objects using YOLOv8 Nano with ONNX Runtime, running entirely on-device.

## Prerequisites

- Node.js 18+ (20.19+ recommended)
- Android device or emulator (API 26+) with camera
- Python 3.8+ (for model export, if not already done)

## Model Setup

The YOLOv8n ONNX model should already be at `assets/yolov8n.onnx`. If you need to re-export:

```bash
pip install ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt').export(format='onnx', imgsz=640, simplify=True)"
```

Copy `yolov8n.onnx` to `assets/yolov8n.onnx`.

## Build & Run

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

Expo Go will **not** work — `onnxruntime-react-native` requires a dev client build.

## How It Works

1. Camera preview with a Snap button
2. Photo is captured via expo-camera
3. Image is resized to 640x640 and converted to NCHW float tensor
4. YOLOv8n runs inference via onnxruntime-react-native
5. Output is decoded (8400 candidates) and filtered with NMS
6. Results shown with SVG bounding boxes overlaid on the photo

## Tech Stack

- Expo (dev client) + React Native
- expo-camera for capture
- onnxruntime-react-native for on-device inference
- jpeg-js for pixel extraction
- react-native-svg for bounding box rendering
