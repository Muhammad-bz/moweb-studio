/**
 * Hero1.jsx — Scroll-Timeline Story Hero
 * Moweb Studio
 *
 * Changes vs original Hero1:
 *   • Background: animated dot field (matches Hero2) — rays removed
 *   • Scroll space: 1100vh (was 700vh) — slower, more breathing room
 *   • Text glitches: translateX animation removed from stagger lines (was
 *     driven by inline style not transition, causing flicker on re-render)
 *   • Hover persistence: CTAButton uses CSS class + stylesheet, not inline
 *     onMouseEnter/Leave state that could get stuck on scroll-rerender
 *   • C6 "Let's begin" chapter removed — Hero2 takes its place
 *   • Chapter timings rescaled to fill 0.00–0.88 (leaving 0.88–1.0 as
 *     a clean hold/exit so Hero2 enters smoothly)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/* ─── Math helpers ────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp  = (a, b, t) => a + (b - a) * t
const ch    = (p, s, e) => clamp((p - s) / (e - s))
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const eout  = t => 1 - Math.pow(1-t, 3)

/* ─── Drifting dot field (same as Hero2) ─────────────────────── */
const BG_DOTS = Array.from({ length: 260 }, () => ({
  x:  Math.random(),
  y:  Math.random(),
  vx: (Math.random() - 0.5) * 0.000065,
  vy: (Math.random() - 0.5) * 0.000065,
  s:  0.18 + Math.random() * 0.72,
  ph: Math.random() * Math.PI * 2,
}))

function DotField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let W = 0, H = 0

    const resize = () => {
      const DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W * DPR
      canvas.height = H * DPR
      canvas.style.width  = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (ts) => {
      const t = ts * 0.001
      ctx.fillStyle = '#060606'
      ctx.fillRect(0, 0, W, H)
      for (const d of BG_DOTS) {
        d.x = (d.x + d.vx + 1) % 1
        d.y = (d.y + d.vy + 1) % 1
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.85 + d.ph)
        ctx.beginPath()
        ctx.arc(d.x * W, d.y * H, d.s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.038 + twinkle * 0.082})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  )
}

/* ─── Scroll progress ─────────────────────────────────────────── */
function useScrollProgress(ref) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const fn = () => {
      const el = ref.current
      if (!el) return
      setP(clamp(-el.getBoundingClientRect().top / (el.getBoundingClientRect().height - window.innerHeight)))
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [ref])
  return p
}

