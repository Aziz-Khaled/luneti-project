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
  the user must have an active OPTICIEN membership in a store.

### Addresses

- `GET|POST /api/v1/users/me/addresses` — list or create an authenticated
  user's address.
- `GET|PATCH|DELETE /api/v1/users/me/addresses/:addressId` — read, update, or
  delete an address owned by the authenticated user. Default-address changes
  are applied transactionally.
- Store-owned address endpoints are not implemented.

### Stores and memberships

- `GET /api/v1/stores` and `GET /api/v1/stores/:storeId` — active public stores.
- `POST /api/v1/stores` — creates a DRAFT store and active owner membership in
  one transaction.
- `PATCH /api/v1/stores/:storeId` — owner/manager profile fields.
- `DELETE /api/v1/stores/:storeId` — owner-only soft archive.
- `GET|POST /api/v1/stores/:storeId/members` — authorized listing/invitation.
- `PATCH|DELETE /api/v1/stores/:storeId/members/:memberId` — own invite
  acceptance, owner membership administration, or own membership departure.

Invitations require an existing user account; email delivery is not configured.
Ownership transfer and store analytics are not implemented.

### Store locations

- `GET|POST /api/v1/stores/:storeId/locations` — list or create a store's
  inventory location; requires an active owner or manager membership.
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
and store listings/prices are pending.

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
