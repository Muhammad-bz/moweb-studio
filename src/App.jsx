import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero1 from './scenes/hero/Hero1'
import Hero2 from './scenes/hero/Hero2'

gsap.registerPlugin(ScrollTrigger)

function App() {
  useEffect(() => {
    gsap.defaults({ ease: 'power3.out' })
  }, [])

  return (
    <main style={{
      background: '#050505',
      color: '#fff',
      overflowX: 'clip',
    }}>
      {/* Story hero — appears first (1100vh) */}
      <Hero1 />
      {/* Points / spheres hero — appears second (1500vh) */}
      <Hero2 />
    </main>
  )
}

export default App
