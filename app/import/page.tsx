import type { Metadata } from "next";
import { ImportForm } from "@/components/import/import-form";

export const metadata: Metadata = { title: "Importer des résultats" };

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Importer des résultats</h1>
        <p className="text-muted-foreground">
          Dépose un export R5Reloaded (.txt). Tu pourras vérifier les lignes avant l&apos;enregistrement.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
