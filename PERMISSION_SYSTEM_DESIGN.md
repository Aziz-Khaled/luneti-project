# Store Permission System Design

## Data model

- `MembreMagasin.permission_preset` stores a stable starting preset for that
  specific membership/store.
- `PermissionMembreMagasin` stores individual `{ code, autorise }` overrides,
  unique per membership and permission code.
- Permission definitions and the preset catalog are code-owned constants in
  `backend/src/common/guards/store-permissions.ts`; this avoids seeding a second
  permission catalog table and keeps codes version-controlled.
- `permissions_updated_at` and `permissions_updated_by` identify the last
  permission change. Permission override rows also record their updater and
  timestamps.
- Each permission change replaces current overrides and writes a before/after
  snapshot to append-only `JournalAudit` inside one database transaction.

## Resolution order

1. The request must have an active membership matching both authenticated user
   and requested store. Membership roles in JWT or browser state are not used
   to authorize a request.
2. `PROPRIETAIRE` receives the complete current catalog as an explicit owner
   invariant.
3. Every non-owner begins with the selected preset's permission set. A missing
   or invalid preset begins with an empty set.
4. Each stored override is applied last: `autorise=true` adds that code;
   `autorise=false` removes that code.
5. Unknown codes are ignored during resolution and rejected when submitted.
   Missing permissions are denied.
6. Permission resolution is fetched on every authorized request. There is no
   permission cache or JWT permission claim, so revocation applies to the next
   API request.

Roles provide labels and owner-protected membership operations only; manager,
optician, and employee roles do not imply business permissions. Presets are
starting configurations, not permanent role inheritance.

## Delegation and membership protections

- Owners can assign any catalog permission to another non-owner.
- Owner-created employee accounts, active memberships, selected presets,
  individual overrides, and audit events are committed transactionally.
- Temporary-password accounts are restricted by the backend to profile reads
  and password change until the employee sets a private password.
- A non-owner can manage permissions only if their current effective set
  contains `employees.manage_permissions`.
- A delegated permission manager cannot edit their own permissions, edit an
  owner, or grant any effective permission absent from their own current set.
- Managers cannot grant the `GERANT` role. Only the owner can assign that role
  or manage a manager's membership.
- Membership operations prevent self role/status edits except accepting an
  existing invitation. Employees cannot set themselves as owner.
- Owner removal is serialized by a store-row lock and rejected if it would
  leave no active owner.
- Membership and resource reads include the requested `storeId`; caller
  permission for one store has no effect in another store.

## Enforcement points

`StoreAuthorizationService` is the shared permission resolver and guard helper.
Domain services require exact codes for inventory, orders, customers, shop,
memberships, payments, appointments, activity, and dashboard operations.
Resource queries remain store-scoped after permission checks. Sensitive
delivery addresses, appointment contact details, refund details, dashboard
financials, and own-vs-all activity are separately gated.

## Migration and compatibility

Migration `20261202120000_member_permissions` only adds nullable membership
metadata and a new permission override table with a cascading membership FK.
It preserves existing roles, memberships, and business rows. Existing non-owner
memberships receive no implicit access; an owner must assign a preset or
permissions.

See [SCHEMA_CHANGES.md](./SCHEMA_CHANGES.md) for migration detail and
[PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) for all currently supported
permission codes.
