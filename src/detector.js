const SERVER_URL = "http://10.92.185.7:8000";

export async function runDetection(photoUri) {
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
