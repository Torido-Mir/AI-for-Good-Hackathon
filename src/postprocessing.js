import { COCO_LABELS } from './labels';

const CONF_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.45;
const NUM_CLASSES = 80;
const NUM_DETECTIONS = 8400;
const INPUT_SIZE = 640;

export function processOutput(output, imgWidth, imgHeight) {
  const candidates = [];

  for (let i = 0; i < NUM_DETECTIONS; i++) {
    const cx = output[0 * NUM_DETECTIONS + i];
    const cy = output[1 * NUM_DETECTIONS + i];
    const w = output[2 * NUM_DETECTIONS + i];
    const h = output[3 * NUM_DETECTIONS + i];

    let maxScore = 0;
    let maxClassIdx = 0;
    for (let c = 0; c < NUM_CLASSES; c++) {
      const score = output[(4 + c) * NUM_DETECTIONS + i];
      if (score > maxScore) {
        maxScore = score;
        maxClassIdx = c;
      }
    }

    if (maxScore < CONF_THRESHOLD) continue;

    const x1 = Math.max(0, (cx - w / 2) / INPUT_SIZE * imgWidth);
    const y1 = Math.max(0, (cy - h / 2) / INPUT_SIZE * imgHeight);
    const x2 = Math.min(imgWidth, (cx + w / 2) / INPUT_SIZE * imgWidth);
    const y2 = Math.min(imgHeight, (cy + h / 2) / INPUT_SIZE * imgHeight);

    candidates.push({
      x1, y1, x2, y2,
      label: COCO_LABELS[maxClassIdx],
      confidence: maxScore,
      classIndex: maxClassIdx,
    });
  }

  return nms(candidates);
}

function nms(detections) {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const result = [];

  while (sorted.length > 0) {
    const best = sorted.shift();
    result.push(best);

    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].classIndex === best.classIndex && iou(best, sorted[i]) > IOU_THRESHOLD) {
        sorted.splice(i, 1);
      }
    }
  }

  return result;
}

function iou(a, b) {
  const interLeft = Math.max(a.x1, b.x1);
  const interTop = Math.max(a.y1, b.y1);
  const interRight = Math.min(a.x2, b.x2);
  const interBottom = Math.min(a.y2, b.y2);

  const interArea = Math.max(0, interRight - interLeft) * Math.max(0, interBottom - interTop);
  const aArea = (a.x2 - a.x1) * (a.y2 - a.y1);
  const bArea = (b.x2 - b.x1) * (b.y2 - b.y1);
  const unionArea = aArea + bArea - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}
