/**
 * Hero.jsx — Orb Scroll Experience v4
 * Moweb Studio
 * - Vivid background with animated rays
 * - Better orb: bright glow ring + smoke rings + inner depth
 * - 1000vh for slower scroll pace
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/* ─── Math ─────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp   = (a, b, t) => a + (b - a) * t
const slice  = (p, s, e) => clamp((p - s) / (e - s))
const eio    = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const eout   = t => 1 - Math.pow(1 - t, 3)

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

/* ─── Background Rays ──────────────────────────────────────────── */
function Rays({ progress }) {
  const shift = lerp(-4, 6, progress)
  const rays = [
    { angle: -32, left: '12%',  width: '50vw', opacity: 0.13 },
    { angle: -24, left: '4%',   width: '36vw', opacity: 0.09 },
    { angle: -38, left: '28%',  width: '64vw', opacity: 0.11 },
    { angle: -20, left: '50%',  width: '42vw', opacity: 0.07 },
    { angle: -44, left: '40%',  width: '56vw', opacity: 0.10 },
    { angle: -16, left: '62%',  width: '34vw', opacity: 0.08 },
    { angle: -28, left: '72%',  width: '28vw', opacity: 0.06 },
    { angle: -36, left: '22%',  width: '70vw', opacity: 0.05 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {rays.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: '-10%',
          left: r.left,
          width: r.width,
          height: '130%',
          background: `linear-gradient(to top, rgba(255,255,255,${r.opacity}) 0%, transparent 65%)`,
          transform: `rotate(${r.angle}deg) translateX(${shift + i * 0.6}vw)`,
          transformOrigin: 'bottom left',
          willChange: 'transform',
        }} />
      ))}
      {/* Central brightest ray */}
      <div style={{
        position: 'absolute', bottom: '-5%', left: '32%',
        width: '36vw', height: '120%',
        background: 'linear-gradient(to top, rgba(255,255,255,0.18) 0%, transparent 55%)',
        transform: `rotate(-30deg) translateX(${shift * 1.3}vw)`,
        transformOrigin: 'bottom left',
        willChange: 'transform',
      }} />
    </div>
  )
}

/* ─── Orb Visual ───────────────────────────────────────────────── */
function Orb({ variant = 0 }) {
  // Each variant has slightly different glow colour tint
  const tints = [
    'rgba(220,220,255,',  // cool blue-white
    'rgba(255,220,200,',  // warm ember
    'rgba(200,255,220,',  // faint green
    'rgba(220,200,255,',  // purple
    'rgba(255,255,220,',  // warm white
  ]
  const t = tints[variant % tints.length]

  return (
    <div className="orb-root">
      {/* Outermost haze */}
      <div className="orb-haze" />
      {/* Bright ring */}
      <div className="orb-ring" style={{
        background: `radial-gradient(circle at 50% 50%,
          transparent 62%,
          ${t}0.06) 70%,
          ${t}0.35) 78%,
          rgba(255,255,255,0.72) 82%,
          rgba(255,255,255,0.85) 84%,
          rgba(255,255,255,0.38) 88%,
          ${t}0.08) 93%,
          transparent 100%
        )`
      }} />
      {/* Dark interior */}
      <div className="orb-interior" />
      {/* Smoke ring 1 */}
      <div className={`orb-smoke orb-smoke-a orb-var-${variant}`} />
      {/* Smoke ring 2 */}
      <div className={`orb-smoke orb-smoke-b orb-var-${variant}`} />
      {/* Smoke ring 3 */}
      <div className={`orb-smoke orb-smoke-c orb-var-${variant}`} />
      {/* Inner glow spot */}
      <div className="orb-inner-glow" />
    </div>
  )
}

