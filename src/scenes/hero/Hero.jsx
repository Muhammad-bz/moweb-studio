/**
 * Hero.jsx — Unified Hero (Hero1 + Hero2 merged)
 * Moweb Studio
 *
 * Step map
 *   0        intro line
 *   1        the question
 *   2        the reveal
 *   3        our story
 *   4        how we work
 *   5        tagline
 *   6        warp crossfade  ← single canvas morphs dot-field → sphere grid
 *   7        sphere overview  (all 4 orbs in grid)
 *   8–9      orb 0 zoom-in / zoom-out
 *   10–11    orb 1 zoom-in / zoom-out
 *   12–13    orb 2 zoom-in / zoom-out
 *   14–15    orb 3 zoom-in (CTA) / zoom-out
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/* ─── Math ──────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp  = (a, b, t) => a + (b - a) * t
const eio   = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
const eout  = t => 1 - Math.pow(1 - t, 3)
const sq    = t => t * t

/* ─── Step constants ────────────────────────────────────────────── */
const WARP_STEP    = 6   // the crossfade step
const SPHERE_START = 7   // first sphere step
const TOTAL_STEPS  = 15  // 0..15, 15 = end

/* ─── Hero1 dot-field data ──────────────────────────────────────── */
const BG_DOTS_H1 = Array.from({ length: 620 }, () => ({
  x:  Math.random(), y: Math.random(),
  vx: (Math.random() - 0.5) * 0.000055,
  vy: (Math.random() - 0.5) * 0.000055,
  s:  0.28 + Math.random() * 1.30,
  ph: Math.random() * Math.PI * 2,
  br: 0.55 + Math.random() * 0.45,
}))

/* ─── Hero2 sphere data ─────────────────────────────────────────── */
const POINTS = [
  { label:'Motion First',    sub:'Every element moves with intention',  rgb:[168,196,255], rs:0.110 },
  { label:'Built Different', sub:'Not pages — cinematic experiences',   rgb:[255,212,168], rs:0.082 },
  { label:'Scroll as Story', sub:'Your scroll controls time itself',    rgb:[184,240,208], rs:0.138 },
  { label:'Zero Compromise', sub:'Precision in every frame rendered',   rgb:[232,192,255], rs:0.094 },
]
const ORB_LOCS    = [[0.27,0.355],[0.73,0.355],[0.27,0.645],[0.73,0.645]]
const ROT_OFFSETS = [0, 1.15, 2.32, 3.74]
const Y_SCALE     = [1.0, 1.0, 0.70, 1.0]

function fibSphere(n) {
  const phi = Math.PI * (1 + Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    return [r * Math.cos(theta), y, r * Math.sin(theta)]
  })
}
const SPHERE_SETS = [fibSphere(340), fibSphere(210), fibSphere(290), fibSphere(460)]
const RING_CONFIGS = [
  [[130,  0, 1.48]],
  [[120, 22, 1.42], [75, -20, 1.74]],
  [[110, 48, 1.50]],
  [[105,  8, 1.46], [58, 82, 1.90]],
]
const RING_DATA = RING_CONFIGS.map(configs =>
  configs.map(([n, tiltDeg, rf]) => {
    const tilt = (tiltDeg * Math.PI) / 180
    const cos  = Math.cos(tilt), sin = Math.sin(tilt)
    const pts  = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return [Math.cos(a), -Math.sin(a) * sin, Math.sin(a) * cos]
    })
    return { pts, rf }
  })
)

const BG_DOTS_H2 = Array.from({ length: 260 }, () => ({
  x: Math.random(), y: Math.random(),
  vx: (Math.random() - 0.5) * 0.000065,
  vy: (Math.random() - 0.5) * 0.000065,
  s: 0.18 + Math.random() * 0.72,
  ph: Math.random() * Math.PI * 2,
}))

/* Given a sphere-phase step (relative to SPHERE_START) and rawT 0→1,
   return which orb is zooming and how far. */
