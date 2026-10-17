-- CreateEnum
CREATE TYPE "WeaponType" AS ENUM ('PISTOL', 'SMG', 'AR', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN');

-- CreateTable
CREATE TABLE "weapons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WeaponType" NOT NULL,
    "aliases" TEXT[],

    CONSTRAINT "weapons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "challenge_name" TEXT NOT NULL,
    "weapon_id" TEXT NOT NULL,
    "shots_hit" INTEGER NOT NULL,
    "total_shots" INTEGER NOT NULL,
    "critical_shots" INTEGER NOT NULL,
    "kills" INTEGER NOT NULL,
    "damage" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "roundtime" INTEGER NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'import',
    "batch_id" TEXT,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weapons_name_key" ON "weapons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "import_batches_file_hash_key" ON "import_batches"("file_hash");

-- CreateIndex
CREATE INDEX "challenges_weapon_id_played_at_idx" ON "challenges"("weapon_id", "played_at");

-- CreateIndex
CREATE INDEX "challenges_challenge_name_played_at_idx" ON "challenges"("challenge_name", "played_at");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
