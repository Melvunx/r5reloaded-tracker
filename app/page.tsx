import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    title: "1. Exporter depuis R5Reloaded",
    description:
      "Termine tes challenges dans l'Aim Trainer : R5Reloaded écrit un fichier aimtrainer_results_<horodatage>.txt avec tes résultats.",
  },
  {
    title: "2. Importer le fichier",
    description:
      "Dépose le .txt dans la page Importer. Tu vois un aperçu (lignes valides, invalides, doublons) avant que quoi que ce soit soit enregistré.",
  },
  {
    title: "3. Suivre ta progression",
    description:
      "Le tableau de bord affiche ta précision au fil du temps, filtrable par arme, catégorie et période, avec les stats détaillées de chaque arme.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">R5 Apex Tracker</h1>
        <p className="max-w-2xl text-muted-foreground">
          Un tracker local de mes sessions d&apos;entraînement à l&apos;aim sur Apex Legends via R5Reloaded. Mes données
          restent sur ma machine : pas de compte, pas de déploiement.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/import" className={buttonVariants({ size: "lg" })}>
            Importer des résultats
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Tableau de bord
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Comment l&apos;utiliser</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ title, description }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
