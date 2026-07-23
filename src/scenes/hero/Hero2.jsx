/**
 * Hero2.jsx — Four Particle Spheres · Zoom-Through Scroll
 * Moweb Studio
 *
 * • Nav removed — shared Navbar.jsx handles it
 * • Smooth entry from Hero1 warp:
 *     First 8% of Hero2's scroll = "arrival" — dots expand outward from
 *     centre (reverse of Hero1's warp-in), bg emerges from black.
 *     This makes it feel like you flew through space and arrived here.
 * • 1500vh (slower, more deliberate)
 * • CTA buttons use CSS class hover (no stuck state)
 */

import { useEffect, useRef, useState } from 'react'

/* ─── Math ─────────────────────────────────────────────────────── */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp   = (a, b, t) => a + (b - a) * t
const slice  = (p, s, e) => clamp((p - s) / (e - s))
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

const SEG_SIZE = 0.22
const SEGS = POINTS.map((_, i) => {
  const base = 0.13 + i * SEG_SIZE
  return {
    zoomIn:   [base,                   base + 0.12],
    inside:   [base + 0.12,            base + SEG_SIZE],
    pinchOut: [base + SEG_SIZE - 0.04, base + SEG_SIZE],
  }
})

const ORB_LOCS = [[0.27,0.355],[0.73,0.355],[0.27,0.645],[0.73,0.645]]
const ROT_OFFSETS = [0, 1.15, 2.32, 3.74]

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
    const cos  = Math.cos(tilt)
    const sin  = Math.sin(tilt)
    const pts  = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return [Math.cos(a), -Math.sin(a) * sin, Math.sin(a) * cos]
    })
    return { pts, rf }
  })
)
const Y_SCALE = [1.0, 1.0, 0.70, 1.0]

const BG_DOTS = Array.from({ length: 260 }, () => ({
  x:  Math.random(),
  y:  Math.random(),
  vx: (Math.random() - 0.5) * 0.000065,
  vy: (Math.random() - 0.5) * 0.000065,
  s:  0.18 + Math.random() * 0.72,
  ph: Math.random() * Math.PI * 2,
  // arrival position: start near centre, expand outward
  ax: 0.5 + (Math.random() - 0.5) * 0.04,
  ay: 0.5 + (Math.random() - 0.5) * 0.04,
}))

/* ─── RAF-throttled scroll hook ─────────────────────────────────── */
function useScrollProgress(ref) {
  const [p, setP] = useState(0)
  const latest    = useRef(0)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      latest.current = clamp(-top / (height - window.innerHeight))
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => { setP(latest.current); ticking = false })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [ref])
  return { progress: p, progressRef: latest }
}

/* ─── Scene state ───────────────────────────────────────────────── */
function getSceneState(progress) {
  let activeOrb = -1, phase = 'none', phaseT = 0
  for (let i = 0; i < SEGS.length; i++) {
    const { zoomIn, inside } = SEGS[i]
    if (progress >= zoomIn[0] && progress < inside[1]) {
      activeOrb = i
      if (progress <= zoomIn[1]) {
        phase  = 'zoomin'
        phaseT = slice(progress, zoomIn[0], zoomIn[1])
      } else {
        phase  = 'inside'
        phaseT = slice(progress, inside[0], inside[1])
      }
      break
    }
  }
  return { activeOrb, phase, phaseT }
}

