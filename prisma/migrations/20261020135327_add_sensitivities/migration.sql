-- CreateTable
CREATE TABLE "sensitivities" (
    "id" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mouse_dpi" INTEGER NOT NULL DEFAULT 800,
    "mouse_sensitivity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "sensitivities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensitivities_effective_from_idx" ON "sensitivities"("effective_from");
