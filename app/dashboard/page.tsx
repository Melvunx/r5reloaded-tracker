import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
      <p className="text-muted-foreground">
        Le graphique de progression et les statistiques par arme arrivent bientôt. En attendant, importe tes résultats.
      </p>
      <Link href="/import" className={buttonVariants({ variant: "outline" })}>
        Importer des résultats
      </Link>
    </div>
  );
}
