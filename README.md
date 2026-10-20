# R5 Apex Tracker

Tracker local de mes sessions d'entraînement à l'aim sur **Apex Legends via [R5Reloaded](https://r5reloaded.com/)**.

J'importe les résultats de mes challenges (ou je les saisis à la main), et l'application affiche ma progression
dans un graphique filtrable par arme et par période, avec la précision et les stats détaillées de chaque arme.

> Application **personnelle, locale et mono‑utilisateur** : pas de compte, pas d'authentification, pas de déploiement.

---

## ✨ Fonctionnalités

- **Import des exports R5Reloaded** (`.txt` au format CSV)
  - vérification de la signature du fichier et des en‑têtes
  - validation stricte de chaque ligne avec Zod (lignes invalides signalées avec leur numéro)
  - aperçu avant insertion et choix de la date de la session
  - détection des doublons (un même fichier ne peut pas être importé deux fois)
  - historique des imports, avec possibilité d'annuler un import
- **Saisie manuelle** d'un challenge via un formulaire
- **Graphique de progression** de la précision (shadcn/ui + Recharts)
  - filtre par **arme** ou **catégorie d'arme**
  - filtre par **période** : 1 jour, 1 semaine, 1 mois, tout
  - filtre par **type de challenge**
  - filtres conservés dans l'URL
- **Statistiques par arme**
  - **précision (%)** calculée sur l'ensemble des tirs : `tirs touchés / tirs totaux`
  - % de coups critiques, dégâts et kills moyens
  - nombre de challenges, meilleure précision, tendance par rapport à la période précédente
- **Réglages souris** : historique de ton DPI et de ta sensibilité (eDPI, cm/360°), pour relier ta progression à tes réglages
- **Résumé global** : précision globale, nombre de sessions, temps d'entraînement total, meilleure arme
- Thème clair / sombre

---

## 🧱 Stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions), React 19, TypeScript |
| Base de données | [PostgreSQL](https://www.postgresql.org/) (Docker) |
| ORM | [Prisma 7](https://www.prisma.io/) + `@prisma/adapter-pg` |
| Validation | [Zod 4](https://zod.dev) |
| UI | [shadcn/ui](https://ui.shadcn.com), Tailwind CSS 4, lucide-react |
| Graphiques | shadcn `chart` + [Recharts 3](https://recharts.org) |
| Tests | Vitest |

---

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org) 20 ou plus
- [pnpm](https://pnpm.io)
- [Docker](https://www.docker.com/) (pour PostgreSQL)

### 1. Cloner le projet

```bash
git clone https://github.com/Melvunx/rs5-apex-tracker-v2.git
cd rs5-apex-tracker-v2
pnpm install
```

### 2. Lancer PostgreSQL

`docker-compose.yml` :

```yaml
services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_USER: apex
      POSTGRES_PASSWORD: apex
      POSTGRES_DB: apex_tracker
    ports:
      - "5432:5432"
    volumes:
      - apex_data:/var/lib/postgresql

volumes:

  apex_data:
```

```bash
docker compose up -d
```

### 3. Configurer l'environnement

Créer un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://apex:apex@localhost:5432/apex_tracker"

# Texte présent dans la 1re ligne des exports R5Reloaded (sert à vérifier le fichier)
VERIF_LINE="<texte de la 1re ligne de l'export>"
```

### 4. Initialiser la base

```bash
pnpm prisma migrate dev     # crée les tables
pnpm prisma generate        # génère le client Prisma
pnpm prisma db seed         # insère la liste des armes
```

### 5. Démarrer

```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## 📥 Format du fichier d'import

Le fichier exporté par R5Reloaded doit être un `.txt` structuré ainsi :

```text
<ligne de signature contenant VERIF_LINE>
ChallengeName,ShotsHit,Kills,Weapon,Accuracy,Damage,CriticalShots,TotalShots,Roundtime
STRAFING DUMMY,87,3,R-99,43.5%,1305,22,200,60
STRAFING DUMMY,95,4,R-99,47.5%,1425,25,200,60
```

| Colonne | Description |
|---|---|
| `ChallengeName` | Nom du challenge (ex. `STRAFING DUMMY`) |
| `ShotsHit` | Tirs touchés |
| `Kills` | Éliminations |
| `Weapon` | Nom de l'arme (doit correspondre à une arme connue ou à un alias) |
| `Accuracy` | Précision, avec ou sans `%` |
| `Damage` | Dégâts infligés |
| `CriticalShots` | Coups critiques (tête) |
| `TotalShots` | Tirs totaux |
| `Roundtime` | Durée du challenge, en secondes |

Règles de validation : valeurs entières positives, `ShotsHit ≤ TotalShots`, `CriticalShots ≤ ShotsHit`,
et la précision doit correspondre à `ShotsHit / TotalShots`.

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

La liste se trouve dans `src/config/apex-weapons.config.ts` et alimente à la fois le seed Prisma et les schémas Zod.

---

## 🗂️ Structure du projet

```text
app/
  page.tsx              # tableau de bord (graphique, KPI, stats par arme)
  import/page.tsx       # import de fichiers + historique
  actions/              # Server Actions
src/
  components/           # composants de l'application
  components/ui/        # composants shadcn/ui
  config/apex-weapons.config.ts  # liste des armes
  schema/               # schémas Zod
  lib/                  # Prisma, parser R5Reloaded, calculs de stats
prisma/
  schema.prisma
  migrations/
  seed.ts
public/apex-weapons/    # images et badges des armes
```

---

## 🛠️ Scripts

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` / `pnpm start` | Build et lancement en mode production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests Vitest |
| `pnpm prisma studio` | Explorer la base dans le navigateur |

---

## 🤖 Développement avec Claude Code

Le fichier [`CLAUDE.md`](./CLAUDE.md) décrit les objectifs, le modèle de données, les règles de validation
et le plan de développement. Claude Code le lit automatiquement à chaque session.

---

## 📝 Licence

Projet personnel. Apex Legends est une marque d'Electronic Arts / Respawn Entertainment ;
R5Reloaded est un projet communautaire indépendant. Ce tracker n'est affilié à aucun d'eux.