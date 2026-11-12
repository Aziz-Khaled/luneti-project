ALTER TABLE "adhesions_magasins"
  ADD COLUMN "permission_preset" VARCHAR(60),
  ADD COLUMN "permissions_updated_at" TIMESTAMPTZ(6),
  ADD COLUMN "permissions_updated_by" UUID;

CREATE TABLE "permissions_membres_magasins" (
  "id" UUID NOT NULL,
  "membre_magasin_id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "autorise" BOOLEAN NOT NULL,
  "modifie_par" UUID,
  "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modifie_le" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "permissions_membres_magasins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "permissions_membres_magasins_membre_magasin_id_fkey"
    FOREIGN KEY ("membre_magasin_id")
    REFERENCES "adhesions_magasins"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "permissions_membres_magasins_membre_magasin_id_code_key"
  ON "permissions_membres_magasins"("membre_magasin_id", "code");
CREATE INDEX "permissions_membres_magasins_code_idx"
  ON "permissions_membres_magasins"("code");
