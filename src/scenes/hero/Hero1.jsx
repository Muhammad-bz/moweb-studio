/**
 * Hero1.jsx — Scroll-Timeline Story Hero
 * Moweb Studio
 *
 * • Nav removed — now in Navbar.jsx
 * • Dot field background (matches Hero2)
 * • 1100vh scroll space
 * • NEW effects:
 *     – Shooting stars: random streaks fire across the field every few seconds
 *     – Nebula pulse: faint radial colour breath synced to scroll chapters
 *     – Grid depth: geometry lines ripple scale on chapter enter
 *     – Warp exit: last 12% of scroll — dots rush toward center (zoom-into-space),
 *       screen fades to black, seamlessly merging into Hero2's black canvas
 * • Text glitch fix: C2 stagger uses CSS transition-delay, not raw inline style
 * • Hover fix: CTAButton uses CSS class, no onMouseEnter state
 * • Wordmark removed — shared Navbar handles it
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/* ─── Math ──────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp  = (a, b, t) => a + (b - a) * t
const ch    = (p, s, e) => clamp((p - s) / (e - s))
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const eout  = t => 1 - Math.pow(1-t, 3)
const sq    = t => t * t

/* ─── Static dot data ───────────────────────────────────────────── */
const BG_DOTS = Array.from({ length: 620 }, () => ({
  x:  Math.random(),
  y:  Math.random(),
  vx: (Math.random() - 0.5) * 0.000055,
  vy: (Math.random() - 0.5) * 0.000055,
  s:  0.28 + Math.random() * 1.30,   // larger dots
  ph: Math.random() * Math.PI * 2,
  br: 0.55 + Math.random() * 0.45,   // all dots noticeably brighter
}))

