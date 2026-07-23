import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './scenes/hero/Navbar'
import Hero1  from './scenes/hero/Hero1'
import Hero2  from './scenes/hero/Hero2'

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
      {/* Single shared nav — fixed, above everything */}
      <Navbar />

      {/* Story hero (1100vh) → warp exit → */}
      <Hero1 />

      {/* Sphere hero (1500vh) ← arrival burst ← */}
      <Hero2 />
    </main>
  )
}

export default App
