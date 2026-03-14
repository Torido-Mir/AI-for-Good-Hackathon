import io
import base64
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
from gtts import gTTS
from ran_sent_gen import generate_example_sentences
import uvicorn

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLO model
model = YOLO("yolov8n.pt")

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    # 1. Read the image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # 2. Run YOLO detection
    results = model(image)
    result = results[0]
    
    if len(result.boxes) == 0:
        return {"word": "nothing detected", "speech": "", "confidence": 0, "box": []}
    
    # 3. Get the main object (highest confidence)
    top_box = sorted(result.boxes, key=lambda x: x.conf[0], reverse=True)[0]
    label_index = int(top_box.cls[0])
    label_name = result.names[label_index]
    confidence = float(top_box.conf[0])
    box = top_box.xyxyn[0].tolist()

    # 3.5 Generate a simple example sentence (text) for educational feedback
    sentence = generate_example_sentences(label_name)
    
    # 4. Generate TTS (Speech) using gTTS
    tts = gTTS(text=label_name, lang='en')
    audio_fp = io.BytesIO()
    tts.write_to_fp(audio_fp)
    audio_fp.seek(0)

    sentence_tts = gTTS(text=sentence, lang='en')
    sentence_audio_fp = io.BytesIO()
    sentence_tts.write_to_fp(sentence_audio_fp)
    sentence_audio_fp.seek(0)
    
    # 5. Convert audio to Base64 string for the JSON response
    speech_base64 = base64.b64encode(audio_fp.read()).decode('utf-8')
    sentence_speech_base64 = base64.b64encode(sentence_audio_fp.read()).decode('utf-8')
    
    # Return the exact JSON format requested: {word: x, speech: y}
    return {
        "word": label_name,
        "speech": speech_base64,
        # "sentence": sentence,
        # "sentence_speech": sentence_speech_base64,
        "confidence": confidence,
        "box": box
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