function getOrbState(sphereStep, rawT) {
  // sphereStep 0 = overview, 1-8 = zoom pairs
  if (sphereStep <= 0) return { activeOrb: -1, zoomT: 0 }
  const orbIndex = Math.floor((sphereStep - 1) / 2)
  const isZoomIn = (sphereStep % 2) === 1
  if (isZoomIn) return { activeOrb: orbIndex,    zoomT: eio(rawT) }
  return              { activeOrb: orbIndex - 1, zoomT: 1 - eio(rawT) }
}

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
    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
      <div style={{ transform:`translateY(${floatY}px)` }}>
        <div style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateX(0px)' : `translateX(${xOut}px)`,
          transition: visible
            ? 'opacity 0.9s 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.9s 0.28s cubic-bezier(0.16,1,0.3,1)'
            : 'opacity 0.38s ease-in, transform 0.38s ease-in',
          willChange:'transform, opacity',
        }}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Text styles ───────────────────────────────────────────────── */
const EYEBROW = { fontSize:10, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.22)', marginBottom:20, marginTop:0 }
const H_LARGE = { fontSize:'clamp(32px,5.5vw,78px)', letterSpacing:'-0.025em', lineHeight:1.15, margin:0 }
const H_MED   = { fontSize:'clamp(26px,4vw,60px)', fontWeight:700, letterSpacing:'-0.025em', lineHeight:1.2, color:'#fff', margin:0 }
const BODY    = { fontSize:'clamp(13px,1.3vw,16px)', fontWeight:300, color:'rgba(255,255,255,0.38)', lineHeight:1.8, letterSpacing:'0.01em', maxWidth:520, margin:'0 auto' }

/* ─── Geometry grid ─────────────────────────────────────────────── */
function GeometryGrid({ visible }) {
  return (
    <div style={{ position:'absolute', inset:'-6%', opacity:visible ? 1 : 0, transition:'opacity 1.2s ease', willChange:'opacity', zIndex:1 }}>
      <svg viewBox="0 0 1440 900" style={{ width:'100%', height:'100%' }} preserveAspectRatio="xMidYMid slice">
        {[0,1,2,3,4].map(i => <line key={i} x1={-200+i*360} y1={0} x2={-200+i*360+500} y2={900} stroke="rgba(255,255,255,0.045)" strokeWidth="0.5" />)}
        {[200,400,600,750].map((y,i) => <line key={i} x1={0} y1={y} x2={1440} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />)}
        <circle cx="720" cy="450" r="300" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
        <circle cx="720" cy="450" r="180" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
      </svg>
    </div>
  )
}

/* ─── Hero1-phase step dots ─────────────────────────────────────── */
function H1StepDots({ step }) {
  const count = WARP_STEP  // dots for steps 0–5
  return (
    <div style={{ position:'absolute', right:28, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:8, zIndex:20, pointerEvents:'none' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          width:  i === step ? 2 : 1,
          height: i === step ? 22 : 8,
          borderRadius:1,
          background: i < step ? 'rgba(255,255,255,0.35)' : i === step ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)',
          boxShadow: i === step ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
          transition:'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        }} />
      ))}
    </div>
  )
}

/* ─── Hero2-phase step dots ─────────────────────────────────────── */
function H2StepDots({ step }) {
  const sphereStep = step - SPHERE_START
  return (
    <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:10, zIndex:20, pointerEvents:'none' }}>
      {POINTS.map((pt, i) => {
        const orbStep  = i * 2 + 1
        const isActive = sphereStep === orbStep || sphereStep === orbStep + 1
        const isPast   = sphereStep > orbStep + 1
        const [r, g, b] = pt.rgb
        return (
          <div key={i} style={{
            width:  isActive ? 2 : 1,
            height: isActive ? 24 : 8,
            background: isActive ? `rgb(${r},${g},${b})` : isPast ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
            borderRadius:1,
            transition:'all 0.5s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: isActive ? `0 0 8px rgba(${r},${g},${b},0.75)` : 'none',
          }} />
        )
      })}
    </div>
  )
}

