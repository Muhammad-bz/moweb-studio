/**
 * Hero.jsx — Single Orb with Rotating Points
 * One orb. Text scattered on its surface. Spins + zooms into each point.
 * Ambience colour shifts per point.
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

/* ─── Math ─────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp   = (a, b, t) => a + (b - a) * t
const slice  = (p, s, e) => clamp((p - s) / (e - s))
const eio    = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const eout   = t => 1 - Math.pow(1-t, 3)

/* ─── Scroll progress ──────────────────────────────────────────── */
function useScrollProgress(ref) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const fn = () => {
      const el = ref.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      setP(clamp(-top / (height - window.innerHeight)))
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [ref])
  return p
}

/* ─── Points on the orb ────────────────────────────────────────── */
// Each point: label, sublabel, position on sphere (angle from centre in deg),
// ambience colour, and which scroll segment zooms into it
const POINTS = [
  {
    id: 0,
    label: 'Motion First',
    sub: 'Every element moves with intention',
    // position offset from centre when orb is in "overview" mode
    pos: { x: -28, y: -22 },
    color: '#a8c4ff',        // cool blue
    glow: 'rgba(120,160,255,',
    scrollFocus: [0.12, 0.28],
  },
  {
    id: 1,
    label: 'Built Different',
    sub: 'Not pages — cinematic experiences',
    pos: { x: 24, y: -30 },
    color: '#ffd4a8',        // warm amber
    glow: 'rgba(255,180,100,',
    scrollFocus: [0.28, 0.44],
  },
  {
    id: 2,
    label: 'Scroll as Story',
    sub: 'Your scroll controls time itself',
    pos: { x: -32, y: 20 },
    color: '#b8f0d0',        // mint
    glow: 'rgba(100,230,160,',
    scrollFocus: [0.44, 0.60],
  },
  {
    id: 3,
    label: 'Zero Compromise',
    sub: 'Precision in every frame rendered',
    pos: { x: 30, y: 26 },
    color: '#e8c0ff',        // purple
    glow: 'rgba(180,100,255,',
    scrollFocus: [0.60, 0.76],
  },
  {
    id: 4,
    label: "Let's Begin",
    sub: 'One studio. Your unforgettable website.',
    pos: { x: 2, y: 4 },
    color: '#ffffff',        // pure white for CTA
    glow: 'rgba(255,255,255,',
    scrollFocus: [0.82, 1.00],
    cta: true,
  },
]

/* ─── Which point is active ────────────────────────────────────── */
function getActivePoint(progress) {
  // 0.00–0.12: intro spin (no point focused)
  // each point has a zoom window
  for (let i = 0; i < POINTS.length; i++) {
    const [s, e] = POINTS[i].scrollFocus
    if (progress >= s - 0.04 && progress <= e + 0.04) return i
  }
  return -1
}

