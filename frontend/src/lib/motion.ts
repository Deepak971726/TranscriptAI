import type { Variants } from "framer-motion"

export const easeOut = [0.22, 1, 0.36, 1] as const

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: { duration: 0.18, ease: "easeIn" },
  },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: easeOut },
  },
}

export const hoverLift = {
  y: -3,
  transition: { duration: 0.2, ease: easeOut },
}
