"use client";

import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";
import { addManualChallenge } from "@app/actions/challenge";
import { WeaponImage } from "@/components/weapon-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEAPON_TYPE, WEAPONS, WEAPONS_BY_TYPE, type Weapon } from "@/config/apex-weapons.config";

const DEFAULT_CHALLENGE_NAME = "STRAFING DUMMY";

type Numbers = { shotsHit: string; totalShots: string; criticalShots: string; kills: string; damage: string; roundtime: string };

const EMPTY_NUMBERS: Numbers = { shotsHit: "", totalShots: "", criticalShots: "", kills: "", damage: "", roundtime: "60" };

const NUMBER_FIELDS: { name: keyof Numbers; label: string }[] = [
  { name: "shotsHit", label: "Tirs touchés" },
  { name: "totalShots", label: "Tirs totaux" },
  { name: "criticalShots", label: "Tirs critiques" },
  { name: "kills", label: "Kills" },
  { name: "damage", label: "Dégâts" },
  { name: "roundtime", label: "Durée (secondes)" },
];

function WeaponOption({ weapon }: { weapon: Weapon }) {
  return (
    <span className="flex items-center gap-2">
      <WeaponImage weapon={weapon} />
      {weapon.name}
    </span>
  );
}

const WEAPON_PLACEHOLDER = "Choisir une arme";

// Valeur affichée dans le bouton une fois l'arme choisie (Base UI relie la valeur au contenu via `items`) ;
// `null` = aucune arme, pour revenir au choix par défaut
const WEAPON_ITEMS = [
  { value: null, label: WEAPON_PLACEHOLDER },
  ...WEAPONS.map((weapon) => ({ value: weapon.slug, label: <WeaponOption weapon={weapon} /> })),
];

/** Précision calculée depuis les tirs : c'est elle qui est envoyée, l'utilisateur ne la saisit pas. */
function computeAccuracy({ shotsHit, totalShots }: Numbers) {
  const hit = Number(shotsHit);
  const total = Number(totalShots);
  if (shotsHit === "" || totalShots === "" || !(total > 0) || hit < 0) return null;
  return Math.round((hit / total) * 10000) / 100;
}

export function ManualEntryForm() {
  const [weapon, setWeapon] = useState<string | null>(null);
  const [challengeName, setChallengeName] = useState(DEFAULT_CHALLENGE_NAME);
  const [numbers, setNumbers] = useState<Numbers>(EMPTY_NUMBERS);
  // Vide = maintenant
  const [playedAt, setPlayedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const accuracy = computeAccuracy(numbers);

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    // Une date seule est lue en UTC minuit : pour aujourd'hui on envoie l'instant présent, sinon le serveur
    // la prendrait pour une date future selon le fuseau horaire.
    const today = new Date().toLocaleDateString("sv");
    const date = playedAt === "" || playedAt === today ? new Date().toISOString() : playedAt;

    startTransition(async () => {
      try {
        const result = await addManualChallenge({
          challengeName,
          weapon: weapon ?? "",
          ...numbers,
          accuracy: accuracy === null ? "" : String(accuracy),
          playedAt: date,
        });
        if (result.success) {
          toast.success("Challenge enregistré");
          // On garde le challenge, la date et la durée (on enchaîne souvent plusieurs parties de suite) ; l'arme se remet à zéro
          setWeapon(null);
          setNumbers((current) => ({ ...EMPTY_NUMBERS, roundtime: current.roundtime }));
        } else {
          setError(result.error);
        }
      } catch (e) {
        console.error("addManualChallenge", e);
        setError("Impossible d'enregistrer le challenge");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau challenge</CardTitle>
        <CardDescription>
          La précision est calculée à partir des tirs touchés et totaux, comme dans les exports.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="weapon">Arme</FieldLabel>
              <Select items={WEAPON_ITEMS} value={weapon} onValueChange={setWeapon}>
                <SelectTrigger id="weapon" className="w-64">
                  <SelectValue placeholder={WEAPON_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{WEAPON_PLACEHOLDER}</SelectItem>
                  {(Object.keys(WEAPONS_BY_TYPE) as (keyof typeof WEAPONS_BY_TYPE)[]).map((type) => (
                    <SelectGroup key={type}>
                      <SelectLabel>{WEAPON_TYPE[type]}</SelectLabel>
                      {WEAPONS_BY_TYPE[type].map((item) => (
                        <SelectItem key={item.slug} value={item.slug}>
                          <WeaponOption weapon={item} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="challengeName">Challenge</FieldLabel>
              <Input
                id="challengeName"
                className="w-64"
                value={challengeName}
                onChange={(event) => setChallengeName(event.currentTarget.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {NUMBER_FIELDS.map(({ name, label }) => (
                <Field key={name}>
                  <FieldLabel htmlFor={name}>{label}</FieldLabel>
                  <Input
                    id={name}
                    inputMode="numeric"
                    value={numbers[name]}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setNumbers((current) => ({ ...current, [name]: value }));
                    }}
                  />
                </Field>
              ))}
            </div>
            <Field>
              <FieldLabel htmlFor="playedAt">Date de la session</FieldLabel>
              <Input
                id="playedAt"
                type="date"
                className="w-fit"
                value={playedAt}
                onChange={(event) => setPlayedAt(event.currentTarget.value)}
              />
              <FieldDescription>Laisse vide pour aujourd&apos;hui.</FieldDescription>
            </Field>
          </FieldGroup>

          {accuracy !== null && (
            <p className="text-sm text-muted-foreground">
              Précision : <strong className="text-foreground">{accuracy.toFixed(2)} %</strong>
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
