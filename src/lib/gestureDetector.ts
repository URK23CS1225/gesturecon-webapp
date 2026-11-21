import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export interface GestureInfo {
  cursorPosition: { x: number; y: number };
  isPinching: boolean;
  isFist: boolean;
}

/**
 * Check if a finger is extended
 */
function isFingerExtended(tip: Keypoint, middle: Keypoint): boolean {
  return tip.y < middle.y - 15;
}

/**
 * Detect gestures from hand landmarks.
 * Keypoints are already in pixel space (0–videoWidth, 0–videoHeight)
 * and already flipped horizontally (flipHorizontal: true in estimateHands).
 */
export function detectGestures(
  landmarks: Keypoint[],
  videoWidth: number,
  videoHeight: number
): GestureInfo {
  const indexTip = landmarks[8];

  // Map pixel coordinates to 0–1 screen-space.
  // x is already mirrored by flipHorizontal, so just divide.
  const cursorPosition = {
    x: indexTip.x / videoWidth,
    y: indexTip.y / videoHeight,
  };

  const indexExtended  = isFingerExtended(landmarks[8],  landmarks[6]);
  const middleExtended = isFingerExtended(landmarks[12], landmarks[10]);
  const ringExtended   = isFingerExtended(landmarks[16], landmarks[14]);
  const pinkyExtended  = isFingerExtended(landmarks[20], landmarks[18]);

  // Click: only index finger up
  const isPinching = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

  // Draw: index and middle fingers up
  const isFist = indexExtended && middleExtended && !ringExtended && !pinkyExtended;

  return { cursorPosition, isPinching, isFist };
}
