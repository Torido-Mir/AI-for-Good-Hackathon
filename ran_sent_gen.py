import os
from dotenv import load_dotenv

try:
    # create your .env.local
    from openai import OpenAI
except ImportError:
    OpenAI = None

# Load OpenAI API key
load_dotenv(".env.local")
api_key = os.getenv("OPENAI_API_KEY")

client = None
if api_key and OpenAI is not None:
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

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",   # cheap and fast
        messages=[
            {"role": "system", "content": "You are a helpful teacher for beginner English learners."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=100
    )

    text = response.choices[0].message.content.strip()
    # Split sentences by periods and clean
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    # return sentences[:num_sentences]
    return sentences[0]

# example
if __name__ == "__main__":
    # Replace this with the object detected by your YOLO app
    object_word = "rice"
    sentences = generate_example_sentences(object_word)
    
    print("AI-generated example sentences:")
    # for s in sentences:
        # print("-", s)

    print("-", sentences)