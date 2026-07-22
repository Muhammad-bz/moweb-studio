import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './scenes/hero/Hero'

gsap.registerPlugin(ScrollTrigger)

function App() {
  useEffect(() => {
    gsap.defaults({ ease: 'power3.out' })
  }, [])

  return (
    <main style={{ background: '#050505', color: '#fff', overflowX: 'hidden' }}>
      <Hero />
    </main>
  )
}

export default App
