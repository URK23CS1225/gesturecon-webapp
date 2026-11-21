/**
 * Central config for all tunable tracking parameters.
 * Change values here; nothing else needs editing.
 */
export const TRACKING_CONFIG = {
  // ── Active region ────────────────────────────────────────────────────────
  // Fraction of the video frame used as the input region (centred).
  // 0.65 means the central 65% maps to the full viewport.
  activeRegion: 0.65,

  // ── One Euro filter ──────────────────────────────────────────────────────
  // Higher minCutoff → less lag but more jitter at slow speeds.
  // Higher beta       → faster response to fast movements (reduces lag).
  // dCutoff is usually left at 1.0.
  oneEuro: {
    minCutoff: 1.0,
    beta: 0.01,
    dCutoff: 1.0,
  },

  // ── Gesture confirmation (sliding window vote) ───────────────────────────
  // A gesture is confirmed when it wins `votesRequired` of the last
  // `windowSize` frames.
  confirmation: {
    windowSize: 7,
    votesRequired: 5,
  },

  // ── Hysteresis thresholds (pixels) ───────────────────────────────────────
  // enterThreshold  – tip must be this many px ABOVE pip to start extending.
  // exitThreshold   – tip only needs to be this many px above pip to stay extended.
  // A larger gap prevents flicker at the boundary.
  hysteresis: {
    enterThreshold: 25,   // stricter: harder to enter
    exitThreshold: 12,    // lenient:  easier to stay
  },

  // ── Pinch detection (click gesture) ──────────────────────────────────────
  // Thresholds are fractions of palm width (wrist → middle-MCP distance),
  // so they are invariant to hand size and camera distance.
  // pinchEnter ≤ this normalised distance → pinch starts
  // pinchExit  > this normalised distance → pinch ends  (hysteresis gap)
  pinch: {
    pinchEnter: 0.35,   // thumb tip must be within 35% of palm width from index tip
    pinchExit:  0.45,   // pinch only releases when gap exceeds 45% of palm width
  },

  // ── Click stability: cursor freeze ───────────────────────────────────────
  // How many frames back to take the "frozen" cursor position from when
  // a click candidate first appears.
  clickFreezeFrames: 3,

  // ── Hand loss ────────────────────────────────────────────────────────────
  // How long (ms) to hold the last state before marking the hand as lost.
  handLossGraceMs: 150,

  // ── Target magnetism ─────────────────────────────────────────────────────
  // If a clickable element's centre is within this many px of the cursor,
  // snap the hit-test to it.
  magnetismRadiusPx: 30,

  // ── Click cooldown ───────────────────────────────────────────────────────
  clickCooldownMs: 400,

  // ── Display refresh ──────────────────────────────────────────────────────
  // How often (ms) the HUD metrics update. Keep ≥ 100ms to avoid
  // triggering too many React re-renders.
  metricsUpdateHz: 100,
};

export type TrackingConfig = typeof TRACKING_CONFIG;
