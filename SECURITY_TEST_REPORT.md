# Security Test Report — Employee Permissions

## Automated coverage

Backend Jest tests cover:

- Owner access resolves to the complete permission catalog.
- Presets and explicit deny overrides resolve in the documented order.
- Missing/inactive membership and cross-store membership lookups are denied.
- Permission lookup runs again on each request; revocation blocks the next
  request.
- Delegated managers cannot assign permissions outside their current effective
  set.
- Employee accounts, active memberships, and individual permission overrides
  are stored with the creation audit event in one transaction.
- Temporary-password accounts cannot access authenticated APIs until they
  replace the temporary password; the password-change endpoint verifies the
  current password.
- Permission preset/override replacement and before/after audit creation share
  one transaction.
- The last active owner cannot be removed; the owner-removal check is made
  under a store row lock.
- Order status transitions, stock mutations, and store-scoped queries retain
  their existing authorization and data-integrity checks.

## Runtime and database checks

- Prisma schema validation and client generation passed.
- Additive migration applied with `prisma migrate deploy` after a fresh
  custom-format PostgreSQL backup.
- Swagger and frontend routes were checked locally; protected APIs return 401
  without a bearer token.

## Remaining verification limitation

The configured local database has no store or membership fixtures. Therefore
an authenticated two-store/two-employee HTTP integration workflow—including
frontend permission revocation in a populated shop—has not been performed.
Unit tests exercise the authorization resolution and mutation paths. Seed or
create non-production fixtures before conducting a manual end-to-end security
test; do not use production employee/customer data for this validation.
