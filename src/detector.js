import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';
import { processOutput } from './postprocessing';

const INPUT_SIZE = 640;

export async function loadModel() {
  const asset = Asset.fromModule(require('../assets/yolov8n.onnx'));
  await asset.downloadAsync();

  const modelPath = asset.localUri.replace('file://', '');

  const session = await InferenceSession.create(modelPath, {
    intraOpNumThreads: 2,
  });

  return session;
}

export async function runDetection(session, photoUri, originalWidth, originalHeight) {
  // Resize to 640x640 and get base64 JPEG
  const manipulated = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    { base64: true, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Decode JPEG to raw RGBA pixel data
  const jpegBuffer = Buffer.from(manipulated.base64, 'base64');
  const rawImage = jpeg.decode(jpegBuffer, { useTArray: true, formatAsRGBA: true });

  // Convert to Float32Array in NCHW format, normalized to [0, 1]
  const numPixels = INPUT_SIZE * INPUT_SIZE;
  const float32Data = new Float32Array(3 * numPixels);

  for (let i = 0; i < numPixels; i++) {
    float32Data[i] = rawImage.data[i * 4] / 255.0;                   // R
    float32Data[numPixels + i] = rawImage.data[i * 4 + 1] / 255.0;   // G
    float32Data[2 * numPixels + i] = rawImage.data[i * 4 + 2] / 255.0; // B
  }

  // Create input tensor and run inference
  const inputTensor = new Tensor('float32', float32Data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const feeds = { images: inputTensor };
  const results = await session.run(feeds);

  // Extract output tensor data
  const outputKey = Object.keys(results)[0];
  const outputTensor = results[outputKey];
  const outputData = outputTensor.data;

  // Post-process (decode boxes + NMS)
  const detections = processOutput(outputData, originalWidth, originalHeight);

  return detections;
}
