import { useEffect, useRef } from 'react';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

interface HandSkeletonProps {
  landmarks: Keypoint[] | null;
  videoWidth: number;
  videoHeight: number;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17] // Palm
];

export function HandSkeleton({ landmarks, videoWidth, videoHeight }: HandSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    // Convert landmarks to screen coordinates
    const screenLandmarks = landmarks.map(point => ({
      x: (1 - point.x / videoWidth) * window.innerWidth,
      y: (point.y / videoHeight) * window.innerHeight
    }));

    // Draw connections
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    HAND_CONNECTIONS.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(screenLandmarks[start].x, screenLandmarks[start].y);
      ctx.lineTo(screenLandmarks[end].x, screenLandmarks[end].y);
      ctx.stroke();
    });

    // Draw landmarks
    screenLandmarks.forEach((point, i) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, i === 0 ? 8 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? 'rgba(255, 0, 255, 0.9)' : 'rgba(0, 255, 255, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [landmarks, videoWidth, videoHeight]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 50
      }}
    />
  );
}
