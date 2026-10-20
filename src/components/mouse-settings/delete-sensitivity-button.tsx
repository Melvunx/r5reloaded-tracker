"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeSensitivity } from "@app/actions/mouse-settings";
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

type Props = { id: string; label: string };

export function DeleteSensitivityButton({ id, label }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      try {
        const result = await removeSensitivity({ id });
        if (result.success) {
          toast.success("Réglage supprimé");
          setOpen(false);
        } else {
          toast.error(result.error);
        }
      } catch (e) {
        console.error("removeSensitivity", e);
        toast.error("Impossible de supprimer le réglage");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>Supprimer</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce réglage ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le réglage « {label} » sera retiré de l&apos;historique. Les challenges concernés seront rattachés au réglage
            précédent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Garder</AlertDialogCancel>
          <Button variant="destructive" onClick={remove} disabled={isPending}>
            {isPending ? "Suppression…" : "Supprimer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
