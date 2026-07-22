import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function App() {
  useEffect(() => {
    // Global GSAP defaults
    gsap.defaults({ ease: 'power3.out' })
  }, [])

  return (
    <main className="bg-void text-pure overflow-x-hidden">
      {/* Scenes mount here — one at a time */}
    </main>
  )
}

export default App
