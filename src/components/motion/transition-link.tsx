"use client";

import { animate } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

const EXIT_DURATION = 0.15;

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * Lien qui fait sortir la page courante (fondu + léger glissement) avant de naviguer ; l'entrée est jouée par
 * `PageTransition`. Le routeur de Next démonte l'ancienne page immédiatement, donc une vraie animation de sortie
 * (AnimatePresence) n'est pas possible sans s'appuyer sur des API internes : on joue la sortie avant `router.push`.
 * Clic modifié (nouvel onglet…), même page ou animations réduites : navigation normale.
 */
export function TransitionLink({ href, onClick, ...props }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const plainClick =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.defaultPrevented;
    const page = document.querySelector<HTMLElement>("[data-page]");
    const samePage = href.split(/[?#]/)[0] === pathname;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!plainClick || !page || samePage || reduceMotion) return;

    event.preventDefault();
    await animate(page, { opacity: 0, y: -8 }, { duration: EXIT_DURATION, ease: "easeIn" });
    router.push(href);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