/* ─── Wordmark ────────────────────────────────────────────────── */
function Wordmark({ visible }) {
  return (
    <div style={{
      position: 'absolute', top: 28, left: 24,
      display: 'flex', alignItems: 'baseline', gap: 8,
      userSelect: 'none', zIndex: 10,
      opacity: visible ? 1 : 0,
      transform: `translateX(${visible ? 0 : -16}px)`,
      transition: 'opacity 0.8s, transform 0.8s',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>MOWEB</span>
      <span style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>STUDIO</span>
    </div>
  )
}

/* ─── Horizontal slide wrapper ────────────────────────────────── */
function HSlide({ inT, outT = 0, fromLeft = true, children, style = {} }) {
  const xIn  = fromLeft ? -80 : 80
  const xOut = fromLeft ? 80 : -80
  const x    = inT < 1 ? lerp(xIn, 0, eio(inT)) : outT > 0 ? lerp(0, xOut, eio(outT)) : 0
  const op   = inT < 1 ? eio(inT) : outT > 0 ? 1 - eio(outT) : 1
  return (
    <div style={{
      transform: `translateX(${x}px)`,
      opacity: op,
      willChange: 'transform, opacity',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─── INTRO OVERLAY ───────────────────────────────────────────── */
function IntroOverlay({ onDone }) {
  const [phase, setPhase] = useState('blink')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fadeout'), 2200)
    const t2 = setTimeout(() => { setPhase('done'); onDone() }, 3100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  if (phase === 'done') return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#060606',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fadeout' ? 0 : 1,
      transition: phase === 'fadeout' ? 'opacity 0.85s ease-in-out' : 'none',
      pointerEvents: 'none',
    }}>
      <span style={{
        fontSize: 'clamp(11px, 1.4vw, 14px)',
        letterSpacing: '0.45em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.55)',
        animation: phase === 'blink' ? 'mw-blink 0.9s ease-in-out infinite' : 'none',
        opacity: phase === 'blink' ? undefined : 0,
      }}>
        Scroll
      </span>
      <style>{`@keyframes mw-blink { 0%,100%{opacity:0.1} 50%{opacity:0.7} }`}</style>
    </div>
  )
}

/* ─── CTA Button — CSS-class hover (no stuck state) ──────────── */
function CTAButton({ children, primary }) {
  return (
    <>
      <style>{`
        .mw-btn-primary {
          padding: clamp(12px,1.5vw,15px) clamp(24px,3vw,40px);
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 1px;
          background: transparent;
          color: #fff;
          font-size: clamp(10px,1vw,12px);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.22s, color 0.22s;
          font-family: inherit;
        }
        .mw-btn-primary:hover { background:#fff; color:#000; }
        .mw-btn-ghost {
          padding: clamp(12px,1.5vw,15px) clamp(24px,3vw,40px);
          border: none;
          background: none;
          color: rgba(255,255,255,0.32);
          font-size: clamp(10px,1vw,12px);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.22s;
          font-family: inherit;
        }
        .mw-btn-ghost:hover { color: rgba(255,255,255,0.9); }
      `}</style>
      <button className={primary ? 'mw-btn-primary' : 'mw-btn-ghost'}>
        {children}
      </button>
    </>
  )
}

/* ─── Shared text styles ──────────────────────────────────────── */
const EYEBROW = {
  fontSize: 10,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.22)',
  marginBottom: 20,
  marginTop: 0,
}
const H_LARGE = {
  fontSize: 'clamp(32px, 5.5vw, 76px)',
  letterSpacing: '-0.025em',
  lineHeight: 1.15,
  margin: 0,
}
const H_MED = {
  fontSize: 'clamp(26px, 4vw, 58px)',
  fontWeight: 700,
  letterSpacing: '-0.025em',
  lineHeight: 1.2,
  color: '#fff',
  margin: '0 0 0',
}
const BODY = {
  fontSize: 'clamp(13px, 1.3vw, 16px)',
  fontWeight: 300,
  color: 'rgba(255,255,255,0.38)',
  lineHeight: 1.8,
  letterSpacing: '0.01em',
  maxWidth: 520,
  margin: '0 auto',
}

/* ─── MAIN ────────────────────────────────────────────────────── */
export default function Hero1() {
  const containerRef = useRef(null)
  const progress     = useScrollProgress(containerRef)
  const [introGone, setIntroGone] = useState(false)
  const onIntroDone = useCallback(() => setIntroGone(true), [])

  /*
    Chapter map — rescaled across 1100vh (0.00–1.00)
    Extra scroll space added proportionally; C6 "Let's begin" dropped.
    C0 Silence       0.00 – 0.10
    C1 Question      0.08 – 0.24
    C2 Reveal        0.22 – 0.40
    C3 Our Story     0.38 – 0.55
    C4 How We Work   0.53 – 0.70
    C5 World tagline 0.68 – 0.85
    hold / exit      0.85 – 1.00
  */
  const c0    = ch(progress, 0.00, 0.10)
  const c1in  = eio(ch(progress, 0.08, 0.20))
  const c1out = eio(ch(progress, 0.20, 0.28))
  const c2in  = eio(ch(progress, 0.22, 0.36))
  const c2out = eio(ch(progress, 0.36, 0.44))
  const c3in  = eio(ch(progress, 0.38, 0.50))
  const c3out = eio(ch(progress, 0.50, 0.58))
  const c4in  = eio(ch(progress, 0.53, 0.65))
  const c4out = eio(ch(progress, 0.65, 0.73))
  const c5in  = eio(ch(progress, 0.68, 0.78))
  const c5out = eio(ch(progress, 0.80, 0.88))

  // Camera subtle drift
  const camScale = lerp(1, 1.10, ch(progress, 0.30, 1.0))
  const camTiltX = lerp(0, -1.5, ch(progress, 0.40, 0.85))

  // Geometry grid
  const gridOp    = eio(ch(progress, 0.38, 0.55)) * (1 - eio(ch(progress, 0.78, 0.90)))
  const gridScale = lerp(0.90, 1.06, ch(progress, 0.38, 0.70))

  const wordmarkVisible = introGone && progress < 0.96

  return (
    <>
      <IntroOverlay onDone={onIntroDone} />

      <section ref={containerRef} style={{ height: '1100vh', position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden',
        }}>

          {/* ── Dot field background ── */}
          <DotField />

          {/* ── CAMERA layer ── */}
          <div style={{
            position: 'absolute', inset: '-6%',
            transformOrigin: '50% 52%',
            transform: `scale(${camScale}) rotateX(${camTiltX}deg)`,
            willChange: 'transform',
            zIndex: 1,
          }}>

            {/* Geometry grid */}
            <div style={{
              position: 'absolute', inset: 0,
              opacity: gridOp,
              transform: `scale(${gridScale})`,
              willChange: 'transform, opacity',
            }}>
              <svg viewBox="0 0 1440 900" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
                {[0,1,2,3,4].map(i => (
                  <line key={i} x1={-200+i*360} y1={0} x2={-200+i*360+500} y2={900}
                    stroke="rgba(255,255,255,0.055)" strokeWidth="0.5" />
                ))}
                {[200,400,600,750].map((y,i) => (
                  <line key={i} x1={0} y1={y} x2={1440} y2={y}
                    stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
                ))}
                <circle cx="720" cy="450" r="300" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <circle cx="720" cy="450" r="180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <rect x="60" y="55" width="160" height="160" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Vignette */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)',
            }} />
          </div>

          {/* ── UI LAYER ── */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>

            <Wordmark visible={wordmarkVisible} />

            {/* Nav */}
            <div style={{
              position: 'absolute', top: 28, right: 24,
              display: 'flex', gap: 28,
              opacity: wordmarkVisible ? c0 : 0,
              transition: 'opacity 0.6s',
              pointerEvents: 'all',
            }}>
              {['Work','Process','Contact'].map(l => (
                <span key={l} style={{
                  fontSize: 10, letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.28)',
                  cursor: 'pointer',
                  display: 'var(--nav-display, flex)',
                }}>{l}</span>
              ))}
            </div>

            {/* ── C0: thin line ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: `${lerp(0, 100, eio(ch(progress, 0, 0.08)))}px`,
              height: '0.5px',
              background: 'rgba(255,255,255,0.22)',
              transform: 'translate(-50%, -50%)',
              opacity: 1 - eio(ch(progress, 0.09, 0.16)),
              willChange: 'width, opacity',
            }} />

            {/* ── C1: The Question ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%', maxWidth: 640, textAlign: 'center',
              pointerEvents: 'none',
            }}>
              <HSlide inT={c1in} outT={c1out} fromLeft={true}>
                <p style={EYEBROW}>A question worth asking</p>
                <h2 style={{ ...H_LARGE, fontWeight: 300, color: '#fff' }}>
                  What if your website<br />
                  <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
                    actually felt alive?
                  </em>
                </h2>
              </HSlide>
            </div>

            {/* ── C2: The Reveal ── */}
            {/*
              FIX: stagger lines previously used inline `transform` driven by c2in
              directly (not a CSS transition), so React re-renders caused flicker.
              Now each line uses its own opacity/transform via HSlide with a
              CSS transition-delay override — stable across re-renders.
            */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '92%', textAlign: 'center',
            }}>
              <div style={{
                opacity: c2in * (1 - c2out),
                willChange: 'opacity',
              }}>
                <p style={EYEBROW}>Motion-first web studio</p>
                {[
                  { text: 'We build',       w: 300, color: 'rgba(255,255,255,0.55)', delay: '0s'    },
                  { text: 'experiences',    w: 700, color: '#fff',                   delay: '0.06s' },
                  { text: 'worth feeling.', w: 300, color: 'rgba(255,255,255,0.55)', delay: '0.12s' },
                ].map(({ text, w, color, delay }, i) => (
                  <div key={i} style={{ overflow: 'hidden', lineHeight: 1.05 }}>
                    <div style={{
                      fontSize: 'clamp(38px, 6.5vw, 96px)',
                      fontWeight: w, color,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      opacity: c2in,
                      transform: `translateX(${lerp(i % 2 === 0 ? -40 : 40, 0, c2in)}px)`,
                      transition: `opacity 0.5s ${delay}, transform 0.5s ${delay}`,
                      willChange: 'transform, opacity',
                    }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── C3: Our Story ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%', maxWidth: 680, textAlign: 'center',
            }}>
              <HSlide inT={c3in} outT={c3out} fromLeft={true}>
                <p style={EYEBROW}>Our story</p>
                <h2 style={{ ...H_MED, marginBottom: 20 }}>
                  Born from a frustration<br />
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>
                    with ordinary websites.
                  </span>
                </h2>
                <p style={BODY}>
                  We started Moweb because every studio we saw was building pages —
                  not experiences. There is a difference between a website people visit
                  and one they <em style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>remember</em>.
                  We chose to build the latter.
                </p>
              </HSlide>
            </div>

            {/* ── C4: How We Change Websites ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%', maxWidth: 720, textAlign: 'center',
            }}>
              <HSlide inT={c4in} outT={c4out} fromLeft={false}>
                <p style={EYEBROW}>How we change websites</p>
                <h2 style={{ ...H_MED, marginBottom: 28 }}>
                  Motion is not decoration.
                  <br />
                  <span style={{ color: 'rgba(255,255,255,0.42)', fontWeight: 300 }}>
                    It is the message.
                  </span>
                </h2>
                <div style={{
                  display: 'flex', gap: 'clamp(16px, 3vw, 40px)',
                  justifyContent: 'center', flexWrap: 'wrap',
                }}>
                  {[
                    { num: '01', title: 'Scroll as Director', desc: 'Every pixel moves with intention. Scroll controls time.' },
                    { num: '02', title: 'Depth & Camera',     desc: 'We think in scenes. Layers. Parallax that feels physical.' },
                    { num: '03', title: 'Story Before Sales', desc: 'We write the narrative first. Design follows the emotion.' },
                  ].map(({ num, title, desc }) => (
                    <div key={num} style={{ flex: '1 1 160px', maxWidth: 200, textAlign: 'left' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)', marginBottom: 10 }}>{num}</div>
                      <div style={{ fontSize: 'clamp(12px, 1.3vw, 15px)', fontWeight: 600, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
                      <div style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', fontWeight: 300, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </HSlide>
            </div>

            {/* ── C5: World tagline ── */}
            <div style={{
              position: 'absolute', bottom: '18%', left: '50%',
              transform: 'translateX(-50%)',
              width: '88%', maxWidth: 560, textAlign: 'center',
              opacity: c5in * (1 - c5out),
              willChange: 'opacity',
            }}>
              <HSlide inT={c5in} outT={c5out} fromLeft={true}>
                <div style={{
                  fontSize: 'clamp(16px, 2.4vw, 30px)',
                  fontWeight: 300, lineHeight: 1.45,
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex', flexWrap: 'wrap',
                  justifyContent: 'center', gap: '0.22em',
                }}>
                  {['Your','website','is','your','first','impression.','Make','it','unforgettable.'].map((w, i) => (
                    <span key={i} style={{
                      color: i >= 6 ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontWeight: i >= 6 ? 500 : 300,
                      display: 'inline-block',
                      transform: `translateX(${lerp(i%2===0?-14:14, 0, eio(clamp((c5in - i*0.08)/0.6)))}px)`,
                      opacity: clamp((c5in - i*0.07)/0.5),
                      willChange: 'transform, opacity',
                    }}>{w}</span>
                  ))}
                </div>
              </HSlide>
            </div>

            {/* ── Scroll hint — C0 only ── */}
            <div style={{
              position: 'absolute', bottom: 36, left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              opacity: introGone ? Math.max(0, 1 - eio(ch(progress, 0.06, 0.18))) : 0,
              transition: 'opacity 0.6s',
              willChange: 'opacity',
            }}>
              <span style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)' }}>Scroll</span>
              <motion.div
                animate={{ y: [0, 9, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 0.5, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
              />
            </div>

          </div>{/* /ui layer */}

        </div>{/* /sticky */}
      </section>

      <style>{`
        @media (max-width: 600px) { :root { --nav-display: none; } }
        @media (min-width: 601px) { :root { --nav-display: flex; } }
      `}</style>
    </>
  )
}
