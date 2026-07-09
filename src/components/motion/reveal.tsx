"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: RevealProps) {
  const shouldUseViewport = typeof IntersectionObserver !== "undefined";

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      whileInView={shouldUseViewport ? { opacity: 1, y: 0 } : undefined}
      viewport={shouldUseViewport ? { once: true, amount: 0.2 } : undefined}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
