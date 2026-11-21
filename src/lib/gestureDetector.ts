import { Keypoint } from '@tensorflow-models/hand-pose-detection';
import { TRACKING_CONFIG } from './trackingConfig';

export type GestureLabel = 'click' | 'draw' | 'idle' | 'none';

export interface GestureInfo {
  /** Normalised 0-1 cursor position (already mirrored). */
  cursorPosition: { x: number; y: number };
  /** True when the confirmed gesture is 'click' (pinch). */
  isPinching: boolean;
  /** True when the confirmed gesture is 'draw' (index+middle extended). */
  isFist: boolean;
  /** The confirmed gesture label. */
  gesture: GestureLabel;
  /** Debug: the raw (unconfirmed) candidate this frame. */
  rawGesture: GestureLabel;
  /** Debug: fraction of the last windowSize frames that agree with confirmed. */
  stability: number;
  /** Debug: current vote counts { click, draw, idle }. */
  votes: { click: number; draw: number; idle: number };
  /** Whether the confirmed gesture is in hysteresis (exit zone). */
  inHysteresis: boolean;
}

// ── Sliding-window state (module-level, lives across frames) ──────────────
const WINDOW   = TRACKING_CONFIG.confirmation.windowSize;
const REQUIRED = TRACKING_CONFIG.confirmation.votesRequired;

type RawLabel = 'click' | 'draw' | 'idle' | 'other';
const frameWindow: RawLabel[] = [];

let confirmedGesture: GestureLabel = 'none';
let middleInHysteresis = false;
// Pinch hysteresis state
let pinchActive = false;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the Euclidean distance between two keypoints in pixel space.
 */
function dist2D(a: Keypoint, b: Keypoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Finger-extension check with enter/exit hysteresis.
 * Uses pixel thresholds (tip.y above pip.y).
 */
function isExtended(
  tip: Keypoint,
  pip: Keypoint,
  mcp: Keypoint,
  currentlyExtended: boolean,
): { extended: boolean; hysteresis: boolean } {
  const { enterThreshold, exitThreshold } = TRACKING_CONFIG.hysteresis;
  const diff       = pip.y - tip.y;   // positive = tip is above pip
  const pipAboveMcp = pip.y < mcp.y + 15;

  if (!currentlyExtended) {
    return { extended: diff > enterThreshold && pipAboveMcp, hysteresis: false };
  } else {
    const stillExtended = diff > exitThreshold && pipAboveMcp;
    const inHysteresis  = diff > exitThreshold && diff <= enterThreshold;
    return { extended: stillExtended, hysteresis: inHysteresis };
  }
}

/**
 * Pinch detection: normalised thumb-tip to index-tip distance.
 * Normalised by palm width (wrist → middle-MCP, landmarks 0 → 9)
 * so the threshold is scale- and distance-invariant.
 *
 * Threshold values are in units of palm widths:
 *   enter ≤ 0.35  → pinch starts
 *   exit  > 0.45  → pinch ends   (hysteresis gap prevents flicker)
 */
function isPinch(
  landmarks: Keypoint[],
  currentlyPinching: boolean,
): boolean {
  const palmWidth = dist2D(landmarks[0], landmarks[9]);
  if (palmWidth < 1) return false;   // degenerate hand pose

  const pinchDist     = dist2D(landmarks[4], landmarks[8]); // thumb tip, index tip
  const normalisedDist = pinchDist / palmWidth;

  const { pinchEnter, pinchExit } = TRACKING_CONFIG.pinch;

  if (!currentlyPinching) {
    return normalisedDist <= pinchEnter;
  } else {
    return normalisedDist <= pinchExit;
  }
}

function countVotes(label: RawLabel): number {
  return frameWindow.filter(f => f === label).length;
}

function rawToLabel(label: RawLabel): GestureLabel {
  if (label === 'click') return 'click';
  if (label === 'draw')  return 'draw';
  return 'idle';
}

// ── Main export ────────────────────────────────────────────────────────────

export function detectGestures(
  landmarks: Keypoint[],
  videoWidth: number,
  videoHeight: number,
): GestureInfo {
  const indexTip = landmarks[8];

  // Mirror X to match the CSS scaleX(-1) video
  const cursorPosition = {
    x: 1 - indexTip.x / videoWidth,
    y: indexTip.y / videoHeight,
  };

  // ── Pinch (click) ────────────────────────────────────────────────────────
  pinchActive = isPinch(landmarks, pinchActive);

  // ── Finger extension (draw + cursor movement) ────────────────────────────
  const middleResult = isExtended(
    landmarks[12], landmarks[10], landmarks[9],
    middleInHysteresis || confirmedGesture === 'draw',
  );
  middleInHysteresis = middleResult.hysteresis;

  const indexResult = isExtended(landmarks[8], landmarks[6], landmarks[5], false);
  const ringResult  = isExtended(landmarks[16], landmarks[14], landmarks[13], false);
  const pinkyResult = isExtended(landmarks[20], landmarks[18], landmarks[17], false);

  const indexExt  = indexResult.extended;
  const middleExt = middleResult.extended;
  const ringExt   = ringResult.extended;
  const pinkyExt  = pinkyResult.extended;

  // ── Raw classification ────────────────────────────────────────────────────
  // Priority: pinch > draw > idle
  let raw: RawLabel;
  if (pinchActive) {
    // Pinch overrides everything — thumb + index touching = click
    raw = 'click';
  } else if (indexExt && middleExt && !ringExt && !pinkyExt) {
    // Index + middle extended, no pinch = draw
    raw = 'draw';
  } else if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    raw = 'idle';
  } else {
    // Covers: index-only, three fingers, all fingers, etc. — cursor movement
    raw = 'idle';
  }

  // ── Sliding-window vote confirmation ─────────────────────────────────────
  frameWindow.push(raw);
  if (frameWindow.length > WINDOW) frameWindow.shift();

  const clickVotes = countVotes('click');
  const drawVotes  = countVotes('draw');
  const idleVotes  = countVotes('idle');

  if (clickVotes >= REQUIRED) {
    confirmedGesture = 'click';
  } else if (drawVotes >= REQUIRED) {
    confirmedGesture = 'draw';
  } else if (idleVotes >= REQUIRED) {
    confirmedGesture = 'none';
  }
  // else: keep previous (sliding-window hysteresis)

  // ── Stability ─────────────────────────────────────────────────────────────
  const confirmedRaw: RawLabel =
    confirmedGesture === 'none' ? 'idle' : (confirmedGesture as RawLabel);
  const matchingVotes = countVotes(confirmedRaw);
  const stability = frameWindow.length > 0 ? matchingVotes / frameWindow.length : 0;

  return {
    cursorPosition,
    isPinching: confirmedGesture === 'click',
    isFist:     confirmedGesture === 'draw',
    gesture:    confirmedGesture,
    rawGesture: rawToLabel(raw),
    stability,
    votes: { click: clickVotes, draw: drawVotes, idle: idleVotes },
    inHysteresis: middleInHysteresis,
  };
}

/** Call this when the hand is lost to reset state cleanly. */
export function resetGestureState(): void {
  frameWindow.length = 0;
  confirmedGesture   = 'none';
  middleInHysteresis = false;
  pinchActive        = false;
}
