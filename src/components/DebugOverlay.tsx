/**
 * DebugOverlay — toggle with the D key.
 *
 * Shows:
 *  • Raw vs filtered cursor position
 *  • Candidate (raw) gesture this frame
 *  • Sliding-window vote counts
 *  • Hysteresis state
 *  • FPS / inference / end-to-end timing
 *  • Hand-lost + partially-out flags
 */
import { TrackingDebug, TrackingMetrics } from '../hooks/useHandTracking';

interface Props {
  debugData: TrackingDebug | null;
  metrics:   TrackingMetrics;
  onClose:   () => void;
}

export function DebugOverlay({ debugData, metrics, onClose }: Props) {
  const row = (label: string, value: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: '#aaa', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );

  const sep = () => (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '6px 0' }} />
  );

  return (
    <div style={{
      position:        'fixed',
      bottom:          80,
      right:           24,
      width:           260,
      background:      'rgba(0,0,0,0.88)',
      backdropFilter:  'blur(12px)',
      border:          '1px solid rgba(255,255,255,0.15)',
      borderRadius:    12,
      padding:         '12px 16px',
      fontFamily:      '"JetBrains Mono", "Fira Mono", monospace',
      fontSize:        12,
      lineHeight:      1.7,
      zIndex:          10000,
      pointerEvents:   'auto',
      userSelect:      'none',
      color:           '#fff',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#00c8ff' }}>🔬 Debug (D)</span>
        <button
          onClick={onClose}
          style={{
            background:   'none',
            border:       'none',
            color:        '#aaa',
            cursor:       'pointer',
            fontSize:     14,
            lineHeight:   1,
            padding:      '0 4px',
          }}
        >✕</button>
      </div>

      {/* Performance */}
      {row('FPS',        metrics.fps)}
      {row('Infer ms',   metrics.inferenceMs.toFixed(1))}
      {row('E2E ms',     metrics.endToEndMs.toFixed(1))}

      {sep()}

      {/* Hand flags */}
      {row('Hand lost',    metrics.handLost        ? '⚠ YES' : 'no')}
      {row('Partial out',  metrics.handPartiallyOutOfFrame ? '⚠ YES' : 'no')}

      {sep()}

      {debugData ? (
        <>
          {/* Cursor */}
          {row('Raw   X',    debugData.rawX.toFixed(3))}
          {row('Raw   Y',    debugData.rawY.toFixed(3))}
          {row('Filt  X',    debugData.filteredX.toFixed(3))}
          {row('Filt  Y',    debugData.filteredY.toFixed(3))}

          {sep()}

          {/* Gesture */}
          {row('Raw gesture',  debugData.rawGesture)}
          {row('Hysteresis',   debugData.inHysteresis ? '🔶 yes' : 'no')}

          {sep()}

          {/* Votes */}
          <div style={{ color: '#aaa', marginBottom: 2 }}>
            Votes ({debugData.votesRequired}/{debugData.windowSize} req)
          </div>
          <VoteBar label="click" count={debugData.votes.click} required={debugData.votesRequired} color="#00ff88" />
          <VoteBar label="draw"  count={debugData.votes.draw}  required={debugData.votesRequired} color="#ff4444" />
          <VoteBar label="idle"  count={debugData.votes.idle}  required={debugData.votesRequired} color="#888"    />

          {sep()}
          {row('Stability', (debugData.stability * 100).toFixed(0) + '%')}
        </>
      ) : (
        <div style={{ color: '#888', textAlign: 'center', padding: '8px 0' }}>
          No hand detected
        </div>
      )}
    </div>
  );
}

function VoteBar({
  label, count, required, color,
}: { label: string; count: number; required: number; color: string }) {
  const pct = Math.min(count / required, 1) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
      <span style={{ color: '#aaa', width: 32, flexShrink: 0 }}>{label}</span>
      <div style={{
        flex:         1,
        height:       8,
        background:   'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow:     'hidden',
      }}>
        <div style={{
          width:        `${pct}%`,
          height:       '100%',
          background:   color,
          borderRadius: 4,
          transition:   'width 0.08s',
        }} />
      </div>
      <span style={{ color, width: 14, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  );
}
