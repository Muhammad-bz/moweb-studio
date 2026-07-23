/**
 * Hero1.jsx — Discrete-Step Scroll Hero
 * Moweb Studio
 *
 * CORE MECHANIC: Each wheel/swipe = one step forward (or backward).
 * Steps: 0=intro line, 1=question, 2=reveal, 3=story, 4=how we work,
 *        5=tagline, 6=warp exit → Hero2
 *
 * Text animates in with CSS transitions (slow, cinematic).
 * Canvas dot-field + shooting stars run independently via RAF.
 * Floating: each text layer gently bobs with a sine wave.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/* ─── Math ──────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp  = (a, b, t) => a + (b - a) * t
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const sq    = t => t * t

/* ─── Dot field data ────────────────────────────────────────────── */
const BG_DOTS = Array.from({ length: 620 }, () => ({
  x:  Math.random(), y: Math.random(),
  vx: (Math.random() - 0.5) * 0.000055,
  vy: (Math.random() - 0.5) * 0.000055,
  s:  0.28 + Math.random() * 1.30,
  ph: Math.random() * Math.PI * 2,
  br: 0.55 + Math.random() * 0.45,
}))

const TOTAL_STEPS = 6   // 0–5 are content, 6 triggers warp-out
const WARP_STEP   = 6

/* ─── Float hook ────────────────────────────────────────────────── */
function useFloat(amplitude = 10, period = 4000) {
  const [y, setY] = useState(0)
  useEffect(() => {
    let raf
    const tick = ts => { setY(Math.sin((ts / period) * Math.PI * 2) * amplitude); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [amplitude, period])
  return y
}

/* ─── Canvas dot field ──────────────────────────────────────────── */
function DotField({ stepRef }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, W = 0, H = 0, DPR = 1
    const STARS = []
    const spawnStar = () => STARS.push({
      x: Math.random(), y: Math.random() * 0.75,
      len: 0.07 + Math.random() * 0.14, spd: 0.0009 + Math.random() * 0.0012,
      age: 0, life: 0.6 + Math.random() * 0.7,
      angle: Math.PI * 0.18 + (Math.random() - 0.5) * 0.35,
    })
    spawnStar(); spawnStar()
    let nextStar = 0.5 + Math.random() * 1.0

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W * DPR; canvas.height = H * DPR
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTs = 0
    let warpStartTs = -1   // timestamp when warp began; -1 = not warping
    const WARP_DURATION = 1.4  // seconds — matches the CSS opacity transition

    const draw = ts => {
      const dt = Math.min((ts - lastTs) * 0.001, 0.05); lastTs = ts
      const t  = ts * 0.001
      const step = stepRef.current ?? 0

      // Track when we first entered warp step so warpT ramps 0→1 over time
      // instead of snapping to 1 instantly (which caused an immediate black canvas).
      if (step >= WARP_STEP && warpStartTs < 0) warpStartTs = ts
      if (step < WARP_STEP) warpStartTs = -1
      const warpT = warpStartTs >= 0 ? eio(clamp((ts - warpStartTs) / 1000 / WARP_DURATION)) : 0

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.fillStyle = '#060606'
      ctx.fillRect(0, 0, W, H)

      for (const d of BG_DOTS) {
        if (warpT > 0.01) {
          const cx = W * 0.5, cy = H * 0.5
          const dx = d.x * W - cx, dy = d.y * H - cy
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

      nextStar -= dt
      if (nextStar <= 0 && warpT < 0.3) {
        spawnStar()
        if (Math.random() < 0.35) spawnStar()
        nextStar = 0.8 + Math.random() * 1.8
      }
      for (let i = STARS.length - 1; i >= 0; i--) {
        const s = STARS[i]; s.age += dt
        if (s.age >= s.life) { STARS.splice(i, 1); continue }
        const life = s.age / s.life
        const fade = life < 0.15 ? life / 0.15 : life > 0.75 ? 1 - (life - 0.75) / 0.25 : 1
        const tail = s.len * Math.min(1, life / 0.2)
        const sx = s.x * W, sy = s.y * H
        const ex = sx + Math.cos(s.angle) * tail * W, ey = sy + Math.sin(s.angle) * tail * H
        s.x += Math.cos(s.angle) * s.spd; s.y += Math.sin(s.angle) * s.spd
        const grad = ctx.createLinearGradient(sx, sy, ex, ey)
        grad.addColorStop(0, `rgba(255,255,255,0)`)
        grad.addColorStop(0.3, `rgba(255,255,255,${0.85 * fade})`)
        grad.addColorStop(1, `rgba(255,255,255,${0.22 * fade})`)
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey)
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4; ctx.stroke()
      }

      if (warpT > 0.05) {
        const cx = W * 0.5, cy = H * 0.5, rays = 60
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2
          const len   = lerp(0, Math.max(W, H) * 0.7, sq(warpT))
          const x1 = cx + Math.cos(angle) * len * 0.1, y1 = cy + Math.sin(angle) * len * 0.1
          const x2 = cx + Math.cos(angle) * len,       y2 = cy + Math.sin(angle) * len
          const g = ctx.createLinearGradient(x1, y1, x2, y2)
          g.addColorStop(0, `rgba(255,255,255,${warpT * 0.18})`); g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
          ctx.strokeStyle = g; ctx.lineWidth = 0.4; ctx.stroke()
        }
        if (warpT > 0.3) {
          ctx.fillStyle = `rgba(2,4,9,${sq((warpT - 0.3) / 0.7)})`
          ctx.fillRect(0, 0, W, H)
        }
      }

      // Nebula: visible on steps 1–4
      const nebulaOn = step >= 1 && step <= 4
      if (nebulaOn) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.4)
        const a     = 0.025 + pulse * 0.018
        const grd   = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.55)
        grd.addColorStop(0,   `rgba(100,120,255,${a})`)
        grd.addColorStop(0.5, `rgba(60,80,200,${a * 0.4})`)
        grd.addColorStop(1,   'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [stepRef])
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:0 }} />
}

