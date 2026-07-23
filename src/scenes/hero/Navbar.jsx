/**
 * Navbar.jsx — Fixed shared nav for Moweb Studio
 *
 * Sits above both heroes at z-index:50.
 * Hides itself during the Hero1→Hero2 warp transition (progress 0.88–1.05)
 * so it doesn't visually interrupt the space-dive.
 * Reappears cleanly once Hero2 has established itself.
 *
 * Usage:
 *   import Navbar from './Navbar'
 *   <Navbar />   ← render once in App.jsx, outside of any hero
 */

import { useEffect, useState } from 'react'

export default function Navbar() {
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // total scroll progress across BOTH sections (1100+1500 = 2600vh)
      const totalH = document.documentElement.scrollHeight - window.innerHeight
      const p      = totalH > 0 ? window.scrollY / totalH : 0

      // Hero1 ends around its own 1100vh → fraction of total
      // 1100 / 2600 ≈ 0.423; transition window 0.38–0.44 → hide nav
      const hero1Frac = 1100 / 2600
      const hideStart = hero1Frac - 0.05
      const hideEnd   = hero1Frac + 0.04

      setVisible(p < hideStart || p > hideEnd)
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     50,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding:    '20px 24px',
        // subtle blur-glass on scroll
        background:    scrolled ? 'rgba(6,6,6,0.55)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'opacity 0.55s ease, background 0.4s',
        opacity:    visible ? 1 : 0,
        pointerEvents: visible ? 'all' : 'none',
        userSelect: 'none',
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>MOWEB</span>
          <span style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>STUDIO</span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 28 }}>
          {['Work', 'Process', 'Contact'].map(l => (
            <span
              key={l}
              className="mw-nav-link"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.28)',
                cursor: 'pointer',
              }}
            >{l}</span>
          ))}
        </div>
      </nav>

      <style>{`
        @media (max-width: 600px) {
          .mw-nav-link { display: none !important; }
        }
        .mw-nav-link:hover { color: rgba(255,255,255,0.75) !important; transition: color 0.2s; }
      `}</style>
    </>
  )
}
