/**
 * Hero.jsx — Scroll-Timeline Experience v2
 * Moweb Studio
 *
 * Changes from v1:
 *   • Intro overlay: "SCROLL" blinks in centre, fades, then experience begins
 *   • All chapter entrances are HORIZONTAL (translateX) not vertical
 *   • Motion rays background (Windows-style) animating with scroll
 *   • Extra chapters: Our Story, How We Change Websites
 *   • Removed ChapterDots sidebar
 *   • Fixed ch4/ch5 overlap — tagline fade-out starts later
 *   • Fully responsive: nav collapses on mobile, font sizes fluid
 *   • 700vh scroll space for 7 chapters
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Math helpers ────────────────────────────────────────────── */
const clamp   = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp    = (a, b, t) => a + (b - a) * t
const chapter = (p, s, e) => clamp((p - s) / (e - s))
const eio     = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const eout    = t => 1 - Math.pow(1-t, 3)

/* ─── Scroll progress ─────────────────────────────────────────── */
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

/* ─── Motion Rays (Windows-style) ────────────────────────────── */
function MotionRays({ progress }) {
  const rays = [
    { angle: -28, x: '18%',  w: '55vw', delay: 0    },
    { angle: -22, x: '10%',  w: '40vw', delay: 0.06 },
    { angle: -35, x: '30%',  w: '70vw', delay: 0.12 },
    { angle: -18, x: '5%',   w: '30vw', delay: 0.18 },
    { angle: -40, x: '45%',  w: '50vw', delay: 0.03 },
    { angle: -15, x: '60%',  w: '38vw', delay: 0.09 },
    { angle: -30, x: '72%',  w: '28vw', delay: 0.15 },
    { angle: -25, x: '55%',  w: '60vw', delay: 0.21 },
  ]

  // Rays brighten through chapters 2-5, then dim
  const raysOpacity = (() => {
    const fadeIn  = eio(chapter(progress, 0.10, 0.28))
    const fadeOut = eio(chapter(progress, 0.82, 0.96))
    return fadeIn * (1 - fadeOut)
  })()

  // Rays shift horizontally with scroll — the "motion" feeling
  const raysShift = lerp(-6, 8, progress) // vw

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      opacity: raysOpacity,
      willChange: 'opacity',
    }}>
      {rays.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: '-20%',
          left: r.x,
          width: r.w,
          height: '160%',
          background: `linear-gradient(to top, rgba(255,255,255,${0.045 - i * 0.003}) 0%, transparent 70%)`,
          transform: `rotate(${r.angle}deg) translateX(${raysShift + i * 0.8}vw)`,
          transformOrigin: 'bottom left',
          willChange: 'transform',
          transition: 'none',
        }} />
      ))}
      {/* Central bright ray */}
      <div style={{
        position: 'absolute', bottom: '-10%', left: '35%',
        width: '30vw', height: '140%',
        background: 'linear-gradient(to top, rgba(255,255,255,0.07) 0%, transparent 60%)',
        transform: `rotate(-27deg) translateX(${raysShift * 1.4}vw)`,
        transformOrigin: 'bottom left',
        willChange: 'transform',
      }} />
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
  const [phase, setPhase] = useState('blink') // blink → fadeout → done

  useEffect(() => {
    // blink for 2.2s, then fade out over 0.8s
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
      <style>{`
        @keyframes mw-blink {
          0%, 100% { opacity: 0.1; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

/* ─── MAIN ────────────────────────────────────────────────────── */
export default function Hero() {
  const containerRef = useRef(null)
  const progress     = useScrollProgress(containerRef)
  const [introGone, setIntroGone] = useState(false)
  const onIntroDone = useCallback(() => setIntroGone(true), [])

  // ── Chapter slices (7 chapters across 0-1) ──
  // C0 Silence      0.00 – 0.12
  // C1 Question     0.10 – 0.26
  // C2 Reveal       0.24 – 0.42
  // C3 Our Story    0.40 – 0.56
  // C4 How We Work  0.54 – 0.70
  // C5 World        0.68 – 0.82
  // C6 Invitation   0.80 – 1.00

  const c0    = chapter(progress, 0.00, 0.12)
  const c1in  = eio(chapter(progress, 0.10, 0.22))
  const c1out = eio(chapter(progress, 0.22, 0.30))
  const c2in  = eio(chapter(progress, 0.24, 0.38))
  const c2out = eio(chapter(progress, 0.38, 0.46))
  const c3in  = eio(chapter(progress, 0.40, 0.52))
  const c3out = eio(chapter(progress, 0.52, 0.60))
  const c4in  = eio(chapter(progress, 0.54, 0.66))
  const c4out = eio(chapter(progress, 0.66, 0.74))
  const c5in  = eio(chapter(progress, 0.68, 0.78))
  const c5out = eio(chapter(progress, 0.78, 0.86))
  const c6in  = eio(chapter(progress, 0.80, 0.92))

  // Camera
  const camScale = lerp(1, 1.14, chapter(progress, 0.30, 1.0))
  const camTiltX = lerp(0, -1.5, chapter(progress, 0.40, 0.85))

  // BG parallax
  const bgY = lerp(0, -10, progress)

  // Geometry grid
  const gridOp    = eio(chapter(progress, 0.38, 0.55)) * (1 - eio(chapter(progress, 0.78, 0.90)))
  const gridScale = lerp(0.90, 1.06, chapter(progress, 0.38, 0.70))

  // Wordmark visible after intro
  const wordmarkVisible = introGone && progress < 0.96

  return (
    <>
      <IntroOverlay onDone={onIntroDone} />

      <section
        ref={containerRef}
        style={{ height: '700vh', position: 'relative' }}
      >
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden', background: '#060606',
        }}>

          {/* ── CAMERA ── */}
          <div style={{
            position: 'absolute', inset: '-6%',
            transformOrigin: '50% 52%',
            transform: `scale(${camScale}) rotateX(${camTiltX}deg)`,
            willChange: 'transform',
          }}>

            {/* Deep BG */}
            <div style={{
              position: 'absolute', inset: 0,
              transform: `translateY(${bgY}%)`,
              willChange: 'transform',
              background: `
                radial-gradient(ellipse 110% 80% at 20% 95%, rgba(255,255,255,0.04) 0%, transparent 55%),
                radial-gradient(ellipse 80%  60% at 80% 15%, rgba(255,255,255,0.03) 0%, transparent 55%),
                #060606
              `,
            }} />

            {/* Motion Rays */}
            <MotionRays progress={progress} />

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
              background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 30%, rgba(0,0,0,0.78) 100%)',
            }} />
          </div>

          {/* ── UI LAYER ── */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

            {/* Wordmark */}
            <Wordmark visible={wordmarkVisible} />

            {/* Nav — desktop only, hidden on mobile */}
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
                  // hide on very small screens
                  display: 'var(--nav-display, flex)',
                }}>
                  {l}
                </span>
              ))}
            </div>

            {/* ── C0: Silence — thin line ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: `${lerp(0, 100, eio(chapter(progress, 0, 0.08)))}px`,
              height: '0.5px',
              background: 'rgba(255,255,255,0.22)',
              transform: 'translate(-50%, -50%)',
              opacity: 1 - eio(chapter(progress, 0.09, 0.16)),
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
                <h2 style={{
                  ...H_LARGE,
                  fontWeight: 300,
                  color: '#fff',
                }}>
                  What if your website<br />
                  <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
                    actually felt alive?
                  </em>
                </h2>
              </HSlide>
            </div>

            {/* ── C2: The Reveal — main headline ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '92%', textAlign: 'center',
            }}>
              <HSlide inT={c2in} outT={c2out} fromLeft={false}>
                <p style={EYEBROW}>Motion-first web studio</p>
                {[
                  { text: 'We build',       w: 300, color: 'rgba(255,255,255,0.55)' },
                  { text: 'experiences',    w: 700, color: '#fff'                   },
                  { text: 'worth feeling.', w: 300, color: 'rgba(255,255,255,0.55)' },
                ].map(({ text, w, color }, i) => (
                  <div key={i} style={{ overflow: 'hidden', lineHeight: 1.05 }}>
                    <div style={{
                      fontSize: 'clamp(38px, 6.5vw, 96px)',
                      fontWeight: w, color,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      transform: `translateX(${lerp(i%2===0?-40:40, 0, c2in)}px)`,
                      opacity: c2in,
                      willChange: 'transform, opacity',
                      // stagger via transition-delay trick — use inline transition
                      transitionDelay: `${i*0.06}s`,
                    }}>{text}</div>
                  </div>
                ))}
              </HSlide>
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
                {/* Three pillars */}
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

            {/* ── C5: The World — tagline ── */}
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

            {/* ── C6: Invitation ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', width: '90%',
            }}>
              <HSlide inT={c6in} fromLeft={false}>
                <p style={EYEBROW}>Ready when you are</p>
                <h3 style={{
                  fontSize: 'clamp(40px, 7vw, 100px)',
                  fontWeight: 700, letterSpacing: '-0.03em',
                  color: '#fff', margin: '0 0 14px', lineHeight: 1,
                }}>Let's begin.</h3>
                <p style={{
                  fontSize: 'clamp(13px, 1.4vw, 17px)',
                  fontWeight: 300, color: 'rgba(255,255,255,0.32)',
                  letterSpacing: '0.02em', margin: '0 0 44px',
                }}>
                  One studio. Precise motion. Zero compromise.
                </p>
                <div style={{
                  display: 'flex', gap: 14, justifyContent: 'center',
                  alignItems: 'center', flexWrap: 'wrap',
                  pointerEvents: 'all',
                }}>
                  <CTAButton primary>Start a Project</CTAButton>
                  <CTAButton>View Work ↗</CTAButton>
                </div>
              </HSlide>
            </div>

            {/* ── Contact strip — C6 ── */}
            <div style={{
              position: 'absolute', bottom: 28, left: '50%',
              transform: `translateX(-50%) translateX(${lerp(40, 0, c6in)}px)`,
              display: 'flex', gap: 'clamp(16px, 4vw, 44px)',
              opacity: c6in * 0.65, whiteSpace: 'nowrap',
              willChange: 'transform, opacity',
              pointerEvents: 'all',
            }}>
              {[
                { label: 'Instagram', value: '@themowebstudio' },
                { label: 'WhatsApp',  value: '+92 312 4919510' },
                { label: 'Email',     value: 'themowebstudio@gmail.com' },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── Scroll hint — C0 only ── */}
            <div style={{
              position: 'absolute', bottom: 36, left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              opacity: introGone ? Math.max(0, 1 - eio(chapter(progress, 0.06, 0.18))) : 0,
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

      {/* Global responsive overrides */}
      <style>{`
        @media (max-width: 600px) {
          :root { --nav-display: none; }
        }
        @media (min-width: 601px) {
          :root { --nav-display: flex; }
        }
      `}</style>
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

/* ─── CTA Button ──────────────────────────────────────────────── */
function CTAButton({ children, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: 'clamp(12px, 1.5vw, 15px) clamp(24px, 3vw, 40px)',
        border: primary ? '1px solid rgba(255,255,255,0.65)' : 'none',
        borderRadius: 1,
        background: primary ? (hov ? '#fff' : 'transparent') : 'none',
        color: primary ? (hov ? '#000' : '#fff') : (hov ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.32)'),
        fontSize: 'clamp(10px, 1vw, 12px)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontWeight: 500,
        transition: 'background 0.22s, color 0.22s',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      {children}
    </button>
  )
}
