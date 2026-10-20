"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { FileUpIcon } from "lucide-react";
import { toast } from "sonner";
import { confirmImport, previewImport } from "@app/actions/import";
import { ImportPreview } from "@/components/import/import-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ImportAnalysis } from "@/lib/import-file";
import { MAX_IMPORT_FILE_SIZE } from "@/schema/import";
import { cn } from "@/lib/utils";

function buildFormData(file: File, playedAt: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("playedAt", playedAt);
  return form;
}

// Date locale au format attendu par <input type="date">
const toDateInput = (date: Date) => date.toLocaleDateString("sv-SE");

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Vide tant que l'utilisateur n'a rien saisi : le serveur utilise alors l'horodatage exact de l'export
  const [playedAt, setPlayedAt] = useState("");
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const latestRequest = useRef(0);

  function reset() {
    latestRequest.current++;
    setFile(null);
    setAnalysis(null);
    setError(null);
    setPlayedAt("");
  }

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    reset();
    setImportedCount(null);

    if (selected.size > MAX_IMPORT_FILE_SIZE) {
      setError("Le fichier est trop volumineux (5 Mo max)");
      return;
    }

    setFile(selected);
    const request = ++latestRequest.current;
    startTransition(async () => {
      try {
        const result = await previewImport(buildFormData(selected, ""));
        if (request !== latestRequest.current) return;
        if (result.success) setAnalysis(result.data);
        else setError(result.error);
      } catch (e) {
        console.error("previewImport", e);
        if (request === latestRequest.current) setError("Impossible d'analyser le fichier");
      }
    });
  }

  function confirm() {
    if (!file) return;
    startTransition(async () => {
      try {
        const result = await confirmImport(buildFormData(file, playedAt));
        if (result.success) {
          toast.success(`${result.data.inserted} challenge(s) importé(s)`);
          reset();
          setImportedCount(result.data.inserted);
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      } catch (e) {
        console.error("confirmImport", e);
        setError("Impossible d'importer le fichier");
      }
    });
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fichier d&apos;export</CardTitle>
        <CardDescription>aimtrainer_results_&lt;horodatage&gt;.txt, généré par R5Reloaded.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/50",
            dragging && "border-primary bg-muted/50",
          )}
        >
          <FileUpIcon className="size-6 text-muted-foreground" />
          <span className="font-medium">{file ? file.name : "Dépose un fichier .txt ici ou clique pour le choisir"}</span>
          <input
            type="file"
            accept=".txt,text/plain"
            className="sr-only"
            onChange={(event) => {
              selectFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {isPending && !analysis && <p className="text-sm text-muted-foreground">Analyse du fichier…</p>}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Import impossible</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {importedCount !== null && (
          <Alert>
            <AlertTitle>{importedCount} challenge(s) importé(s)</AlertTitle>
            <AlertDescription>
              <Link href="/dashboard" className={buttonVariants({ variant: "link", className: "h-auto p-0" })}>
                Voir le tableau de bord
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {analysis && (
          <>
            <Field>
              <FieldLabel htmlFor="playedAt">Date de la session</FieldLabel>
              <Input
                id="playedAt"
                type="date"
                className="w-fit"
                value={playedAt || toDateInput(analysis.playedAt)}
                onChange={(event) => setPlayedAt(event.currentTarget.value)}
              />
              <FieldDescription>
                Proposée d&apos;après l&apos;horodatage du fichier. Elle sert aux filtres et au graphique.
              </FieldDescription>
            </Field>
            <ImportPreview analysis={analysis} />
          </>
        )}
      </CardContent>
      {analysis && (
        <CardFooter className="gap-2">
          <Button onClick={confirm} disabled={isPending || analysis.valid.length === 0}>
            {isPending ? "Import en cours…" : `Importer ${analysis.valid.length} ligne(s)`}
          </Button>
          <Button variant="outline" onClick={reset} disabled={isPending}>
            Annuler
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
