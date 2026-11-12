# Lunetty API

## Base URL and conventions

Business endpoints use `/api/v1`. Swagger UI is available at
`/api/docs`; the OpenAPI JSON is at `/api/docs-json`.

List endpoints use `page` (1-based) and `limit` (1–100), and return
`{ "data": [], "meta": { "page", "limit", "total", "totalPages" } }`.
DTO validation rejects unknown fields, transforms query values, and rejects
invalid UUIDs at route boundaries.

## Implemented endpoints

### Users

- `GET /api/v1/users` — paginated public active profiles.
- `GET /api/v1/users/:id` — public profile fields only.
- `GET /api/v1/users/me` — authenticated private profile.
- `PATCH /api/v1/users/me` and `PATCH /api/v1/users/me/profile` — allow-listed
  profile updates.
- `DELETE /api/v1/users/me` — soft-deactivate the authenticated account.
- `GET /api/v1/users/:id/followers` and `/following` — authenticated,
  paginated safe profile lists.
- `POST|DELETE /api/v1/users/:id/follow` — follow or unfollow a public user;
  self-follow and duplicate follow operations are rejected.

### Client and optician profiles

- `GET|PATCH /api/v1/clients/me` — get or create/update the authenticated
  user's client profile.
- `GET|PATCH /api/v1/opticians/me` — get or create/update an optician profile;
  the user must have an active owner or OPTICIEN membership in a store. Reading
  the client profile provisions an empty profile when one does not exist.

### Addresses

- `GET|POST /api/v1/users/me/addresses` — list or create an authenticated
  user's address.
- `GET|PATCH|DELETE /api/v1/users/me/addresses/:addressId` — read, update, or
  delete an address owned by the authenticated user. Default-address changes
  are applied transactionally.
- Store-owned address endpoints are not implemented.

### Stores and memberships

- `GET /api/v1/stores` and `GET /api/v1/stores/:storeId` — active public stores.
- `GET /api/v1/stores/:storeId/manage` — member with `shop.view` read of an
  active or draft store.
- `POST /api/v1/stores` — creates a DRAFT store and active owner membership in
  one transaction.
- `PATCH /api/v1/stores/:storeId` — `shop.update` profile fields.
- `DELETE /api/v1/stores/:storeId` — owner-only soft archive.
- `GET|POST /api/v1/stores/:storeId/members` — list members or create an
  employee account and active membership. Only the store owner can create an
  account. The body contains `prenom`, `nom`, `email`, `temporaryPassword`,
  `role`, optional `preset` (defaults to `read_only`), and optional
  `{code, allowed}` overrides. Account, membership, permissions, and audit
  event are committed together.
- The employee must change the 12-character-minimum temporary password at
  first login. The API blocks other authenticated operations until it is
  changed.
- `PATCH|DELETE /api/v1/stores/:storeId/members/:memberId` — own invite
  acceptance, owner membership administration, or own membership departure.

Existing pending invitations can still be accepted; creating new employee
accounts no longer depends on prior registration or email delivery. Ownership
transfer is not implemented.

### Employee permissions and portal

- `GET /api/v1/employee/me` and `GET /api/v1/employee/stores` — active
  memberships and effective store-specific permissions for the authenticated
  user.
- `POST /api/v1/auth/change-password` accepts the current temporary password
  and a new password. It is the only authenticated write available to an
  account that is required to change its temporary password; `GET /auth/me`
  remains available to render the form.
- `GET /api/v1/stores/:storeId/permissions/catalog` — stable permission codes
  and preset definitions for an active member.
- `GET /api/v1/stores/:storeId/members/:memberId/permissions` — current preset,
  explicit overrides, effective permissions, and last modifier/time.
- `PUT /api/v1/stores/:storeId/members/:memberId/permissions` — replace a
  member's preset and `{code, allowed}` overrides. Owner-only unless the owner
  explicitly grants `employees.manage_permissions`; delegated managers cannot
  grant permissions they do not have.
- Permission checks are made from the current database membership on every
  request. Roles other than `PROPRIETAIRE` do not implicitly authorize
  inventory, order, customer, financial, shop, appointment, or activity
  operations.

### Store locations

- `GET|POST /api/v1/stores/:storeId/locations` — list or create a store's
  inventory location; reads require `inventory.view`, writes require
  `inventory.manage_locations`.
- `PATCH /api/v1/stores/:storeId/locations/:locationId` — update or deactivate
  a location. Locations are deactivated rather than deleted to preserve stock
  history.

### Products

- `GET /api/v1/products` — paginated active catalog search; optional `q` and
  `type` filters.
- `GET /api/v1/products/:productId` — active product, active variants and
  optical specifications.
- `POST|PATCH|DELETE /api/v1/products[/:productId]` — ADMIN/SUPER_ADMIN
  catalog operations; delete archives instead of deleting the row.
- `GET|POST /api/v1/products/:productId/variants` — variant listing/create;
  writes require platform ADMIN/SUPER_ADMIN.

Barcode scan/catalog lookup is not connected. Product characteristic writes
remain pending.

