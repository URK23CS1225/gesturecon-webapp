import { useState, useCallback, useEffect, useRef } from 'react';
import { VideoFeed } from './components/VideoFeed';
import { GestureCursorLayer } from './components/GestureCursorLayer';
import { DrawingCanvas, DrawingCanvasHandle } from './components/DrawingCanvas';
import { DrawingToolbar } from './components/DrawingToolbar';
import { NoteBoard } from './components/NoteBoard';
import { HandSkeleton } from './components/HandSkeleton';
import { DebugOverlay } from './components/DebugOverlay';
import { GestureGuide } from './components/GestureGuide';
import { useHandTracking } from './hooks/useHandTracking';
import './styles/App.css';

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawPosition, setDrawPosition] = useState<{ x: number; y: number; isDrawing: boolean } | null>(null);
  const [strokeColor, setStrokeColor] = useState('#1a1a2e');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [showDebug, setShowDebug] = useState(false);
  const drawingCanvasRef = useRef<DrawingCanvasHandle>(null);

  const { gestureInfo, landmarks, isReady, metrics, debugData } = useHandTracking(videoElement);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    setVideoElement(video);
    // Poll until the video reports real dimensions
    const poll = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
        clearInterval(poll);
      }
    }, 100);
  }, []);

  // Keep dimensions in sync if video resizes (e.g. camera switch)
  useEffect(() => {
    if (!videoElement) return;
    const handleResize = () => {
      if (videoElement.videoWidth > 0) {
        setVideoDimensions({ width: videoElement.videoWidth, height: videoElement.videoHeight });
      }
    };
    videoElement.addEventListener('resize', handleResize);
    return () => videoElement.removeEventListener('resize', handleResize);
  }, [videoElement]);

  const handleGestureClick = useCallback((x: number, y: number) => {
    console.log('Gesture click at:', x, y);
  }, []);

  const handleGestureDrag = useCallback((x: number, y: number, isDragging: boolean) => {
    setDrawPosition({ x, y, isDrawing: isDragging });
  }, []);

  // D key toggles debug overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setShowDebug(v => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const createNewNote = () => {
    if ((window as any).__createNote) {
      (window as any).__createNote();
    }
  };

  const getStatusClass = () => {
    if (!isReady) return 'loading';
    if (gestureInfo) return 'ready';
    return 'waiting';
  };

  const getStatusText = () => {
    if (!isReady) return 'Loading...';
    if (gestureInfo) return 'Hand Detected';
    return 'Show Hand';
  };

  return (
    <div className="app">
      <VideoFeed onVideoReady={handleVideoReady} />

      {/* Hand Skeleton Overlay — only render once we have real video dimensions */}
      {videoDimensions.width > 0 && (
        <HandSkeleton
          landmarks={landmarks}
          videoWidth={videoDimensions.width}
          videoHeight={videoDimensions.height}
        />
      )}

      {/* Sidebar Menu */}
      <div className="sidebar">
        <button
          className="menu-item"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
          onClick={createNewNote}
        >
          <span className="menu-icon">📝</span>
          <span className="menu-text">Notes</span>
        </button>
        <button
          className="menu-item"
          style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}
          onClick={() => setIsDrawMode(!isDrawMode)}
        >
          <span className="menu-icon">✏️</span>
          <span className="menu-text">Draw</span>
        </button>
        <button
          className="menu-item"
          style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}
        >
          <span className="menu-icon">🎤</span>
          <span className="menu-text">Voice</span>
        </button>
        <button
          className="menu-item"
          style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}
        >
          <span className="menu-icon">⚙️</span>
          <span className="menu-text">Settings</span>
        </button>
      </div>

      {/* Top Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <h1>🖐️ Gesture Control</h1>
        </div>
        <div className="status-right">
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`mode-btn ${isDrawMode ? 'active' : ''}`}
          >
            {isDrawMode ? '✏️ Drawing' : '👆 Pointer'}
          </button>
          <button onClick={createNewNote} className="mode-btn">
            + Note
          </button>
          <div className={`status-indicator ${getStatusClass()}`}>
            <span className="status-dot"></span>
            {getStatusText()}
          </div>
        </div>
      </div>

      <GestureCursorLayer
        gestureInfo={gestureInfo}
        onGestureClick={handleGestureClick}
        onGestureDrag={handleGestureDrag}
        handLost={metrics.handLost}
        handPartiallyOut={metrics.handPartiallyOutOfFrame}
      />

      <DrawingCanvas
        ref={drawingCanvasRef}
        drawPosition={drawPosition}
        isDrawMode={isDrawMode}
        handLost={metrics.handLost}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Drawing palette — visible only while in draw mode */}
      {isDrawMode && (
        <DrawingToolbar
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          onColorChange={setStrokeColor}
          onWidthChange={setStrokeWidth}
          onClear={() => {
            drawingCanvasRef.current?.clear();
            setDrawPosition(null);
          }}
          onExit={() => setIsDrawMode(false)}
        />
      )}

      <NoteBoard />

      {/* Gesture reference guide — always visible, bottom-right */}
      <GestureGuide />

      {/* Debug overlay — toggle with D key */}
      {showDebug && (
        <DebugOverlay
          debugData={debugData}
          metrics={metrics}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
}

export default App;
