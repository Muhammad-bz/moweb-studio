/**
 * Hero2.jsx — Four Particle Spheres · Discrete-Step Scroll
 * Moweb Studio
 *
 * CORE MECHANIC (matches Hero1 pattern):
 *   Each scroll = one discrete action:
 *   Step 0  → all 4 orbs visible (overview)
 *   Step 1  → zoom INTO orb 0 (open)
 *   Step 2  → zoom OUT of orb 0, back to overview
 *   Step 3  → zoom INTO orb 1 (open)
 *   Step 4  → zoom OUT of orb 1
 *   Step 5  → zoom INTO orb 2
 *   Step 6  → zoom OUT of orb 2
 *   Step 7  → zoom INTO orb 3 (final, shows CTA)
 *   Step 8  → fade out (end of hero2)
 *
 *  The canvas animates the zoom using a lerped "animProgress" per step,
 *  so each step is a smooth cinematic move rather than a jump.
 *
 *  Floating: text bobs gently via a sine-wave RAF loop.
 */

import { useEffect, useRef, useState } from 'react'

/* ─── Math ─────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp   = (a, b, t) => a + (b - a) * t
const eout   = t => 1 - Math.pow(1 - t, 3)
const eio    = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
const sq     = t => t * t

/* ─── Content ──────────────────────────────────────────────────── */
const POINTS = [
  { label:'Motion First',    sub:'Every element moves with intention',  rgb:[168,196,255], rs:0.110 },
  { label:'Built Different', sub:'Not pages — cinematic experiences',   rgb:[255,212,168], rs:0.082 },
  { label:'Scroll as Story', sub:'Your scroll controls time itself',    rgb:[184,240,208], rs:0.138 },
  { label:'Zero Compromise', sub:'Precision in every frame rendered',   rgb:[232,192,255], rs:0.094 },
]

// Step map: which orb is active and what are we doing
// step 0 = overview
// odd  steps = zoomed IN  to orb (step-1)/2
// even steps = overview / zoomed OUT
const TOTAL_STEPS = 8  // 0–8
const ORB_LOCS    = [[0.27,0.355],[0.73,0.355],[0.27,0.645],[0.73,0.645]]
const ROT_OFFSETS = [0, 1.15, 2.32, 3.74]

function getOrbState(step, animT) {
  // Returns { activeOrb: -1|0-3, zoomT: 0-1, isInside: bool }
  if (step === 0) return { activeOrb: -1, zoomT: 0, isInside: false }

  const orbIndex  = Math.floor((step - 1) / 2)    // which orb (0-3)
  const isZoomIn  = (step % 2) === 1              // odd = zooming in
  const isZoomOut = (step % 2) === 0 && step > 0  // even (>0) = zooming out

  if (isZoomIn)  return { activeOrb: orbIndex, zoomT: eio(animT), isInside: animT >= 1, phase: 'in' }
  if (isZoomOut) return { activeOrb: orbIndex - 1, zoomT: 1 - eio(animT), isInside: false, phase: 'out' }
  return { activeOrb: -1, zoomT: 0, isInside: false }
}

/* ─── Geometry ─────────────────────────────────────────────────── */
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
const Y_SCALE  = [1.0, 1.0, 0.70, 1.0]

const BG_DOTS = Array.from({ length: 260 }, () => ({
  x: Math.random(), y: Math.random(),
  vx: (Math.random() - 0.5) * 0.000065,
  vy: (Math.random() - 0.5) * 0.000065,
  s: 0.18 + Math.random() * 0.72,
  ph: Math.random() * Math.PI * 2,
}))

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