### Inventory

- `GET|POST /api/v1/stores/:storeId/inventory` — store-scoped inventory.
- `GET|PATCH /api/v1/stores/:storeId/inventory/:stockId` — read a stock record
  or update its reorder threshold; stock quantity changes require a movement.
- `GET|POST /api/v1/stores/:storeId/inventory/:stockId/movements` — immutable
  movement history and transactional operations.
- Supported movement operations: receipt, sale, return, signed adjustment,
  damage, reserve, release, and paired transfer between locations in the same
  store. Inventory is conditionally updated and movement records are inserted
  in the same transaction. Transfer destinations must already have a stock
  record.

### Store listings and pricing

- `GET /api/v1/stores/:storeId/listings` — paginated active listings.
- `GET /api/v1/stores/:storeId/listings/:listingId` — active listing detail.
- `POST /api/v1/stores/:storeId/listings` — create a listing for an active
  catalog product.
- `PATCH /api/v1/stores/:storeId/listings/:listingId` — update listing state.
- `POST /api/v1/stores/:storeId/listings/:listingId/variants` and
  `PATCH /api/v1/stores/:storeId/listings/:listingId/variants/:listingVariantId`
  — set store-specific prices, currency, SKU, barcode, and availability.

Writes require authorized store membership. Checkout resolves prices from the
database, never from client input.

### Cart and orders

- `GET /api/v1/cart`, `POST /api/v1/cart/items`,
  `DELETE /api/v1/cart/items/:itemId`, and `DELETE /api/v1/cart` — owner-scoped
  cart operations.
- `POST /api/v1/orders` — create an order using server-side listing prices and
  stock, reserve inventory transactionally, and snapshot order details.
- `GET /api/v1/orders`, `GET /api/v1/orders/:orderId`, and
  `GET /api/v1/orders/:orderId/history` — owner-scoped order history.
- `POST /api/v1/orders/:orderId/cancel` — cancel an unpaid order and release
  its stock reservation.

Checkout currently accepts only one store per order. Orders remain pending
payment: payment creation, refund initiation, and webhook confirmation are not
exposed until a payment provider and verified webhook configuration are selected.

Store-owner workflows are separate from customer order endpoints:

- `GET /api/v1/stores/:storeId/orders` — paginated store orders; supports
  `status`, `from`, `to`, and `search`.
- `GET /api/v1/stores/:storeId/orders/:orderId` — details, customer summary,
  payment status, and order-status history.
- `PATCH /api/v1/stores/:storeId/orders/:orderId/status` — constrained
  business-state transition with an optional note. Only unpaid orders may be
  cancelled; that operation releases reserved stock atomically.
- `GET /api/v1/stores/:storeId/transactions` — paginated read-only payment
  records with `status`, `provider`, `from`, `to`, and `search` filters.
- `GET /api/v1/stores/:storeId/activity` and
  `GET /api/v1/stores/:storeId/activity/:activityId` — paginated audit history
  and event detail. Query filters include actor, action, entity type, dates,
  and text search.

These routes require the corresponding active membership permission. Every
data query includes the path store ID. Order changes are recorded in status history and
the audit journal in one transaction. Payment records are read-only; there is
no configured checkout, webhook verification, or refund processing.

Authenticated order owners can inspect sanitized records with
`GET /api/v1/orders/:orderId/payments` and
`GET /api/v1/orders/:orderId/refunds`. Provider payloads, idempotency keys,
checkout URLs, and internal failure details are never returned.

### Prescriptions and favorites

- `GET|POST /api/v1/clients/me/prescriptions` and
  `GET|PATCH|DELETE /api/v1/clients/me/prescriptions/:prescriptionId` — prescription and
  eye-specific data scoped to the authenticated user's client profile.
- `GET|POST|DELETE /api/v1/users/me/favorites/products[/:productId]` and
  `GET|POST|DELETE /api/v1/users/me/favorites/stores[/:storeId]` — owner-scoped
  favorites for active catalog products and stores.

### Social

- `GET /api/v1/social/feed` — public published posts.
- `GET /api/v1/social/me/publications` — own posts.
- `POST|PATCH|DELETE /api/v1/social/publications[/:postId]` — create, update,
  or soft-delete a user/store post; store posts require membership.
- `GET|POST /api/v1/social/publications/:postId/comments` and
  `DELETE /api/v1/social/comments/:commentId` — public-post comments.
- `POST|DELETE /api/v1/social/publications/:postId/like` and
  `POST|DELETE /api/v1/social/publications/:postId/repost` — likes and reposts.
- `POST|DELETE /api/v1/social/stores/:storeId/follow` — follow/unfollow stores.

Only public content is exposed; private/subscriber visibility and media
upload/delivery are not implemented. No storage keys are accepted or returned.

### Appointments and reviews

- `GET /api/v1/appointments/me`, `POST /api/v1/appointments`, and
  `POST /api/v1/appointments/:appointmentId/cancel` — customer appointment
  requests and cancellation.
