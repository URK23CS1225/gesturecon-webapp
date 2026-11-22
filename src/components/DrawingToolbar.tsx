/**
 * DrawingToolbar — floating palette shown while draw mode is active.
 *
 * Colour swatches and brush-size buttons all carry className="draw-tool-btn"
 * so GestureCursorLayer can pinch-click them without special-casing.
 */

interface DrawingToolbarProps {
  strokeColor:    string;
  strokeWidth:    number;
  onColorChange:  (color: string) => void;
  onWidthChange:  (width: number) => void;
  onClear:        () => void;
  onExit:         () => void;
}

const COLORS = [
  { value: '#1a1a2e', label: 'Black'  },
  { value: '#ffffff', label: 'White'  },
  { value: '#ff4757', label: 'Red'    },
  { value: '#1e90ff', label: 'Blue'   },
  { value: '#2ed573', label: 'Green'  },
  { value: '#ffa502', label: 'Orange' },
  { value: '#ff6b81', label: 'Pink'   },
  { value: '#eccc68', label: 'Yellow' },
];

const SIZES: { value: number; label: string; preview: number }[] = [
  { value: 2,  label: 'Thin',   preview: 2  },
  { value: 5,  label: 'Medium', preview: 5  },
  { value: 12, label: 'Thick',  preview: 12 },
];

export function DrawingToolbar({
  strokeColor,
  strokeWidth,
  onColorChange,
  onWidthChange,
  onClear,
  onExit,
}: DrawingToolbarProps) {
  return (
    <div className="drawing-toolbar">
      {/* Section label */}
      <div className="draw-toolbar-label">Colour</div>

      {/* Colour grid */}
      <div className="draw-color-grid">
        {COLORS.map(c => (
          <button
            key={c.value}
            className={`draw-tool-btn draw-color-swatch${strokeColor === c.value ? ' selected' : ''}`}
            style={{ '--swatch-color': c.value } as React.CSSProperties}
            onClick={() => onColorChange(c.value)}
            title={c.label}
            aria-label={c.label}
          />
        ))}
      </div>

      <div className="draw-toolbar-divider" />

      {/* Brush size label */}
      <div className="draw-toolbar-label">Brush</div>

      {/* Size buttons */}
      <div className="draw-size-row">
        {SIZES.map(s => (
          <button
            key={s.value}
            className={`draw-tool-btn draw-size-btn${strokeWidth === s.value ? ' selected' : ''}`}
            onClick={() => onWidthChange(s.value)}
            title={s.label}
            aria-label={s.label}
          >
            {/* Visual preview dot sized to match the brush */}
            <span
              className="draw-size-preview"
              style={{
                width:      s.preview,
                height:     s.preview,
                background: strokeColor,
              }}
            />
          </button>
        ))}
      </div>

      <div className="draw-toolbar-divider" />

      {/* Actions */}
      <button
        className="draw-tool-btn draw-action-btn draw-action-clear"
        onClick={onClear}
      >
        🗑️ Clear
      </button>
      <button
        className="draw-tool-btn draw-action-btn draw-action-exit"
        onClick={onExit}
      >
        ✕ Exit
      </button>
    </div>
  );
}
