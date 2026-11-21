import { useEffect, useRef, useState } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { detectGestures, GestureInfo } from '../lib/gestureDetector';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export function useHandTracking(videoElement: HTMLVideoElement | null) {
  const [gestureInfo, setGestureInfo] = useState<GestureInfo | null>(null);
  const [landmarks, setLandmarks] = useState<Keypoint[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const animationRef = useRef<number>();
  const runningRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initializeDetector() {
      try {
        console.log('Initializing hand detector...');

        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detector = await handPoseDetection.createDetector(model, {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915',
          modelType: 'lite',
          maxHands: 1,
        });

        if (mounted) {
          detectorRef.current = detector;
          setIsReady(true);
          console.log('Hand detector ready!');
        }
      } catch (error) {
        console.error('Failed to initialize hand detector:', error);
        setTimeout(() => { if (mounted) initializeDetector(); }, 2000);
      }
    }

    initializeDetector();

    return () => {
      mounted = false;
      runningRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      detectorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!videoElement || !detectorRef.current || !isReady) return;
    if (runningRef.current) return;

    runningRef.current = true;

    async function loop() {
      if (!runningRef.current || !videoElement || !detectorRef.current) return;

      if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        const hands = await detectorRef.current.estimateHands(videoElement);

        if (hands.length > 0 && hands[0].keypoints) {
          const kp = hands[0].keypoints;
          const W = videoElement.videoWidth;
          const H = videoElement.videoHeight;

          console.log('kp[8]:', kp[8].x.toFixed(1), kp[8].y.toFixed(1), 'video:', W, H);

          const gesture = detectGestures(kp, W, H);
          setGestureInfo(gesture);
          setLandmarks([...kp]);
        } else {
          setGestureInfo(null);
          setLandmarks(null);
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

  return { gestureInfo, landmarks, isReady };
}