/* ─── Shared canvas background ──────────────────────────────────── */
function DotField({ progressRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let W = 0, H = 0, DPR = 1

    // Shooting stars pool
    const STARS = []
    const spawnStar = () => {
      STARS.push({
        x:   Math.random(),
        y:   Math.random() * 0.75,
        len: 0.07 + Math.random() * 0.14,   // longer tails
        spd: 0.0009 + Math.random() * 0.0012, // faster
        age: 0,
        life: 0.6 + Math.random() * 0.7,
        angle: Math.PI * 0.18 + (Math.random() - 0.5) * 0.35,
      })
    }
    // spawn 2 stars immediately so field isn't empty at start
    spawnStar(); spawnStar()
    let nextStar = 0.4 + Math.random() * 1.0

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W   = window.innerWidth
      H   = window.innerHeight
      canvas.width  = W * DPR
      canvas.height = H * DPR
      canvas.style.width  = W + 'px'
      canvas.style.height = H + 'px'
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTs = 0
    const draw = (ts) => {
      const dt = Math.min((ts - lastTs) * 0.001, 0.05)
      lastTs = ts
      const t = ts * 0.001
      const p = progressRef.current ?? 0

      // Warp factor: last 12% → stars rush to centre
      const warpT = eio(ch(p, 0.88, 1.0))

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.fillStyle = '#060606'
      ctx.fillRect(0, 0, W, H)

      // ── Background dots ──
      for (const d of BG_DOTS) {
        if (warpT > 0.01) {
          // rush toward centre
          const cx = W * 0.5
          const cy = H * 0.5
          const dx = d.x * W - cx
          const dy = d.y * H - cy
          const spd = warpT * warpT * 0.025
          d.x = ((d.x * W + dx * spd) / W + 1) % 1
          d.y = ((d.y * H + dy * spd) / H + 1) % 1
        } else {
          d.x = (d.x + d.vx + 1) % 1
          d.y = (d.y + d.vy + 1) % 1
        }
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.85 + d.ph)
        const alpha   = (0.10 + twinkle * 0.22) * d.br * (1 - warpT * 0.6)
        ctx.beginPath()
        ctx.arc(d.x * W, d.y * H, d.s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }

      // ── Shooting stars ──
      nextStar -= dt
      if (nextStar <= 0 && warpT < 0.3) {
        spawnStar()
        // occasionally fire a second one right behind
        if (Math.random() < 0.35) spawnStar()
        nextStar = 0.8 + Math.random() * 1.8
      }
      for (let i = STARS.length - 1; i >= 0; i--) {
        const s = STARS[i]
        s.age += dt
        if (s.age >= s.life) { STARS.splice(i, 1); continue }
        const life = s.age / s.life
        const fade = life < 0.15 ? life / 0.15 : life > 0.75 ? 1 - (life - 0.75) / 0.25 : 1
        const tail = s.len * Math.min(1, life / 0.2)
        const sx = s.x * W
        const sy = s.y * H
        const ex = sx + Math.cos(s.angle) * tail * W
        const ey = sy + Math.sin(s.angle) * tail * H
        s.x += Math.cos(s.angle) * s.spd
        s.y += Math.sin(s.angle) * s.spd
        const grad = ctx.createLinearGradient(sx, sy, ex, ey)
        grad.addColorStop(0, `rgba(255,255,255,0)`)
        grad.addColorStop(0.3, `rgba(255,255,255,${0.85 * fade})`)
        grad.addColorStop(1,   `rgba(255,255,255,${0.22 * fade})`)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.strokeStyle = grad
        ctx.lineWidth   = 1.4
        ctx.stroke()
      }

      // ── Warp radial rush lines ──
      if (warpT > 0.05) {
        const cx   = W * 0.5
        const cy   = H * 0.5
        const rays = 60
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2
          const len   = lerp(0, Math.max(W, H) * 0.7, sq(warpT))
          const x1    = cx + Math.cos(angle) * len * 0.1
          const y1    = cy + Math.sin(angle) * len * 0.1
          const x2    = cx + Math.cos(angle) * len
          const y2    = cy + Math.sin(angle) * len
          const g     = ctx.createLinearGradient(x1, y1, x2, y2)
          g.addColorStop(0,   `rgba(255,255,255,${warpT * 0.18})`)
          g.addColorStop(1,   'rgba(255,255,255,0)')
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.strokeStyle = g
          ctx.lineWidth   = 0.4
          ctx.stroke()
        }
      }

      // ── Nebula colour breath (chapter-based) ──
      const nebulaT = eio(ch(p, 0.08, 0.45)) * (1 - eio(ch(p, 0.78, 0.90)))
      if (nebulaT > 0.01) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.4)
        const a     = nebulaT * (0.025 + pulse * 0.018)
        const grd   = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.55)
        grd.addColorStop(0,   `rgba(100,120,255,${a})`)
        grd.addColorStop(0.5, `rgba(60,80,200,${a * 0.4})`)
        grd.addColorStop(1,   'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
      }

      // ── Warp fade-to-black overlay ──
      if (warpT > 0.3) {
        ctx.fillStyle = `rgba(2,4,9,${sq((warpT - 0.3) / 0.7)})`
        ctx.fillRect(0, 0, W, H)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [progressRef])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
}

/* ─── Scroll progress ───────────────────────────────────────────── */
function useScrollProgress(ref) {
  const [p, setP]    = useState(0)
  const progressRef  = useRef(0)

  useEffect(() => {
    const fn = () => {
      const el = ref.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const val = clamp(-top / (height - window.innerHeight))
      progressRef.current = val
      setP(val)
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [ref])

  return { progress: p, progressRef }
}

/* ─── Horizontal slide wrapper ──────────────────────────────────── */
function HSlide({ inT, outT = 0, fromLeft = true, children, style = {} }) {
  const xIn  = fromLeft ? -80 : 80
  const xOut = fromLeft ? 80 : -80
  const x    = inT < 1 ? lerp(xIn, 0, eio(inT)) : outT > 0 ? lerp(0, xOut, eio(outT)) : 0
  const op   = inT < 1 ? eio(inT) : outT > 0 ? 1 - eio(outT) : 1
  return (
    <div style={{ transform: `translateX(${x}px)`, opacity: op, willChange: 'transform, opacity', ...style }}>
      {children}
    </div>
  )
}

/* ─── Intro overlay ─────────────────────────────────────────────── */
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
        fontSize: 'clamp(11px,1.4vw,14px)', letterSpacing: '0.45em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
        animation: phase === 'blink' ? 'mw-blink 0.9s ease-in-out infinite' : 'none',
        opacity: phase === 'blink' ? undefined : 0,
      }}>Scroll</span>
      <style>{`@keyframes mw-blink{0%,100%{opacity:0.1}50%{opacity:0.7}}`}</style>
    </div>
  )
}

