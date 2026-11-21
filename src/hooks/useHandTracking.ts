import { useEffect, useRef, useState } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import { detectGestures, resetGestureState, GestureInfo } from '../lib/gestureDetector';
import { OneEuroFilter } from '../lib/oneEuroFilter';
import { TRACKING_CONFIG } from '../lib/trackingConfig';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export interface TrackingMetrics {
  fps: number;
  inferenceMs: number;   // rolling average of estimateHands() duration
  endToEndMs: number;    // rolling average of full loop iteration
  handLost: boolean;
  handPartiallyOutOfFrame: boolean;
}

export interface TrackingDebug {
  rawX: number;
  rawY: number;
  filteredX: number;
  filteredY: number;
  rawGesture: string;
  votes: { click: number; draw: number; idle: number };
  stability: number;
  inHysteresis: boolean;
  windowSize: number;
  votesRequired: number;
}

const ROLLING = 30; // frames for rolling averages

export function useHandTracking(videoElement: HTMLVideoElement | null) {
  const [gestureInfo, setGestureInfo]   = useState<GestureInfo | null>(null);
  const [landmarks,   setLandmarks]     = useState<Keypoint[] | null>(null);
  const [isReady,     setIsReady]       = useState(false);
  const [metrics,     setMetrics]       = useState<TrackingMetrics>({
    fps: 0, inferenceMs: 0, endToEndMs: 0,
    handLost: false, handPartiallyOutOfFrame: false,
  });
  const [debugData, setDebugData] = useState<TrackingDebug | null>(null);

  const detectorRef   = useRef<handPoseDetection.HandDetector | null>(null);
  const animationRef  = useRef<number>();
  const runningRef    = useRef(false);

  // One Euro filters — one per axis
  const filterX = useRef(new OneEuroFilter(
    TRACKING_CONFIG.oneEuro.minCutoff,
    TRACKING_CONFIG.oneEuro.beta,
    TRACKING_CONFIG.oneEuro.dCutoff,
  ));
  const filterY = useRef(new OneEuroFilter(
    TRACKING_CONFIG.oneEuro.minCutoff,
    TRACKING_CONFIG.oneEuro.beta,
    TRACKING_CONFIG.oneEuro.dCutoff,
  ));

  // Hand loss grace period
  const lastHandSeenAt  = useRef<number>(0);
  const handLostRef     = useRef(false);

  // Rolling metric buffers (kept in refs, not state — no re-renders per frame)
  const inferenceBuf  = useRef<number[]>([]);
  const endToEndBuf   = useRef<number[]>([]);
  const fpsFrameTimes = useRef<number[]>([]);

  // Throttle React state updates to ~10 Hz
  const lastMetricsUpdate = useRef(0);

  // Cursor position history for click-freeze
  const posHistoryRef = useRef<{ x: number; y: number }[]>([]);

  // ── Init detector ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        console.log('Initializing hand detector...');
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TF backend:', tf.getBackend());

        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detector = await handPoseDetection.createDetector(model, {
          runtime: 'tfjs',
          modelType: 'lite',
          maxHands: 1,
        });

        if (mounted) {
          detectorRef.current = detector;
          setIsReady(true);
          console.log('Hand detector ready!');
        }
      } catch (err) {
        console.error('Detector init failed:', err);
        setTimeout(() => { if (mounted) init(); }, 2000);
      }
    }

    init();

    return () => {
      mounted = false;
      runningRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      detectorRef.current?.dispose();
    };
  }, []);

  // ── Detection loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoElement || !detectorRef.current || !isReady) return;
    if (runningRef.current) return;

    runningRef.current = true;
    filterX.current.reset();
    filterY.current.reset();
    resetGestureState();

    async function loop() {
      if (!runningRef.current || !videoElement || !detectorRef.current) return;

      // Wait for video to be ready
      if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }
      if (!videoElement.width || !videoElement.height) {
        videoElement.width  = videoElement.videoWidth;
        videoElement.height = videoElement.videoHeight;
      }

      const loopStart = performance.now();

      try {
        // ── Inference ──────────────────────────────────────────────────
        const t0    = performance.now();
        const hands = await detectorRef.current.estimateHands(videoElement);
        const inferMs = performance.now() - t0;

        const W = videoElement.videoWidth;
        const H = videoElement.videoHeight;
        const now = performance.now();

        if (hands.length > 0 && hands[0].keypoints) {
          lastHandSeenAt.current = now;
          handLostRef.current    = false;

          const kp = hands[0].keypoints;

          // ── Active region mapping ────────────────────────────────────
          // Map the central `activeRegion` fraction to full viewport.
          const ar     = TRACKING_CONFIG.activeRegion;
          const margin = (1 - ar) / 2;           // e.g. 0.175 each side

          // Raw normalised position (already mirrored for X)
          const rawNormX = 1 - kp[8].x / W;
          const rawNormY =     kp[8].y / H;

          // Remap from [margin, 1-margin] to [0, 1], clamp
          const remapX = Math.max(0, Math.min(1, (rawNormX - margin) / ar));
          const remapY = Math.max(0, Math.min(1, (rawNormY - margin) / ar));

          // ── One Euro filter ──────────────────────────────────────────
          const filtX = filterX.current.filter(remapX, now);
          const filtY = filterY.current.filter(remapY, now);

          // ── Gesture detection ────────────────────────────────────────
          const gesture = detectGestures(kp, W, H);

          // Override cursorPosition with our filtered + remapped position
          gesture.cursorPosition = { x: filtX, y: filtY };

          // ── Click-freeze: keep position history ──────────────────────
          posHistoryRef.current.push({ x: filtX, y: filtY });
          if (posHistoryRef.current.length > TRACKING_CONFIG.clickFreezeFrames + 2) {
            posHistoryRef.current.shift();
          }
          // If a click candidate just appeared, freeze cursor at the
          // position from FREEZE_FRAMES ago
          if (gesture.isPinching) {
            const freeze = posHistoryRef.current[0] ?? { x: filtX, y: filtY };
            gesture.cursorPosition = freeze;
          }

          // ── Out-of-frame detection ───────────────────────────────────
          const edgeMargin = 0.05;
          const partiallyOut = (
            rawNormX < edgeMargin || rawNormX > 1 - edgeMargin ||
            rawNormY < edgeMargin || rawNormY > 1 - edgeMargin
          );

          // ── Update state (throttled) ─────────────────────────────────
          setGestureInfo({ ...gesture });
          setLandmarks([...kp]);

          // Rolling inference buffer
          inferenceBuf.current.push(inferMs);
          if (inferenceBuf.current.length > ROLLING) inferenceBuf.current.shift();

          const endMs = performance.now() - loopStart;
          endToEndBuf.current.push(endMs);
          if (endToEndBuf.current.length > ROLLING) endToEndBuf.current.shift();

          fpsFrameTimes.current.push(now);
          // Keep only last 1 second
          const cutoff = now - 1000;
          fpsFrameTimes.current = fpsFrameTimes.current.filter(t => t > cutoff);

          if (now - lastMetricsUpdate.current > TRACKING_CONFIG.metricsUpdateHz) {
            lastMetricsUpdate.current = now;
            const avgInf    = avg(inferenceBuf.current);
            const avgEnd    = avg(endToEndBuf.current);
            const fps       = fpsFrameTimes.current.length;

            setMetrics({
              fps,
              inferenceMs: avgInf,
              endToEndMs:  avgEnd,
              handLost: false,
              handPartiallyOutOfFrame: partiallyOut,
            });
            setDebugData({
              rawX:       rawNormX,
              rawY:       rawNormY,
              filteredX:  filtX,
              filteredY:  filtY,
              rawGesture: gesture.rawGesture,
              votes:      gesture.votes,
              stability:  gesture.stability,
              inHysteresis: gesture.inHysteresis,
              windowSize: TRACKING_CONFIG.confirmation.windowSize,
              votesRequired: TRACKING_CONFIG.confirmation.votesRequired,
            });
          }

        } else {
          // ── Hand loss grace period ────────────────────────────────────
          const elapsed = now - lastHandSeenAt.current;
          if (elapsed > TRACKING_CONFIG.handLossGraceMs) {
            if (!handLostRef.current) {
              handLostRef.current = true;
              resetGestureState();
              filterX.current.reset();
              filterY.current.reset();
              posHistoryRef.current = [];
            }
            setGestureInfo(null);
            setLandmarks(null);

            if (now - lastMetricsUpdate.current > TRACKING_CONFIG.metricsUpdateHz) {
              lastMetricsUpdate.current = now;
              setMetrics(m => ({ ...m, handLost: true, handPartiallyOutOfFrame: false }));
              setDebugData(null);
            }
          }
          // else: within grace period — keep last gestureInfo, don't update
        }

      } catch (err) {
        console.error('Detection error:', err);
      }

      animationRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      runningRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [videoElement, isReady]);

  return { gestureInfo, landmarks, isReady, metrics, debugData };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