/* ─── Orb component ────────────────────────────────────────────── */
function Orb({ progress, activeIdx, focusT }) {
  const pt = activeIdx >= 0 ? POINTS[activeIdx] : null
  const glowColor = pt ? pt.glow : 'rgba(255,255,255,'

  // Spin: continuous slow rotation + snap toward active point
  const baseRotate = progress * 380  // degrees across full scroll
  // When zooming in, the orb tilts slightly
  const tiltY = pt ? lerp(0, pt.pos.x * 0.18, focusT) : 0
  const tiltX = pt ? lerp(0, -pt.pos.y * 0.12, focusT) : 0

  // Size: pulses slightly between points
  const breathe = 1 + Math.sin(progress * Math.PI * 8) * 0.015
  const focusScale = pt ? lerp(1, 1.08, focusT) : 1

  return (
    <div style={{
      position: 'absolute', inset: 0,
      transform: `rotateY(${tiltY}deg) rotateX(${tiltX}deg) scale(${breathe * focusScale})`,
      transformStyle: 'preserve-3d',
      willChange: 'transform',
      transition: 'transform 0.1s linear',
    }}>
      {/* Outer atmosphere / haze */}
      <div className="orb-atmo" style={{
        boxShadow: `0 0 80px 20px ${glowColor}0.06), 0 0 160px 60px ${glowColor}0.03)`,
        transition: 'box-shadow 1.2s ease',
      }} />

      {/* Main glow ring */}
      <div className="orb-ring" style={{
        background: `radial-gradient(circle at 50% 50%,
          transparent 60%,
          ${glowColor}0.05) 68%,
          ${glowColor}0.28) 76%,
          rgba(255,255,255,0.78) 80%,
          rgba(255,255,255,0.92) 82%,
          rgba(255,255,255,0.42) 86%,
          ${glowColor}0.10) 91%,
          transparent 100%
        )`,
        transition: 'background 1.2s ease',
      }} />

      {/* Dark interior */}
      <div className="orb-interior" />

      {/* Rotating smoke shell 1 */}
      <div className="orb-smoke-shell shell-1" style={{
        borderColor: `${glowColor}0.18)`,
        boxShadow: `inset 0 0 30px ${glowColor}0.08), 0 0 20px ${glowColor}0.05)`,
        transition: 'border-color 1.2s ease, box-shadow 1.2s ease',
        animationDuration: `${lerp(40, 24, progress)}s`,
      }} />

      {/* Rotating smoke shell 2 */}
      <div className="orb-smoke-shell shell-2" style={{
        borderColor: `${glowColor}0.12)`,
        boxShadow: `inset 0 0 22px ${glowColor}0.06)`,
        transition: 'border-color 1.2s ease, box-shadow 1.2s ease',
        animationDuration: `${lerp(56, 32, progress)}s`,
      }} />

      {/* Rotating smoke shell 3 */}
      <div className="orb-smoke-shell shell-3" style={{
        borderColor: `${glowColor}0.08)`,
        transition: 'border-color 1.2s ease',
        animationDuration: `${lerp(34, 20, progress)}s`,
      }} />

      {/* Inner colour glow */}
      <div className="orb-inner-light" style={{
        background: `radial-gradient(circle at 42% 38%,
          ${glowColor}0.12) 0%,
          ${glowColor}0.04) 40%,
          transparent 70%
        )`,
        transition: 'background 1.2s ease',
      }} />

      {/* Scanline / grid overlay for depth */}
      <div className="orb-grid" />
    </div>
  )
}

