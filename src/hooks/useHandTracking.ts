import { useEffect, useRef, useState } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import { detectGestures, GestureInfo } from '../lib/gestureDetector';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

export function useHandTracking(videoElement: HTMLVideoElement | null) {
  const [gestureInfo, setGestureInfo] = useState<GestureInfo | null>(null);
  const [landmarks, setLandmarks] = useState<Keypoint[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    let mounted = true;

    async function initializeDetector() {
      try {
        console.log('Initializing hand detector...');
        
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detector = await handPoseDetection.createDetector(model, {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
          modelType: 'lite',
          maxHands: 1
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

  useEffect(() => {
    if (!videoElement || !detectorRef.current || !isReady) return;

    if (videoElement.readyState < 2) {
      const handleLoadedData = () => {
        console.log('Video ready, starting detection');
      };
      videoElement.addEventListener('loadeddata', handleLoadedData);
      return () => videoElement.removeEventListener('loadeddata', handleLoadedData);
    }

    async function detectHands() {
      if (!videoElement || !detectorRef.current) return;

      try {
        const hands = await detectorRef.current.estimateHands(videoElement);
        
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

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoElement, isReady]);

  return { gestureInfo, landmarks, isReady };
}
