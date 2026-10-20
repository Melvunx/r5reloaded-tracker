import type { Metadata } from "next";
import { Suspense } from "react";
import { ManualEntryHistory } from "@/components/manual-entry/manual-entry-history";
import { ManualEntryForm } from "@/components/manual-entry/manual-entry-form";

export const metadata: Metadata = { title: "Saisie manuelle" };

export default function ManualEntryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Saisie manuelle</h1>
        <p className="text-muted-foreground">
          Ajoute un challenge sans passer par un export, par exemple une partie jouée hors R5Reloaded.
        </p>
      </div>
      <ManualEntryForm />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement de l&apos;historique…</p>}>
        <ManualEntryHistory />
      </Suspense>
    </div>
  );
}
