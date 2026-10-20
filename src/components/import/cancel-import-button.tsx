"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteImportBatch } from "@app/actions/import";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = { id: string; fileName: string; challengeCount: number };

export function CancelImportButton({ id, fileName, challengeCount }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function cancelImport() {
    startTransition(async () => {
      try {
        const result = await deleteImportBatch({ id });
        if (result.success) {
          toast.success(`Import annulé : ${result.data.deleted} challenge(s) supprimé(s)`);
          setOpen(false);
        } else {
          toast.error(result.error);
        }
      } catch (e) {
        console.error("deleteImportBatch", e);
        toast.error("Impossible d'annuler l'import");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>Annuler cet import</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cet import ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les {challengeCount} challenge(s) de « {fileName} » seront supprimés définitivement. Tu pourras réimporter le
            fichier ensuite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Garder</AlertDialogCancel>
          <Button variant="destructive" onClick={cancelImport} disabled={isPending}>
            {isPending ? "Suppression…" : "Supprimer l'import"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
