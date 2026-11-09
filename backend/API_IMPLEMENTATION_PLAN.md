# API implementation plan

## Architecture

Keep the existing NestJS modular monolith and Prisma 6.19.3. Organize behavior
by feature domains already present in `src/`; add small application services
and DTOs per feature rather than introducing a generic table CRUD abstraction.
Keep Prisma behind feature services/repositories and use explicit `select`
objects for API responses.

```text
src/
  common/       current-user decorator, platform-role/store-membership rules,
                pagination and shared validation
  prisma/       shared Prisma module and client
  auth/         credential verification and access-token guard
  users/        self profile and public profile reads
  stores/       store profile, membership, invitations and lifecycle
  products/     public catalog, variants and specifications
  inventory/    store-scoped stock, immutable movements and transactions
  clients/      client profiles and prescriptions
  orders/        cart, order snapshots and legal state transitions
  payments/     provider adapter contracts, webhooks and refunds
  social/        posts, comments, likes, follows and visibility
  ...
```

`PrismaModule` is imported once through the existing application module graph.
Feature modules may depend on common authorization services, but should not
depend on one another's controllers. Cross-domain operations should use an
exported application service or a transaction orchestrator, avoiding circular
module imports.

## Authorization

- `JwtAuthGuard` validates an access token and reloads active account status and
  platform role from PostgreSQL.
- `PlatformRolesGuard` handles only platform roles.
- `StoreAuthorizationService` requires a matching ACTIVE membership for the
  requested store; membership role is evaluated per operation.
- Resource-owner IDs always come from the authenticated principal, not the
  request body.
- User/payment/private-file/audit payloads require explicit selects and
  dedicated response shapes.

## Implemented checkpoint

1. `/api/v1` prefix, global DTO validation, CORS allow-list configuration,
   Swagger, and global request throttling.
2. User profile read/update/deactivation and public user/follower directories.
3. User follow/unfollow business operations with duplicate/self-follow guards.
4. Client profile self-service and optician profile self-service gated by an
   active optician membership.
5. User-owned address CRUD, with transactional default-address changes.
6. Store create/list/read/update/archive and store member invitation,
   acceptance, update, and removal.
7. Store inventory location list/create/update/deactivation, with default
   location changes.
8. Product public search/read and platform-admin catalog create/update/archive;
   product variant list/create.
9. Store inventory create/list/read and reorder-threshold update; transactional
   stock movements, reservations,
   releases, and same-store paired transfers.
10. Generic `/admin/crud/:resource` routes removed.

## Remaining sequence

1. Reconcile deployed migration state and physical PostgreSQL schema. This
   migration audit is a release blocker; do not replay the destructive
   translation migration or alter data as part of API work.
2. Complete authentication lifecycle after choosing durable schema-backed
   token/challenge storage and configuring an email delivery provider. Until
   then, refresh/revocation, email verification, and password reset cannot be
   represented securely by the current schema.
3. Implement store-specific listings, listing variants/prices, and
   product-specification writes.
4. Implement cart and orders with conditional stock reservations, immutable
   price/address snapshots, and explicit status transition policy.
5. Implement payments only for configured providers; verify raw webhook
   signatures and deduplicate provider events.
6. Implement appointments, prescriptions, reviews, favorites and moderation.
7. Implement social publication, media storage, comments, likes, follows and
   feed visibility.
8. Implement try-on consent/session/file lifecycle after private storage and
   retention policy are configured; keep AI processing behind an adapter.
9. Implement notifications, store analytics and explicit SUPER_ADMIN
   administration.
10. Add per-domain integration tests and update
    `API_ENTITY_COVERAGE.md` as each module passes.

## Schema and integration blockers (no schema changes made)

- Refresh tokens and verification/reset challenges have no storage models.
  Secure multi-instance refresh rotation, revocation, and one-time challenges
  require durable storage; in-memory or self-contained tokens are not an
  acceptable production substitute.
- Email, payment, object-storage, and AI provider credentials/adapters are not
  configured. Those integrations remain disabled.
- Stories are not represented in Prisma. Their data model needs a separate
  product/schema proposal.
- Inventory has no database check constraint preventing negative quantities;
  transactional conditional updates enforce this in the implemented API, but
  direct database writes can bypass it.
- The translation migration drops/recreates tables and its physical columns
  do not line up with several current Prisma field mappings. Resolve the
  migration/database mismatch with a backup and verified data plan before
  deploying new migrations.
