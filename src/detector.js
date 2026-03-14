const SERVER_URL = "http://10.36.39.104:8000";

export async function runDetection(photoUri) {
  const formData = new FormData();
  formData.append("file", {
    uri: photoUri,
    type: "image/jpeg",
    name: "photo.jpg",
  });

  const response = await fetch(`${SERVER_URL}/detect`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
