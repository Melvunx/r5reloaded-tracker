"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

type StaggerProps = HTMLMotionProps<"div"> & {
  /** À true, le groupe n'a pas son propre déclencheur : il suit l'animation du `StaggerItem` parent. */
  nested?: boolean;
};

/** Conteneur dont les `StaggerItem` apparaissent les uns après les autres. */
export function Stagger({ nested = false, ...props }: StaggerProps) {
  return <motion.div variants={container} {...(nested ? {} : { initial: "hidden", animate: "show" })} {...props} />;
}

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={item} {...props} />;
}
