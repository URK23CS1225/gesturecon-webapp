import { useEffect, useRef } from 'react';

interface DrawingCanvasProps {
  drawPosition: { x: number; y: number; isDrawing: boolean } | null;
  isDrawMode: boolean;
  onClear: () => void;
  onExitDrawMode: () => void;
}

export function DrawingCanvas({ drawPosition, isDrawMode, onClear, onExitDrawMode }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    if (!drawPosition || !isDrawMode) {
      lastPosRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawPosition.isDrawing) {
      if (lastPosRef.current) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(drawPosition.x, drawPosition.y);
        ctx.stroke();
      }
      lastPosRef.current = { x: drawPosition.x, y: drawPosition.y };
    } else {
      lastPosRef.current = null;
    }
  }, [drawPosition, isDrawMode]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      {isDrawMode && (
        <div style={{ position: 'fixed', top: '100px', right: '30px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000 }}>
          <button
            onClick={onExitDrawMode}
            className="exit-draw-btn"
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ✕ Exit Draw
          </button>
          <button
            onClick={handleClear}
            className="clear-canvas-btn"
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 6px 20px rgba(245, 87, 108, 0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🗑️ Clear Canvas
          </button>
        </div>
      )}
    </>
  );
}
