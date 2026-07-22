import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { headlineReveal, staggerContainer, driftUp, floatLoop, ease, duration } from '../../motion/variants.js'

gsap.registerPlugin(ScrollTrigger)

const WORDS = ['Motion', 'Precision', 'Story']

export default function Hero() {
  const sectionRef = useRef(null)
  const cameraRef = useRef(null)
  const bgRef = useRef(null)
  const midRef = useRef(null)
  const fgRef = useRef(null)
  const taglineRef = useRef(null)
  const wordRefs = useRef([])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const bgX = useTransform(smoothX, [-1, 1], [-18, 18])
  const bgY = useTransform(smoothY, [-1, 1], [-10, 10])
  const midX = useTransform(smoothX, [-1, 1], [-10, 10])
  const midY = useTransform(smoothY, [-1, 1], [-6, 6])
  const fgX = useTransform(smoothX, [-1, 1], [-5, 5])
  const fgY = useTransform(smoothY, [-1, 1], [-3, 3])

  useEffect(() => {
    const section = sectionRef.current
    const camera = cameraRef.current

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.4,
      },
    })

    // Camera zoom
    tl.to(camera, { scale: 1.22, ease: 'none' }, 0)
    tl.to(bgRef.current, { y: '-14%', ease: 'none' }, 0)
    tl.to(midRef.current, { y: '-7%', ease: 'none' }, 0)
    tl.to(fgRef.current, { y: '-3%', ease: 'none' }, 0)
    tl.to(taglineRef.current, { opacity: 0, y: -30, ease: 'none' }, 0)

    // Word cycle
    wordRefs.current.forEach((el, i) => {
      if (!el) return
      tl.fromTo(
        el,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' },
        0.05 + i * 0.28
      )
      if (i < WORDS.length - 1) {
        tl.to(el, { opacity: 0, y: -40, filter: 'blur(10px)', duration: 0.2 }, 0.28 + i * 0.28)
      }
    })

    return () => tl.kill()
  }, [])

  const onMouseMove = (e) => {
    const { innerWidth: w, innerHeight: h } = window
    mouseX.set((e.clientX / w - 0.5) * 2)
    mouseY.set((e.clientY / h - 0.5) * 2)
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      style={{ height: '280vh', position: 'relative' }}
    >
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Camera */}
        <div
          ref={cameraRef}
          style={{
            position: 'absolute', inset: 0,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          {/* Background layer — deep silk waves */}
          <motion.div
            ref={bgRef}
            style={{ x: bgX, y: bgY, position: 'absolute', inset: '-15%', willChange: 'transform' }}
          >
            <motion.div
              {...floatLoop(14, 9)}
              style={{
                width: '100%', height: '100%',
                background: `
                  radial-gradient(ellipse 90% 60% at 20% 80%, rgba(255,255,255,0.055) 0%, transparent 70%),
                  radial-gradient(ellipse 70% 50% at 80% 30%, rgba(255,255,255,0.04) 0%, transparent 65%),
                  radial-gradient(ellipse 120% 80% at 50% 110%, rgba(255,255,255,0.06) 0%, transparent 60%),
                  #050505
                `,
              }}
            />
          </motion.div>

          {/* Silk wave SVG — mid layer */}
          <motion.div
            ref={midRef}
            style={{ x: midX, y: midY, position: 'absolute', inset: 0, willChange: 'transform' }}
          >
            <svg
              viewBox="0 0 1440 900"
              preserveAspectRatio="xMidYMid slice"
              style={{ width: '100%', height: '100%', opacity: 0.35 }}
            >
              <defs>
                <radialGradient id="silk1" cx="30%" cy="70%" r="60%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="silk2" cx="75%" cy="35%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path
                d="M0,600 C200,520 400,700 720,580 C1040,460 1240,640 1440,560 L1440,900 L0,900Z"
                fill="url(#silk1)"
              />
              <path
                d="M0,680 C300,600 600,780 900,660 C1200,540 1320,700 1440,640 L1440,900 L0,900Z"
                fill="url(#silk2)"
              />
              <path
                d="M-100,200 C200,140 500,320 800,200 C1100,80 1300,260 1540,180"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M-100,350 C250,290 550,440 850,330 C1150,220 1300,380 1540,310"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </motion.div>

          {/* Foreground grain vignette */}
          <motion.div
            ref={fgRef}
            style={{ x: fgX, y: fgY, position: 'absolute', inset: 0, willChange: 'transform', pointerEvents: 'none' }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.72) 100%)',
            }} />
          </motion.div>
        </div>

        {/* UI layer — fixed above camera */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: ease.cinematic, delay: 0.2 }}
            style={{ position: 'absolute', top: 32, left: 40, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.01em', color: '#fff' }}>Moweb</span>
            <span style={{ fontWeight: 300, fontSize: 15, letterSpacing: '0.01em', color: 'rgba(255,255,255,0.5)' }}>Studio</span>
          </motion.div>

          {/* Central text stack */}
          <div style={{ textAlign: 'center', userSelect: 'none' }}>

            {/* Overline */}
            <motion.p
              variants={driftUp(0.3)}
              initial="hidden"
              animate="show"
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 28,
              }}
            >
              Motion-First Web Studio
            </motion.p>

            {/* Headline */}
            <motion.div
              variants={staggerContainer(0.14, 0.5)}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                variants={headlineReveal}
                style={{
                  fontSize: 'clamp(52px, 9vw, 128px)',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: '#fff',
                  margin: 0,
                }}
              >
                Get Your Own
              </motion.h1>

              {/* Cycling word */}
              <div style={{ position: 'relative', height: 'clamp(60px, 10vw, 140px)', overflow: 'hidden', marginTop: 4 }}>
                {WORDS.map((word, i) => (
                  <div
                    key={word}
                    ref={el => wordRefs.current[i] = el}
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(52px, 9vw, 128px)',
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      opacity: 0,
                      willChange: 'transform, opacity, filter',
                    }}
                  >
                    {word}
                  </div>
                ))}
              </div>

              <motion.h1
                variants={headlineReveal}
                style={{
                  fontSize: 'clamp(52px, 9vw, 128px)',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: '#fff',
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Website
              </motion.h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              ref={taglineRef}
              variants={driftUp(1.0)}
              initial="hidden"
              animate="show"
              style={{
                marginTop: 36,
                fontSize: 'clamp(14px, 1.8vw, 20px)',
                fontWeight: 300,
                letterSpacing: '0.04em',
                color: 'rgba(255,255,255,0.42)',
              }}
            >
              Built for speed.&nbsp; Designed to convert.
            </motion.p>

            {/* CTA */}
            <motion.div
              variants={driftUp(1.3)}
              initial="hidden"
              animate="show"
              style={{ marginTop: 52, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}
            >
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: '#fff', color: '#000' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.28, ease: ease.drift }}
                style={{
                  padding: '14px 36px',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  background: 'transparent',
                  color: '#fff',
                  fontSize: 13,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Start Your Project
              </motion.button>
              <motion.button
                whileHover={{ opacity: 1, x: 4 }}
                transition={{ duration: 0.22 }}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                See Work <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            style={{ position: 'absolute', bottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }}
            />
          </motion.div>

          {/* Contact strip — bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1.2 }}
            style={{
              position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 40,
              whiteSpace: 'nowrap',
            }}
          >
            {[
              { label: 'Instagram', value: '@themowebstudio' },
              { label: 'WhatsApp', value: '+92 312 4919510' },
              { label: 'Email', value: 'themowebstudio@gmail.com' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>{value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
