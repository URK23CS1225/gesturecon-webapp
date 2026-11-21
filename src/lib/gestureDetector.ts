import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export interface GestureInfo {
  cursorPosition: { x: number; y: number };
  isPinching: boolean;
  isFist: boolean;
}

function isFingerExtended(tip: Keypoint, middle: Keypoint): boolean {
  return tip.y < middle.y - 15;
}

export function detectGestures(
  landmarks: Keypoint[],
  videoWidth: number,
  videoHeight: number
): GestureInfo {
  const indexTip = landmarks[8];

  // Mirror X to match the CSS scaleX(-1) on the video element
  const cursorPosition = {
    x: 1 - indexTip.x / videoWidth,
    y: indexTip.y / videoHeight,
  };

  const indexExtended  = isFingerExtended(landmarks[8],  landmarks[6]);
  const middleExtended = isFingerExtended(landmarks[12], landmarks[10]);
  const ringExtended   = isFingerExtended(landmarks[16], landmarks[14]);
  const pinkyExtended  = isFingerExtended(landmarks[20], landmarks[18]);

  const isPinching = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
  const isFist     = indexExtended && middleExtended   && !ringExtended && !pinkyExtended;

  return { cursorPosition, isPinching, isFist };
}
