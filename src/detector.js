const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export async function runDetection(photoUri) {
  if (!SERVER_URL) {
    throw new Error("Missing EXPO_PUBLIC_SERVER_URL. Add it to your .env.local file.");
  }

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
