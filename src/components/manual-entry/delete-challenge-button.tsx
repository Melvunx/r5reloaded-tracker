"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeManualChallenge } from "@app/actions/challenge";
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

type Props = { id: string; description: string };

export function DeleteChallengeButton({ id, description }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function deleteChallenge() {
    startTransition(async () => {
      try {
        const result = await removeManualChallenge({ id });
        if (result.success) {
          toast.success("Saisie supprimée");
          setOpen(false);
        } else {
          toast.error(result.error);
        }
      } catch (e) {
        console.error("removeManualChallenge", e);
        toast.error("Impossible de supprimer la saisie");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>Supprimer</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette saisie ?</AlertDialogTitle>
          <AlertDialogDescription>
            « {description} » sera supprimée définitivement, et disparaîtra du graphique.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Garder</AlertDialogCancel>
          <Button variant="destructive" onClick={deleteChallenge} disabled={isPending}>
            {isPending ? "Suppression…" : "Supprimer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
