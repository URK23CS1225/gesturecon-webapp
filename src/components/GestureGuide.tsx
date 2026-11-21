/**
 * GestureGuide — a compact, always-visible reference panel (bottom-left)
 * that shows which hand shape produces which action.
 */

interface GestureEntry {
  emoji:       string;
  shape:       string;
  action:      string;
  cursorColor: string;
  label:       string;
}

const GESTURES: GestureEntry[] = [
  {
    emoji:       '🤌',
    shape:       'Thumb + Index tips touch',
    action:      'Click',
    cursorColor: '#00ff88',
    label:       'PINCH → CLICK',
  },
  {
    emoji:       '✌️',
    shape:       'Index + Middle extended',
    action:      'Draw / Drag',
    cursorColor: '#ff4444',
    label:       'PEACE → DRAW',
  },
  {
    emoji:       '☝️',
    shape:       'Any finger(s) raised',
    action:      'Move cursor',
    cursorColor: '#00c8ff',
    label:       'POINT → CURSOR',
  },
  {
    emoji:       '✊',
    shape:       'All fingers down',
    action:      'Idle / Rest',
    cursorColor: '#888',
    label:       'FIST → IDLE',
  },
];

export function GestureGuide() {
  return (
    <div style={{
      position:      'fixed',
      bottom:        24,
      left:          24,
      display:       'flex',
      flexDirection: 'column',
      gap:           8,
      zIndex:        200,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontSize:      11,
        fontWeight:    700,
        color:         'rgba(255,255,255,0.5)',
        letterSpacing: '0.08em',
        marginBottom:  2,
        paddingLeft:   2,
      }}>
        GESTURE GUIDE
      </div>

      {GESTURES.map(g => (
        <div
          key={g.label}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            10,
            background:     'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(12px)',
            border:         `1px solid ${g.cursorColor}33`,
            borderRadius:   10,
            padding:        '7px 12px',
            minWidth:       230,
          }}
        >
          {/* Colour dot */}
          <div style={{
            width:        10,
            height:       10,
            borderRadius: '50%',
            background:   g.cursorColor,
            boxShadow:    `0 0 6px ${g.cursorColor}`,
            flexShrink:   0,
          }} />

          {/* Hand emoji */}
          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{g.emoji}</span>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{
              fontSize:      11,
              fontWeight:    700,
              color:         g.cursorColor,
              letterSpacing: '0.06em',
            }}>
              {g.label}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
              {g.shape} → {g.action}
            </span>
          </div>
        </div>
      ))}

      {/* Shortcut hint */}
      <div style={{
        fontSize:   10,
        color:      'rgba(255,255,255,0.3)',
        paddingLeft: 2,
        marginTop:   2,
      }}>
        Press D for debug overlay
      </div>
    </div>
  );
}
