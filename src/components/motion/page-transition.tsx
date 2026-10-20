"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Entrée de page. Utilisé par `app/template.tsx`, qui est remonté à chaque navigation (contrairement au layout) :
 * l'animation se rejoue donc à chaque changement de route. `data-page` sert de cible à la sortie de `TransitionLink`.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-page
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