/* ─── Orb Chapters ─────────────────────────────────────────────── */
const ORBS = [
  {
    id: 0, variant: 0,
    scroll: [0.00, 0.07, 0.14, 0.20],
    enterFrom: 'left',
    eyebrow: 'Motion-first web studio',
    headline: ['We build', 'experiences', 'worth feeling.'],
    weights: [300, 700, 300],
    sub: null, cta: false,
  },
  {
    id: 1, variant: 1,
    scroll: [0.18, 0.25, 0.34, 0.40],
    enterFrom: 'right',
    eyebrow: 'A question worth asking',
    headline: ['What if your', 'website actually', 'felt alive?'],
    weights: [300, 300, 700],
    sub: null, cta: false,
  },
  {
    id: 2, variant: 2,
    scroll: [0.38, 0.45, 0.55, 0.61],
    enterFrom: 'left',
    eyebrow: 'Our story',
    headline: ['Born from', 'frustration.'],
    weights: [300, 700],
    sub: 'Every studio we saw was building pages — not experiences.',
    cta: false,
  },
  {
    id: 3, variant: 3,
    scroll: [0.59, 0.66, 0.76, 0.82],
    enterFrom: 'right',
    eyebrow: 'How we work',
    headline: ['Motion is not', 'decoration.', 'It is the message.'],
    weights: [300, 700, 300],
    sub: null, cta: false,
  },
  {
    id: 4, variant: 4,
    scroll: [0.80, 0.87, 0.95, 1.00],
    enterFrom: 'bottom',
    eyebrow: 'Ready when you are',
    headline: ["Let's begin."],
    weights: [700],
    sub: 'One studio. Precise motion. Zero compromise.',
    cta: true,
  },
]

