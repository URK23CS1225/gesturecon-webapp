import { useEffect, useRef, useState } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import { detectGestures, GestureInfo } from '../lib/gestureDetector';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export function useHandTracking(videoElement: HTMLVideoElement | null) {
  const [gestureInfo, setGestureInfo] = useState<GestureInfo | null>(null);
  const [landmarks, setLandmarks] = useState<Keypoint[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const animationRef = useRef<number>();
  const isDetectingRef = useRef(false);

  // Initialize detector once on mount
  useEffect(() => {
    let mounted = true;

    async function initializeDetector() {
      try {
        console.log('Initializing hand detector...');

        // Ensure WebGL backend is registered and ready
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
      } catch (error) {
        console.error('Failed to initialize hand detector:', error);
        setTimeout(() => {
          if (mounted) initializeDetector();
        }, 2000);
      }
    }

    initializeDetector();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      detectorRef.current?.dispose();
    };
  }, []);

  // Start detection loop once both video and detector are ready
  useEffect(() => {
    if (!videoElement || !detectorRef.current || !isReady) return;
    if (isDetectingRef.current) return;

    async function waitForVideoAndDetect() {
      // Wait until video has actual dimensions
      if (
        !videoElement ||
        videoElement.readyState < 2 ||
        videoElement.videoWidth === 0
      ) {
        animationRef.current = requestAnimationFrame(waitForVideoAndDetect);
        return;
      }
      startDetectionLoop();
    }

    async function startDetectionLoop() {
      if (!videoElement || !detectorRef.current) return;
      isDetectingRef.current = true;

      async function detectHands() {
        if (!videoElement || !detectorRef.current) return;

        try {
          const hands = await detectorRef.current.estimateHands(videoElement, {
            flipHorizontal: true,
          });

          if (hands.length > 0 && hands[0].keypoints) {
            const gesture = detectGestures(
              hands[0].keypoints,
              videoElement.videoWidth,
              videoElement.videoHeight
            );
            setGestureInfo(gesture);
            setLandmarks(hands[0].keypoints);
          } else {
            setGestureInfo(null);
            setLandmarks(null);
          }
        } catch (error) {
          console.error('Hand detection error:', error);
        }

        animationRef.current = requestAnimationFrame(detectHands);
      }

      detectHands();
    }

    waitForVideoAndDetect();

    return () => {
      isDetectingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoElement, isReady]);

  return { gestureInfo, landmarks, isReady };
}