/* ─── Text overlay ──────────────────────────────────────────────── */
function TextOverlay({ step, animT, floatY }) {
  const orbIndex  = Math.floor((step - 1) / 2)
  const isZoomIn  = step > 0 && (step % 2) === 1
  const isZoomOut = step > 0 && (step % 2) === 0 && step <= TOTAL_STEPS

  // Which orb to show label for (valid for both zoom-in AND zoom-out steps)
  const showOrb = step > 0 && step <= TOTAL_STEPS
  const pt      = showOrb ? POINTS[Math.min(orbIndex, 3)] : null

  // Text alpha:
  //  • zoom-in  → fade IN  from animT 0.72 → 1.0
  //  • zoom-out → fade OUT from animT 0.00 → 0.30  (keeps element alive so CSS doesn't snap)
  let textAlpha = 0
  if (isZoomIn) {
    textAlpha = animT > 0.72 ? clamp((animT - 0.72) / 0.28) : 0
  } else if (isZoomOut) {
    textAlpha = clamp(1 - animT / 0.30)   // 1 → 0 over first 30 % of zoom-out
  }

  if (!pt || textAlpha < 0.005) return null

  const [r, g, b] = pt.rgb
  const color     = `rgb(${r},${g},${b})`
  const colorDim  = `rgba(${r},${g},${b},0.48)`
  const glowBox   = `0 0 20px 6px rgba(${r},${g},${b},0.5)`
  const isFinal   = orbIndex === 3

  return (
    <>
      <style>{`
        .h2-btn-p { padding:12px 32px; border:1px solid ${color}; border-radius:2px; background:transparent; color:${color}; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; cursor:pointer; font-family:inherit; transition:background 0.22s,color 0.22s; }
        .h2-btn-p:hover { background:${color}; color:#000; }
        .h2-btn-g { padding:12px 32px; border:none; background:none; color:${colorDim}; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; cursor:pointer; font-family:inherit; transition:color 0.22s; }
        .h2-btn-g:hover { color:${color}; }
      `}</style>
      <div style={{
        position:'absolute', inset:0, zIndex:10,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        pointerEvents:'none',
        opacity: textAlpha,
        transform: `translateY(${floatY + (isZoomIn ? lerp(24, 0, eout(textAlpha)) : 0)}px)`,
        willChange:'transform, opacity',
      }}>
        {/* Counter */}
        <div style={{
          position:'absolute', top:'13%', left:'50%', transform:'translateX(-50%)',
          fontSize:9, letterSpacing:'0.44em', textTransform:'uppercase', color,
          fontWeight:400, whiteSpace:'nowrap',
        }}>
          {`0${Math.min(orbIndex + 1, 4)} / 04`}
        </div>

        <div style={{ textAlign:'center' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:color, margin:'0 auto 18px', boxShadow:glowBox }} />
          <h2 style={{
            fontSize:'clamp(28px,5.8vmin,58px)', fontWeight:700,
            letterSpacing:'-0.015em', color, margin:'0 0 14px', lineHeight:1.05,
          }}>{pt.label}</h2>
          <p style={{
            fontSize:'clamp(12px,2vmin,16px)', color:colorDim,
            letterSpacing:'0.07em', margin:0, fontWeight:300,
          }}>{pt.sub}</p>

          {isFinal && animT > 0.82 && (
            <div style={{
              marginTop:36, display:'flex', gap:14, justifyContent:'center',
              pointerEvents:'auto',
              opacity: clamp((animT - 0.82) / 0.18),
              transition:'opacity 0.5s',
            }}>
              <button className="h2-btn-p">Start a Project</button>
              <button className="h2-btn-g">View Work ↗</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Overview labels (step 0) ──────────────────────────────────── */
function OverviewLabels({ step, animT }) {
  const alpha = step === 0 ? eout(animT) : step > 0 && (step % 2) === 0 ? eout(animT) : 0
  if (alpha < 0.005) return null
  return (
    <>
      {ORB_LOCS.map(([lx, ly], i) => {
        const [r, g, b] = POINTS[i].rgb
        return (
          <div key={i} style={{
            position:'absolute',
            left:`${lx * 100}%`, top:`${ly * 100 + 13}%`,
            transform:'translateX(-50%)',
            textAlign:'center', pointerEvents:'none', zIndex:5, opacity:alpha,
          }}>
            <div style={{ fontSize:'clamp(8px,1.7vmin,11px)', fontWeight:600, letterSpacing:'0.06em', color:`rgba(${r},${g},${b},0.82)` }}>{POINTS[i].label}</div>
            <div style={{ fontSize:'clamp(6px,1.2vmin,9px)', color:`rgba(${r},${g},${b},0.32)`, marginTop:4, letterSpacing:'0.04em' }}>{POINTS[i].sub}</div>
          </div>
        )
      })}
    </>
  )
}

/* ─── Step dots ─────────────────────────────────────────────────── */
function StepDots({ step }) {
  // 4 orbs, 2 steps each = 8 steps total. Show as 4 pairs.
  return (
    <div style={{
      position:'absolute', right:20, top:'50%', transform:'translateY(-50%)',
      display:'flex', flexDirection:'column', gap:10, zIndex:20, pointerEvents:'none',
    }}>
      {POINTS.map((pt, i) => {
        const orbStep = i * 2 + 1  // step where this orb zooms in
        const isActive = step === orbStep || step === orbStep + 1
        const isPast   = step > orbStep + 1
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

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function Hero2({ active = false }) {
  const canvasRef  = useRef(null)
  const [step, setStep] = useState(0)
  const stepRef    = useRef(0)   // for canvas RAF
  const animTRef   = useRef(0)   // 0→1 smooth lerp between steps
  const [animT, setAnimT] = useState(0)  // mirrored for React renders
  const lockedRef  = useRef(false)

  const floatY = useFloat(9, 4600)

  // Sync stepRef
  useEffect(() => { stepRef.current = step; animTRef.current = 0 }, [step])

  /* ── Discrete scroll handler — only active after Hero1 hands off ── */
  useEffect(() => {
    if (!active) return   // stay dormant while Hero1 is running

    let wheelAccum = 0
    const THRESH   = 60

    const advance = (dir) => {
      if (lockedRef.current) return
      lockedRef.current = true
      setTimeout(() => { lockedRef.current = false }, 900)

      setStep(prev => {
        const next = clamp(prev + dir, 0, TOTAL_STEPS)
        return next
      })
    }

    const onWheel = (e) => {
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
  }, [active])

  /* ── Canvas RAF ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, W = 0, H = 0, DPR = 1

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W   = window.innerWidth; H = window.innerHeight
      canvas.width  = W * DPR; canvas.height = H * DPR
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px'
    }
    resize()
    window.addEventListener('resize', resize)

    const ANIM_SPEED = 0.018  // how fast animT lerps to 1 (lower = slower/cinematic)

    const draw = (ts) => {
      const t  = ts * 0.001
      const st = stepRef.current

      // Smoothly drive animT toward 1
      animTRef.current = Math.min(1, animTRef.current + ANIM_SPEED)
      const aT = eio(animTRef.current)
      setAnimT(aT)  // sync to React

      const { activeOrb, zoomT, phase } = getOrbState(st, animTRef.current)

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.fillStyle = '#020409'
      ctx.fillRect(0, 0, W, H)

      // Background dots
      for (const d of BG_DOTS) {
        d.x = (d.x + d.vx + 1) % 1
        d.y = (d.y + d.vy + 1) % 1
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.85 + d.ph)
        const alpha   = 0.038 + twinkle * 0.082
        ctx.beginPath()
        ctx.arc(d.x * W, d.y * H, d.s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }

      const baseR = Math.min(W, H) * 0.135
      const maxR  = Math.sqrt(W * W + H * H) * 0.82

      for (let i = 0; i < POINTS.length; i++) {
        const pt  = POINTS[i]
        const [r, g, b] = pt.rgb
        const [lx, ly]  = ORB_LOCS[i]
        const isActive  = i === activeOrb
        const isFar     = activeOrb >= 0 && !isActive

        let cx     = lx * W
        let cy     = ly * H
        let radius = baseR
        let alpha  = 1.0

        if (isActive) {
          const zt = zoomT
          cx     = lerp(cx, W * 0.5, zt)
          cy     = lerp(cy, H * 0.5, zt)
          radius = lerp(baseR, maxR, Math.pow(zt, 1.75))
          alpha  = zt > 0.5 ? lerp(1, 0.12, (zt - 0.5) / 0.5) : 1
        } else if (isFar) {
          const ft = clamp(zoomT * 1.9)
          alpha    = lerp(1, 0, ft)
          radius   = lerp(baseR, baseR * 0.52, ft)
        } else {
          // overview — orbs gently pulse
          radius = baseR * (1 + 0.04 * Math.sin(t * 0.6 + i))
        }

        if (alpha < 0.005) continue

        const rotY = t * pt.rs + ROT_OFFSETS[i]
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
        const ys   = Y_SCALE[i]

        for (const [sx, sy, sz] of SPHERE_SETS[i]) {
          const rx    = sx * cosY + sz * sinY
          const rz    = -sx * sinY + sz * cosY
          const px    = cx + rx * radius
          const py    = cy + sy * ys * radius
          const depth = (rz + 1) * 0.5
          const size  = Math.max(0.22, 0.22 + depth * 1.70)
          const da    = alpha * (0.07 + depth * 0.60)
          ctx.beginPath()
          ctx.arc(px, py, size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${da})`
          ctx.fill()
        }

        const ringRotY = t * pt.rs * 0.65 + ROT_OFFSETS[i] + 0.62
        const cosR = Math.cos(ringRotY), sinR = Math.sin(ringRotY)
        for (const { pts, rf } of RING_DATA[i]) {
          const rr = radius * rf
          for (const [rx, ry, rz] of pts) {
            const rrx = rx * cosR + rz * sinR
            const rrz = -rx * sinR + rz * cosR
            const px  = cx + rrx * rr
            const py  = cy + ry * ys * rr
            const dep = (rrz + 1) * 0.5
            const da  = alpha * (0.04 + dep * 0.30)
            ctx.beginPath()
            ctx.arc(px, py, Math.max(0.14, dep * 0.92), 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${r},${g},${b},${da})`
            ctx.fill()
          }
        }
      }

      // Ambient glow when inside an orb
      if (activeOrb >= 0 && zoomT > 0.4) {
        const [r, g, b] = POINTS[activeOrb].rgb
        const ga = sq(clamp((zoomT - 0.4) / 0.6)) * 0.14
        if (ga > 0.003) {
          const glowR = Math.min(W, H) * 0.66
          const grd   = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, glowR)
          grd.addColorStop(0, `rgba(${r},${g},${b},${ga})`)
          grd.addColorStop(1, 'transparent')
          ctx.fillStyle = grd
          ctx.fillRect(0, 0, W, H)
        }
      }

      // Fade out on final step
      if (st >= TOTAL_STEPS) {
        ctx.fillStyle = `rgba(2,4,9,${clamp(animTRef.current)})`
        ctx.fillRect(0, 0, W, H)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  const isZoomIn = step > 0 && (step % 2) === 1
  const scrollHintOp = step === 0 ? 1 : 0

  return (
    <>
      {/* Fixed full-screen stage */}
      <div style={{
        position:'fixed', inset:0, zIndex:1,
        opacity: step >= TOTAL_STEPS ? 0 : 1,
        transition: step >= TOTAL_STEPS ? 'opacity 1.4s ease-in' : 'none',
        pointerEvents: step >= TOTAL_STEPS ? 'none' : 'auto',
      }}>
        <canvas ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:0 }} />

        <OverviewLabels step={step} animT={animT} />
        <TextOverlay    step={step} animT={animT} floatY={floatY} />
        <StepDots       step={step} />

        {/* Scroll hint */}
        <div style={{
          position:'absolute', bottom:26, left:'50%',
          transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          opacity:scrollHintOp, transition:'opacity 0.6s',
          pointerEvents:'none', zIndex:20,
        }}>
          <span style={{ fontSize:7, letterSpacing:'0.36em', textTransform:'uppercase', color:'rgba(255,255,255,0.13)' }}>Scroll</span>
          <div style={{
            width:'0.5px', height:30,
            background:'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
            animation:'h2ScrollPulse 2.2s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height:'100vh' }} />

      <style>{`
        @keyframes h2ScrollPulse {
          0%,100%{opacity:.28;transform:scaleY(.85)}
          50%{opacity:1;transform:scaleY(1.15)}
        }
      `}</style>
    </>
  )
}
