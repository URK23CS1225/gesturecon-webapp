import { useState, useCallback } from 'react';
import { VideoFeed } from './components/VideoFeed';
import { GestureCursorLayer } from './components/GestureCursorLayer';
import { DrawingCanvas } from './components/DrawingCanvas';
import { NoteBoard } from './components/NoteBoard';
import { HandSkeleton } from './components/HandSkeleton';
import { useHandTracking } from './hooks/useHandTracking';
import './styles/App.css';

function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawPosition, setDrawPosition] = useState<{ x: number; y: number; isDrawing: boolean } | null>(null);
  
  const { gestureInfo, landmarks, isReady } = useHandTracking(videoElement);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    setVideoElement(video);
  }, []);

  const handleGestureClick = useCallback((x: number, y: number) => {
    console.log('Gesture click at:', x, y);
  }, []);

  const handleGestureDrag = useCallback((x: number, y: number, isDragging: boolean) => {
    setDrawPosition({ x, y, isDrawing: isDragging });
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

      {/* Hand Skeleton Overlay */}
      {videoElement && (
        <HandSkeleton
          landmarks={landmarks}
          videoWidth={videoElement.videoWidth}
          videoHeight={videoElement.videoHeight}
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
      />

      <DrawingCanvas
        drawPosition={drawPosition}
        isDrawMode={isDrawMode}
        onClear={() => setDrawPosition(null)}
        onExitDrawMode={() => setIsDrawMode(false)}
      />

      <NoteBoard onCreateNote={createNewNote} />
    </div>
  );
}

export default App;
