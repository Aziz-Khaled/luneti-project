# Lunetty Optician Backoffice — Implementation Status

## Delivered

- Added optician navigation for Dashboard, Employees, Inventory, Orders,
  Transactions, Shop management, Activity History, and Settings while retaining
  existing store locations, catalog/listing, appointments, and customer pages.
- Added a separate permission-aware `/employee` portal with active multi-store
  selection, dynamic navigation, and the existing store-scoped inventory,
  order, customer, appointment, activity, and profile surfaces.
- Added a permission editor to employee management with role labels, starting
  presets, per-permission allow/deny overrides, confirmation, save state, and
  last-modified identity/time.
- Added an additive, store-membership-scoped permission catalog and resolution
  service. Owner access is explicit and complete; every other membership uses
  its selected preset plus individual overrides and is denied missing
  permissions by default.
- Built a data-connected dashboard with selectable reporting periods, actual
  gross paid revenue and completed refunds reported separately, order status counts and recent orders,
  inventory/low-stock/out-of-stock counts and movement history, employee
  counts/invitations, and recent audited activity.
- Reused the store membership APIs for owner-created employee accounts,
  permission assignment, role/status management, and removal. Account,
  membership, permissions, and audit event are created transactionally.
- Added store-scoped order browsing, detail, history, filters, and constrained
  status transitions. Cancellation is limited to unpaid orders and releases
  reservations transactionally.
- Added read-only store-scoped payment browsing with provider/status/date
  filters, associated order/customer summary, and refund amounts. No payment
  status can be changed through this backoffice API.
- Recorded inventory creation, adjustments, receipts, damage, reservations,
  releases, and transfers with before/after on-hand and reserved quantities.
  Movement and audit writes share the stock transaction.
- Added store-scoped paginated activity search and detail reads. Store changes,
  employee changes, inventory changes, order creation/status changes, and
  listing/price/availability changes write actor snapshots and meaningful
  before/after data.
- Added an accessible chatbot popup placeholder that explicitly says it is
  coming soon and does not simulate AI.
- Expanded store settings to update existing store name, slug, description,
  contact, logo/cover URLs, timezone, and currency fields.

## Not implemented / existing platform limitations

- The current backend has no configured payment provider checkout, payment
  creation, verified webhook processing, refund workflow, or payment status
  mutation. The Transactions page therefore reports persisted payment records
  only; it cannot create or settle transactions.
- Employee accounts receive a temporary password directly from the owner and
  must change it at first login. Membership roles are the existing
  Owner/Manager/Optician/Employee roles and no payroll is implemented.
- The schema has no shop opening-hours/social-link configuration. A store can
  have inventory locations and store listings, but a client-facing postal
  address and full publication moderation workflow are not part of this
  backoffice implementation.
- Existing order and payment records are shown only when they exist. This
  database has previously been observed with no stores/products; empty views
  are expected until the owner creates or receives real data.
- Dashboard trends are returned as dated, currency-specific net-revenue rows;
  no charting dependency was introduced.
- Activity events are now generated for the mutations listed above. Legacy
  audit and stock movement rows are retained, but their new descriptions,
  snapshots, and quantity-before/after columns remain null because that
  information was not previously captured. Not every unrelated social,
  appointment, notification, or platform-admin mutation has been integrated
  into the store audit stream. Moderation of store reviews is linked to its
  store; global product-review moderation remains a platform-level audit event.
- Global search, exports, automated store notifications, and store-side customer
  editing are not implemented.
- Payment checkout, verified webhooks, refunds, exports, shop publication
  moderation and custom opening hours/social links remain unsupported by
  existing platform integrations. The
  permission catalog exposes only operations backed by current API behavior;
  it does not imply these unavailable features exist.

## Database safety and audit operations

- The audit and membership-permission Prisma migrations are additive. They do
  not alter historical migrations or drop/recreate tables.
- Audit events are protected from normal `UPDATE` and `DELETE` operations by a
  PostgreSQL trigger. The trigger permits only the existing actor foreign key
  to become null when its user is deleted; the stored identity snapshot remains.
- Application cleanup jobs must not delete audit rows. For multi-year history,
  operators should retain encrypted, access-controlled PostgreSQL backups,
  take backups before schema changes, keep copies outside the database host,
  and periodically test point-in-time recovery/restore. Backup frequency and
  retention must be set by the deployment operator to meet its legal/business
  requirements; no backup scheduler is configured by this change.

## Verification

- `npx prisma format`, `npx prisma validate`, `npx prisma generate`
- Backend lint, production build, and full Jest suite
- Frontend ESLint and Next.js production build
- Permission resolution, explicit deny, immediate revocation, delegation,
  owner protection, store-scoped behavior, and status transition unit tests
- Live Swagger and application route health; authenticated cross-shop
  end-to-end testing still requires populated store/member fixtures

See [EMPLOYEE_IMPLEMENTATION_STATUS.md](./EMPLOYEE_IMPLEMENTATION_STATUS.md),
[PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md),
[PERMISSION_SYSTEM_DESIGN.md](./PERMISSION_SYSTEM_DESIGN.md),
[SECURITY_TEST_REPORT.md](./SECURITY_TEST_REPORT.md),
[SCHEMA_CHANGES.md](./SCHEMA_CHANGES.md), [API_CHANGES.md](./API_CHANGES.md),
and [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for detail.