/* ─── Point labels on the orb ──────────────────────────────────── */
function OrbLabels({ progress, activeIdx, focusT }) {
  return (
    <>
      {POINTS.map((pt, i) => {
        const isActive = i === activeIdx
        const isFar    = activeIdx >= 0 && !isActive

        // When this point is active: it moves toward centre
        const tx = isActive ? lerp(pt.pos.x, 0, eio(focusT)) : pt.pos.x
        const ty = isActive ? lerp(pt.pos.y, 0, eio(focusT)) : pt.pos.y

        // Fade: non-active points fade out when any point is focused
        const pointOpacity = isFar
          ? lerp(1, 0, eio(Math.min(1, focusT * 2)))
          : isActive
          ? 1
          : lerp(0, 1, eio(slice(progress, 0.04, 0.12))) // all appear on intro

        // Active point grows
        const pointScale = isActive ? lerp(1, 1.18, eio(focusT)) : 1

        return (
          <div key={pt.id} style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(calc(-50% + ${tx}%), calc(-50% + ${ty}%)) scale(${pointScale})`,
            opacity: pointOpacity,
            willChange: 'transform, opacity',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: isActive ? 4 : 3,
            transition: 'opacity 0.6s ease',
          }}>
            {/* Dot */}
            <div style={{
              width: isActive ? 6 : 4,
              height: isActive ? 6 : 4,
              borderRadius: '50%',
              background: isActive ? pt.color : 'rgba(255,255,255,0.5)',
              margin: '0 auto 6px',
              boxShadow: isActive ? `0 0 10px 3px ${pt.glow}0.6)` : 'none',
              transition: 'all 0.6s ease',
            }} />

            {/* Label */}
            <div style={{
              fontSize: isActive
                ? 'clamp(16px, 4.5vmin, 42px)'
                : 'clamp(7px, 1.8vmin, 12px)',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: isActive ? '-0.03em' : '0.08em',
              color: isActive ? pt.color : 'rgba(255,255,255,0.45)',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              textShadow: isActive ? `0 0 30px ${pt.glow}0.5)` : 'none',
              transition: 'font-size 0.7s ease, color 0.6s ease, font-weight 0.4s ease',
            }}>
              {pt.label}
            </div>

            {/* Sub — only shown when active and focused */}
            <div style={{
              fontSize: 'clamp(10px, 2.2vmin, 15px)',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.42)',
              marginTop: 8,
              letterSpacing: '0.01em',
              opacity: isActive ? clamp((focusT - 0.5) / 0.5) : 0,
              transition: 'opacity 0.5s ease',
              whiteSpace: 'nowrap',
            }}>
              {pt.sub}
            </div>

            {/* CTA */}
            {pt.cta && isActive && focusT > 0.6 && (
              <div style={{
                marginTop: 20,
                display: 'flex', gap: 10, justifyContent: 'center',
                opacity: clamp((focusT - 0.6) / 0.4),
                transition: 'opacity 0.4s',
                pointerEvents: 'auto',
              }}>
                <CTABtn primary color={pt.color}>Start a Project</CTABtn>
                <CTABtn color={pt.color}>View Work ↗</CTABtn>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/* ─── CTA Button ───────────────────────────────────────────────── */
function CTABtn({ children, primary, color }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: 'clamp(9px,1.5vmin,13px) clamp(18px,3vmin,32px)',
        border: `1px solid ${primary ? color || '#fff' : 'transparent'}`,
        borderRadius: 2,
        background: primary ? (hov ? color || '#fff' : 'transparent') : 'none',
        color: primary ? (hov ? '#000' : color || '#fff') : (hov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'),
        fontSize: 'clamp(8px,1.5vmin,11px)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        cursor: 'pointer', fontWeight: 500,
        transition: 'all 0.2s', fontFamily: 'inherit',
      }}
    >{children}</button>
  )
}

/* ─── Ambient background rays ───────────────────────────────────── */
function Rays({ progress, activeIdx }) {
  const pt = activeIdx >= 0 ? POINTS[activeIdx] : null
  const rayColor = pt ? pt.glow : 'rgba(255,255,255,'
  const shift = lerp(-3, 5, progress)

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {[
        { angle: -30, left: '10%', w: '45vw', op: 0.09 },
        { angle: -22, left: '3%',  w: '32vw', op: 0.07 },
        { angle: -38, left: '26%', w: '58vw', op: 0.08 },
        { angle: -18, left: '48%', w: '38vw', op: 0.06 },
        { angle: -42, left: '38%', w: '50vw', op: 0.07 },
        { angle: -14, left: '60%', w: '30vw', op: 0.05 },
      ].map((r, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '-8%',
          left: r.left, width: r.w, height: '125%',
          background: `linear-gradient(to top, ${rayColor}${r.op}) 0%, transparent 60%)`,
          transform: `rotate(${r.angle}deg) translateX(${shift + i * 0.5}vw)`,
          transformOrigin: 'bottom left',
          transition: 'background 1.4s ease',
          willChange: 'transform',
        }} />
      ))}
    </div>
  )
}

/* ─── MAIN ─────────────────────────────────────────────────────── */
export default function Hero() {
  const containerRef = useRef(null)
  const progress = useScrollProgress(containerRef)

  const activeIdx = getActivePoint(progress)
  const pt = activeIdx >= 0 ? POINTS[activeIdx] : null

  // Focus strength within the active point's scroll window
  const focusT = pt
    ? eio(slice(progress, pt.scrollFocus[0], pt.scrollFocus[1]))
    : 0

  // Intro: orb appears (0→0.12)
  const introT = eio(slice(progress, 0.00, 0.10))

  // Between-point spin progress (0→1 covers full scroll)
  const spinDeg = lerp(0, 360, progress)

  const scrollHintOp = Math.max(0, 1 - eio(slice(progress, 0.04, 0.10)))

  // Background ambient colour per active point
  const bgGlow = pt ? pt.glow : 'rgba(255,255,255,'

  return (
    <>
      <section ref={containerRef} style={{ height: '1100vh', position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${bgGlow}0.04) 0%, #050505 65%)`,
          transition: 'background 1.4s ease',
          overflow: 'hidden',
        }}>

          <Rays progress={progress} activeIdx={activeIdx} />

          {/* Wordmark */}
          <div style={{
            position: 'absolute', top: 22, left: 18, zIndex: 20,
            display: 'flex', alignItems: 'baseline', gap: 7, userSelect: 'none',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>MOWEB</span>
            <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.28)' }}>STUDIO</span>
          </div>

          {/* Nav */}
          <div style={{
            position: 'absolute', top: 22, right: 18, zIndex: 20,
            display: 'flex', gap: 22,
          }}>
            {['Work','Process','Contact'].map(l => (
              <span key={l} style={{
                fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)', cursor: 'pointer',
              }}>{l}</span>
            ))}
          </div>

          {/* THE ORB */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 'min(82vmin, 520px)',
            height: 'min(82vmin, 520px)',
            transform: `translate(-50%, -50%) rotate(${spinDeg}deg) scale(${lerp(0.6, 1, introT)})`,
            opacity: introT,
            willChange: 'transform, opacity',
          }}>
            <Orb progress={progress} activeIdx={activeIdx} focusT={focusT} />
          </div>

          {/* Labels — separate layer, counter-rotated so text stays upright */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 'min(82vmin, 520px)',
            height: 'min(82vmin, 520px)',
            transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, introT)})`,
            opacity: introT,
            willChange: 'transform, opacity',
          }}>
            <OrbLabels progress={progress} activeIdx={activeIdx} focusT={focusT} />
          </div>

          {/* Chapter dots */}
          <div style={{
            position: 'absolute', right: 16, top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 9, zIndex: 20,
          }}>
            {POINTS.map((pt, i) => {
              const active = i === activeIdx
              const past = progress > pt.scrollFocus[1]
              return (
                <div key={i} style={{
                  width: active ? 2 : 1,
                  height: active ? 20 : 8,
                  background: active
                    ? pt.color
                    : past ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                  borderRadius: 1,
                  transition: 'all 0.4s ease',
                  boxShadow: active ? `0 0 6px ${pt.glow}0.7)` : 'none',
                }} />
              )
            })}
          </div>

          {/* Eyebrow above orb — shows active chapter name */}
          <div style={{
            position: 'absolute', top: '14%', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20, textAlign: 'center',
            opacity: activeIdx >= 0 ? clamp(focusT * 2) : 0,
            transition: 'opacity 0.5s',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: 'clamp(7px, 1.4vmin, 9px)',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: pt ? pt.color : 'rgba(255,255,255,0.3)',
              transition: 'color 1s ease',
            }}>
              {pt ? `0${activeIdx + 1} / 0${POINTS.length}` : ''}
            </span>
          </div>

          {/* Scroll hint */}
          <div style={{
            position: 'absolute', bottom: 26, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            opacity: scrollHintOp, transition: 'opacity 0.4s', pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 7, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)' }}>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 0.5, height: 32, background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }}
            />
          </div>

        </div>
      </section>

      <style>{`
        /* ── Orb shells ── */
        .orb-atmo {
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          pointer-events: none;
        }

        .orb-ring {
          position: absolute;
          inset: -1%;
          border-radius: 50%;
        }

        .orb-interior {
          position: absolute;
          inset: 5%;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 36%,
            #0e0e0e 0%,
            #090909 48%,
            rgba(8,8,8,0.9) 76%,
            transparent 100%
          );
        }

        .orb-smoke-shell {
          position: absolute;
          border-radius: 50%;
          border-style: solid;
          border-width: 1.5px;
          will-change: transform;
          filter: blur(1.5px);
        }

        .shell-1 { inset: 4%;  animation: spin-cw var(--dur, 40s) linear infinite; }
        .shell-2 { inset: 13%; animation: spin-ccw var(--dur, 56s) linear infinite; }
        .shell-3 { inset: 22%; animation: spin-cw var(--dur, 34s) linear infinite; border-width: 1px; filter: blur(2px); }

        .orb-inner-light {
          position: absolute;
          inset: 18%;
          border-radius: 50%;
          filter: blur(8px);
        }

        /* Subtle grid lines for depth illusion */
        .orb-grid {
          position: absolute;
          inset: 5%;
          border-radius: 50%;
          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 18px,
              rgba(255,255,255,0.018) 18px,
              rgba(255,255,255,0.018) 19px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 18px,
              rgba(255,255,255,0.012) 18px,
              rgba(255,255,255,0.012) 19px
            );
          opacity: 0.6;
          mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 72%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 72%);
        }

        @keyframes spin-cw  { to { transform: rotate(360deg);  } }
        @keyframes spin-ccw { to { transform: rotate(-360deg); } }
      `}</style>
    </>
  )
}
