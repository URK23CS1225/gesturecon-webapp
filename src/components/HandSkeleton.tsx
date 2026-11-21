import { useEffect, useRef } from 'react';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

interface HandSkeletonProps {
  landmarks: Keypoint[] | null;
  videoWidth: number;
  videoHeight: number;
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export function HandSkeleton({ landmarks, videoWidth, videoHeight }: HandSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Always resize canvas to current window, then draw — in one effect
    // so resizing never clears a draw from a separate effect
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear after resize
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length < 21 || !videoWidth || !videoHeight) {
      console.log('HandSkeleton: no landmarks or bad dimensions', { count: landmarks?.length, videoWidth, videoHeight });
      return;
    }

    console.log('HandSkeleton drawing', landmarks.length, 'points, video:', videoWidth, 'x', videoHeight, 'canvas:', canvas.width, 'x', canvas.height);

    // The video has CSS transform scaleX(-1), so mirror X to match
    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    const pts = landmarks.map(p => ({
      x: (videoWidth - p.x) * scaleX,  // mirror X to match mirrored video
      y: p.y * scaleY,
    }));

    // Draw bones
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    }

    // Draw joints
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
