import { useEffect, useRef } from 'react';

interface DrawingCanvasProps {
  drawPosition: { x: number; y: number; isDrawing: boolean } | null;
  isDrawMode: boolean;
  /** When the hand is lost mid-stroke, end the stroke cleanly. */
  handLost: boolean;
  onClear: () => void;
  onExitDrawMode: () => void;
}

export function DrawingCanvas({
  drawPosition,
  isDrawMode,
  handLost,
  onClear,
  onExitDrawMode,
}: DrawingCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  // Buffer of points in the current stroke (for quadratic smoothing)
  const strokeRef   = useRef<{ x: number; y: number }[]>([]);
  const wasDrawingRef = useRef(false);

  // Size canvas once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Break the current stroke cleanly when the hand goes missing mid-draw
  useEffect(() => {
    if (handLost) {
      strokeRef.current   = [];
      wasDrawingRef.current = false;
    }
  }, [handLost]);

  // Draw smoothed strokes
  useEffect(() => {
    // No-op when not in draw mode or nothing to process
    if (!isDrawMode || !drawPosition) {
      if (!drawPosition?.isDrawing) {
        // Stroke ended (gesture released or mode exited)
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
      if (pts.length < 2) return;   // need at least two points

      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth   = 3;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      if (pts.length === 2) {
        // First segment: plain line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      } else {
        // Redraw only the last segment using a quadratic curve.
        // Control point = previous point; end = midpoint between prev and curr.
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
      // Stroke ended — commit any remaining arc to the last point
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
  }, [drawPosition, isDrawMode]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeRef.current = [];
    onClear();
  };

  return (
    <>
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
      {isDrawMode && (
        <div style={{
          position:      'fixed',
          top:           '100px',
          right:         '30px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '10px',
          zIndex:        1000,
        }}>
          <button
            onClick={onExitDrawMode}
            className="exit-draw-btn"
            style={{
              padding:      '12px 24px',
              background:   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color:        'white',
              border:       'none',
              borderRadius: '14px',
              cursor:       'pointer',
              fontSize:     '15px',
              fontWeight:   '600',
              boxShadow:    '0 6px 20px rgba(102, 126, 234, 0.4)',
              transition:   'all 0.3s ease',
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
            }}
          >
            ✕ Exit Draw
          </button>
          <button
            onClick={handleClear}
            className="clear-canvas-btn"
            style={{
              padding:      '12px 24px',
              background:   'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color:        'white',
              border:       'none',
              borderRadius: '14px',
              cursor:       'pointer',
              fontSize:     '15px',
              fontWeight:   '600',
              boxShadow:    '0 6px 20px rgba(245, 87, 108, 0.4)',
              transition:   'all 0.3s ease',
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
            }}
          >
            🗑️ Clear Canvas
          </button>
        </div>
      )}
    </>
  );
}
