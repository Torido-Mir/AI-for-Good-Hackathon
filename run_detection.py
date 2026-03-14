import sys
import os
from ultralytics import YOLO
from PIL import Image
from gtts import gTTS
import base64

def process_image(image_path):
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found.")
        return

    # 1. Load the YOLO model
    model = YOLO("yolov8n.pt")

    # 2. Run YOLO detection (silenced)
    results = model(image_path, verbose=False)
    result = results[0]

    if len(result.boxes) == 0:
        return

    # 3. Get the main object (highest confidence)
    top_box = sorted(result.boxes, key=lambda x: x.conf[0], reverse=True)[0]
    label_index = int(top_box.cls[0])
    label_name = result.names[label_index]
    
    # OUTPUT JUST THE WORD
    print(label_name)

    # (2) Generate and Save Recording (TTS) - COMMENTED OUT
    # audio_filename = f"result_audio_{label_name}.mp3"
    # tts = gTTS(text=label_name, lang='en')
    # tts.save(audio_filename)
    
    # Try to play it
    # try:
    #     if sys.platform == "win32":
    #         os.startfile(audio_filename)
    #     elif sys.platform == "darwin":
    #         os.system(f"afplay {audio_filename}")
    #     else:
    #         os.system(f"mpg123 {audio_filename}")
    # except:
    #     pass

    # (3) Save image with labels/boxes - COMMENTED OUT
    # annotated_img_array = result.plot()
    # annotated_img = Image.fromarray(annotated_img_array[..., ::-1])
    
    # output_image_path = f"detected_{os.path.basename(image_path)}"
    # annotated_img.save(output_image_path)
if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("Usage: python run_detection.py <image_filename>")
    else:
        process_image(sys.argv[1])

# name in "label_name"