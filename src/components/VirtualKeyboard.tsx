import { useState } from 'react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
}

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ['Space', '.', ',', '!', '?']
];

export function VirtualKeyboard({ onKeyPress, onClose }: VirtualKeyboardProps) {
  const [shift, setShift] = useState(false);

  const handleKeyClick = (key: string) => {
    if (key === '⌫') {
      onKeyPress('Backspace');
    } else if (key === 'Space') {
      onKeyPress(' ');
    } else {
      onKeyPress(shift ? key : key.toLowerCase());
      setShift(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '120px',
        left: '150px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        padding: '20px',
        borderRadius: '16px',
        zIndex: 1000,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', gap: '10px' }}>
        <button
          onClick={() => setShift(!shift)}
          className="keyboard-key"
          style={{
            padding: '12px 20px',
            background: shift ? 'rgba(102, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ⇧ Shift
        </button>
        <button
          onClick={onClose}
          className="keyboard-key"
          style={{
            padding: '12px 20px',
            background: 'rgba(255, 59, 48, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ✕ Close
        </button>
      </div>

      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '8px',
            justifyContent: 'center'
          }}
        >
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              className="keyboard-key"
              style={{
                padding: key === 'Space' ? '14px 80px' : '14px 18px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                minWidth: key === 'Space' ? 'auto' : '50px',
                minHeight: '50px',
                transition: 'all 0.1s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
