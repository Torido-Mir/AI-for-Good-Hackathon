import os
from pathlib import Path
from dotenv import load_dotenv

try:
    # create your .env.local
    from openai import OpenAI
except ImportError:
    OpenAI = None

# Load OpenAI API key
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
load_dotenv(dotenv_path=PROJECT_ROOT / ".env.local")
raw_openrouter_key = os.getenv("OPENROUTER_API") or os.getenv("OPENROUTER_API_KEY")
api_key = raw_openrouter_key or os.getenv("OPENAI_API_KEY") or ""
api_key = api_key.strip().strip('"').strip("'")

client = None
if api_key and OpenAI is not None:
    if raw_openrouter_key:
        client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
    else:
        client = OpenAI(api_key=api_key)

def generate_example_sentences(object_name: str, num_sentences: int = 1):
    """
    Generate beginner-friendly English sentences for a given object.
    Ensures clean output: no numbering, no extra headers.
    """
    prompt = (
        f"Generate exactly {num_sentences} short, simple English sentences "
        f"using the word '{object_name}'. "
        "Do NOT include numbering, headers, or extra text. "
        "Only output the sentences separated by periods."
    )

    if client is None:
        return f"This is a {object_name}."

    try:
        response = client.chat.completions.create(
            model="google/gemini-3-pro-preview" if raw_openrouter_key else "gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful teacher for beginner English learners."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=100
        )

        text = (response.choices[0].message.content or "").strip()
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        if not sentences:
            return f"This is a {object_name}."
        return f"{sentences[0]}."
    except Exception:
        return f"This is a {object_name}."

# example
if __name__ == "__main__":
    # Replace this with the object detected by your YOLO app
    object_word = "rice"
    sentences = generate_example_sentences(object_word)
    
    print("AI-generated example sentences:")
    # for s in sentences:
        # print("-", s)

    print("-", sentences)