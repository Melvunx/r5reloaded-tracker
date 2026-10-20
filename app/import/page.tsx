import type { Metadata } from "next";
import { Suspense } from "react";
import { CardSkeleton } from "@/components/card-skeleton";
import { ImportForm } from "@/components/import/import-form";
import { ImportHistory } from "@/components/import/import-history";

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
      <Suspense fallback={<CardSkeleton />}>
        <ImportHistory />
      </Suspense>
    </div>
  );
}
