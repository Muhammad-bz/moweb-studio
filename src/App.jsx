import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './scenes/hero/Navbar'
import Hero  from './scenes/hero/Hero'

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
      minHeight: '100vh',
    }}>
      <Navbar />
      <Hero />
    </main>
  )
}

export default App
