/**
 * Hero.jsx — Orb Scroll Experience v3
 * Moweb Studio
 * - CSS-only orbs (no SVG feTurbulence) for smooth 60fps
 * - vmin-based sizing for mobile/desktop
 * - Proper sticky scroll
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/* ─── Math helpers ─────────────────────────────────────────────── */
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

/* ─── CSS Orb (no SVG filters — pure CSS for performance) ──────── */
function CSSOrb({ animClass }) {
  return (
    <div className={`orb-shell ${animClass}`}>
      {/* Glow ring */}
      <div className="orb-glow" />
      {/* Dark core */}
      <div className="orb-core" />
      {/* Smoke wisps — rotating layers */}
      <div className="orb-wisp orb-wisp-1" />
      <div className="orb-wisp orb-wisp-2" />
      <div className="orb-wisp orb-wisp-3" />
    </div>
  )
}

/* ─── Orb Chapter Config ───────────────────────────────────────── */
const ORBS = [
  {
    id: 0,
    scroll: [0.00, 0.08, 0.17, 0.23],
    enterFrom: 'left',
    animClass: 'anim-slow',
    eyebrow: 'Motion-first web studio',
    headline: ['We build', 'experiences', 'worth feeling.'],
    headlineWeights: [300, 700, 300],
    sub: null,
    cta: false,
  },
  {
    id: 1,
    scroll: [0.19, 0.27, 0.37, 0.43],
    enterFrom: 'right',
    animClass: 'anim-med',
    eyebrow: 'A question worth asking',
    headline: ['What if your', 'website actually', 'felt alive?'],
    headlineWeights: [300, 300, 700],
    sub: null,
    cta: false,
  },
  {
    id: 2,
    scroll: [0.39, 0.47, 0.57, 0.63],
    enterFrom: 'left',
    animClass: 'anim-fast',
    eyebrow: 'Our story',
    headline: ['Born from', 'frustration.'],
    headlineWeights: [300, 700],
    sub: 'Every studio we saw was building pages — not experiences.',
    cta: false,
  },
  {
    id: 3,
    scroll: [0.59, 0.67, 0.77, 0.83],
    enterFrom: 'right',
    animClass: 'anim-slow',
    eyebrow: 'How we work',
    headline: ['Motion is not', 'decoration.', 'It is the message.'],
    headlineWeights: [300, 700, 300],
    sub: null,
    cta: false,
  },
  {
    id: 4,
    scroll: [0.79, 0.87, 0.96, 1.00],
    enterFrom: 'bottom',
    animClass: 'anim-med',
    eyebrow: 'Ready when you are',
    headline: ["Let's begin."],
    headlineWeights: [700],
    sub: 'One studio. Precise motion. Zero compromise.',
    cta: true,
  },
]

