import functools
import io
import os
from pathlib import Path
from gtts import gTTS
import base64

import numpy as np
import scipy.io.wavfile
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel
from transformers import AutoTokenizer, VitsModel, Wav2Vec2ForCTC, Wav2Vec2Processor
from ultralytics import YOLO
from PIL import Image
import uvicorn
from dotenv import load_dotenv

from ran_sent_gen import generate_example_sentences

app = FastAPI()

OPENROUTER_MODEL = "google/gemini-3-pro-preview"
TTS_MODEL_ID = "facebook/mms-tts-rhg"
ASR_MODEL_ID = "facebook/mms-1b-all"
ROHINGYA_LANG = "rhg"

load_dotenv()
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
load_dotenv(dotenv_path=PROJECT_ROOT / ".env.local")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")

class EnglishToRhgAudioRequest(BaseModel):
    text: str


class RhgAudioToEnglishResponse(BaseModel):
    english_text: str
    rohingya_text: str


def _get_api_key() -> str:
    api_key = (
        os.getenv("OPENROUTER_API")
        or os.getenv("OPENROUTER_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or ""
    )
    api_key = api_key.strip().strip('"').strip("'")
    if not api_key:
        raise RuntimeError(
            "Missing API key. Set OPENROUTER_API (or OPENROUTER_API_KEY / OPENAI_API_KEY) "
            "in .env.local at project root or export it in your shell environment."
        )
    return api_key


@functools.lru_cache(maxsize=1)
def get_openrouter_client() -> OpenAI:
    return OpenAI(api_key=_get_api_key(), base_url="https://openrouter.ai/api/v1")


@functools.lru_cache(maxsize=1)
def load_tts() -> tuple[VitsModel, AutoTokenizer]:
    model = VitsModel.from_pretrained(TTS_MODEL_ID)
    tokenizer = AutoTokenizer.from_pretrained(TTS_MODEL_ID)
    model.eval()
    return model, tokenizer


@functools.lru_cache(maxsize=1)
def load_rohingya_asr_model() -> tuple[Wav2Vec2Processor, Wav2Vec2ForCTC]:
    asr_processor = Wav2Vec2Processor.from_pretrained(ASR_MODEL_ID)
    asr_model = Wav2Vec2ForCTC.from_pretrained(ASR_MODEL_ID)
    asr_processor.tokenizer.set_target_lang(ROHINGYA_LANG)
    asr_model.load_adapter(ROHINGYA_LANG)
    asr_model.eval()
    return asr_processor, asr_model


def _chat_translate(system_prompt: str, text: str) -> str:
    try:
        client = get_openrouter_client()
        response = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return text


def translate_to_rohingya(text: str) -> str:
    return _chat_translate(
        "You are a translation assistant. "
        "Translate the user's text into Rohingya written in Latin script (Rohingyalish). "
        "Return only the translated text with no explanations or extra formatting.",
        text,
    )


def translate_to_english(text: str) -> str:
    return _chat_translate(
        "You are a translation assistant. "
        "Translate the following Rohingya Latin script (Rohingyalish) text into English. "
        "Return only the translated text with no explanations or extra formatting.",
        text,
    )


def transcribe_rohingya(audio: np.ndarray, sample_rate: int) -> str:
    asr_processor, asr_model = load_rohingya_asr_model()
    inputs = asr_processor(audio, sampling_rate=sample_rate, return_tensors="pt")
    with torch.no_grad():
        logits = asr_model(**inputs).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    return asr_processor.decode(predicted_ids[0])


def _to_float32_mono(data: np.ndarray) -> np.ndarray:
    if data.ndim > 1:
        data = data[:, 0]
    if np.issubdtype(data.dtype, np.integer):
        data = data.astype(np.float32) / np.iinfo(data.dtype).max
    else:
        data = data.astype(np.float32)
    return data

@app.get("/")
async def health():
    return {"status": "ok", "model": "yolov8n"}

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
        "sentence": sentence,
        "sentence_speech": sentence_speech_base64,
        "confidence": confidence,
        "box": box
    }


@app.post("/english_to_rhg_audio")
def english_to_rhg_audio(payload: EnglishToRhgAudioRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="`text` cannot be empty.")

    try:
        rohingya_text = translate_to_rohingya(payload.text) or payload.text
    except Exception:
        rohingya_text = payload.text

    try:
        tts_model, tts_tokenizer = load_tts()
        inputs = tts_tokenizer(rohingya_text, return_tensors="pt")

        with torch.no_grad():
            waveform = tts_model(**inputs).waveform

        audio = waveform.squeeze().detach().cpu().numpy().astype(np.float32)
        wav_buffer = io.BytesIO()
        scipy.io.wavfile.write(wav_buffer, rate=tts_model.config.sampling_rate, data=audio)
        wav_buffer.seek(0)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate Rohingya audio: {exc}",
        ) from exc

    return StreamingResponse(
        wav_buffer,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=rhg_audio.wav",
            "X-Rohingya-Text": rohingya_text,
        },
    )


@app.post("/rhg_audio_to_english", response_model=RhgAudioToEnglishResponse)
async def rhg_audio_to_english(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Upload a .wav file.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        sample_rate, data = scipy.io.wavfile.read(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid WAV file: {exc}") from exc

    audio = _to_float32_mono(data)
    rohingya_text = transcribe_rohingya(audio, sample_rate)
    english_text = translate_to_english(rohingya_text)

    return RhgAudioToEnglishResponse(
        english_text=english_text,
        rohingya_text=rohingya_text,
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
