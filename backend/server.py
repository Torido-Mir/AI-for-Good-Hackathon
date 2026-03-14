from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")


@app.get("/")
async def health():
    return {"status": "ok", "model": "yolov8n"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    results = model(image, imgsz=640, conf=0.25, iou=0.45)

    detections = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "confidence": float(box.conf[0]),
                "classIndex": int(box.cls[0]),
                "label": model.names[int(box.cls[0])],
            })

    return {
        "detections": detections,
        "imageWidth": image.width,
        "imageHeight": image.height,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