/* ─── Intro overlay ─────────────────────────────────────────────── */
function IntroOverlay({ onDone }) {
  const [phase, setPhase] = useState('blink')
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fadeout'), 2000)
    const t2 = setTimeout(() => { setPhase('done'); onDone() }, 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  if (phase === 'done') return null
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100, background:'#060606',
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: phase === 'fadeout' ? 0 : 1,
      transition: phase === 'fadeout' ? 'opacity 0.9s ease-in-out' : 'none',
      pointerEvents:'none',
    }}>
      <span style={{
        fontSize:'clamp(11px,1.4vw,14px)', letterSpacing:'0.45em',
        textTransform:'uppercase', color:'rgba(255,255,255,0.55)',
        animation: phase === 'blink' ? 'mw-blink 0.9s ease-in-out infinite' : 'none',
      }}>Moweb</span>
      <style>{`@keyframes mw-blink{0%,100%{opacity:0.1}50%{opacity:0.7}}`}</style>
    </div>
  )
}

/* ─── Chapter slide component ───────────────────────────────────── */
function Chapter({ visible, fromLeft = true, floatY = 0, children }) {
  const xOut = fromLeft ? 60 : -60
  return (
    <div style={{
      position:'absolute', inset:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      pointerEvents:'none',
    }}>
      <div style={{ transform: `translateY(${floatY}px)` }}>
        <div style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateX(0px)' : `translateX(${xOut}px)`,
          transition: visible
            ? 'opacity 0.9s 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.9s 0.28s cubic-bezier(0.16,1,0.3,1)'
            : 'opacity 0.38s ease-in, transform 0.38s ease-in',
          willChange: 'transform, opacity',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Text styles ───────────────────────────────────────────────── */
const EYEBROW = {
  fontSize:10, letterSpacing:'0.32em', textTransform:'uppercase',
  color:'rgba(255,255,255,0.22)', marginBottom:20, marginTop:0,
}
const H_LARGE = { fontSize:'clamp(32px,5.5vw,78px)', letterSpacing:'-0.025em', lineHeight:1.15, margin:0 }
const H_MED   = { fontSize:'clamp(26px,4vw,60px)', fontWeight:700, letterSpacing:'-0.025em', lineHeight:1.2, color:'#fff', margin:0 }
const BODY    = {
  fontSize:'clamp(13px,1.3vw,16px)', fontWeight:300,
  color:'rgba(255,255,255,0.38)', lineHeight:1.8,
  letterSpacing:'0.01em', maxWidth:520, margin:'0 auto',
}

/* ─── Step counter indicator ────────────────────────────────────── */
function StepDots({ step }) {
  return (
    <div style={{
      position:'absolute', right:28, top:'50%', transform:'translateY(-50%)',
      display:'flex', flexDirection:'column', gap:8, zIndex:20, pointerEvents:'none',
    }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} style={{
          width:  i === step ? 2 : 1,
          height: i === step ? 22 : 8,
          borderRadius:1,
          background: i < step
            ? 'rgba(255,255,255,0.35)'
            : i === step
              ? 'rgba(255,255,255,0.85)'
              : 'rgba(255,255,255,0.08)',
          boxShadow: i === step ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        }} />
      ))}
    </div>
  )
}

