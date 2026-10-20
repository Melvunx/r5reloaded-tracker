import type { Metadata } from "next";
import { Black_Ops_One, Inter, JetBrains_Mono, Rajdhani, Russo_One } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Combinaison « Militaire » : titres Rajdhani, texte Inter, chiffres JetBrains Mono ; Black Ops One et Russo One
// sont réservées aux noms des armes favorites (cf. `[data-favorite]` dans globals.css)
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], weight: ["500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const blackOpsOne = Black_Ops_One({ variable: "--font-black-ops-one", subsets: ["latin"], weight: "400" });
const russoOne = Russo_One({ variable: "--font-russo-one", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "R5 Apex Tracker",
  description: "Suivi local de mes sessions d'entraînement à l'aim sur Apex Legends via R5Reloaded.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${rajdhani.variable} ${jetbrainsMono.variable} ${blackOpsOne.variable} ${russoOne.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
