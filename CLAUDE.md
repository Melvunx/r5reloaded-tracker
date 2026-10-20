# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# R5 Apex Tracker (v3, reprise de zéro)

Langue du projet : **français** (UI, messages d'erreur, commentaires). Code et noms de variables en anglais.

@AGENTS.md

## État du dépôt

Scaffold `create-next-app` + `shadcn init` faits. `src/` existe (`components/ui`, `lib/`, `config/`, `schema/`) ; alias `@/*` → `./src/*` et `@app/*` → `./app/*` configurés dans `tsconfig.json`.

Installé : Next 16.4, React 19.3, Tailwind 4, shadcn, `@base-ui/react`, `lucide-react`, Prisma 7 (CLI épinglé en
7.10.1 : le tag `latest` de `prisma` pointe sur une RC 8), Zod 4, Vitest. Sonner et `next-themes` (dépendance de sonner) installés. Pas encore installés (**cible**) :
Recharts, `motion` ; vérifier `package.json` avant de supposer qu'une dépendance existe.
Étapes 1 à 4 du plan faites ; schémas Zod et tests dans `src/schema/`. Étape 5 : parser, actions `previewImport` / `confirmImport`
et page `/import` (envoi + aperçu) faits ; reste l'historique des imports et « Annuler cet import ».
Routes : `/` = présentation de l'app et mode d'emploi, `/dashboard` = tableau de bord (placeholder pour l'instant), `/import`.
Le `README.md` décrit déjà l'app finie.

---

## 1. Objectif

Application **100 % locale et mono‑utilisateur** pour suivre mes sessions d'entraînement à l'aim sur
**Apex Legends via R5Reloaded**. Pas d'auth, pas de déploiement.

- Importer les exports R5Reloaded (`.txt` au format CSV) ou saisir une entrée à la main
- Graphique de progression (shadcn `chart` + Recharts) filtrable par arme, catégorie, période (1 jour / 1 semaine / 1 mois / tout) et type de challenge
- Stats par arme, notamment la précision pondérée

## 2. Stack

| Domaine | Choix |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions), React 19, TypeScript strict |
| Paquets | **pnpm** |
| BDD / ORM | **PostgreSQL** (Docker) + **Prisma 7** (`prisma.config.ts`, `@prisma/adapter-pg`) |
| Validation | **Zod 4** : toute donnée entrante (fichier, formulaire, paramètres d'action) |
| UI | **shadcn/ui** (style `base-nova`, `@base-ui/react`, baseColor `neutral`), Tailwind 4, `lucide-react` |
| Graphiques | shadcn `chart` + **Recharts 3** |
| Divers | `sonner`, `next-themes`, `motion` |

> ⚠️ Next.js 16 a des changements cassants (ex. `middleware.ts` → `proxy.ts`). **Lire
> `node_modules/next/dist/docs/` avant d'écrire du code Next** (voir `AGENTS.md`).

## 3. Commandes

```bash
pnpm install
docker compose up -d            # Postgres local
pnpm prisma migrate dev --name <nom>   # puis: pnpm prisma generate  (client dans app/generated/prisma)
pnpm prisma db seed
pnpm dev                        # http://localhost:3000
pnpm lint
pnpm typecheck                  # tsc --noEmit
pnpm test                       # vitest run ; un seul fichier : pnpm test src/schema/challenge.test.ts
```

`.env` (jamais commité), validé par Zod dans `src/lib/env.ts` :
```env
DATABASE_URL="postgresql://apex:apex@localhost:5432/apex_tracker"
VERIF_LINE="<texte de la 1re ligne de l'export R5Reloaded>"
```

Environnement : le projet est sous `/mnt/c` (WSL) → CRLF possible, et le hot reload peut rater les
changements (`WATCHPACK_POLLING=true pnpm dev`).

---

## 4. Acquis de la v2 à réutiliser

- **Format d'import** (vérifié sur un vrai export, `src/data/aimtrainer_results_*.txt`) : fichier `.txt` lu côté
  serveur, fins de ligne `\r\n`. Ligne 1 = signature contenant `VERIF_LINE` (espace final), **ligne 2 vide**, ligne 3 =
  en‑têtes `ChallengeName, ShotsHit, Kills, Weapon, Accuracy, Damage, CriticalShots, TotalShots, Roundtime ` (séparateur
  `, ` et espace final : tout est trimé, ordre des colonnes libre). Ensuite une ligne CSV par challenge ; `Accuracy`
  accepte `"45.2%"` ou `45.2`. Le nom du fichier contient le timestamp Unix de l'export
  (`aimtrainer_results_1792494390.txt`) : `getExportDate()` (`src/lib/export-date.ts`) fournit la date de session par défaut, avant « aujourd'hui ». Lignes invalides
  ignorées et listées (`Ligne N : …`, numéro réel du fichier), lignes valides insérées via `createMany`. Deux lignes
  strictement identiques dans un même fichier sont des doublons : la 1re est gardée, les autres vont dans `duplicates`.
- **Config armes** : 24 armes (`name`, `slug`, `type` ∈ PISTOL, SMG, AR, LMG, MARKSMAN, SNIPER, SHOTGUN), libellés FR
  des catégories, helpers `getWeaponByName`, `getWeaponImagePath(type, slug)` → `/apex-weapons/<type>/<slug>.png`,
  `getWeaponBadgePath(slug)` → `/apex-weapons/badges/<slug>.webp`. Images à reprendre telles quelles dans
  `public/apex-weapons/`. Config v3 : `src/config/apex-weapons.config.ts` (+ `utils.config.ts`), source unique de vérité.
- **Retour des Server Actions** : `ActionResult<T> = { success: true; data: T } | { success: false; error: string }`.

## 5. Pièges de la v2 à ne pas reproduire

1. **Date de session = date d'import** → utiliser `playedAt` (saisissable à l'import), jamais `createdAt`, pour les filtres.
2. **`weapon` en `String` libre** → table `Weapon` + enum Zod depuis la config + alias (`"R-99"`, `"r99"`…).
3. **Ids `cuid` validés par `z.uuid()`** → utiliser le validateur cohérent avec Prisma.
4. **Précision moyenne = moyenne de pourcentages** (biaisée) → toujours `SUM(shotsHit) / SUM(totalShots) × 100`.
5. **Doublons à la réimportation** → `ImportBatch.fileHash` (SHA‑256) `@unique`.
6. **Filtrage client** de données rechargées à chaque changement → filtrer côté serveur (`where` Prisma), filtres dans les `searchParams`.
7. **Parsing par `split(",")`** → gérer champs avec virgule et `\r\n`.
8. `better-auth`, `adapter-neon`, middleware d'auth, carrousel : ne pas reprendre.

---

## 6. Modèle de données cible

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum WeaponType {
  PISTOL
  SMG
  AR
  LMG
  MARKSMAN
  SNIPER
  SHOTGUN
}

model Weapon {
  id         String      @id            // slug canonique : "r99", "wingman"…
  name       String      @unique        // "R-99"
  type       WeaponType
  aliases    String[]                   // noms rencontrés dans les exports R5Reloaded
  challenges Challenge[]

  @@map("weapons")
}

model ImportBatch {
  id         String      @id @default(cuid())
  fileName   String      @map("file_name")
  fileHash   String      @unique @map("file_hash")
  importedAt DateTime    @default(now()) @map("imported_at")
  challenges Challenge[]

  @@map("import_batches")
}

model Challenge {
  id            String       @id @default(cuid())
  challengeName String       @map("challenge_name")
  weaponId      String       @map("weapon_id")
  weapon        Weapon       @relation(fields: [weaponId], references: [id])
  shotsHit      Int          @map("shots_hit")
  totalShots    Int          @map("total_shots")
  criticalShots Int          @map("critical_shots")
  kills         Int
  damage        Int
  accuracy      Float        // en %, recalculé/validé à l'import
  roundtime     Int          // en secondes
  playedAt      DateTime     @map("played_at")
  createdAt     DateTime     @default(now()) @map("created_at")
  source        String       @default("import")     // "import" | "manual"
  batchId       String?      @map("batch_id")
  batch         ImportBatch? @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@index([weaponId, playedAt])
  @@index([challengeName, playedAt])
  @@map("challenges")
}
```

Armes insérées par `prisma/seed.ts` depuis la config TS. Supprimer un `ImportBatch` supprime ses challenges.

## 7. Validation Zod

- Schémas dans `src/schema/` : `weapon.ts` (`WEAPON_SLUGS`, `resolveWeaponSlug`, alias), `challenge.ts`, `import.ts`, `filters.ts`. Les schémas d'arme et de stats restent dans `src/config/apex-weapons.config.ts` ; le schéma des variables d'environnement est dans `src/lib/env.ts`.
- **Une Server Action reçoit `unknown` et commence par `safeParse`.**
- Enums dérivés de la config (`WEAPON_SLUGS`), types **inférés** (`z.infer`/`z.input`/`z.output`), jamais déclarés à la main.
- Ligne importée : `z.coerce` pour les nombres, entiers ≥ 0, `roundtime > 0`, puis `.superRefine()` :
  `shotsHit ≤ totalShots`, `criticalShots ≤ shotsHit`, précision cohérente à ±0,5 %. Arme inconnue (après alias) → erreur explicite.
- Messages d'erreur **en français**, avec numéro de ligne pour l'import.
- Filtres du graphique : `ChartFiltersSchema` (`weapon`, `weaponType`, `range` ∈ `1d|1w|1m|all` défaut `1w`, `challenge?`)
  parsé depuis `searchParams` ; valeur invalide → défaut, pas de crash.

## 8. Fonctionnalités

- **Page `/`** : présentation de l'application et comment l'utiliser (3 étapes). Le dashboard est sur `/dashboard`.
- **Import** (`/import`) : drag & drop `.txt`, vérif signature + en‑têtes, **aperçu avant insertion** (valides / invalides, champ `playedAt` défaut = aujourd'hui), refus si hash déjà importé, historique avec « Annuler cet import ».
- **Saisie manuelle** : formulaire shadcn (`Field`, `Input`, `Select` d'arme avec image), même schéma Zod client et serveur.
- **Graphique** : une courbe de précision ; axe X par session sur « 1 jour », agrégé **par jour** (précision pondérée) sur semaine/mois ; tooltip date / arme / précision / touchés sur total. Option « comparer » : séries `--chart-1..5`.
- **Stats par arme** (même filtre de période) : précision pondérée, % critiques (`criticalShots / shotsHit`), dégâts et kills moyens, nombre de challenges, meilleure précision, tendance vs période précédente. Grille de cartes ou tableau triable.
- **KPI** : précision globale, nombre de sessions, temps total (`SUM(roundtime)`), meilleure arme.

## 9. Architecture et conventions

```
app/                              # routes uniquement (+ globals.css)
  layout.tsx, page.tsx            # layout (en-tête + Toaster) ; page = présentation de l'app
  dashboard/page.tsx              # dashboard (Server Component, lit les searchParams)
  import/page.tsx
  actions/                        # Server Actions ("use server"), retour ActionResult<T>
  generated/prisma/               # client Prisma généré (gitignore)
src/                              # tout le reste, alias @/* → ./src/*
  components/ui/                  # shadcn (ne pas modifier à la main sauf besoin)
  components/                     # composants métier
  config/                         # apex-weapons.config.ts, utils.config.ts
  schema/                         # Zod
  lib/{prisma,env,stats,csv,r5-parser,hash,export-date,utils}.ts
  data/                           # exports R5Reloaded d'exemple (fixtures de tests)
prisma/schema.prisma, migrations/, seed.ts
public/apex-weapons/<type>/<slug>.png et badges/<slug>.webp
```

- **Alias** : `@/*` → `./src/*` ; `@app/*` → `./app/*` (pour importer le client Prisma généré et les actions).
- **Server Components par défaut** ; `"use client"` seulement pour filtres, formulaire, graphique.
- **Agrégats en BDD** (`groupBy`/`aggregate`, ou `$queryRaw` typé pour `date_trunc`), pas en JS sur toutes les lignes.
- Logique pure (parsing, stats) séparée des actions, testée avec Vitest.
- shadcn : `pnpm dlx shadcn@latest add <composant>`. `cn()` depuis `@/lib/utils`. ⚠️ Avec le style `base-nova`, la CLI génère
  `import { cn } from "cn"` et ajoute le paquet npm `cn` : après chaque `add`, remplacer par `@/lib/utils` et faire `pnpm remove cn`.
- Server Actions appelées avec un `File` : `instanceof File` fonctionne côté Next ; limite de corps relevée à 6 Mo dans `next.config.ts`
  (défaut 1 Mo). Pour les tester sans navigateur : `curl` multipart avec `Next-Action: <id>` (voir `.next/server/server-reference-manifest.json`),
  champs `_1_<nom>` puis `0=["$K1"]` **en dernier**.
- Pas de `any`, pas de `console.log` (garder `console.error` dans les `catch`).

## 10. Plan de reconstruction

1. ~~`create-next-app`~~ → `shadcn init` fait (base-nova, neutral) ; reste `src/` + alias (voir « État du dépôt »).
2. `docker-compose.yml` + `.env` + `src/lib/env.ts`.
3. Prisma : schéma §6, migration initiale, seed.
4. Schémas Zod + tests.
5. Parser R5Reloaded + action d'import + page d'import avec aperçu.
6. Saisie manuelle.
7. `getChartData(filters)` + graphique + filtres en searchParams.
8. Stats par arme + KPI.
9. Polish : dark mode, états vides, skeletons, toasts.

Une étape est terminée quand `pnpm lint`, `pnpm typecheck` et `pnpm test` passent.
