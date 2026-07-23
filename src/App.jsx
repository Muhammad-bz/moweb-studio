import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './scenes/hero/Navbar'
import Hero1  from './scenes/hero/Hero1'
import Hero2  from './scenes/hero/Hero2'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [hero1Done, setHero1Done] = useState(false)

  useEffect(() => {
    gsap.defaults({ ease: 'power3.out' })
  }, [])

  return (
    <main style={{
      background: '#050505',
      color: '#fff',
      overflowX: 'clip',
    }}>
      <Navbar />

      {/* active=!hero1Done so Hero1 stops intercepting wheel when Hero2 is live */}
      <Hero1
        onComplete={() => setHero1Done(true)}
        resumeFromEnd={hero1Done}
        active={!hero1Done}
      />

      <Hero2
        active={hero1Done}
        onExit={() => setHero1Done(false)}
      />
    </main>
  )
}

export default App