/* ─── Text styles ───────────────────────────────────────────────── */
const EYEBROW = { fontSize:10, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.22)', marginBottom:20, marginTop:0 }
const H_LARGE = { fontSize:'clamp(32px,5.5vw,76px)', letterSpacing:'-0.025em', lineHeight:1.15, margin:0 }
const H_MED   = { fontSize:'clamp(26px,4vw,58px)', fontWeight:700, letterSpacing:'-0.025em', lineHeight:1.2, color:'#fff', margin:0 }
const BODY    = { fontSize:'clamp(13px,1.3vw,16px)', fontWeight:300, color:'rgba(255,255,255,0.38)', lineHeight:1.8, letterSpacing:'0.01em', maxWidth:520, margin:'0 auto' }

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function Hero1() {
  const containerRef             = useRef(null)
  const { progress, progressRef } = useScrollProgress(containerRef)
  const [introGone, setIntroGone] = useState(false)
  const onIntroDone = useCallback(() => setIntroGone(true), [])

  /*
    Chapter map (1100vh)
    C0  0.00–0.10   silence / line
    C1  0.08–0.24   question
    C2  0.22–0.40   reveal headline
    C3  0.38–0.55   our story
    C4  0.53–0.70   how we work
    C5  0.68–0.85   world tagline
    WARP 0.88–1.00  warp-to-space (canvas handles it)
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

  // Camera
  const camScale = lerp(1, 1.10, ch(progress, 0.30, 1.0))
  const camTiltX = lerp(0, -1.5, ch(progress, 0.40, 0.85))

  // Geometry grid
  const gridOp    = eio(ch(progress, 0.38, 0.55)) * (1 - eio(ch(progress, 0.78, 0.90)))
  const gridScale = lerp(0.90, 1.06, ch(progress, 0.38, 0.70))

  // Warp — UI fades out
  const warpT  = eio(ch(progress, 0.88, 1.0))
  const uiAlpha = 1 - warpT

  return (
    <>
      <IntroOverlay onDone={onIntroDone} />

      <section ref={containerRef} style={{ height: '1100vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

          {/* Animated dot field + shooting stars + warp */}
          <DotField progressRef={progressRef} />

          {/* Camera layer */}
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
              opacity: gridOp * (1 - warpT),
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

          {/* UI Layer */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
            opacity: uiAlpha, willChange: 'opacity',
          }}>

            {/* C0: thin line */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: `${lerp(0, 100, eio(ch(progress, 0, 0.08)))}px`,
              height: '0.5px',
              background: 'rgba(255,255,255,0.22)',
              transform: 'translate(-50%, -50%)',
              opacity: 1 - eio(ch(progress, 0.09, 0.16)),
            }} />

            {/* C1: The Question */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'90%', maxWidth:640, textAlign:'center' }}>
              <HSlide inT={c1in} outT={c1out} fromLeft={true}>
                <p style={EYEBROW}>A question worth asking</p>
                <h2 style={{ ...H_LARGE, fontWeight:300, color:'#fff' }}>
                  What if your website<br />
                  <em style={{ fontStyle:'italic', color:'rgba(255,255,255,0.45)' }}>actually felt alive?</em>
                </h2>
              </HSlide>
            </div>

            {/* C2: The Reveal */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'92%', textAlign:'center' }}>
              <div style={{ opacity: c2in * (1 - c2out), willChange:'opacity' }}>
                <p style={EYEBROW}>Motion-first web studio</p>
                {[
                  { text:'We build',       w:300, color:'rgba(255,255,255,0.55)', delay:'0s'    },
                  { text:'experiences',    w:700, color:'#fff',                   delay:'0.06s' },
                  { text:'worth feeling.', w:300, color:'rgba(255,255,255,0.55)', delay:'0.12s' },
                ].map(({ text, w, color, delay }, i) => (
                  <div key={i} style={{ overflow:'hidden', lineHeight:1.05 }}>
                    <div style={{
                      fontSize:'clamp(38px,6.5vw,96px)',
                      fontWeight:w, color,
                      letterSpacing:'-0.03em', lineHeight:1.1,
                      opacity: c2in,
                      transform:`translateX(${lerp(i%2===0?-40:40,0,c2in)}px)`,
                      transition:`opacity 0.5s ${delay}, transform 0.5s ${delay}`,
                      willChange:'transform, opacity',
                    }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* C3: Our Story */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'90%', maxWidth:680, textAlign:'center' }}>
              <HSlide inT={c3in} outT={c3out} fromLeft={true}>
                <p style={EYEBROW}>Our story</p>
                <h2 style={{ ...H_MED, marginBottom:20 }}>
                  Born from a frustration<br />
                  <span style={{ color:'rgba(255,255,255,0.45)', fontWeight:300 }}>with ordinary websites.</span>
                </h2>
                <p style={BODY}>
                  We started Moweb because every studio we saw was building pages —
                  not experiences. There is a difference between a website people visit
                  and one they <em style={{ color:'rgba(255,255,255,0.7)', fontStyle:'italic' }}>remember</em>.
                  We chose to build the latter.
                </p>
              </HSlide>
            </div>

            {/* C4: How We Change Websites */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'90%', maxWidth:720, textAlign:'center' }}>
              <HSlide inT={c4in} outT={c4out} fromLeft={false}>
                <p style={EYEBROW}>How we change websites</p>
                <h2 style={{ ...H_MED, marginBottom:28 }}>
                  Motion is not decoration.<br />
                  <span style={{ color:'rgba(255,255,255,0.42)', fontWeight:300 }}>It is the message.</span>
                </h2>
                <div style={{ display:'flex', gap:'clamp(16px,3vw,40px)', justifyContent:'center', flexWrap:'wrap' }}>
                  {[
                    { num:'01', title:'Scroll as Director', desc:'Every pixel moves with intention. Scroll controls time.' },
                    { num:'02', title:'Depth & Camera',     desc:'We think in scenes. Layers. Parallax that feels physical.' },
                    { num:'03', title:'Story Before Sales', desc:'We write the narrative first. Design follows the emotion.' },
                  ].map(({ num, title, desc }) => (
                    <div key={num} style={{ flex:'1 1 160px', maxWidth:200, textAlign:'left' }}>
                      <div style={{ fontSize:9, letterSpacing:'0.3em', color:'rgba(255,255,255,0.2)', marginBottom:10 }}>{num}</div>
                      <div style={{ fontSize:'clamp(12px,1.3vw,15px)', fontWeight:600, color:'#fff', marginBottom:8 }}>{title}</div>
                      <div style={{ fontSize:'clamp(11px,1.1vw,13px)', fontWeight:300, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </HSlide>
            </div>

            {/* C5: World tagline */}
            <div style={{
              position:'absolute', bottom:'18%', left:'50%',
              transform:'translateX(-50%)',
              width:'88%', maxWidth:560, textAlign:'center',
              opacity: c5in * (1 - c5out), willChange:'opacity',
            }}>
              <HSlide inT={c5in} outT={c5out} fromLeft={true}>
                <div style={{
                  fontSize:'clamp(16px,2.4vw,30px)',
                  fontWeight:300, lineHeight:1.45,
                  color:'rgba(255,255,255,0.6)',
                  display:'flex', flexWrap:'wrap',
                  justifyContent:'center', gap:'0.22em',
                }}>
                  {['Your','website','is','your','first','impression.','Make','it','unforgettable.'].map((w, i) => (
                    <span key={i} style={{
                      color: i >= 6 ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontWeight: i >= 6 ? 500 : 300,
                      display:'inline-block',
                      transform:`translateX(${lerp(i%2===0?-14:14, 0, eio(clamp((c5in - i*0.08)/0.6)))}px)`,
                      opacity: clamp((c5in - i*0.07)/0.5),
                      willChange:'transform, opacity',
                    }}>{w}</span>
                  ))}
                </div>
              </HSlide>
            </div>

            {/* Scroll hint */}
            <div style={{
              position:'absolute', bottom:36, left:'50%',
              transform:'translateX(-50%)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              opacity: introGone ? Math.max(0, 1 - eio(ch(progress, 0.06, 0.18))) : 0,
              transition:'opacity 0.6s',
            }}>
              <span style={{ fontSize:8, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.16)' }}>Scroll</span>
              <motion.div
                animate={{ y:[0,9,0] }}
                transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:0.5, height:40, background:'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
              />
            </div>

          </div>{/* /ui */}

        </div>{/* /sticky */}
      </section>
    </>
  )
}