/* ─── Scene ────────────────────────────────────────────────────── */
function OrbScene({ orb, progress }) {
  const [s, holdS, holdE, e] = orb.scroll
  const [hov1, setHov1] = useState(false)
  const [hov2, setHov2] = useState(false)

  if (progress < s - 0.05 || progress > e + 0.05) return null

  const enterT = eio(slice(progress, s, holdS))
  const exitT  = eio(slice(progress, holdE, e))

  const offX = orb.enterFrom === 'left' ? -115 : orb.enterFrom === 'right' ? 115 : 0
  const offY = orb.enterFrom === 'bottom' ? 90 : 0

  const tx      = lerp(offX, 0, enterT)
  const ty      = lerp(offY, 0, enterT)
  const scale   = lerp(0.72, 1, enterT) * lerp(1, 0.55, exitT)
  const opacity = enterT * lerp(1, 0, eout(exitT))

  const textT  = Math.max(0, clamp((enterT - 0.70) / 0.30) * (1 - clamp(exitT * 3)))
  const textTY = lerp(16, 0, textT)

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      width: 'min(80vmin, 500px)',
      height: 'min(80vmin, 500px)',
      transform: `translate(-50%,-50%) translateX(${tx}vw) translateY(${ty}vh) scale(${scale})`,
      opacity,
      willChange: 'transform, opacity',
      pointerEvents: orb.cta ? 'auto' : 'none',
    }}>
      <Orb variant={orb.variant} />

      {/* Text layer */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '20%',
        opacity: textT,
        transform: `translateY(${textTY}px)`,
        willChange: 'opacity, transform',
        zIndex: 3,
        pointerEvents: 'none',
      }}>
        <p style={{
          fontSize: 'clamp(7px, 1.6vmin, 10px)',
          letterSpacing: '0.36em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.32)',
          margin: '0 0 14px',
        }}>
          {orb.eyebrow}
        </p>
        <h2 style={{
          fontSize: orb.headline.length === 1
            ? 'clamp(30px, 8vmin, 78px)'
            : 'clamp(17px, 4.6vmin, 48px)',
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
          margin: orb.sub ? '0 0 14px' : 0,
          color: '#fff',
          fontWeight: 700,
        }}>
          {orb.headline.map((line, i) => (
            <span key={i} style={{
              display: 'block',
              fontWeight: orb.weights[i] || 700,
              color: orb.weights[i] === 300 ? 'rgba(255,255,255,0.48)' : '#fff',
            }}>{line}</span>
          ))}
        </h2>
        {orb.sub && (
          <p style={{
            fontSize: 'clamp(10px, 2vmin, 13px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.34)',
            lineHeight: 1.65,
            margin: 0,
          }}>
            {orb.sub}
          </p>
        )}
        {orb.cta && (
          <div style={{
            display: 'flex', gap: 10,
            marginTop: 'clamp(14px, 3vmin, 26px)',
            flexWrap: 'wrap', justifyContent: 'center',
            pointerEvents: 'auto',
          }}>
            <button onMouseEnter={() => setHov1(true)} onMouseLeave={() => setHov1(false)}
              style={{
                padding: 'clamp(9px,1.4vmin,13px) clamp(18px,3vmin,32px)',
                border: '1px solid rgba(255,255,255,0.55)', borderRadius: 1,
                background: hov1 ? '#fff' : 'transparent',
                color: hov1 ? '#000' : '#fff',
                fontSize: 'clamp(8px,1.5vmin,11px)', letterSpacing: '0.18em',
                textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500,
                transition: 'background 0.2s, color 0.2s', fontFamily: 'inherit',
              }}>Start a Project</button>
            <button onMouseEnter={() => setHov2(true)} onMouseLeave={() => setHov2(false)}
              style={{
                padding: 'clamp(9px,1.4vmin,13px) clamp(18px,3vmin,32px)',
                border: 'none', background: 'none',
                color: hov2 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                fontSize: 'clamp(8px,1.5vmin,11px)', letterSpacing: '0.18em',
                textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500,
                transition: 'color 0.2s', fontFamily: 'inherit',
              }}>View Work ↗</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── MAIN ─────────────────────────────────────────────────────── */
export default function Hero() {
  const containerRef = useRef(null)
  const progress = useScrollProgress(containerRef)

  const scrollHintOp = Math.max(0, 1 - eio(slice(progress, 0.03, 0.09)))

  // Background: subtle radial shifts with scroll
  const bgX = lerp(40, 60, progress)
  const bgY = lerp(60, 40, progress)

  return (
    <>
      <section ref={containerRef} style={{ height: '1000vh', position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          background: `radial-gradient(ellipse 90% 90% at ${bgX}% ${bgY}%, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.012) 40%, #060606 70%)`,
          willChange: 'background',
        }}>

          {/* Rays */}
          <Rays progress={progress} />

          {/* Wordmark */}
          <div style={{
            position: 'absolute', top: 24, left: 20, zIndex: 20,
            display: 'flex', alignItems: 'baseline', gap: 7, userSelect: 'none',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>MOWEB</span>
            <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.28)' }}>STUDIO</span>
          </div>

          {/* Nav */}
          <div style={{
            position: 'absolute', top: 24, right: 20, zIndex: 20,
            display: 'flex', gap: 24,
          }}>
            {['Work','Process','Contact'].map(l => (
              <span key={l} style={{
                fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)', cursor: 'pointer',
              }}>{l}</span>
            ))}
          </div>

          {/* Orb scenes */}
          {ORBS.map(orb => (
            <OrbScene key={orb.id} orb={orb} progress={progress} />
          ))}

          {/* Progress bar */}
          <div style={{
            position: 'absolute', right: 18, top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 8, zIndex: 20,
          }}>
            {ORBS.map((orb, i) => {
              const [s,,, e] = orb.scroll
              const active = progress >= s && progress <= e
              const past   = progress > e
              return (
                <div key={i} style={{
                  width: active ? 2 : 1,
                  height: active ? 20 : 8,
                  background: active ? 'rgba(255,255,255,0.7)' : past ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                  borderRadius: 1,
                  transition: 'all 0.4s ease',
                }} />
              )
            })}
          </div>

          {/* Scroll hint */}
          <div style={{
            position: 'absolute', bottom: 28, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            opacity: scrollHintOp, transition: 'opacity 0.4s', pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 7, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)' }}>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 0.5, height: 34, background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
            />
          </div>

        </div>
      </section>

      <style>{`
        /* ── Orb ── */
        .orb-root {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        /* Outer atmospheric haze */
        .orb-haze {
          position: absolute;
          inset: -14%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%,
            transparent 52%,
            rgba(255,255,255,0.012) 65%,
            rgba(255,255,255,0.045) 76%,
            rgba(255,255,255,0.018) 88%,
            transparent 100%
          );
          filter: blur(4px);
        }

        /* Bright glow ring */
        .orb-ring {
          position: absolute;
          inset: -2%;
          border-radius: 50%;
        }

        /* Dark interior */
        .orb-interior {
          position: absolute;
          inset: 6%;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 38%,
            #0c0c0c 0%,
            #080808 50%,
            rgba(10,10,10,0.92) 78%,
            transparent 100%
          );
        }

        /* Smoke rings */
        .orb-smoke {
          position: absolute;
          border-radius: 50%;
          will-change: transform;
        }

        .orb-smoke-a {
          inset: 5%;
          border: 1.5px solid rgba(255,255,255,0.13);
          filter: blur(2.5px);
          box-shadow: inset 0 0 18px rgba(255,255,255,0.06), 0 0 12px rgba(255,255,255,0.04);
        }
        .orb-smoke-b {
          inset: 14%;
          border: 1px solid rgba(255,255,255,0.09);
          filter: blur(3px);
          box-shadow: inset 0 0 14px rgba(255,255,255,0.05);
        }
        .orb-smoke-c {
          inset: 24%;
          border: 1px solid rgba(255,255,255,0.06);
          filter: blur(4px);
          box-shadow: inset 0 0 10px rgba(255,255,255,0.04);
        }

        /* Smoke distortion via per-variant offsets */
        .orb-var-0 .orb-smoke-a { transform-origin: 52% 48%; }
        .orb-var-1 .orb-smoke-a { transform-origin: 48% 54%; }
        .orb-var-2 .orb-smoke-a { transform-origin: 54% 46%; }
        .orb-var-3 .orb-smoke-a { transform-origin: 46% 52%; }
        .orb-var-4 .orb-smoke-a { transform-origin: 50% 50%; }

        /* Spin animations */
        .orb-var-0 .orb-smoke-a { animation: spin-cw  44s linear infinite; }
        .orb-var-0 .orb-smoke-b { animation: spin-ccw 58s linear infinite; }
        .orb-var-0 .orb-smoke-c { animation: spin-cw  36s linear infinite; }

        .orb-var-1 .orb-smoke-a { animation: spin-ccw 36s linear infinite; }
        .orb-var-1 .orb-smoke-b { animation: spin-cw  48s linear infinite; }
        .orb-var-1 .orb-smoke-c { animation: spin-ccw 30s linear infinite; }

        .orb-var-2 .orb-smoke-a { animation: spin-cw  28s linear infinite; }
        .orb-var-2 .orb-smoke-b { animation: spin-ccw 40s linear infinite; }
        .orb-var-2 .orb-smoke-c { animation: spin-cw  52s linear infinite; }

        .orb-var-3 .orb-smoke-a { animation: spin-ccw 50s linear infinite; }
        .orb-var-3 .orb-smoke-b { animation: spin-cw  34s linear infinite; }
        .orb-var-3 .orb-smoke-c { animation: spin-ccw 44s linear infinite; }

        .orb-var-4 .orb-smoke-a { animation: spin-cw  32s linear infinite; }
        .orb-var-4 .orb-smoke-b { animation: spin-ccw 46s linear infinite; }
        .orb-var-4 .orb-smoke-c { animation: spin-cw  38s linear infinite; }

        /* Inner glow */
        .orb-inner-glow {
          position: absolute;
          inset: 28%;
          border-radius: 50%;
          background: radial-gradient(circle at 44% 40%,
            rgba(255,255,255,0.04) 0%,
            transparent 70%
          );
          filter: blur(6px);
        }

        @keyframes spin-cw  { to { transform: rotate(360deg);  } }
        @keyframes spin-ccw { to { transform: rotate(-360deg); } }
      `}</style>
    </>
  )
}
