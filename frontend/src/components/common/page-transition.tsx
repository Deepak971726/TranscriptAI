import { motion } from "framer-motion"
import type { PropsWithChildren } from "react"
import { pageVariants, staggerContainer } from "@/lib/motion"

export function PageTransition({ children }: PropsWithChildren) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-w-0"
    >
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="min-w-0">
        {children}
      </motion.div>
    </motion.div>
  )
}
