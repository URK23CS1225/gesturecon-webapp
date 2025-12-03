import { useState, useEffect } from 'react';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { VirtualKeyboard } from './VirtualKeyboard';

interface Note {
  id: string;
  text: string;
  x: number;
  y: number;
  audioUrl?: string;
}

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      onUpdate(note.id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyPress = (key: string) => {
    if (key === 'Backspace') {
      onUpdate(note.id, { text: note.text.slice(0, -1) });
    } else {
      onUpdate(note.id, { text: note.text + key });
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: note.x,
          top: note.y,
          width: '320px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 10,
          transition: 'box-shadow 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '15px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>📝 Note</span>
          <button
            onClick={() => onDelete(note.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            ×
          </button>
        </div>

        {/* Text Area */}
        <div style={{ padding: '20px' }}>
          <textarea
            value={note.text}
            onChange={(e) => onUpdate(note.id, { text: e.target.value })}
            placeholder="Type your note here..."
            style={{
              width: '100%',
              minHeight: '120px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              backgroundColor: 'white',
              resize: 'vertical',
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: '15px',
              outline: 'none',
              color: '#333',
              lineHeight: '1.6',
              padding: '12px',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{
          padding: '0 20px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="keyboard-toggle"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            ⌨️ {showKeyboard ? 'Hide' : 'Show'} Keyboard
          </button>

          <VoiceNoteRecorder
            audioUrl={note.audioUrl}
            onRecordingComplete={(url) => onUpdate(note.id, { audioUrl: url })}
          />
        </div>
      </div>

      {showKeyboard && (
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </>
  );
}
