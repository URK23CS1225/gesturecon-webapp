import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export interface GestureInfo {
  cursorPosition: { x: number; y: number };
  isPinching: boolean;
  isFist: boolean;
}

/**
 * Check if a finger is extended - more sensitive detection
 */
function isFingerExtended(tip: Keypoint, middle: Keypoint): boolean {
  return tip.y < middle.y - 15; // Reduced threshold for easier detection
}

/**
 * Detect gestures from hand landmarks
 */
export function detectGestures(
  landmarks: Keypoint[],
  videoWidth: number,
  videoHeight: number
): GestureInfo {
  const indexTip = landmarks[8];
  
  // Map video coordinates to screen coordinates
  const cursorPosition = {
    x: 1 - (indexTip.x / videoWidth),
    y: indexTip.y / videoHeight
  };

  // Check which fingers are extended
  const indexExtended = isFingerExtended(landmarks[8], landmarks[6]);
  const middleExtended = isFingerExtended(landmarks[12], landmarks[10]);
  const ringExtended = isFingerExtended(landmarks[16], landmarks[14]);
  const pinkyExtended = isFingerExtended(landmarks[20], landmarks[18]);

  // Click gesture: Only index finger up
  const isPinching = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

  // Draw gesture: Index and middle fingers up
  const isFist = indexExtended && middleExtended && !ringExtended && !pinkyExtended;

  return { cursorPosition, isPinching, isFist };
}
