/**
 * motion/variants.js
 * Moweb Studio — shared motion tokens
 *
 * Note: Hero.jsx now manages all its own scroll-driven transforms inline
 * for maximum precision. These variants are kept for other components
 * (cards, nav, footers, etc.) that still benefit from declarative Framer Motion.
 */

/* ─── Easing curves ────────────────────────────────────────────── */
export const ease = {
  cinematic : [0.16, 1, 0.3, 1],
  drift     : [0.25, 0.46, 0.45, 0.94],
  snap      : [0.4, 0, 0.2, 1],
  smooth    : [0.43, 0.13, 0.23, 0.96],
}

export const duration = {
  fast   : 0.25,
  base   : 0.55,
  slow   : 1.00,
  cinema : 1.40,
}

/* ─── Reusable variants ────────────────────────────────────────── */

/**
 * Stagger container — wraps children that use motion variants
 * @param {number} stagger  delay between children (seconds)
 * @param {number} delay    initial delay before first child
 */
export const staggerContainer = (stagger = 0.1, delay = 0) => ({
  hidden : {},
  show   : {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
})

/**
 * Single line / element drift upward
 * @param {number} delay
 */
export const driftUp = (delay = 0) => ({
  hidden : { opacity: 0, y: 24 },
  show   : {
    opacity: 1,
    y      : 0,
    transition: { duration: duration.slow, ease: ease.cinematic, delay },
  },
})

/**
 * Headline reveal — slides up from a clipped container
 */
export const headlineReveal = {
  hidden : { opacity: 0, y: '105%' },
  show   : {
    opacity: 1,
    y      : '0%',
    transition: { duration: duration.cinema, ease: ease.cinematic },
  },
}

/**
 * Ambient float loop — subtle continuous vertical oscillation
 * Use as spread props: <motion.div {...floatLoop(14, 9)} />
 *
 * @param {number} duration  seconds for one full loop
 * @param {number} distance  pixels of travel
 */
export const floatLoop = (dur = 12, distance = 8) => ({
  animate  : { y: [0, -distance, 0] },
  transition: {
    duration : dur,
    repeat   : Infinity,
    ease     : 'easeInOut',
  },
})

/**
 * Fade in — simple opacity entrance
 */
export const fadeIn = (delay = 0, dur = duration.base) => ({
  hidden : { opacity: 0 },
  show   : {
    opacity: 1,
    transition: { duration: dur, ease: ease.drift, delay },
  },
})

/**
 * Scale up from slightly small
 */
export const scaleUp = (delay = 0) => ({
  hidden : { opacity: 0, scale: 0.94 },
  show   : {
    opacity: 1,
    scale  : 1,
    transition: { duration: duration.slow, ease: ease.cinematic, delay },
  },
})
