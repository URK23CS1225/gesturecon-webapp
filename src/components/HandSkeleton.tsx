import { useEffect, useRef } from 'react';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

interface HandSkeletonProps {
  landmarks: Keypoint[] | null;
  videoWidth: number;
  videoHeight: number;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17],             // Palm
];

export function HandSkeleton({ landmarks, videoWidth, videoHeight }: HandSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep canvas sized to window
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Draw skeleton on every landmarks update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;
    if (!videoWidth || !videoHeight) return;

    // Scale from video pixel space to screen pixel space
    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    const pts = landmarks.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));

    // Connections
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    }

    // Dots
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 9 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? 'rgba(255, 0, 255, 0.95)' : 'rgba(0, 255, 255, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'white';
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
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
