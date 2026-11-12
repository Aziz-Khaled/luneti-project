CREATE TABLE "types_emplacements_magasins" (
  "id" UUID NOT NULL,
  "magasin_id" UUID NOT NULL,
  "nom" VARCHAR(80) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modifie_le" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "types_emplacements_magasins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "types_emplacements_magasins_magasin_id_fkey"
    FOREIGN KEY ("magasin_id")
    REFERENCES "magasins"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "emplacements_stock"
  ADD COLUMN "type_personnalise_id" UUID;

ALTER TABLE "emplacements_stock"
  ADD CONSTRAINT "emplacements_stock_type_personnalise_id_fkey"
  FOREIGN KEY ("type_personnalise_id")
  REFERENCES "types_emplacements_magasins"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "types_emplacements_magasins_magasin_id_nom_key"
  ON "types_emplacements_magasins"("magasin_id", "nom");
CREATE INDEX "emplacements_stock_type_personnalise_id_idx"
  ON "emplacements_stock"("type_personnalise_id");
