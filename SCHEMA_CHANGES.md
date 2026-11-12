# Schema Changes — Optician Backoffice

## Existing models reused

No duplicate business models were added. The backoffice extends the existing
`JournalAudit` (`journaux_audit`) and `MouvementStock` (`mouvements_stock`)
models. It uses existing `MembreMagasin`, `Magasin`, `AnnonceMagasin`,
`Commande`, `HistoriqueStatutCommande`, `Paiement`, `Remboursement`, `Stock`,
and `MouvementStock` relations. Employee permissions extend the existing
`MembreMagasin` membership rather than creating duplicate users or roles.

## Additive migration

`backend/prisma/migrations/20261201120000_backoffice_audit_fields/migration.sql`
adds:

- `actor_identity`, `description`, `before_values`, `after_values`, and
  `reason` to `journaux_audit`.
- An `(action, cree_le)` index for filtered historical queries.
- `quantity_before`, `quantity_after`, `reserved_before`, and `reserved_after`
  to `mouvements_stock`.
- A database trigger that prevents audit-event updates and deletes in ordinary
  application operations. It permits only a user foreign-key `actor_id` to be
  nulled by the existing `ON DELETE SET NULL` relationship; all snapshot fields
  remain immutable.

All additions are nullable or have no effect on existing records. Existing
audit and movement rows remain unchanged; old quantity snapshots are unknown
and intentionally are not backfilled with invented values.

## Membership permissions migration

`backend/prisma/migrations/20261202120000_member_permissions/migration.sql`
adds nullable preset and modifier metadata columns to `adhesions_magasins` and
creates `permissions_membres_magasins`. Each row stores a unique,
store-membership-scoped permission code and an explicit allow/deny boolean.
The table has a cascading relation to the membership, a unique
`(membre_magasin_id, code)` constraint, and a code lookup index.

Permission changes update the membership preset/modified-by/time fields,
replace its current overrides, and append a before/after `JournalAudit` event
in the same transaction. The audit event is the durable permission-change
history; deleting a membership removes its current overrides but does not
delete historical audit entries.

The migration was applied to the configured PostgreSQL database after creating
a fresh custom-format `pg_dump` backup. Existing memberships were not assigned
permissions automatically: the owner role remains full access, while all
non-owner memberships with no preset are deny-by-default until configured.

## Employee temporary-password migration

`backend/prisma/migrations/20261203120000_employee_account_password_change/migration.sql`
adds `must_change_password` to `utilisateurs`, defaulting to `false` for all
existing accounts. Newly owner-created employee accounts set it to `true`;
the authentication guard restricts those accounts to reading their profile
and changing the temporary password until that change is complete.
This additive migration was applied after creating a fresh custom-format
database backup.

## Migration safety

- Existing migrations, including the historical French-translation migration,
  are not modified or rerun.
- No table is dropped, truncated, reset, or recreated.
- The migration was applied to the configured local database with
  `npx prisma migrate deploy` after a successful `pg_dump` backup. The migration
  status is up to date. Do not use `prisma migrate reset` or `db push`.
- Schema formatting, validation, and Prisma Client generation are part of the
  verification workflow.

## Retention and backup strategy

Audit history has no automatic expiration. Application cleanup should exclude
`journaux_audit` and its actor snapshot. Use encrypted, least-privilege
PostgreSQL backups with copies outside the database host, and routinely test
restore/PITR procedures. Operators should define retention duration and backup
frequency according to applicable legal and business requirements. Automated
backup scheduling is not configured in this repository.
