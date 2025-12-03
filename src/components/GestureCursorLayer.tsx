import { useEffect, useRef, useState } from 'react';
import { GestureInfo } from '../lib/gestureDetector';

interface GestureCursorLayerProps {
  gestureInfo: GestureInfo | null;
  onGestureClick: (x: number, y: number) => void;
  onGestureDrag: (x: number, y: number, isDragging: boolean) => void;
}

export function GestureCursorLayer({ 
  gestureInfo, 
  onGestureClick, 
  onGestureDrag 
}: GestureCursorLayerProps) {
  const wasPinchingRef = useRef(false);
  const wasFistRef = useRef(false);
  const [smoothedPosition, setSmoothedPosition] = useState({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!gestureInfo) return;

    const { cursorPosition, isPinching, isFist } = gestureInfo;
    const targetX = cursorPosition.x * window.innerWidth;
    const targetY = cursorPosition.y * window.innerHeight;

    const smoothing = 0.5;
    const smoothX = lastPositionRef.current.x + (targetX - lastPositionRef.current.x) * smoothing;
    const smoothY = lastPositionRef.current.y + (targetY - lastPositionRef.current.y) * smoothing;
    
    lastPositionRef.current = { x: smoothX, y: smoothY };
    setSmoothedPosition({ x: smoothX, y: smoothY });

    // NO COOLDOWN - instant clicks
    if (isPinching && !wasPinchingRef.current) {
      const elements = document.elementsFromPoint(smoothX, smoothY);
      
      for (const element of elements) {
        if (element.tagName === 'BUTTON' || 
            element.classList.contains('menu-item') ||
            element.classList.contains('mode-btn') ||
            element.classList.contains('clear-canvas-btn') ||
            element.classList.contains('exit-draw-btn') ||
            element.classList.contains('keyboard-key') ||
            element.classList.contains('keyboard-toggle') ||
            element.classList.contains('download-link')) {
          (element as HTMLElement).click();
          
          const originalTransform = (element as HTMLElement).style.transform;
          (element as HTMLElement).style.transform = 'scale(0.9)';
          setTimeout(() => {
            (element as HTMLElement).style.transform = originalTransform;
          }, 50);
          break;
        }
      }
      
      onGestureClick(smoothX, smoothY);
    }
    wasPinchingRef.current = isPinching;

    if (isFist) {
      onGestureDrag(smoothX, smoothY, true);
    } else if (wasFistRef.current) {
      onGestureDrag(smoothX, smoothY, false);
    }
    wasFistRef.current = isFist;
  }, [gestureInfo, onGestureClick, onGestureDrag]);

  if (!gestureInfo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: smoothedPosition.x - 15,
        top: smoothedPosition.y - 15,
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: gestureInfo.isPinching 
          ? 'rgba(0, 255, 0, 0.9)' 
          : gestureInfo.isFist 
          ? 'rgba(255, 0, 0, 0.9)' 
          : 'rgba(0, 150, 255, 0.7)',
        border: '3px solid white',
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'background-color 0.05s',
        boxShadow: gestureInfo.isPinching 
          ? '0 0 20px rgba(0, 255, 0, 0.8)' 
          : gestureInfo.isFist 
          ? '0 0 20px rgba(255, 0, 0, 0.8)' 
          : '0 0 10px rgba(0, 150, 255, 0.5)'
      }}
    >
      {gestureInfo.isPinching && (
        <span style={{ 
          position: 'absolute', 
          top: '-35px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white',
          background: 'rgba(0, 255, 0, 0.9)',
          padding: '5px 10px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}>
          ☝️ CLICK
        </span>
      )}
      {gestureInfo.isFist && (
        <span style={{ 
          position: 'absolute', 
          top: '-35px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white',
          background: 'rgba(255, 0, 0, 0.9)',
          padding: '5px 10px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}>
          ✌️ DRAW
        </span>
      )}
    </div>
  );
}
