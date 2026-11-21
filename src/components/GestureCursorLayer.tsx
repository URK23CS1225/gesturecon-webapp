import { useEffect, useRef, useState } from 'react';
import { GestureInfo } from '../lib/gestureDetector';
import { TRACKING_CONFIG } from '../lib/trackingConfig';

interface Props {
  gestureInfo:      GestureInfo | null;
  onGestureClick:   (x: number, y: number) => void;
  onGestureDrag:    (x: number, y: number, isDragging: boolean) => void;
  handLost:         boolean;
  handPartiallyOut: boolean;
}

interface TrailPoint { x: number; y: number; age: number }
interface Ripple     { x: number; y: number; id: number }

const TRAIL_MAX    = 8;
const TRAIL_DECAY  = 80; // ms per age unit

export function GestureCursorLayer({
  gestureInfo,
  onGestureClick,
  onGestureDrag,
  handLost,
  handPartiallyOut,
}: Props) {
  const wasPinchingRef   = useRef(false);
  const wasFistRef       = useRef(false);
  const clickCooldownRef = useRef(false);
  const pendingReleaseRef= useRef(false);

  const [pos,    setPos]    = useState({ x: -100, y: -100 });
  const [trail,  setTrail]  = useState<TrailPoint[]>([]);
  const [ripples,setRipples]= useState<Ripple[]>([]);
  const rippleIdRef         = useRef(0);

  // Confirmation ring fill (0–1)
  const [confirmProgress, setConfirmProgress] = useState(0);

  const posRef = useRef({ x: -100, y: -100 });

  // ── Poll trail decay ────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTrail(t => t
        .map(p => ({ ...p, age: p.age + 1 }))
        .filter(p => p.age < TRAIL_MAX)
      );
    }, TRAIL_DECAY);
    return () => clearInterval(id);
  }, []);

  // ── Main gesture effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (!gestureInfo) return;

    const { cursorPosition, isPinching, isFist, votes } = gestureInfo;
    const x = cursorPosition.x * window.innerWidth;
    const y = cursorPosition.y * window.innerHeight;

    posRef.current = { x, y };
    setPos({ x, y });

    // Trail
    setTrail(t => [{ x, y, age: 0 }, ...t.slice(0, TRAIL_MAX - 1)]);

    // Confirmation ring: show progress toward required votes
    const { votesRequired } = TRACKING_CONFIG.confirmation;
    const best = Math.max(votes.click, votes.draw);
    setConfirmProgress(Math.min(best / votesRequired, 1));

    // ── Click dispatch ──────────────────────────────────────────────────
    if (isPinching && !wasPinchingRef.current && !clickCooldownRef.current) {
      clickCooldownRef.current  = true;
      pendingReleaseRef.current = true;

      // Target magnetism: find nearest clickable within radius
      const radius = TRACKING_CONFIG.magnetismRadiusPx;
      const candidates = document.elementsFromPoint(x, y) as HTMLElement[];

      let hitTarget: HTMLElement | null = null;
      let hitX = x, hitY = y;

      // Also scan nearby area for magnetism
      const nearby = findNearestClickable(x, y, radius);
      if (nearby) {
        hitTarget = nearby.el;
        hitX = nearby.cx;
        hitY = nearby.cy;
      } else {
        for (const el of candidates) {
          if (isClickable(el)) { hitTarget = el; break; }
        }
      }

      if (hitTarget) {
        hitTarget.click();
        const orig = hitTarget.style.transform;
        hitTarget.style.transform = 'scale(0.93)';
        setTimeout(() => { if (hitTarget) hitTarget.style.transform = orig; }, 100);
      }

      onGestureClick(hitX, hitY);

      // Ripple
      const id = ++rippleIdRef.current;
      setRipples(r => [...r, { x, y, id }]);
      setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);

      // Cooldown: wait for release + 400ms
      const checkRelease = setInterval(() => {
        if (!wasPinchingRef.current) {
          clearInterval(checkRelease);
          setTimeout(() => {
            clickCooldownRef.current  = false;
            pendingReleaseRef.current = false;
          }, TRACKING_CONFIG.clickCooldownMs);
        }
      }, 50);
    }
    wasPinchingRef.current = isPinching;

    // ── Drag dispatch ───────────────────────────────────────────────────
    if (isFist) {
      onGestureDrag(x, y, true);
    } else if (wasFistRef.current) {
      onGestureDrag(x, y, false);
    }
    wasFistRef.current = isFist;

  }, [gestureInfo, onGestureClick, onGestureDrag]);

  // ── Hover highlight ─────────────────────────────────────────────────────
  const lastHoveredRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!gestureInfo) return;
    const { x, y } = posRef.current;
    const els = document.elementsFromPoint(x, y) as HTMLElement[];
    const target = els.find(isClickable) ?? null;

    if (target !== lastHoveredRef.current) {
      if (lastHoveredRef.current) {
        lastHoveredRef.current.classList.remove('gesture-hover');
      }
      if (target) {
        target.classList.add('gesture-hover');
      }
      lastHoveredRef.current = target;
    }
  }, [gestureInfo]);

  // Status message
  const statusMsg = handLost
    ? 'No hand detected'
    : handPartiallyOut
    ? 'Move hand to centre'
    : null;

  const { isPinching, isFist } = gestureInfo ?? {
    isPinching: false, isFist: false,
  };

  const cursorColor = isPinching
    ? '#00ff88'
    : isFist
    ? '#ff4444'
    : '#00c8ff';

  const ringCircumference = 2 * Math.PI * 14; // radius 14px

  return (
    <>
      {/* Trail */}
      {trail.map((p, i) => (
        <div
          key={i}
          style={{
            position:      'fixed',
            left:          p.x - 4,
            top:           p.y - 4,
            width:         8,
            height:        8,
            borderRadius:  '50%',
            background:    cursorColor,
            opacity:       (1 - p.age / TRAIL_MAX) * 0.35,
            pointerEvents: 'none',
            zIndex:        9997,
            transition:    'opacity 0.08s',
          }}
        />
      ))}

      {/* Ripples */}
      {ripples.map(r => (
        <div
          key={r.id}
          style={{
            position:      'fixed',
            left:          r.x - 24,
            top:           r.y - 24,
            width:         48,
            height:        48,
            borderRadius:  '50%',
            border:        `2px solid ${cursorColor}`,
            pointerEvents: 'none',
            zIndex:        9998,
            animation:     'gestureRipple 0.6s ease-out forwards',
          }}
        />
      ))}

      {/* Main cursor — only visible when hand present */}
      {gestureInfo && (
        <div
          style={{
            position:      'fixed',
            left:          pos.x - 16,
            top:           pos.y - 16,
            width:         32,
            height:        32,
            pointerEvents: 'none',
            zIndex:        9999,
          }}
        >
          {/* Confirmation ring (SVG) */}
          <svg
            width="32" height="32"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle cx="16" cy="16" r="14"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
            {/* Fill */}
            <circle cx="16" cy="16" r="14"
              fill="none"
              stroke={cursorColor}
              strokeWidth="2.5"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - confirmProgress)}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>

          {/* Dot */}
          <div style={{
            position:   'absolute',
            top:        '50%',
            left:       '50%',
            transform:  'translate(-50%, -50%)',
            width:      isPinching || isFist ? 14 : 10,
            height:     isPinching || isFist ? 14 : 10,
            borderRadius: '50%',
            background: cursorColor,
            boxShadow:  `0 0 12px ${cursorColor}`,
            transition: 'width 0.08s, height 0.08s, background 0.08s',
          }} />

          {/* Label */}
          {(isPinching || isFist) && (
            <span style={{
              position:   'absolute',
              top:        '-32px',
              left:       '50%',
              transform:  'translateX(-50%)',
              fontSize:   '11px',
              fontWeight: 700,
              color:      'white',
              background: isPinching ? 'rgba(0,200,100,0.92)' : 'rgba(220,50,50,0.92)',
              padding:    '3px 8px',
              borderRadius: '5px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
            }}>
              {isPinching ? '☝ CLICK' : '✌ DRAW'}
            </span>
          )}
        </div>
      )}

      {/* Status message */}
      {statusMsg && (
        <div style={{
          position:   'fixed',
          bottom:     32,
          left:       '50%',
          transform:  'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)',
          color:      '#ffcc00',
          padding:    '10px 24px',
          borderRadius: '24px',
          fontSize:   '14px',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex:     9999,
          border:     '1px solid rgba(255,204,0,0.4)',
        }}>
          {handLost ? '🤚 ' : '⚠️ '}{statusMsg}
        </div>
      )}
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isClickable(el: Element): boolean {
  const tag = el.tagName;
  if (tag === 'BUTTON') return true;
  const role = el.getAttribute('role');
  if (role === 'button') return true;
  const cls = (el as HTMLElement).classList;
  return cls.contains('menu-item')     ||
         cls.contains('mode-btn')      ||
         cls.contains('clear-canvas-btn') ||
         cls.contains('exit-draw-btn') ||
         cls.contains('keyboard-key')  ||
         cls.contains('keyboard-toggle') ||
         cls.contains('download-link');
}

function findNearestClickable(
  cx: number, cy: number, radius: number
): { el: HTMLElement; cx: number; cy: number } | null {
  const buttons = document.querySelectorAll<HTMLElement>(
    'button, [role="button"], .menu-item, .mode-btn, .keyboard-key, .keyboard-toggle'
  );
  let best: { el: HTMLElement; cx: number; cy: number } | null = null;
  let bestDist = radius;

  buttons.forEach(el => {
    const rect = el.getBoundingClientRect();
    const bcx  = rect.left + rect.width  / 2;
    const bcy  = rect.top  + rect.height / 2;
    const dist = Math.hypot(cx - bcx, cy - bcy);
    if (dist < bestDist) {
      bestDist = dist;
      best     = { el, cx: bcx, cy: bcy };
    }
  });

  return best;
}
