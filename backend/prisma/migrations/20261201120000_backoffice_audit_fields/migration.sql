ALTER TABLE "journaux_audit"
  ADD COLUMN "actor_identity" VARCHAR(255),
  ADD COLUMN "description" TEXT,
  ADD COLUMN "before_values" JSONB,
  ADD COLUMN "after_values" JSONB,
  ADD COLUMN "reason" TEXT;

CREATE INDEX "journaux_audit_action_cree_le_idx"
  ON "journaux_audit" ("action", "cree_le");

ALTER TABLE "mouvements_stock"
  ADD COLUMN "quantity_before" INTEGER,
  ADD COLUMN "quantity_after" INTEGER,
  ADD COLUMN "reserved_before" INTEGER,
  ADD COLUMN "reserved_after" INTEGER;

CREATE OR REPLACE FUNCTION prevent_audit_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.actor_id IS NOT NULL
     AND NEW.actor_id IS NULL
     AND (to_jsonb(OLD) - 'actor_id') = (to_jsonb(NEW) - 'actor_id') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Audit history is append-only'
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "journaux_audit_append_only"
  BEFORE UPDATE OR DELETE ON "journaux_audit"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_history_mutation();
