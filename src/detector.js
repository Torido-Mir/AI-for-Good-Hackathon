const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

function ensureServerUrl() {
  if (!SERVER_URL) {
    throw new Error("Missing EXPO_PUBLIC_SERVER_URL. Add it to your .env.local file.");
  }
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function getServerUrl() {
  ensureServerUrl();
  return SERVER_URL;
}

export function englishSpeechBase64ToUri(base64Speech) {
  if (!base64Speech) return null;
  return `data:audio/mp3;base64,${base64Speech}`;
}

export async function runDetection(photoUri) {
  ensureServerUrl();

  const formData = new FormData();
  formData.append("file", {
    uri: photoUri,
    type: "image/jpeg",
    name: "photo.jpg",
  });
  console.log(formData)
  console.log('form successful')
  console.log(`Fetching: ${SERVER_URL}/detect`)

  try {
    const response = await fetch(`${SERVER_URL}/detect`, {
      method: "POST",
      body: formData
    });
    console.log("received response")

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Fetch error name:", err.name);
    console.error("Fetch error message:", err.message);
    console.error("Fetch error stack:", err.stack);
    throw err;
  }
}

export async function getRohingyaSentenceAudio(text) {
  ensureServerUrl();

  const response = await fetch(`${SERVER_URL}/english_to_rhg_audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const rohingyaText = response.headers.get('X-Rohingya-Text') || '';
  const audioBlob = await response.blob();
  const audioUri = await blobToDataUri(audioBlob);

  return {
    rohingyaText,
    audioUri,
  };
}