/* ─── Single Orb Scene ─────────────────────────────────────────── */
function OrbScene({ orb, progress }) {
  const [s, holdS, holdE, e] = orb.scroll
  const [hov, setHov] = useState(false)
  const [hovGhost, setHovGhost] = useState(false)

  if (progress < s - 0.06 || progress > e + 0.06) return null

  const enterT = eio(slice(progress, s, holdS))
  const exitT  = eio(slice(progress, holdE, e))

  // Enter offset
  const offX = orb.enterFrom === 'left' ? -110 : orb.enterFrom === 'right' ? 110 : 0
  const offY = orb.enterFrom === 'bottom' ? 80 : 0

  const tx = lerp(offX, 0, enterT)
  const ty = lerp(offY, 0, enterT)

  const scale   = lerp(0.78, 1, enterT) * lerp(1, 0.6, exitT)
  const opacity = enterT * lerp(1, 0, eout(exitT))

  // Text appears after orb settles
  const textT  = clamp((enterT - 0.72) / 0.28) * (1 - clamp(exitT * 2.5))
  const textOp = Math.max(0, textT)
  const textTY = lerp(12, 0, textT)

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: `translate(-50%, -50%) translateX(${tx}vw) translateY(${ty}vh) scale(${scale})`,
      opacity,
      willChange: 'transform, opacity',
      width: 'min(78vmin, 520px)',
      height: 'min(78vmin, 520px)',
      pointerEvents: orb.cta ? 'auto' : 'none',
    }}>
      <CSSOrb animClass={orb.animClass} />

      {/* Text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '18%',
        opacity: textOp,
        transform: `translateY(${textTY}px)`,
        willChange: 'opacity, transform',
        zIndex: 2,
        pointerEvents: 'none',
      }}>
        <p style={{
          fontSize: 'clamp(7px, 1.8vw, 10px)',
          letterSpacing: '0.36em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          margin: '0 0 clamp(10px, 2vw, 18px)',
          fontWeight: 400,
        }}>
          {orb.eyebrow}
        </p>

        <h2 style={{
          fontSize: orb.headline.length === 1
            ? 'clamp(28px, 7vmin, 72px)'
            : 'clamp(18px, 4.8vmin, 52px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          color: '#fff',
          margin: orb.sub ? '0 0 clamp(10px, 2vw, 18px)' : 0,
        }}>
          {orb.headline.map((line, i) => (
            <span key={i} style={{
              display: 'block',
              fontWeight: orb.headlineWeights[i] || 700,
              color: orb.headlineWeights[i] === 300 ? 'rgba(255,255,255,0.5)' : '#fff',
            }}>{line}</span>
          ))}
        </h2>

        {orb.sub && (
          <p style={{
            fontSize: 'clamp(10px, 2.2vmin, 14px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.65,
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            {orb.sub}
          </p>
        )}

        {orb.cta && (
          <div style={{
            display: 'flex', gap: 10, marginTop: 'clamp(16px, 3vmin, 28px)',
            flexWrap: 'wrap', justifyContent: 'center',
            pointerEvents: 'auto',
          }}>
            <button
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                padding: 'clamp(9px, 1.5vmin, 13px) clamp(18px, 3vmin, 32px)',
                border: '1px solid rgba(255,255,255,0.55)',
                borderRadius: 1,
                background: hov ? '#fff' : 'transparent',
                color: hov ? '#000' : '#fff',
                fontSize: 'clamp(8px, 1.6vmin, 11px)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: 'pointer', fontWeight: 500,
                transition: 'background 0.2s, color 0.2s',
                fontFamily: 'inherit',
              }}>
              Start a Project
            </button>
            <button
              onMouseEnter={() => setHovGhost(true)}
              onMouseLeave={() => setHovGhost(false)}
              style={{
                padding: 'clamp(9px, 1.5vmin, 13px) clamp(18px, 3vmin, 32px)',
                border: 'none', borderRadius: 1,
                background: 'none',
                color: hovGhost ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                fontSize: 'clamp(8px, 1.6vmin, 11px)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: 'pointer', fontWeight: 500,
                transition: 'color 0.2s',
                fontFamily: 'inherit',
              }}>
              View Work ↗
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── MAIN ─────────────────────────────────────────────────────── */
export default function Hero() {
  const containerRef = useRef(null)
  const progress     = useScrollProgress(containerRef)

  const scrollHintOp = Math.max(0, 1 - eio(slice(progress, 0.04, 0.12)))

  return (
    <>
      <section
        ref={containerRef}
        style={{ height: '700vh', position: 'relative' }}
      >
        <div style={{
          position: 'sticky', top: 0,
          height: '100vh',
          background: '#060606',
          // No overflow:hidden here — that breaks sticky on some browsers
          // Use clip on x only via the global style
        }}>

          {/* Wordmark */}
          <div style={{
            position: 'absolute', top: 24, left: 20, zIndex: 20,
            display: 'flex', alignItems: 'baseline', gap: 7,
            userSelect: 'none',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>MOWEB</span>
            <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.25)' }}>STUDIO</span>
          </div>

          {/* Nav */}
          <div style={{
            position: 'absolute', top: 24, right: 20, zIndex: 20,
            display: 'flex', gap: 24,
          }}>
            {['Work','Process','Contact'].map(l => (
              <span key={l} style={{
                fontSize: 9, letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)',
                cursor: 'pointer',
              }}>{l}</span>
            ))}
          </div>

          {/* Orbs */}
          {ORBS.map(orb => (
            <OrbScene key={orb.id} orb={orb} progress={progress} />
          ))}

          {/* Progress dots */}
          <div style={{
            position: 'absolute', right: 18, top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 8,
            zIndex: 20,
          }}>
            {ORBS.map((orb, i) => {
              const [s,,, e] = orb.scroll
              const active = progress >= s && progress <= e
              const past   = progress > e
              return (
                <div key={i} style={{
                  width: active ? 2 : 1,
                  height: active ? 18 : 8,
                  background: active
                    ? 'rgba(255,255,255,0.65)'
                    : past
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.07)',
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
            opacity: scrollHintOp,
            transition: 'opacity 0.4s',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 7, letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)' }}>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 0.5, height: 34, background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }}
            />
          </div>

        </div>
      </section>

      <style>{`
        html, body, #root, #__next {
          margin: 0; padding: 0;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          height: auto;
          min-height: 100%;
          font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
        }

        /* ── CSS Orb ── */
        .orb-shell {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          will-change: transform;
        }

        /* Glow ring */
        .orb-glow {
          position: absolute; inset: -2%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 50% 50%,
            transparent 68%,
            rgba(255,255,255,0.04) 76%,
            rgba(255,255,255,0.55) 84%,
            rgba(255,255,255,0.65) 87%,
            rgba(255,255,255,0.18) 92%,
            transparent 100%
          );
        }

        /* Dark core */
        .orb-core {
          position: absolute; inset: 4%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 42% 42%,
            #0a0a0a 0%,
            #070707 55%,
            rgba(12,12,12,0.9) 80%,
            transparent 100%
          );
        }

        /* Smoke wisps — CSS blur + rotate */
        .orb-wisp {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: screen;
          will-change: transform;
        }

        .orb-wisp-1 {
          inset: 8%;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            rgba(255,255,255,0.06) 12%,
            transparent 25%,
            rgba(255,255,255,0.04) 40%,
            transparent 55%,
            rgba(255,255,255,0.07) 70%,
            transparent 85%,
            rgba(255,255,255,0.03) 100%
          );
          filter: blur(6px);
        }

        .orb-wisp-2 {
          inset: 16%;
          background: conic-gradient(
            from 120deg,
            transparent 0%,
            rgba(255,255,255,0.05) 15%,
            transparent 30%,
            rgba(255,255,255,0.08) 50%,
            transparent 65%,
            rgba(255,255,255,0.04) 80%,
            transparent 100%
          );
          filter: blur(8px);
        }

        .orb-wisp-3 {
          inset: 24%;
          background: conic-gradient(
            from 240deg,
            transparent 0%,
            rgba(255,255,255,0.04) 20%,
            transparent 40%,
            rgba(255,255,255,0.06) 60%,
            transparent 80%,
            transparent 100%
          );
          filter: blur(10px);
        }

        /* Rotation animations — different speeds per orb */
        .anim-slow .orb-wisp-1 { animation: spin-cw  38s linear infinite; }
        .anim-slow .orb-wisp-2 { animation: spin-ccw 52s linear infinite; }
        .anim-slow .orb-wisp-3 { animation: spin-cw  44s linear infinite; }

        .anim-med .orb-wisp-1  { animation: spin-cw  26s linear infinite; }
        .anim-med .orb-wisp-2  { animation: spin-ccw 34s linear infinite; }
        .anim-med .orb-wisp-3  { animation: spin-cw  30s linear infinite; }

        .anim-fast .orb-wisp-1 { animation: spin-ccw 20s linear infinite; }
        .anim-fast .orb-wisp-2 { animation: spin-cw  28s linear infinite; }
        .anim-fast .orb-wisp-3 { animation: spin-ccw 24s linear infinite; }

        @keyframes spin-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes spin-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }

        @media (max-width: 600px) {
          /* Nav hidden on small screens */
          .mw-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
