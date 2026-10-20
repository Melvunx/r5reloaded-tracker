# R5 Apex Tracker

Tracker local de mes sessions d'entraînement à l'aim sur **Apex Legends via [R5Reloaded](https://r5reloaded.com/)**.

J'importe les résultats de mes challenges (ou je les saisis à la main), et l'application affiche ma progression
dans un graphique filtrable par arme et par période, avec la précision et les stats détaillées de chaque arme, le tout
relié à mes réglages de souris.

> Application **personnelle, locale et mono‑utilisateur** : pas de compte, pas d'authentification, pas de déploiement.

---

## ✨ Fonctionnalités

- **Import des exports R5Reloaded** (`.txt` au format CSV)
  - vérification de la signature du fichier et des en‑têtes
  - validation stricte de chaque ligne avec Zod (lignes invalides signalées avec leur numéro dans le fichier)
  - aperçu avant insertion et choix de la date de la session (par défaut : la date de l'export, lue dans le nom du fichier)
  - détection des doublons : un même fichier ne peut pas être importé deux fois, et deux lignes strictement identiques dans un fichier ne comptent qu'une fois
  - historique des imports, avec possibilité d'annuler un import
- **Saisie manuelle** d'un challenge (liste d'armes avec images) et historique des saisies, supprimables une à une
- **Graphique de progression** de la précision (shadcn/ui + Recharts)
  - filtre par **arme**, par **catégorie d'arme** et par **type de challenge**
  - filtre par **période** : 1 jour (une partie = un point), 1 semaine, 1 mois, tout (précision pondérée par jour)
  - **comparaison de deux armes** sur le même graphique, avec un tableau côte à côte
  - filtres conservés dans l'URL
- **Statistiques par arme**
  - **précision (%)** calculée sur l'ensemble des tirs : `tirs touchés / tirs totaux` (jamais une moyenne de pourcentages)
  - % de coups critiques, dégâts et kills moyens, nombre de challenges, meilleure précision
  - tendance par rapport à la période précédente de même durée
  - **arme préférée** (la plus jouée sur tout l'historique) et **favorite de chaque catégorie**, avec des effets visuels et une police dédiés
- **Résumé global** : précision globale, nombre de challenges, temps d'entraînement total, meilleure arme, arme préférée
- **Réglages souris** : historique de ton DPI et de ta sensibilité (eDPI, cm/360°)
  - marqueurs de changement de réglage sur le graphique et réglage actif dans l'infobulle
  - **précision par réglage** : une ligne par période de réglage, avec l'écart avec la période précédente
- Thème clair / sombre (celui du système par défaut), animations de pages avec [motion](https://motion.dev) (désactivées si le système demande moins d'animations)

---

## 🧱 Stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions, Cache Components), React 19, TypeScript strict |
| Base de données | [PostgreSQL 18](https://www.postgresql.org/) (Docker) |
| ORM | [Prisma 7](https://www.prisma.io/) + `@prisma/adapter-pg` |
| Validation | [Zod 4](https://zod.dev) |
| UI | [shadcn/ui](https://ui.shadcn.com) (style `base-nova`, `@base-ui/react`), Tailwind CSS 4, lucide-react |
| Graphiques | shadcn `chart` + [Recharts 3](https://recharts.org) |
| Animations | [motion](https://motion.dev) |
| Tests | [Vitest](https://vitest.dev) + [fast-check](https://fast-check.dev) (tests de propriétés) |

---

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org) 20.12 ou plus
- [pnpm](https://pnpm.io)
- [Docker](https://www.docker.com/) (pour PostgreSQL)

### 1. Cloner le projet

```bash
git clone https://github.com/Melvunx/r5reloaded-tracker.git
cd r5reloaded-tracker
pnpm install
```

### 2. Lancer PostgreSQL

Le fichier `docker-compose.yml` du dépôt démarre un PostgreSQL 18 (utilisateur, mot de passe et base : `apex` / `apex` / `apex_tracker`).

```bash
pnpm db:up        # docker compose up -d
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://apex:apex@localhost:5432/apex_tracker"

# Texte présent dans la 1re ligne des exports R5Reloaded (sert à vérifier le fichier)
VERIF_LINE="=== Aim Trainer v1.0 CSV Results Dump - Made by CafeFPS @CafeFPS === "
```

Les variables sont validées au démarrage (`src/lib/env.ts`) : une valeur manquante donne une erreur explicite.
La ligne de signature se termine par un espace, à conserver.

### 4. Initialiser la base

```bash
pnpm prisma migrate deploy   # crée les tables
pnpm prisma generate         # génère le client Prisma (app/generated/prisma)
pnpm prisma db seed          # insère la liste des armes
```

> Le CLI `prisma` est épinglé en 7.10.1 : le tag `latest` du paquet pointe sur une version candidate 8.

### 5. Démarrer

```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## 🧭 Pages

| Route | Rôle |
|---|---|
| `/` | Présentation et mode d'emploi |
| `/dashboard` | Graphique, filtres, comparaison, KPI, stats par arme, précision par réglage de souris |
| `/import` | Import d'un export R5Reloaded (aperçu avant insertion) et historique des imports |
| `/manual-entry` | Saisie manuelle d'un challenge et historique des saisies |
| `/mouse-settings` | Historique des réglages DPI / sensibilité |

---

## 📥 Format du fichier d'import

Le fichier exporté par R5Reloaded est un `.txt` (fins de ligne `\r\n`) structuré ainsi :

```text
=== Aim Trainer v1.0 CSV Results Dump - Made by CafeFPS @CafeFPS ===
<ligne vide>
ChallengeName, ShotsHit, Kills, Weapon, Accuracy, Damage, CriticalShots, TotalShots, Roundtime
STRAFING DUMMY, 193, 19, Flatline, 46.61%, 3888, 8, 414, 60
STRAFING DUMMY, 182, 14, Volt, 44.49%, 2928, 7, 409, 60
```

Les espaces autour des valeurs sont ignorés, l'ordre des colonnes est libre, et les lignes vides sont tolérées.
Le nom du fichier contient l'horodatage Unix de l'export (`aimtrainer_results_1792494390.txt`), utilisé comme date de session par défaut.

| Colonne | Description |
|---|---|
| `ChallengeName` | Nom du challenge (ex. `STRAFING DUMMY`) |
| `ShotsHit` | Tirs touchés |
| `Kills` | Éliminations |
| `Weapon` | Nom de l'arme (une arme connue ou un de ses alias : `R-99`, `r99`…) |
| `Accuracy` | Précision, avec ou sans `%` |
| `Damage` | Dégâts infligés |
| `CriticalShots` | Coups critiques (tête) |
| `TotalShots` | Tirs totaux |
| `Roundtime` | Durée du challenge, en secondes |

Règles de validation : valeurs entières positives, `Roundtime > 0`, `ShotsHit ≤ TotalShots`, `CriticalShots ≤ ShotsHit`,
et la précision doit correspondre à `ShotsHit / TotalShots` à ±0,5 point près. La précision enregistrée est toujours recalculée
à partir des tirs. Taille maximale du fichier : 5 Mo.

---

## 🔫 Armes prises en charge

| Catégorie | Armes |
|---|---|
| Pistolets | Wingman, RE-45, P2020 |
| Mitraillettes | R-99, Volt, Alternator, Prowler |
| Fusils d'assaut | R-301, Flatline, Havoc, Hemlok |
| Mitrailleuses | Devotion, L-Star, Spitfire |
| Armes à longue portée | G7 Scout, Triple Take |
| Fusils de précision | Charge Rifle, Kraber, Longbow, Sentinel |
| Fusils à pompe | EVA-8, Mastiff, Mozambique, Peacekeeper |

La liste se trouve dans `src/config/apex-weapons.config.ts` : c'est la source de vérité du seed Prisma, des schémas Zod et des listes déroulantes.

---

## 🗂️ Structure du projet

```text
app/
  layout.tsx, template.tsx   # layout (en-tête, thème, animations) ; template = animation d'entrée de page
  page.tsx                   # présentation
  dashboard/ import/ manual-entry/ mouse-settings/
  actions/                   # Server Actions (retour ActionResult<T>)
  globals.css                # palette « Apex » (clair / sombre), effets des armes favorites
src/
  components/                # composants (dashboard/, import/, manual-entry/, mouse-settings/, motion/)
  components/ui/             # composants shadcn/ui
  config/                    # armes, réglages souris, fuseau horaire
  schema/                    # schémas Zod (import, challenge, filtres, réglages)
  lib/                       # parser R5Reloaded, services Prisma, calculs de stats et de réglages souris
  __tests__/                 # tests des actions et tests d'intégration (base PostgreSQL dédiée)
prisma/
  schema.prisma, migrations/, seed.ts
public/apex-weapons/         # images et badges des armes
scripts/apex-tracker.sh      # lanceur (base Docker + serveur de dev)
```

Les règles de conception (modèle de données, pièges évités par rapport à la v2, conventions) sont dans [`CLAUDE.md`](./CLAUDE.md).

Le fuseau utilisé pour regrouper les parties par jour et afficher les heures est `Europe/Paris` (`src/config/time.config.ts`).

---

## 🛠️ Scripts

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` / `pnpm start` | Build et lancement en mode production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests unitaires et de propriétés (sans base de données) |
| `pnpm test:integration` | Tests d'intégration sur PostgreSQL (base dédiée, voir ci‑dessous) |
| `pnpm test:watch` | Tests en mode watch |
| `pnpm db:up` / `pnpm db:down` | Démarrer / arrêter PostgreSQL |
| `pnpm db:studio` | Explorer la base dans le navigateur |

---

## ⚡ Lancer l'application de n'importe où

Le script `scripts/apex-tracker.sh` démarre PostgreSQL (Docker) en arrière-plan, attend qu'il soit prêt, puis lance le serveur de dev.
Pour l'appeler depuis n'importe quel dossier, crée un lien dans un dossier de ton `PATH` :

```bash
ln -s "$(pwd)/scripts/apex-tracker.sh" ~/.local/bin/apex-tracker
```

| Commande | Rôle |
|---|---|
| `apex-tracker` | Démarre la base puis le serveur de dev (Ctrl+C l'arrête ; la base reste allumée) |
| `apex-tracker db` | Démarre seulement la base |
| `apex-tracker stop` | Arrête la base (les données sont conservées dans le volume Docker) |
| `apex-tracker status` | Dit si la base tourne |

---

## 🧪 Tests

Une étape est terminée quand `pnpm lint`, `pnpm typecheck` et `pnpm test` passent.

- **Tests unitaires** (`pnpm test`) : schémas Zod, parser CSV et R5Reloaded, calculs de stats, réglages de souris, fusion des séries.
- **Tests de propriétés** (fast‑check) : le parseur ne plante jamais sur une entrée quelconque, un CSV encodé puis relu redonne les mêmes cellules,
  chaque ligne d'un export est classée exactement une fois (valide, invalide ou doublon) avec son vrai numéro de ligne, tout schéma d'action
  refuse les entrées invalides sans lever d'exception, les périodes de réglage souris ne laissent ni trou ni chevauchement, etc.
- **Tests des Server Actions** (`src/__tests__/actions.test.ts`) : avec les services simulés, on vérifie qu'une entrée invalide
  (fichier trop gros, mauvaise signature, identifiant forgé, date future…) n'atteint jamais la base, et qu'une panne de la base ne divulgue pas son message.
- **Tests d'intégration** (`pnpm test:integration`) : requêtes réelles (regroupement par jour en SQL brut, agrégats `groupBy`, cascade de
  suppression, contraintes d'unicité, règle du réglage souris actif). Ils exigent que PostgreSQL tourne (`pnpm db:up`) et utilisent
  **une base séparée, `apex_tracker_test`**, créée et migrée automatiquement ; un garde‑fou refuse de s'exécuter sur une autre base.
  Tes données ne sont jamais touchées.

---

## 🤖 Développement avec Claude Code

Le fichier [`CLAUDE.md`](./CLAUDE.md) décrit les objectifs, le modèle de données, les règles de validation
et le plan de développement. Claude Code le lit automatiquement à chaque session.

---

## 📝 Licence

Projet personnel. Apex Legends est une marque d'Electronic Arts / Respawn Entertainment ;
R5Reloaded est un projet communautaire indépendant. Ce tracker n'est affilié à aucun d'eux.
