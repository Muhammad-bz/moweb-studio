/**
 * Hero.jsx — Orb Scroll Experience
 * Moweb Studio
 *
 * 5 smoky plasma orbs, each carrying a chapter of brand story.
 * Scroll-driven: orbs drift in from sides, hold, then zoom/fade out.
 * Text lives inside each orb, fades in after orb settles.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/* ─── Math helpers ─────────────────────────────────────────────── */
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
    document.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => {
      window.removeEventListener('scroll', fn)
      document.removeEventListener('scroll', fn)
    }
  }, [ref])
  return p
}

/* ─── Smoky Orb SVG ────────────────────────────────────────────── */
function OrbSvg({ size = 500, seed = 0, animSpeed = 28 }) {
  const id = `orb-${seed}`
  // Different turbulence seeds per orb for variety
  const freq = 0.008 + seed * 0.002
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 500 500"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <defs>
        <filter id={`smoke-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${freq} ${freq}`}
            numOctaves="4"
            seed={seed * 7}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values={`${freq} ${freq};${freq+0.003} ${freq+0.002};${freq} ${freq}`}
              dur={`${animSpeed}s`}
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="55" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="3" result="blurred" />
          <feComposite in="blurred" in2="SourceGraphic" operator="in" />
        </filter>

        {/* Glow ring */}
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
          <stop offset="72%"  stopColor="rgba(0,0,0,0)" />
          <stop offset="84%"  stopColor={`rgba(255,255,255,${0.18 + seed*0.04})`} />
          <stop offset="92%"  stopColor={`rgba(255,255,255,${0.55 + seed*0.05})`} />
          <stop offset="97%"  stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Smoke fill — dark inside, wispy at edges */}
        <radialGradient id={`fill-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="rgba(6,6,6,1)" />
          <stop offset="55%" stopColor="rgba(10,10,10,0.97)" />
          <stop offset="80%" stopColor="rgba(18,18,18,0.85)" />
          <stop offset="92%" stopColor="rgba(30,30,30,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        <clipPath id={`circle-${id}`}>
          <circle cx="250" cy="250" r="230" />
        </clipPath>
      </defs>

      {/* Outer glow ring */}
      <circle cx="250" cy="250" r="240" fill={`url(#glow-${id})`} />

      {/* Dark smoke fill with turbulence displacement */}
      <circle
        cx="250" cy="250" r="230"
        fill={`url(#fill-${id})`}
        filter={`url(#smoke-${id})`}
        clipPath={`url(#circle-${id})`}
      />

      {/* Inner smoke wisps — layered circles with varying opacity */}
      {[0,1,2,3].map(i => (
        <circle
          key={i}
          cx={250 + (i%2===0?-1:1)*18*i}
          cy={250 + (i<2?-1:1)*14*i}
          r={180 - i*22}
          fill="none"
          stroke={`rgba(255,255,255,${0.035 - i*0.006})`}
          strokeWidth={28 - i*4}
          filter={`url(#smoke-${id})`}
          clipPath={`url(#circle-${id})`}
        />
      ))}

      {/* Bright inner rim */}
      <circle
        cx="250" cy="250" r="228"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/* ─── Orb Chapter Config ───────────────────────────────────────── */
// Each orb: scroll window [start, hold-start, hold-end, end]
// enterFrom: 'left' | 'right' | 'bottom'
// pos: [x%, y%] center of orb in viewport
const ORBS = [
  {
    id: 0,
    scroll: [0.00, 0.08, 0.16, 0.22],
    enterFrom: 'left',
    pos: [50, 50],
    size: 520,
    seed: 3,
    speed: 32,
    eyebrow: 'Motion-first web studio',
    headline: 'We build\nexperiences\nworth feeling.',
    sub: null,
  },
  {
    id: 1,
    scroll: [0.18, 0.26, 0.36, 0.42],
    enterFrom: 'right',
    pos: [52, 48],
    size: 480,
    seed: 7,
    speed: 26,
    eyebrow: 'A question worth asking',
    headline: 'What if your\nwebsite actually\nfelt alive?',
    sub: null,
  },
  {
    id: 2,
    scroll: [0.38, 0.46, 0.56, 0.62],
    enterFrom: 'left',
    pos: [48, 52],
    size: 560,
    seed: 11,
    speed: 38,
    eyebrow: 'Our story',
    headline: 'Born from\nfrustration.',
    sub: 'Every studio we saw was building pages — not experiences.',
  },
  {
    id: 3,
    scroll: [0.58, 0.66, 0.76, 0.82],
    enterFrom: 'right',
    pos: [50, 50],
    size: 500,
    seed: 5,
    speed: 30,
    eyebrow: 'How we work',
    headline: 'Motion is not\ndecoration.\nIt is the message.',
    sub: null,
  },
  {
    id: 4,
    scroll: [0.78, 0.86, 0.95, 1.00],
    enterFrom: 'bottom',
    pos: [50, 50],
    size: 600,
    seed: 9,
    speed: 22,
    eyebrow: 'Ready when you are',
    headline: "Let's begin.",
    sub: 'One studio. Precise motion. Zero compromise.',
    cta: true,
  },
]

/* ─── Single Orb Scene ─────────────────────────────────────────── */
function OrbScene({ orb, progress }) {
  const [s, holdS, holdE, e] = orb.scroll

  // t=0 → t=1 across enter phase
  const enterT  = eio(slice(progress, s, holdS))
  // t=0 → t=1 across exit phase
  const exitT   = eio(slice(progress, holdE, e))
  // visibility: 1 during hold, 0 outside scroll window
  const visible = progress >= s && progress <= e

  if (!visible && progress > e + 0.05) return null
  if (!visible && progress < s - 0.05) return null

  // Orb position: enters from side/bottom, settles at pos
  const offX = orb.enterFrom === 'left'   ? -130
             : orb.enterFrom === 'right'  ?  130
             : 0
  const offY = orb.enterFrom === 'bottom' ? 140 : 0

  // During exit: zoom out and drift
  const exitScale = lerp(1, 0.55, exitT)
  const exitOp    = lerp(1, 0, eout(exitT))

  const cx = lerp(offX, 0, enterT) // offset from center X in vw
  const cy = lerp(offY, 0, enterT) // offset from center Y in vh

  // Text appears after orb settles (enterT > 0.75)
  const textT = clamp((enterT - 0.75) / 0.25) * (1 - exitT * 2)
  const textOp = clamp(textT)

  const orbSize = orb.size
  const halfOrb = orbSize / 2

  return (
    <div style={{
      position: 'absolute',
      left: `${orb.pos[0]}%`,
      top:  `${orb.pos[1]}%`,
      width: orbSize,
      height: orbSize,
      transform: `
        translate(-50%, -50%)
        translateX(${cx}vw)
        translateY(${cy}vh)
        scale(${lerp(0.82, 1, enterT) * exitScale})
      `,
      opacity: exitT > 0 ? exitOp : enterT,
      willChange: 'transform, opacity',
      pointerEvents: orb.cta ? 'auto' : 'none',
    }}>
      {/* The orb graphic */}
      <OrbSvg size={orbSize} seed={orb.seed} animSpeed={orb.speed} />

      {/* Text inside the orb */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `${halfOrb * 0.22}px`,
        opacity: textOp,
        transform: `translateY(${lerp(14, 0, textT)}px)`,
        willChange: 'opacity, transform',
        zIndex: 2,
      }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 'clamp(8px, 1vw, 11px)',
          letterSpacing: '0.38em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
          margin: '0 0 16px',
          fontWeight: 400,
        }}>
          {orb.eyebrow}
        </p>

        {/* Headline */}
        <h2 style={{
          fontSize: orbSize > 540
            ? 'clamp(22px, 3.8vw, 52px)'
            : 'clamp(18px, 3vw, 42px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          color: '#fff',
          margin: '0 0 18px',
          whiteSpace: 'pre-line',
          maxWidth: orbSize * 0.55,
        }}>
          {orb.headline}
        </h2>

        {/* Sub */}
        {orb.sub && (
          <p style={{
            fontSize: 'clamp(11px, 1.1vw, 14px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.7,
            maxWidth: orbSize * 0.48,
            margin: 0,
            letterSpacing: '0.01em',
          }}>
            {orb.sub}
          </p>
        )}

        {/* CTA buttons for last orb */}
        {orb.cta && (
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            <CTAButton primary>Start a Project</CTAButton>
            <CTAButton>View Work ↗</CTAButton>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── CTA Button ───────────────────────────────────────────────── */
function CTAButton({ children, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: 'clamp(10px, 1.2vw, 13px) clamp(20px, 2.5vw, 34px)',
        border: primary ? '1px solid rgba(255,255,255,0.55)' : 'none',
        borderRadius: 1,
        background: primary ? (hov ? '#fff' : 'transparent') : 'none',
        color: primary ? (hov ? '#000' : '#fff') : (hov ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)'),
        fontSize: 'clamp(9px, 0.9vw, 11px)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontWeight: 500,
        transition: 'background 0.22s, color 0.22s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Scroll hint ──────────────────────────────────────────────── */
function ScrollHint({ progress }) {
  const op = Math.max(0, 1 - eio(slice(progress, 0.04, 0.12)))
  return (
    <div style={{
      position: 'absolute', bottom: 32, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      opacity: op, pointerEvents: 'none',
      transition: 'opacity 0.4s',
    }}>
      <span style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)' }}>Scroll</span>
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 0.5, height: 38, background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }}
      />
    </div>
  )
}

/* ─── MAIN ─────────────────────────────────────────────────────── */
export default function Hero() {
  const containerRef = useRef(null)
  const progress     = useScrollProgress(containerRef)

  // Subtle background pulse based on scroll
  const bgLuminance = lerp(0.018, 0.032, Math.sin(progress * Math.PI))

  return (
    <>
      <section
        ref={containerRef}
        style={{ height: '700vh', position: 'relative', display: 'block', overflow: 'visible' }}
      >
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden',
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,255,255,${bgLuminance}) 0%, #060606 70%)`,
        }}>

          {/* Wordmark */}
          <div style={{
            position: 'absolute', top: 28, left: 24, zIndex: 20,
            display: 'flex', alignItems: 'baseline', gap: 8,
            opacity: 0.9,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', userSelect: 'none' }}>MOWEB</span>
            <span style={{ fontSize: 12, fontWeight: 300, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.28)', userSelect: 'none' }}>STUDIO</span>
          </div>

          {/* Nav */}
          <div style={{
            position: 'absolute', top: 28, right: 24, zIndex: 20,
            display: 'flex', gap: 28,
          }}>
            {['Work','Process','Contact'].map(l => (
              <span key={l} style={{
                fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
              }}>{l}</span>
            ))}
          </div>

          {/* Orb scenes */}
          {ORBS.map(orb => (
            <OrbScene key={orb.id} orb={orb} progress={progress} />
          ))}

          {/* Scroll hint */}
          <ScrollHint progress={progress} />

          {/* Progress dots */}
          <div style={{
            position: 'absolute', right: 24, top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 10,
            zIndex: 20,
          }}>
            {ORBS.map((orb, i) => {
              const [s,,, e] = orb.scroll
              const active = progress >= s && progress <= e
              const past   = progress > e
              return (
                <div key={i} style={{
                  width: active ? 2 : 1,
                  height: active ? 20 : 10,
                  background: active ? 'rgba(255,255,255,0.7)' : past ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 1,
                  transition: 'all 0.4s ease',
                }} />
              )
            })}
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
          font-family: -apple-system, 'Helvetica Neue', sans-serif;
        }
        @media (max-width: 600px) {
          /* Scale orbs down on mobile */
        }
      `}</style>
    </>
  )
}
