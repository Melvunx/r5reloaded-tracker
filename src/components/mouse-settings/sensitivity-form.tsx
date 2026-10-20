"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { saveSensitivity } from "@app/actions/mouse-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cmPer360, edpi } from "@/lib/mouse";

type Props = { defaultDpi: number; defaultSensitivity: number };

export function SensitivityForm({ defaultDpi, defaultSensitivity }: Props) {
  const [dpi, setDpi] = useState(String(defaultDpi));
  const [sensitivity, setSensitivity] = useState(String(defaultSensitivity));
  // Vide = aujourd'hui côté serveur
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Aperçu en direct : seulement quand les deux valeurs sont des nombres exploitables
  const dpiValue = Number(dpi);
  const sensitivityValue = Number(sensitivity.replace(",", "."));
  const hasPreview = dpiValue > 0 && sensitivityValue > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveSensitivity({ mouseDpi: dpi, mouseSensitivity: sensitivity, effectiveFrom });
        if (result.success) {
          toast.success("Réglages enregistrés");
          setEffectiveFrom("");
        } else {
          setError(result.error);
        }
      } catch (e) {
        console.error("saveSensitivity", e);
        setError("Impossible d'enregistrer les réglages");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau réglage</CardTitle>
        <CardDescription>
          Chaque changement est ajouté à l&apos;historique : tes anciens challenges gardent les réglages qu&apos;ils avaient.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mouseDpi">DPI de la souris</FieldLabel>
              <Input
                id="mouseDpi"
                inputMode="numeric"
                className="w-40"
                value={dpi}
                onChange={(event) => setDpi(event.currentTarget.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="mouseSensitivity">Sensibilité dans Apex</FieldLabel>
              <Input
                id="mouseSensitivity"
                inputMode="decimal"
                className="w-40"
                value={sensitivity}
                onChange={(event) => setSensitivity(event.currentTarget.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="effectiveFrom">Appliqué depuis le</FieldLabel>
              <Input
                id="effectiveFrom"
                type="date"
                className="w-fit"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.currentTarget.value)}
              />
              <FieldDescription>Laisse vide pour aujourd&apos;hui. Tu peux saisir une date passée.</FieldDescription>
            </Field>
          </FieldGroup>

          {hasPreview && (
            <p className="text-sm text-muted-foreground">
              eDPI <strong className="text-foreground">{Math.round(edpi(dpiValue, sensitivityValue))}</strong> ·{" "}
              <strong className="text-foreground">{cmPer360(dpiValue, sensitivityValue).toFixed(1)} cm</strong> pour 360°
            </p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Enregistrement impossible</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
