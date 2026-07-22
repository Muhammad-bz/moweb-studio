/**
 * Moweb Motion DNA
 * Cinematic — slow, precise, purposeful.
 * Every element combines multiple transforms.
 */

export const ease = {
  cinematic: [0.16, 1, 0.3, 1],
  reveal:    [0.22, 1, 0.36, 1],
  drift:     [0.4, 0, 0.2, 1],
}

export const duration = {
  instant: 0.2,
  fast:    0.5,
  medium:  0.9,
  slow:    1.4,
  cinematic: 2.0,
}

/** Stagger children with cinema pacing */
export const staggerContainer = (stagger = 0.12, delay = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
})

/** Headline reveal — clip-path + translate + blur */
export const headlineReveal = {
  hidden: {
    y: 60,
    opacity: 0,
    filter: 'blur(12px)',
    clipPath: 'inset(0 0 100% 0)',
  },
  show: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    clipPath: 'inset(0 0 0% 0)',
    transition: {
      duration: duration.slow,
      ease: ease.cinematic,
    },
  },
}

/** Drift in from below with scale */
export const driftUp = (delay = 0) => ({
  hidden: { y: 40, opacity: 0, scale: 0.96 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: duration.medium, ease: ease.reveal, delay },
  },
})

/** Horizontal drift */
export const driftLeft = (delay = 0) => ({
  hidden: { x: 40, opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { duration: duration.medium, ease: ease.reveal, delay },
  },
})

/** Ambient float — infinite loop for background orbs */
export const floatLoop = (y = 20, duration_ = 6) => ({
  animate: {
    y: [0, -y, 0],
    transition: {
      duration: duration_,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
})