- `GET /api/v1/stores/:storeId/appointments` and
  `PATCH /api/v1/stores/:storeId/appointments/:appointmentId` — store-member
  list and status transitions.
- `GET /api/v1/products/:productId/reviews` and
  `GET /api/v1/stores/:storeId/reviews` — published review lists.
- `POST /api/v1/products/:productId/reviews` and
  `POST /api/v1/stores/:storeId/reviews` — submit reviews for moderation.
- `PATCH|DELETE /api/v1/reviews/:reviewId` — edit/delete an owned review.

Product verified-purchase status is derived from completed order items.
Appointment requests do not reserve time slots because the schema has no
availability schedule or unique slot constraint.

### Notifications

- `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`,
  `POST /api/v1/notifications/:notificationId/read`, and
  `POST /api/v1/notifications/read-all` — recipient-only notification access.
- `GET|PATCH /api/v1/notifications/preferences` — read/update channel
  preferences.

Client APIs cannot create or send notifications. Automated in-app event
generation and email/push delivery are not wired; delivery providers are not
configured.

### Virtual try-on consent and sessions

- `GET /api/v1/virtual-try-on/consent` — return the configured consent policy.
- `POST /api/v1/virtual-try-on/sessions` — create an owner-scoped session and
  record acceptance of the current server-configured consent version.
- `GET /api/v1/virtual-try-on/sessions` and
  `GET /api/v1/virtual-try-on/sessions/:sessionId` — list/read owned sessions
  and consent state.
- `POST /api/v1/virtual-try-on/sessions/:sessionId/withdraw-consent` and
  `DELETE /api/v1/virtual-try-on/sessions/:sessionId` — withdraw consent or
  close the owned session.

Session creation is disabled with `503` until
`VIRTUAL_TRYON_CONSENT_VERSION`, `VIRTUAL_TRYON_CONSENT_PURPOSE`, and
`VIRTUAL_TRYON_CONSENT_TEXT` are configured. This does not process images or
invoke an AI provider. Upload, private file access/deletion, and generated
try-on results remain unavailable until a private storage provider and AI
integration are configured.

### Store dashboard and customer history

- `GET /api/v1/stores/:storeId/dashboard` — date-filtered gross payment revenue
  and successfully processed refunds reported separately, daily/weekly/monthly/yearly revenue by
  currency, transaction counts, order status counts and recent orders,
  inventory/low-stock/out-of-stock totals and recent movements, employee
  counts/recent additions, recent store audit history, and published review
  average. `range` supports `today`, `7d`, `30d`, `3m`, `12m`, and `custom`;
  custom ranges require ISO `from` and `to` query values.
- `GET /api/v1/stores/:storeId/customers` — paginated customers with store
  purchases, order counts, and last-order date.
- `GET /api/v1/stores/:storeId/customers/:customerId/orders` — paginated
  customer orders scoped to that store.

These endpoints require an active owner or manager membership and return
minimal customer profile data. Revenue is calculated from persisted successful
payment records and refunds from successful refund records, separately grouped
by currency; order values retain their own currency in purchase history.

### Store audit history

The store activity API is append-only from normal application operations.
Member, store profile, inventory/movement, order, and listing mutations now
record server-generated events transactionally with actor identity snapshots
and before/after values where available. New stock movement rows include
available/reserved before-and-after quantities. PostgreSQL rejects updates and
deletes to audit rows except the foreign-key nulling required when an actor user
is deleted; the saved identity snapshot is preserved. Historical rows predate
these fields and are not backfilled with invented values.

### Platform administration

The following endpoints require the `SUPER_ADMIN` platform role:

- `GET /api/v1/admin/audit-logs` — paginated, filtered audit metadata; IP
  address, user-agent, and arbitrary audit metadata are excluded.
- `PATCH /api/v1/admin/product-reviews/:reviewId` and
  `PATCH /api/v1/admin/store-reviews/:reviewId` — moderate review visibility;
  each status change is written to the audit log in the same transaction.

## Authentication and authorization

Use `POST /api/v1/auth/register` and `POST /api/v1/auth/login` for the existing
credential flow, then send `Authorization: Bearer <accessToken>` to protected
routes. Access tokens expire in 15 minutes. Sensitive endpoints are rate
limited in-process; multi-instance deployments need a shared throttling store.

Secure refresh/logout revocation, password reset and email verification are not
available yet: the current schema has no durable refresh/challenge storage and
no mail provider is configured. Registration status policy must be reconciled
with email verification before production.

## Responses and errors

Successful single-record operations return a DTO-shaped object; list operations
return the pagination envelope above. Nest exceptions produce standard HTTP
error responses: `400` invalid input, `401` missing/invalid authentication,
`403` insufficient role/membership, `404` missing/inaccessible resource, and
`409` uniqueness or business-state conflict. Internal Prisma messages should
not be exposed to API clients.

For exact model fields, optionality, enum members, mappings and constraints see
`prisma/schema.prisma`. Implemented API scope and outstanding entities are
tracked in `API_ENTITY_COVERAGE.md`.