/* ─── Text Overlay ──────────────────────────────────────────────── */
function TextOverlay({ activeOrb, phase, phaseT }) {
  const pt = activeOrb >= 0 ? POINTS[activeOrb] : null
  const isLastOrb = activeOrb === 3

  let textAlpha = 0
  if (phase === 'zoomin') {
    textAlpha = phaseT > 0.80 ? (phaseT - 0.80) / 0.20 : 0
  } else if (phase === 'inside') {
    if (isLastOrb) {
      textAlpha = 1
    } else {
      const holdEnd = 0.92
      textAlpha = phaseT < holdEnd ? 1 : 1 - (phaseT - holdEnd) / (1 - holdEnd)
    }
  }
  textAlpha = clamp(textAlpha)
  const translateY = phase === 'zoomin' ? lerp(22, 0, textAlpha) : 0
  if (!pt || textAlpha < 0.008) return null

  const [r, g, b] = pt.rgb
  const color    = `rgb(${r},${g},${b})`
  const colorDim = `rgba(${r},${g},${b},0.48)`
  const glowBox  = `0 0 20px 6px rgba(${r},${g},${b},0.5)`

  return (
    <>
      <style>{`
        .h2-btn-primary-${activeOrb} {
          padding: 11px 28px;
          border: 1px solid ${color};
          border-radius: 2px;
          background: transparent;
          color: ${color};
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.22s, color 0.22s;
        }
        .h2-btn-primary-${activeOrb}:hover { background: ${color}; color: #000; }
        .h2-btn-ghost-${activeOrb} {
          padding: 11px 28px;
          border: none;
          background: none;
          color: ${colorDim};
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.22s;
        }
        .h2-btn-ghost-${activeOrb}:hover { color: ${color}; }
      `}</style>

      <div style={{
        position:'absolute', inset:0, zIndex:10,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        pointerEvents:'none',
      }}>
        {/* Counter */}
        <div style={{
          position:'absolute', top:'13%', left:'50%',
          transform:'translateX(-50%)',
          opacity: textAlpha,
          fontSize:9, letterSpacing:'0.44em',
          textTransform:'uppercase', color,
          fontWeight:400, whiteSpace:'nowrap',
        }}>
          {`0${activeOrb + 1} / 0${POINTS.length}`}
        </div>

        {/* Label */}
        <div style={{ opacity:textAlpha, textAlign:'center', transform:`translateY(${translateY}px)` }}>
          <div style={{
            width:5, height:5, borderRadius:'50%',
            background:color, margin:'0 auto 18px',
            boxShadow:glowBox,
          }} />
          <h2 style={{
            fontSize:'clamp(24px,5.8vmin,52px)',
            fontWeight:700, letterSpacing:'-0.015em',
            color, margin:'0 0 12px', lineHeight:1.05,
          }}>{pt.label}</h2>
          <p style={{
            fontSize:'clamp(11px,2vmin,15px)',
            color:colorDim, letterSpacing:'0.07em',
            margin:0, fontWeight:300,
          }}>{pt.sub}</p>

          {activeOrb === 3 && phase === 'inside' && phaseT > 0.35 && (
            <div style={{
              marginTop:32,
              opacity: clamp((phaseT - 0.35) / 0.3),
              display:'flex', gap:12, justifyContent:'center',
              pointerEvents:'auto',
            }}>
              <button className={`h2-btn-primary-${activeOrb}`}>Start a Project</button>
              <button className={`h2-btn-ghost-${activeOrb}`}>View Work ↗</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Overview labels ───────────────────────────────────────────── */
function OverviewLabels({ progress }) {
  const showT = clamp(eout(slice(progress, 0.06, 0.13)))
  const hideT = clamp(eout(slice(progress, 0.13, 0.17)))
  const alpha = showT * (1 - hideT)
  if (alpha < 0.005) return null
  return (
    <>
      {ORB_LOCS.map(([lx, ly], i) => {
        const pt = POINTS[i]
        const [r, g, b] = pt.rgb
        return (
          <div key={i} style={{
            position:'absolute',
            left:`${lx * 100}%`, top:`${ly * 100 + 13}%`,
            transform:'translateX(-50%)',
            textAlign:'center', pointerEvents:'none', zIndex:5, opacity:alpha,
          }}>
            <div style={{ fontSize:'clamp(8px,1.7vmin,11px)', fontWeight:600, letterSpacing:'0.06em', color:`rgba(${r},${g},${b},0.82)` }}>{pt.label}</div>
            <div style={{ fontSize:'clamp(6px,1.2vmin,9px)', color:`rgba(${r},${g},${b},0.32)`, marginTop:4, letterSpacing:'0.04em' }}>{pt.sub}</div>
          </div>
        )
      })}
    </>
  )
}

/* ─── Chapter dots ──────────────────────────────────────────────── */
function ChapterDots({ progress }) {
  return (
    <div style={{
      position:'absolute', right:16, top:'50%',
      transform:'translateY(-50%)',
      display:'flex', flexDirection:'column', gap:9, zIndex:20,
    }}>
      {POINTS.map((pt, i) => {
        const seg    = SEGS[i]
        const active = progress >= seg.zoomIn[0] && progress < seg.inside[1]
        const past   = progress >= seg.inside[1]
        const [r, g, b] = pt.rgb
        return (
          <div key={i} style={{
            width:  active ? 2 : 1,
            height: active ? 22 : 8,
            background: active ? `rgb(${r},${g},${b})` : past ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
            borderRadius:1,
            transition:'all 0.4s ease',
            boxShadow: active ? `0 0 8px rgba(${r},${g},${b},0.75)` : 'none',
          }} />
        )
      })}
    </div>
  )
}

/* ─── MAIN ──────────────────────────────────────────────────────── */
export default function Hero2() {
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const { progress, progressRef } = useScrollProgress(containerRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let W = 0, H = 0, DPR = 1

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

    const draw = (ts) => {
      const t = ts * 0.001
      const p = progressRef.current

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

      // ── Arrival: first 8% — emerge from black
      const arrivalT = eio(slice(p, 0.00, 0.08))
      ctx.fillStyle = arrivalT < 0.999
        ? `rgba(2,4,9,${1})` // fill opaque black first, then orbs render over
        : '#020409'
      ctx.fillRect(0, 0, W, H)

      /* Drifting background dots — expand from centre on arrival */
      for (const d of BG_DOTS) {
        let rx, ry
        if (arrivalT < 1) {
          // interpolate from arrival (near-centre) position to final position
          rx = lerp(d.ax, d.x, arrivalT)
          ry = lerp(d.ay, d.y, arrivalT)
          // push them outward each frame so they animate
          d.x = (d.x + d.vx + 1) % 1
          d.y = (d.y + d.vy + 1) % 1
        } else {
          d.x = (d.x + d.vx + 1) % 1
          d.y = (d.y + d.vy + 1) % 1
          rx = d.x
          ry = d.y
        }
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.85 + d.ph)
        const alpha   = arrivalT * (0.038 + twinkle * 0.082)
        ctx.beginPath()
        ctx.arc(rx * W, ry * H, d.s, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }

      // Arrival radial burst — brief flash of rays expanding outward
      if (arrivalT < 0.85) {
        const burstT = eout(arrivalT)
        const rays   = 48
        const cx     = W * 0.5
        const cy     = H * 0.5
        for (let i = 0; i < rays; i++) {
          const angle  = (i / rays) * Math.PI * 2
          const inner  = Math.max(W, H) * 0.02 * burstT
          const outer  = Math.max(W, H) * 0.5  * burstT
          const g      = ctx.createLinearGradient(
            cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner,
            cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer,
          )
          g.addColorStop(0,   `rgba(255,255,255,${0.22 * (1 - burstT)})`)
          g.addColorStop(1,   'rgba(255,255,255,0)')
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
          ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
          ctx.strokeStyle = g
          ctx.lineWidth   = 0.5
          ctx.stroke()
        }
      }

      // ── Orb rendering (unchanged logic) ──
      const introT = eout(slice(p, 0, 0.09))
      const { activeOrb, phase, phaseT } = getSceneState(p)
      const baseR = Math.min(W, H) * 0.135
      const maxR  = Math.sqrt(W * W + H * H) * 0.82

      for (let i = 0; i < POINTS.length; i++) {
        const pt = POINTS[i]
        const [r, g, b] = pt.rgb
        const [lx, ly]  = ORB_LOCS[i]
        const isActive  = i === activeOrb
        const isFar     = activeOrb >= 0 && !isActive

        let cx     = lx * W
        let cy     = ly * H
        let radius = baseR
        let alpha  = introT * arrivalT // scale by arrival

        if (isActive) {
          if (phase === 'zoomin') {
            const zt = eio(phaseT)
            cx     = lerp(cx, W * 0.5, zt)
            cy     = lerp(cy, H * 0.5, zt)
            radius = lerp(baseR, maxR, Math.pow(phaseT, 1.75))
            alpha  = arrivalT
          } else {
            cx = W * 0.5; cy = H * 0.5
            const isLastOrb  = i === POINTS.length - 1
            const pinchStart = SEGS[i].pinchOut[0]
            const pinchEnd   = SEGS[i].pinchOut[1]
            const isPinching = !isLastOrb && p >= pinchStart
            if (isPinching) {
              const pinchT   = eio(slice(p, pinchStart, pinchEnd))
              const currentR = maxR * lerp(1, 1.45, sq(phaseT))
              radius = lerp(currentR, baseR * 1.6, pinchT)
              alpha  = lerp(lerp(0.92, 0.10, phaseT), 0.0, pinchT)
            } else {
              radius = maxR * lerp(1, 1.45, sq(phaseT))
              alpha  = lerp(0.92, 0.10, phaseT)
            }
          }
        } else if (isFar) {
          const fade = phase === 'zoomin' ? eio(phaseT) : 1
          const ft   = clamp(fade * 1.9)
          alpha  = lerp(introT, 0, ft) * arrivalT
          radius = lerp(baseR, baseR * 0.52, ft)
        }

        if (alpha < 0.005) continue

        const rotY = t * pt.rs + ROT_OFFSETS[i]
        const cosY = Math.cos(rotY)
        const sinY = Math.sin(rotY)
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
        const cosR = Math.cos(ringRotY); const sinR = Math.sin(ringRotY)
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

      /* Ambient glow */
      if (activeOrb >= 0) {
        const [r, g, b] = POINTS[activeOrb].rgb
        const ga = phase === 'zoomin' ? sq(phaseT) * 0.13 : lerp(0.13, 0.03, phaseT)
        if (ga > 0.004) {
          const glowR = Math.min(W, H) * 0.66
          const grd   = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, glowR)
          grd.addColorStop(0, `rgba(${r},${g},${b},${ga * arrivalT})`)
          grd.addColorStop(1, 'transparent')
          ctx.fillStyle = grd
          ctx.fillRect(0, 0, W, H)
        }
      }

      /* Cross-fade flash at transition */
      if (activeOrb >= 0 && activeOrb < 3 && phase === 'inside' && phaseT > 0.82) {
        const flashT        = (phaseT - 0.82) / 0.18
        const [r, g, b]    = POINTS[activeOrb].rgb
        const [nr, ng, nb] = POINTS[activeOrb + 1].rgb
        const fa  = sq(flashT) * 0.10
        const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H) * 0.7)
        grd.addColorStop(0, `rgba(${lerp(r,nr,flashT)|0},${lerp(g,ng,flashT)|0},${lerp(b,nb,flashT)|0},${fa})`)
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
      }

      /* Black arrival overlay — fades out as arrival completes */
      if (arrivalT < 1) {
        ctx.fillStyle = `rgba(2,4,9,${1 - arrivalT})`
        ctx.fillRect(0, 0, W, H)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  const { activeOrb, phase, phaseT } = getSceneState(progress)
  const scrollHintOp = Math.max(0, 1 - eio(slice(progress, 0.04, 0.11)))

  return (
    <>
      <section ref={containerRef} style={{ height: '1500vh', position: 'relative' }}>
        <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden' }}>

          <canvas ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:0 }} />

          <OverviewLabels progress={progress} />
          <TextOverlay activeOrb={activeOrb} phase={phase} phaseT={phaseT} />
          <ChapterDots progress={progress} />

          {/* Scroll hint */}
          <div style={{
            position:'absolute', bottom:26, left:'50%',
            transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            opacity:scrollHintOp, transition:'opacity 0.4s',
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
      </section>

      <style>{`
        @keyframes h2ScrollPulse {
          0%,100%{opacity:.28;transform:scaleY(.85)}
          50%{opacity:1;transform:scaleY(1.15)}
        }
      `}</style>
    </>
  )
}