/* ─── Geometry grid (appears on steps 2–4) ──────────────────────── */
function GeometryGrid({ visible }) {
  return (
    <div style={{
      position:'absolute', inset:'-6%',
      opacity: visible ? 1 : 0,
      transition:'opacity 1.2s ease',
      willChange:'opacity',
      zIndex:1,
    }}>
      <svg viewBox="0 0 1440 900" style={{ width:'100%', height:'100%' }} preserveAspectRatio="xMidYMid slice">
        {[0,1,2,3,4].map(i => (
          <line key={i} x1={-200+i*360} y1={0} x2={-200+i*360+500} y2={900}
            stroke="rgba(255,255,255,0.045)" strokeWidth="0.5" />
        ))}
        {[200,400,600,750].map((y,i) => (
          <line key={i} x1={0} y1={y} x2={1440} y2={y}
            stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        ))}
        <circle cx="720" cy="450" r="300" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
        <circle cx="720" cy="450" r="180" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
      </svg>
    </div>
  )
}

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function Hero1({ onComplete, resumeFromEnd = false, active = true }) {
  const [step, setStep]           = useState(0)
  const [introGone, setIntroGone] = useState(false)
  const stepRef                   = useRef(0)
  const lockedRef                 = useRef(false)
  // Ref (not state) so clearing it never causes a re-render race with the
  // warp transition. true = currently resumed from Hero2, block warp.
  const blockWarpRef              = useRef(false)
  const [isWarp, setIsWarp]       = useState(false)
  const onIntroDone = useCallback(() => setIntroGone(true), [])

  // Sync stepRef for canvas
  useEffect(() => { stepRef.current = step }, [step])

  // When resumeFromEnd flips true (Hero2 called onExit), snap back to step 5.
  useEffect(() => {
    if (resumeFromEnd) {
      blockWarpRef.current = true
      setIsWarp(false)
      const resumeStep = WARP_STEP - 1
      setStep(resumeStep)
      stepRef.current = resumeStep
      setIntroGone(true)
    }
  }, [resumeFromEnd])

  /* ── Scroll handler ── */
  useEffect(() => {
    let wheelAccum = 0
    const THRESH = 60

    const advance = (dir) => {
      // Always consume the event, but only act after intro
      if (!introGone) return
      // Hero2 is active — Hero1 should not respond
      if (!active) return
      if (lockedRef.current) return
      lockedRef.current = true
      setTimeout(() => { lockedRef.current = false }, 700)

      if (dir > 0) {
        // Scrolling forward: clear resume block so warp can fire
        blockWarpRef.current = false
      }

      // Compute next step eagerly so we can call setIsWarp outside the updater.
      // State updater functions must be pure — side effects inside them are
      // unreliable in React's concurrent mode and can silently drop.
      setStep(prev => {
        const next = prev + dir
        if (next < 0) return 0
        if (next > WARP_STEP) return prev
        return next
      })

      // Trigger warp AFTER computing the intended next step
      const currentStep = stepRef.current
      const nextStep = Math.max(0, Math.min(currentStep + dir, WARP_STEP))
      if (nextStep === WARP_STEP && !blockWarpRef.current) {
        setIsWarp(true)
      }
    }

    const onWheel = (e) => {
      // Always preventDefault to stop browser scroll accumulation during intro
      e.preventDefault()
      wheelAccum += e.deltaY
      if (Math.abs(wheelAccum) >= THRESH) {
        advance(wheelAccum > 0 ? 1 : -1)
        wheelAccum = 0
      }
    }

    let touchStartY = 0
    const onTouchStart = e => { touchStartY = e.touches[0].clientY }
    const onTouchEnd   = e => {
      const dy = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(dy) > 40) advance(dy > 0 ? 1 : -1)
    }

    const onKey = e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') advance(1)
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  advance(-1)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  // Re-register when introGone or active changes
  }, [introGone, active])

  // Float offsets
  const floatA = useFloat(8,  4200)
  const floatB = useFloat(10, 5100)
  const floatC = useFloat(7,  3700)
  const floatD = useFloat(9,  4800)
  const floatE = useFloat(6,  3200)

  return (
    <>
      {/* Skip intro when returning from Hero2 */}
      {!resumeFromEnd && !introGone && <IntroOverlay onDone={onIntroDone} />}

      <div
        onTransitionEnd={isWarp ? (e) => { if (e.propertyName === 'opacity') onComplete?.() } : undefined}
        style={{
          position:'fixed', inset:0, zIndex:2,
          opacity: isWarp ? 0 : 1,
          transition: isWarp ? 'opacity 1.4s ease-in' : 'none',
          pointerEvents: isWarp ? 'none' : 'auto',
        }}
      >
        <DotField stepRef={stepRef} />
        <GeometryGrid visible={step >= 2 && step <= 4} />

        {/* Vignette */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:2,
          background:'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* Step 0: thin opening line */}
        <div style={{
          position:'absolute', top:'50%', left:'50%', zIndex:3,
          width: step === 0 ? 100 : 0, height:'0.5px',
          background:'rgba(255,255,255,0.22)',
          transform:'translate(-50%, -50%)',
          transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)',
          opacity: step === 0 ? 1 : 0,
        }} />

        {/* Step 1: The Question */}
        <div style={{ position:'absolute', inset:0, zIndex:4 }}>
          <Chapter visible={step === 1} fromLeft={true} floatY={floatA}>
            <div style={{ width:'min(90vw,640px)', textAlign:'center' }}>
              <p style={EYEBROW}>A question worth asking</p>
              <h2 style={{ ...H_LARGE, fontWeight:300, color:'#fff' }}>
                What if your website<br />
                <em style={{ fontStyle:'italic', color:'rgba(255,255,255,0.45)' }}>actually felt alive?</em>
              </h2>
            </div>
          </Chapter>
        </div>

        {/* Step 2: The Reveal */}
        <div style={{ position:'absolute', inset:0, zIndex:4 }}>
          <Chapter visible={step === 2} fromLeft={false} floatY={floatB}>
            <div style={{ width:'min(92vw,820px)', textAlign:'center' }}>
              <p style={EYEBROW}>Motion-first web studio</p>
              <div>
                {[
                  { text:'We build',       w:300, color:'rgba(255,255,255,0.55)' },
                  { text:'experiences',    w:700, color:'#fff' },
                  { text:'worth feeling.', w:300, color:'rgba(255,255,255,0.55)' },
                ].map(({ text, w, color }, i) => (
                  <div key={i} style={{
                    fontSize:'clamp(38px,6.5vw,96px)',
                    fontWeight:w, color,
                    letterSpacing:'-0.03em', lineHeight:1.1,
                    opacity: step === 2 ? 1 : 0,
                    transform: step === 2 ? 'translateX(0)' : `translateX(${i%2===0?-30:30}px)`,
                    transition: `opacity 0.9s ${i*0.1}s cubic-bezier(0.16,1,0.3,1), transform 0.9s ${i*0.1}s cubic-bezier(0.16,1,0.3,1)`,
                    willChange:'transform, opacity',
                  }}>{text}</div>
                ))}
              </div>
            </div>
          </Chapter>
        </div>

        {/* Step 3: Our Story */}
        <div style={{ position:'absolute', inset:0, zIndex:4 }}>
          <Chapter visible={step === 3} fromLeft={true} floatY={floatC}>
            <div style={{ width:'min(90vw,680px)', textAlign:'center' }}>
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
            </div>
          </Chapter>
        </div>

        {/* Step 4: How We Change Websites */}
        <div style={{ position:'absolute', inset:0, zIndex:4 }}>
          <Chapter visible={step === 4} fromLeft={false} floatY={floatD}>
            <div style={{ width:'min(90vw,720px)', textAlign:'center' }}>
              <p style={EYEBROW}>How we change websites</p>
              <h2 style={{ ...H_MED, marginBottom:28 }}>
                Motion is not decoration.<br />
                <span style={{ color:'rgba(255,255,255,0.42)', fontWeight:300 }}>It is the message.</span>
              </h2>
              <div style={{ display:'flex', gap:'clamp(16px,3vw,48px)', justifyContent:'center', flexWrap:'wrap', marginTop:8 }}>
                {[
                  { num:'01', title:'Scroll as Director', desc:'Every pixel moves with intention. Scroll controls time.' },
                  { num:'02', title:'Depth & Camera',     desc:'We think in scenes. Layers. Parallax that feels physical.' },
                  { num:'03', title:'Story Before Sales', desc:'We write the narrative first. Design follows the emotion.' },
                ].map(({ num, title, desc }, i) => (
                  <div key={num} style={{
                    flex:'1 1 160px', maxWidth:200, textAlign:'left',
                    opacity: step === 4 ? 1 : 0,
                    transform: step === 4 ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.9s ${0.15 + i*0.12}s cubic-bezier(0.16,1,0.3,1), transform 0.9s ${0.15 + i*0.12}s cubic-bezier(0.16,1,0.3,1)`,
                  }}>
                    <div style={{ fontSize:9, letterSpacing:'0.3em', color:'rgba(255,255,255,0.2)', marginBottom:10 }}>{num}</div>
                    <div style={{ fontSize:'clamp(12px,1.3vw,15px)', fontWeight:600, color:'#fff', marginBottom:8 }}>{title}</div>
                    <div style={{ fontSize:'clamp(11px,1.1vw,13px)', fontWeight:300, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Chapter>
        </div>

        {/* Step 5: World tagline */}
        <div style={{ position:'absolute', inset:0, zIndex:4, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:'18vh' }}>
          <div style={{
            width:'min(88vw,560px)', textAlign:'center',
            opacity: step === 5 ? 1 : 0,
            transform: `translateY(${step === 5 ? floatE : 20}px)`,
            transition:'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
            willChange:'opacity, transform',
          }}>
            <div style={{
              fontSize:'clamp(16px,2.4vw,30px)', fontWeight:300, lineHeight:1.45,
              color:'rgba(255,255,255,0.6)',
              display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'0.22em',
            }}>
              {['Your','website','is','your','first','impression.','Make','it','unforgettable.'].map((w, i) => (
                <span key={i} style={{
                  color: i >= 6 ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: i >= 6 ? 500 : 300,
                  display:'inline-block',
                  opacity: step === 5 ? 1 : 0,
                  transform: step === 5 ? 'translateX(0)' : `translateX(${i%2===0?-12:12}px)`,
                  transition: `opacity 0.8s ${i*0.06}s cubic-bezier(0.16,1,0.3,1), transform 0.8s ${i*0.06}s cubic-bezier(0.16,1,0.3,1)`,
                  willChange:'transform, opacity',
                }}>{w}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint — step 0 only */}
        <div style={{
          position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          opacity: introGone && step === 0 ? 1 : 0,
          transition:'opacity 0.8s',
          pointerEvents:'none', zIndex:20,
        }}>
          <span style={{ fontSize:8, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.16)' }}>Scroll</span>
          <motion.div
            animate={{ y:[0,9,0] }}
            transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
            style={{ width:0.5, height:40, background:'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
          />
        </div>

        {/* Step counter dots */}
        {introGone && <StepDots step={step} />}
      </div>

      {/* Spacer so page has height for Hero2 to sit below */}
      <div style={{ height: '100vh' }} />
    </>
  )
}
