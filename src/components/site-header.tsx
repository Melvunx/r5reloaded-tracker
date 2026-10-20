import { TransitionLink } from "@/components/motion/transition-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/import", label: "Importer" },
  { href: "/manual-entry", label: "Saisie" },
  { href: "/mouse-settings", label: "Souris" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <TransitionLink href="/" className="font-semibold tracking-tight">
          R5 Apex Tracker
        </TransitionLink>
        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <TransitionLink key={href} href={href} className={buttonVariants({ variant: "ghost" })}>
              {label}
            </TransitionLink>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
