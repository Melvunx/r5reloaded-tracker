import type { Metadata } from "next";
import { Suspense } from "react";
import { CardSkeleton } from "@/components/card-skeleton";
import { SensitivityForm } from "@/components/mouse-settings/sensitivity-form";
import { SensitivityHistory } from "@/components/mouse-settings/sensitivity-history";
import { listSensitivities } from "@/lib/sensitivity-service";

export const metadata: Metadata = { title: "Réglages souris" };

async function MouseSettingsContent() {
  const sensitivities = await listSensitivities();
  // Le formulaire démarre sur le dernier réglage saisi : un changement se résume souvent à une seule valeur
  const latest = sensitivities[0];

  return (
    <>
      <SensitivityForm defaultDpi={latest?.mouseDpi ?? 800} defaultSensitivity={latest?.mouseSensitivity ?? 1} />
      <SensitivityHistory sensitivities={sensitivities} />
    </>
  );
}

export default function MouseSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Réglages souris</h1>
        <p className="text-muted-foreground">
          Garde l&apos;historique de ton DPI et de ta sensibilité pour relier ta progression à tes réglages.
        </p>
      </div>
      <Suspense
        fallback={
          <>
            <CardSkeleton rows={3} />
            <CardSkeleton />
          </>
        }
      >
        <MouseSettingsContent />
      </Suspense>
    </div>
  );
}
