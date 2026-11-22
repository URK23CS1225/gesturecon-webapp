import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface DrawingCanvasHandle {
  clear: () => void;
}

interface DrawingCanvasProps {
  drawPosition: { x: number; y: number; isDrawing: boolean } | null;
  isDrawMode:   boolean;
  handLost:     boolean;
  strokeColor:  string;
  strokeWidth:  number;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas(
    { drawPosition, isDrawMode, handLost, strokeColor, strokeWidth },
    ref,
  ) {
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const strokeRef     = useRef<{ x: number; y: number }[]>([]);
    const wasDrawingRef = useRef(false);

    // Expose clear() to parent via ref
    useImperativeHandle(ref, () => ({
      clear() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        strokeRef.current   = [];
        wasDrawingRef.current = false;
      },
    }));

    // Size canvas once on mount
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }, []);

    // Break stroke cleanly when hand is lost mid-draw
    useEffect(() => {
      if (handLost) {
        strokeRef.current   = [];
        wasDrawingRef.current = false;
      }
    }, [handLost]);

    // Smoothed stroke rendering
    useEffect(() => {
      if (!isDrawMode || !drawPosition) {
        if (!drawPosition?.isDrawing) {
          strokeRef.current   = [];
          wasDrawingRef.current = false;
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (drawPosition.isDrawing) {
        strokeRef.current.push({ x: drawPosition.x, y: drawPosition.y });

        const pts = strokeRef.current;
        if (pts.length < 2) return;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth   = strokeWidth;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        if (pts.length === 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.stroke();
        } else {
          const prev = pts[pts.length - 2];
          const curr = pts[pts.length - 1];
          const mid  = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 };

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
          ctx.stroke();
        }

        wasDrawingRef.current = true;
      } else {
        if (wasDrawingRef.current && strokeRef.current.length >= 2) {
          const pts  = strokeRef.current;
          const last = pts[pts.length - 1];
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(drawPosition.x, drawPosition.y);
          ctx.stroke();
        }
        strokeRef.current   = [];
        wasDrawingRef.current = false;
      }
    }, [drawPosition, isDrawMode, strokeColor, strokeWidth]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          pointerEvents: 'none',
          zIndex:        1,
        }}
      />
    );
  }
);