/* ─── Overview labels (sphere grid captions) ────────────────────── */
function OverviewLabels({ step, animTRef }) {
  const elRef = useRef(null)
  const sphereStep = step - SPHERE_START
  useEffect(() => {
    let raf
    const tick = () => {
      if (elRef.current) {
        const rawT = animTRef.current
        // Visible on sphere overview (sphereStep=0) or zoom-outs (even sphereSteps)
        const show = sphereStep === 0 || (sphereStep > 0 && sphereStep % 2 === 0)
        elRef.current.style.opacity = show ? eout(rawT) : 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sphereStep, animTRef])

  return (
    <div ref={elRef} style={{ position:'absolute', inset:0, opacity:0 }}>
      {ORB_LOCS.map(([lx, ly], i) => {
        const [r, g, b] = POINTS[i].rgb
        return (
          <div key={i} style={{ position:'absolute', left:`${lx*100}%`, top:`${ly*100+13}%`, transform:'translateX(-50%)', textAlign:'center', pointerEvents:'none', zIndex:5 }}>
            <div style={{ fontSize:'clamp(8px,1.7vmin,11px)', fontWeight:600, letterSpacing:'0.06em', color:`rgba(${r},${g},${b},0.82)` }}>{POINTS[i].label}</div>
            <div style={{ fontSize:'clamp(6px,1.2vmin,9px)', color:`rgba(${r},${g},${b},0.32)`, marginTop:4, letterSpacing:'0.04em' }}>{POINTS[i].sub}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Sphere text overlay ───────────────────────────────────────── */
function SphereTextOverlay({ step, animTRef, floatY }) {
  const wrapRef  = useRef(null)
  const floatRef = useRef(floatY)
  floatRef.current = floatY
  const ctaRef   = useRef(null)

  const sphereStep = step - SPHERE_START
  const isZoomIn   = sphereStep > 0 && (sphereStep % 2) === 1
  const isZoomOut  = sphereStep > 0 && (sphereStep % 2) === 0
  const orbIndex   = Math.max(0, Math.floor((sphereStep - 1) / 2))
  const pt         = (sphereStep > 0) ? POINTS[Math.min(orbIndex, 3)] : null
  const isFinal    = orbIndex === 3

  useEffect(() => {
    if (!pt) return
    let raf
    const tick = () => {
      const el = wrapRef.current
      if (el) {
        const rawT = animTRef.current
        let alpha = 0
        if (isZoomIn)       alpha = rawT > 0.78 ? clamp((rawT - 0.78) / 0.22) : 0
        else if (isZoomOut) alpha = clamp(1 - rawT / 0.30)
        el.style.opacity   = alpha
        const slideY = isZoomIn ? lerp(20, 0, eout(clamp((rawT - 0.78) / 0.22))) : 0
        el.style.transform = `translateY(${floatRef.current + slideY}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, pt, isZoomIn, isZoomOut, animTRef])

  useEffect(() => {
    if (!isFinal || !isZoomIn) return
    let raf
    const tick = () => {
      if (ctaRef.current) {
        const rawT = animTRef.current
        ctaRef.current.style.opacity = rawT > 0.88 ? clamp((rawT - 0.88) / 0.12) : 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isFinal, isZoomIn, animTRef])

  if (!pt) return null

  const [r, g, b] = pt.rgb
  const color    = `rgb(${r},${g},${b})`
  const colorDim = `rgba(${r},${g},${b},0.48)`
  const glowBox  = `0 0 20px 6px rgba(${r},${g},${b},0.5)`

  return (
    <>
      <style>{`
        .hw-btn-p{padding:12px 32px;border:1px solid ${color};border-radius:2px;background:transparent;color:${color};font-size:9px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;font-family:inherit;transition:background 0.22s,color 0.22s}
        .hw-btn-p:hover{background:${color};color:#000}
        .hw-btn-g{padding:12px 32px;border:none;background:none;color:${colorDim};font-size:9px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;font-family:inherit;transition:color 0.22s}
        .hw-btn-g:hover{color:${color}}
      `}</style>
      <div ref={wrapRef} style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none', opacity:0, willChange:'transform,opacity' }}>
        <div style={{ position:'absolute', top:'13%', left:'50%', transform:'translateX(-50%)', fontSize:9, letterSpacing:'0.44em', textTransform:'uppercase', color, fontWeight:400, whiteSpace:'nowrap' }}>
          {`0${Math.min(orbIndex+1,4)} / 04`}
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:color, margin:'0 auto 18px', boxShadow:glowBox }} />
          <h2 style={{ fontSize:'clamp(28px,5.8vmin,58px)', fontWeight:700, letterSpacing:'-0.015em', color, margin:'0 0 14px', lineHeight:1.05 }}>{pt.label}</h2>
          <p style={{ fontSize:'clamp(12px,2vmin,16px)', color:colorDim, letterSpacing:'0.07em', margin:0, fontWeight:300 }}>{pt.sub}</p>
          {isFinal && (
            <div ref={ctaRef} style={{ marginTop:36, display:'flex', gap:14, justifyContent:'center', pointerEvents:'auto', opacity:0 }}>
              <button className="hw-btn-p">Start a Project</button>
              <button className="hw-btn-g">View Work ↗</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MAIN HERO
═══════════════════════════════════════════════════════════════════ */
export default function Hero() {
  const canvasRef  = useRef(null)
  const [step, setStep]           = useState(0)
  const [introGone, setIntroGone] = useState(false)
  const stepRef    = useRef(0)
  const lockedRef  = useRef(false)
  // Per-step animation progress 0→1, reset to 0 on each step change.
  // Sphere text overlays and overview labels read this directly via RAF.
  const animTRef   = useRef(0)
  // Warp transition progress — separate from animTRef so the crossfade
  // has its own clock independent of the step-level animation.
  const warpTRef   = useRef(0)
  const onIntroDone = useCallback(() => setIntroGone(true), [])

  const floatA = useFloat(8,  4200)
  const floatB = useFloat(10, 5100)
  const floatC = useFloat(7,  3700)
  const floatD = useFloat(9,  4800)
  const floatE = useFloat(6,  3200)
  const floatOrb = useFloat(9, 4600)

  // Keep stepRef current and reset animTRef on every step change
  useEffect(() => {
    stepRef.current  = step
    animTRef.current = 0
    // Also reset warpT when leaving the warp step
    if (step !== WARP_STEP) warpTRef.current = 0
  }, [step])

  /* ── Scroll handler ── */
  useEffect(() => {
    let wheelAccum = 0
    const THRESH = 60

    const advance = (dir) => {
      if (!introGone) return
      if (lockedRef.current) return
      lockedRef.current = true
      // Slightly longer lock during warp so it can play out
      setTimeout(() => { lockedRef.current = false }, dir !== 0 && stepRef.current === WARP_STEP ? 1400 : 750)

      setStep(prev => {
        const next = prev + dir
        if (next < 0) return 0
        if (next > TOTAL_STEPS) return prev
        return next
      })
    }

    const onWheel = e => {
      e.preventDefault()
      wheelAccum += e.deltaY
      if (Math.abs(wheelAccum) >= THRESH) { advance(wheelAccum > 0 ? 1 : -1); wheelAccum = 0 }
    }
    let touchStartY = 0
    const onTouchStart = e => { touchStartY = e.touches[0].clientY }
    const onTouchEnd   = e => { const dy = touchStartY - e.changedTouches[0].clientY; if (Math.abs(dy) > 40) advance(dy > 0 ? 1 : -1) }
    const onKey = e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') advance(1)
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  advance(-1)
    }

    window.addEventListener('wheel', onWheel, { passive:false })
    window.addEventListener('touchstart', onTouchStart, { passive:true })
    window.addEventListener('touchend',   onTouchEnd,   { passive:true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [introGone])

  /* ── Single unified canvas RAF ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, W = 0, H = 0, DPR = 1

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      canvas.width  = W * DPR; canvas.height = H * DPR
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px'
    }
    resize()
    window.addEventListener('resize', resize)

    // Hero1 shooting stars
    const STARS = []
    const spawnStar = () => STARS.push({
      x: Math.random(), y: Math.random() * 0.75,
      len: 0.07 + Math.random() * 0.14, spd: 0.0009 + Math.random() * 0.0012,
      age: 0, life: 0.6 + Math.random() * 0.7,
      angle: Math.PI * 0.18 + (Math.random() - 0.5) * 0.35,
    })
    spawnStar(); spawnStar()
    let nextStar = 0.5 + Math.random() * 1.0

    const ANIM_SPEED  = 0.018
    const WARP_SPEED  = 0.012  // warp crossfade is slower and cinematic

    let lastTs = 0
    const draw = ts => {
      const dt = Math.min((ts - lastTs) * 0.001, 0.05); lastTs = ts
      const t  = ts * 0.001
      const st = stepRef.current

      // Advance per-step animation clock
      animTRef.current = Math.min(1, animTRef.current + ANIM_SPEED)
      const rawT = animTRef.current

      // Warp crossfade progress: ramps 0→1 while st===WARP_STEP, held at 1 after
      if (st === WARP_STEP) {
        warpTRef.current = Math.min(1, warpTRef.current + WARP_SPEED)
      } else if (st > WARP_STEP) {
        warpTRef.current = 1
      }
      // Allow scrolling back through warp
      if (st < WARP_STEP) {
        warpTRef.current = 0
      }
      const crossT = warpTRef.current   // 0 = full dot-field, 1 = full sphere scene
      const warpT  = clamp(crossT)

      /* ── Background ── */
      // Blend Hero1 bg (#060606) → Hero2 bg (#020409) through the warp
      const bgR = Math.round(lerp(6, 2, crossT))
      const bgG = Math.round(lerp(6, 4, crossT))
      const bgB = Math.round(lerp(6, 9, crossT))
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`
      ctx.fillRect(0, 0, W, H)

      /* ══ HERO1 LAYER: dot-field + shooting stars + warp rays ══ */
      const h1Alpha = clamp(1 - crossT * 1.4)  // fades out through first 70% of crossT

      if (h1Alpha > 0.01) {
        // Dot field
        for (const d of BG_DOTS_H1) {
          if (warpT > 0.01) {
            const cx = W*0.5, cy = H*0.5
            const dx = d.x*W - cx, dy = d.y*H - cy
            const spd = warpT * warpT * 0.025
            d.x = ((d.x*W + dx*spd) / W + 1) % 1
            d.y = ((d.y*H + dy*spd) / H + 1) % 1
          } else {
            d.x = (d.x + d.vx + 1) % 1
            d.y = (d.y + d.vy + 1) % 1
          }
          const twinkle = 0.5 + 0.5 * Math.sin(t * 0.85 + d.ph)
          const alpha   = (0.10 + twinkle * 0.22) * d.br * (1 - warpT * 0.6) * h1Alpha
          ctx.beginPath()
          ctx.arc(d.x*W, d.y*H, d.s, 0, Math.PI*2)
          ctx.fillStyle = `rgba(255,255,255,${alpha})`
          ctx.fill()
        }

        // Shooting stars (only before/early warp)
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
          const fade = life < 0.15 ? life/0.15 : life > 0.75 ? 1-(life-0.75)/0.25 : 1
          const tail = s.len * Math.min(1, life/0.2)
          const sx = s.x*W, sy = s.y*H
          const ex = sx + Math.cos(s.angle)*tail*W, ey = sy + Math.sin(s.angle)*tail*H
          s.x += Math.cos(s.angle)*s.spd; s.y += Math.sin(s.angle)*s.spd
          const grad = ctx.createLinearGradient(sx, sy, ex, ey)
          grad.addColorStop(0,   `rgba(255,255,255,0)`)
          grad.addColorStop(0.3, `rgba(255,255,255,${0.85*fade*h1Alpha})`)
          grad.addColorStop(1,   `rgba(255,255,255,${0.22*fade*h1Alpha})`)
          ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey)
          ctx.strokeStyle = grad; ctx.lineWidth = 1.4; ctx.stroke()
        }

        // Warp streaks
        if (warpT > 0.05) {
          const cx = W*0.5, cy = H*0.5, rays = 60
          for (let i = 0; i < rays; i++) {
            const angle = (i/rays) * Math.PI*2
            const len   = lerp(0, Math.max(W,H)*0.7, sq(warpT))
            const x1 = cx + Math.cos(angle)*len*0.1, y1 = cy + Math.sin(angle)*len*0.1
            const x2 = cx + Math.cos(angle)*len,     y2 = cy + Math.sin(angle)*len
            const g = ctx.createLinearGradient(x1,y1,x2,y2)
            g.addColorStop(0, `rgba(255,255,255,${warpT*0.18*h1Alpha})`)
            g.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2)
            ctx.strokeStyle = g; ctx.lineWidth = 0.4; ctx.stroke()
          }
        }

        // Nebula (Hero1 steps 1–4)
        if (st >= 1 && st <= 4) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.4)
          const a = (0.025 + pulse*0.018) * h1Alpha
          const grd = ctx.createRadialGradient(W*0.5,H*0.5,0, W*0.5,H*0.5, Math.max(W,H)*0.55)
          grd.addColorStop(0,   `rgba(100,120,255,${a})`)
          grd.addColorStop(0.5, `rgba(60,80,200,${a*0.4})`)
          grd.addColorStop(1,   'transparent')
          ctx.fillStyle = grd
          ctx.fillRect(0,0,W,H)
        }
      }

      /* ══ HERO2 LAYER: sphere grid — fades in through the warp ══ */
      const h2Alpha = clamp(crossT * 1.6 - 0.3)  // starts fading in at crossT≈0.19

      if (h2Alpha > 0.01) {
        // Hero2 background dots
        for (const d of BG_DOTS_H2) {
          d.x = (d.x + d.vx + 1) % 1
          d.y = (d.y + d.vy + 1) % 1
          const twinkle = 0.5 + 0.5 * Math.sin(t*0.85 + d.ph)
          const alpha   = (0.038 + twinkle*0.082) * h2Alpha
          ctx.beginPath()
          ctx.arc(d.x*W, d.y*H, d.s, 0, Math.PI*2)
          ctx.fillStyle = `rgba(255,255,255,${alpha})`
          ctx.fill()
        }

        // Determine sphere state from sphere-relative step
        const sphereStep = st >= SPHERE_START ? st - SPHERE_START : 0
        const sphereRawT = st >= SPHERE_START ? rawT : 0
        const { activeOrb, zoomT } = getOrbState(sphereStep, sphereRawT)

        const baseR = Math.min(W,H) * 0.135
        const maxR  = Math.sqrt(W*W + H*H) * 0.82

        for (let i = 0; i < POINTS.length; i++) {
          const pt = POINTS[i]
          const [r,g,b] = pt.rgb
          const [lx,ly] = ORB_LOCS[i]
          const isActive = i === activeOrb
          const isFar    = activeOrb >= 0 && !isActive

          let cx = lx*W, cy = ly*H, radius = baseR, alpha = h2Alpha

          if (isActive) {
            cx     = lerp(cx, W*0.5, zoomT)
            cy     = lerp(cy, H*0.5, zoomT)
            radius = lerp(baseR, maxR, Math.pow(zoomT, 1.75))
            alpha  = h2Alpha * (zoomT > 0.5 ? lerp(1, 0.12, (zoomT-0.5)/0.5) : 1)
          } else if (isFar) {
            const ft = clamp(zoomT * 1.9)
            alpha    = h2Alpha * lerp(1, 0, ft)
            radius   = lerp(baseR, baseR*0.52, ft)
          } else {
            radius = baseR * (1 + 0.04 * Math.sin(t*0.6+i))
          }

          if (alpha < 0.005) continue

          const rotY = t*pt.rs + ROT_OFFSETS[i]
          const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
          const ys   = Y_SCALE[i]

          for (const [sx,sy,sz] of SPHERE_SETS[i]) {
            const rx  = sx*cosY + sz*sinY
            const rz  = -sx*sinY + sz*cosY
            const px  = cx + rx*radius
            const py  = cy + sy*ys*radius
            const dep = (rz+1)*0.5
            const da  = alpha * (0.07 + dep*0.60)
            ctx.beginPath()
            ctx.arc(px, py, Math.max(0.22, 0.22+dep*1.70), 0, Math.PI*2)
            ctx.fillStyle = `rgba(${r},${g},${b},${da})`
            ctx.fill()
          }

          const ringRotY = t*pt.rs*0.65 + ROT_OFFSETS[i] + 0.62
          const cosR = Math.cos(ringRotY), sinR = Math.sin(ringRotY)
          for (const { pts, rf } of RING_DATA[i]) {
            const rr = radius * rf
            for (const [rx,ry,rz] of pts) {
              const rrx = rx*cosR + rz*sinR
              const rrz = -rx*sinR + rz*cosR
              const px  = cx + rrx*rr
              const py  = cy + ry*ys*rr
              const dep = (rrz+1)*0.5
              const da  = alpha * (0.04 + dep*0.30)
              ctx.beginPath()
              ctx.arc(px, py, Math.max(0.14, dep*0.92), 0, Math.PI*2)
              ctx.fillStyle = `rgba(${r},${g},${b},${da})`
              ctx.fill()
            }
          }
        }

        // Orb glow
        if (activeOrb >= 0 && zoomT > 0.4) {
          const [r,g,b] = POINTS[activeOrb].rgb
          const ga = sq(clamp((zoomT-0.4)/0.6)) * 0.14 * h2Alpha
          if (ga > 0.003) {
            const glowR = Math.min(W,H)*0.66
            const grd = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,glowR)
            grd.addColorStop(0, `rgba(${r},${g},${b},${ga})`)
            grd.addColorStop(1, 'transparent')
            ctx.fillStyle = grd
            ctx.fillRect(0,0,W,H)
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  /* ── Derived display state ── */
  const inH1      = step < WARP_STEP
  const inWarp    = step === WARP_STEP
  const inH2      = step >= SPHERE_START
  const sphereStep = step - SPHERE_START
  const scrollHintH1 = introGone && step === 0
  const scrollHintH2 = step === SPHERE_START

  return (
    <>
      {!introGone && <IntroOverlay onDone={onIntroDone} />}

      <div style={{ position:'fixed', inset:0, zIndex:1 }}>
        <canvas ref={canvasRef} style={{ position:'absolute', inset:0 }} />

        {/* ── Hero1 text layers — visible during steps 0–5 ── */}
        <div style={{
          position:'absolute', inset:0,
          opacity: inH1 ? 1 : 0,
          transition: inH1 ? 'none' : 'opacity 0.6s ease-in',
          pointerEvents:'none',
        }}>
          <GeometryGrid visible={step >= 2 && step <= 4} />

          {/* Vignette */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2, background:'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)' }} />

          {/* Step 0: opening line */}
          <div style={{ position:'absolute', top:'50%', left:'50%', zIndex:3, width:step===0?100:0, height:'0.5px', background:'rgba(255,255,255,0.22)', transform:'translate(-50%,-50%)', transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)', opacity:step===0?1:0 }} />

          {/* Step 1 */}
          <div style={{ position:'absolute', inset:0, zIndex:4 }}>
            <Chapter visible={step===1} fromLeft={true} floatY={floatA}>
              <div style={{ width:'min(90vw,640px)', textAlign:'center' }}>
                <p style={EYEBROW}>A question worth asking</p>
                <h2 style={{ ...H_LARGE, fontWeight:300, color:'#fff' }}>
                  What if your website<br />
                  <em style={{ fontStyle:'italic', color:'rgba(255,255,255,0.45)' }}>actually felt alive?</em>
                </h2>
              </div>
            </Chapter>
          </div>

          {/* Step 2 */}
          <div style={{ position:'absolute', inset:0, zIndex:4 }}>
            <Chapter visible={step===2} fromLeft={false} floatY={floatB}>
              <div style={{ width:'min(92vw,820px)', textAlign:'center' }}>
                <p style={EYEBROW}>Motion-first web studio</p>
                <div>
                  {[
                    { text:'We build',       w:300, color:'rgba(255,255,255,0.55)' },
                    { text:'experiences',    w:700, color:'#fff' },
                    { text:'worth feeling.', w:300, color:'rgba(255,255,255,0.55)' },
                  ].map(({ text, w, color }, i) => (
                    <div key={i} style={{
                      fontSize:'clamp(38px,6.5vw,96px)', fontWeight:w, color,
                      letterSpacing:'-0.03em', lineHeight:1.1,
                      opacity: step===2 ? 1 : 0,
                      transform: step===2 ? 'translateX(0)' : `translateX(${i%2===0?-30:30}px)`,
                      transition:`opacity 0.9s ${i*0.1}s cubic-bezier(0.16,1,0.3,1),transform 0.9s ${i*0.1}s cubic-bezier(0.16,1,0.3,1)`,
                      willChange:'transform,opacity',
                    }}>{text}</div>
                  ))}
                </div>
              </div>
            </Chapter>
          </div>

          {/* Step 3 */}
          <div style={{ position:'absolute', inset:0, zIndex:4 }}>
            <Chapter visible={step===3} fromLeft={true} floatY={floatC}>
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

          {/* Step 4 */}
          <div style={{ position:'absolute', inset:0, zIndex:4 }}>
            <Chapter visible={step===4} fromLeft={false} floatY={floatD}>
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
                      opacity: step===4?1:0, transform: step===4?'translateY(0)':'translateY(16px)',
                      transition:`opacity 0.9s ${0.15+i*0.12}s cubic-bezier(0.16,1,0.3,1),transform 0.9s ${0.15+i*0.12}s cubic-bezier(0.16,1,0.3,1)`,
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

          {/* Step 5 */}
          <div style={{ position:'absolute', inset:0, zIndex:4, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:'18vh' }}>
            <div style={{
              width:'min(88vw,560px)', textAlign:'center',
              opacity: step===5?1:0,
              transform: `translateY(${step===5?floatE:20}px)`,
              transition:'opacity 1s cubic-bezier(0.16,1,0.3,1),transform 1s cubic-bezier(0.16,1,0.3,1)',
              willChange:'opacity,transform',
            }}>
              <div style={{ fontSize:'clamp(16px,2.4vw,30px)', fontWeight:300, lineHeight:1.45, color:'rgba(255,255,255,0.6)', display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'0.22em' }}>
                {['Your','website','is','your','first','impression.','Make','it','unforgettable.'].map((w, i) => (
                  <span key={i} style={{
                    color: i>=6?'#fff':'rgba(255,255,255,0.5)', fontWeight:i>=6?500:300, display:'inline-block',
                    opacity: step===5?1:0,
                    transform: step===5?'translateX(0)':`translateX(${i%2===0?-12:12}px)`,
                    transition:`opacity 0.8s ${i*0.06}s cubic-bezier(0.16,1,0.3,1),transform 0.8s ${i*0.06}s cubic-bezier(0.16,1,0.3,1)`,
                    willChange:'transform,opacity',
                  }}>{w}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll hint step 0 */}
          <div style={{
            position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            opacity: scrollHintH1 ? 1 : 0, transition:'opacity 0.8s',
            pointerEvents:'none', zIndex:20,
          }}>
            <span style={{ fontSize:8, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(255,255,255,0.16)' }}>Scroll</span>
            <motion.div
              animate={{ y:[0,9,0] }}
              transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:0.5, height:40, background:'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}
            />
          </div>

          {introGone && <H1StepDots step={step} />}
        </div>

        {/* ── Hero2 text layers — visible during sphere steps ── */}
        <div style={{
          position:'absolute', inset:0,
          opacity: inH2 ? 1 : 0,
          transition: inH2 ? 'none' : 'opacity 0.6s ease-out',
          pointerEvents: inH2 ? 'auto' : 'none',
        }}>
          <OverviewLabels step={step} animTRef={animTRef} />
          <SphereTextOverlay step={step} animTRef={animTRef} floatY={floatOrb} />
          <H2StepDots step={step} />

          {/* Scroll hint sphere step 0 */}
          <div style={{
            position:'absolute', bottom:26, left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            opacity: scrollHintH2 ? 1 : 0, transition:'opacity 0.6s',
            pointerEvents:'none', zIndex:20,
          }}>
            <span style={{ fontSize:7, letterSpacing:'0.36em', textTransform:'uppercase', color:'rgba(255,255,255,0.13)' }}>Scroll</span>
            <div style={{ width:'0.5px', height:30, background:'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)', animation:'hwScrollPulse 2.2s ease-in-out infinite' }} />
          </div>
        </div>
      </div>

      {/* Page height so the browser scroll bar exists */}
      <div style={{ height:'100vh' }} />

      <style>{`
        @keyframes hwScrollPulse{0%,100%{opacity:.28;transform:scaleY(.85)}50%{opacity:1;transform:scaleY(1.15)}}
      `}</style>
    </>
  )
}
