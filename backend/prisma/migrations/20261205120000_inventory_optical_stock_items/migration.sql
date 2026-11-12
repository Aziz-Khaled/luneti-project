CREATE TYPE "InventoryItemType" AS ENUM (
  'PRESCRIPTION_GLASSES',
  'SUN_GLASSES',
  'FRAME'
);

CREATE TYPE "StockLensDesign" AS ENUM (
  'SIMPLE',
  'PROGRESSIF'
);

CREATE TYPE "StockLensTreatment" AS ENUM (
  'BLUE_LIGHT',
  'PHOTOCHROMIC',
  'HYBRID_PHOTO'
);

ALTER TABLE "stocks"
  ALTER COLUMN "store_listing_variant_id" DROP NOT NULL,
  ADD COLUMN "item_type" "InventoryItemType",
  ADD COLUMN "lens_design" "StockLensDesign",
  ADD COLUMN "lens_treatment" "StockLensTreatment",
  ADD COLUMN "right_power" DECIMAL(5, 2),
  ADD COLUMN "left_power" DECIMAL(5, 2),
  ADD COLUMN "brand_reference" VARCHAR(160),
  ADD COLUMN "target_audience" "Audience",
  ADD COLUMN "frame_size" VARCHAR(60);

CREATE INDEX "stocks_location_id_item_type_idx"
  ON "stocks"("location_id", "item_type");
