# Lunetty API entity coverage

This inventory is based on `prisma/schema.prisma` (44 models, 30 enums). Prisma
remains the source of truth for scalar field names, optionality, relation
fields, foreign-key actions, unique constraints, indexes, defaults, and mapped
database names. The additive backoffice migration extends `JournalAudit` and
`MouvementStock`; it does not replace existing models.

The migration `20261109013937_traduire_noms_francais` explicitly warns that it
drops and recreates tables. It does not show data-copy operations and its
created column names differ from the current schema in several places. Do not
replay, edit, or replace it until database migration history and stored data
have been checked against the actual database. That investigation was not run
as part of API work.

## Model inventory and API ownership

“Implemented” below means that a domain route and an initial working business
operation exist; it does not mean full lifecycle/CRUD completeness. Tests are
only marked for the service behaviors currently covered by unit tests.

| Prisma model | Domain | API operation / route ownership | Authorization | Status / tests |
|---|---|---|---|---|
| `Utilisateur` | Users / Auth | Profile read/update/deactivate: `/api/v1/users/me`; login/register: `/api/v1/auth/*` | Self; active account for bearer routes | Partial; user-service unit tests |
| `ProfilClient` | Clients | `GET|PATCH /api/v1/clients/me`; create/read/update current user's profile | Profile owner | Partial; service behavior tested |
| `ProfilOpticien` | Opticians | `GET|PATCH /api/v1/opticians/me`; create/read/update current user's profile | Own profile and active owner or OPTICIEN store membership | Partial; membership gate tested |
| `Magasin` | Stores / Analytics | Create/list/read/update/archive; filtered dashboard, owner orders and transactions | Public active read; owner/manager updates and analytics; owner archives | Partial; store profile changes are audit-recorded |
| `MembreMagasin` | Stores / Memberships | List/create employee account/update/leave: `/api/v1/stores/:storeId/members` | Active membership; only owners create employee accounts; individual permissions | Partial; account creation and changes are audit-recorded |
| `Adresse` | Users / Stores | User-owned CRUD: `/api/v1/users/me/addresses`; store address operations planned | Authenticated address owner | Partial; ownership-scoped writes |
| `EmplacementMagasin` | Stores / Inventory | List/create/update/deactivate: `/api/v1/stores/:storeId/locations` | Active owner or manager membership | Partial; location scope and uniqueness handled |
| `Produit` | Products | Search/read/create/update/archive: `/api/v1/products` | Active public read; platform ADMIN/SUPER_ADMIN writes | Partial |
| `VarianteProduit` | Products | List/create nested: `/api/v1/products/:productId/variants` | Public active read; platform ADMIN/SUPER_ADMIN writes | Partial |
| `CaracteristiqueMonture` | Products | Read through `GET /api/v1/products/:productId` | Active product catalog read; no write endpoint | Read only; writes not implemented |
| `CaracteristiqueVerre` | Products | Read through `GET /api/v1/products/:productId` | Active product catalog read; no write endpoint | Read only; writes not implemented |
| `CaracteristiqueLentilleContact` | Products | Read through `GET /api/v1/products/:productId` | Active product catalog read; no write endpoint | Read only; writes not implemented |
| `AnnonceMagasin` | Store Listings | List/read/create/update: `/api/v1/stores/:storeId/listings` | Public active read; authorized store member writes | Partial |
| `VarianteAnnonceMagasin` | Store Listings | Nested create/update under store listing | Authorized listing store | Partial |
| `Stock` | Inventory | Create/list/read/update reorder threshold: `/api/v1/stores/:storeId/inventory` | Owner/manager/optician active membership | Partial; threshold and creation changes are audit-recorded |
| `MouvementStock` | Inventory | History/create: `/api/v1/stores/:storeId/inventory/:stockId/movements` | Authorized store membership; movement history is append-only in application flows | Partial; before/after quantity snapshots and reservation tests |
| `Ordonnance` | Prescriptions | `GET|POST /api/v1/clients/me/prescriptions`; nested `GET|PATCH|DELETE /:id` | Client-profile owner | Partial; CRUD operations |
| `OeilOrdonnance` | Prescriptions | Nested eye measurements in prescription create/update | Prescription owner | Partial; transactional replacement |
| `Panier` | Cart | `GET|DELETE /api/v1/cart` | Authenticated cart owner | Partial |
| `ArticlePanier` | Cart | `POST /api/v1/cart/items`; `DELETE /api/v1/cart/items/:itemId` | Cart owner; server-validated listing and stock | Partial |
| `Commande` | Orders | Customer endpoints under `/api/v1/orders`; store-scoped list/detail/status under `/api/v1/stores/:storeId/orders` | Customer owner or Owner/Manager in the order's store | Partial; status transitions are constrained and audited |
| `ArticleCommande` | Orders | Snapshotted from cart; read within owned order | Parent order authorization | Internal operation; immutable order item snapshots |
| `HistoriqueStatutCommande` | Orders | Read `/api/v1/orders/:orderId/history`; service writes transitions | Parent order owner | Internal history; order cancellation covered |
| `Paiement` | Payments | Customer order reads and store transactions: `/api/v1/orders/:orderId/payments`, `/api/v1/stores/:storeId/transactions` | Owning customer or Owner/Manager in the order's store | Read-only; provider not configured |
| `Remboursement` | Payments | Sanitized refund reads attached to authorized order/payment records | Owning customer or Owner/Manager in the order's store | Read-only; refund provider not configured |
| `EvenementWebhookPaiement` | Payments | Internal webhook ingestion/deduplication only | Provider signature verification | Not implemented; webhook secrets/providers absent |
| `RendezVous` | Appointments | Customer request/list/cancel; store list/status transition | Customer owner or authorized store member | Partial; no slot availability model |
| `AvisProduit` | Reviews | Public list; user submit/edit/delete | Review author; new reviews pending moderation | Partial; purchase status server-derived |
| `AvisMagasin` | Reviews | Public list; user submit/edit/delete; admin moderation | Review author; optional completed order association; SUPER_ADMIN moderation | Partial; moderation audit |
| `ProduitFavori` | Favorites | `GET|POST|DELETE /api/v1/users/me/favorites/products` | Favorite owner; active product required | Partial |
| `MagasinFavori` | Favorites | `GET|POST|DELETE /api/v1/users/me/favorites/stores` | Favorite owner; active store required | Partial |
| `Publication` | Social | Public feed; own create/update/soft-delete | Author/store membership; public visibility only | Partial |
| `MediaPublication` | Social | Nested media metadata; private storage integration required | Parent post authorization | Not implemented |
| `CommentairePublication` | Social | Public post comment list/create; author soft-delete | Authenticated commenter; public posts only | Partial |
| `AimePublication` | Social | Like/unlike public post | Authenticated actor; unique by post/user | Partial |
| `AbonnementUtilisateur` | Social / Users | Follow/unfollow: `POST|DELETE /api/v1/users/:id/follow`; follower/following lists under `/api/v1/users/:id` | Authenticated actor; public active target; no self-follow or duplicate | Partial; user service tests |
| `AbonnementMagasin` | Social | Follow/unfollow: `/api/v1/social/stores/:storeId/follow` | Authenticated actor; active store | Partial |
| `PartagePublication` | Social | Repost/unrepost public post | Authenticated actor; unique by post/user | Partial |
| `SessionEssayage` | Virtual Try-On | Create/list/read/close under `/api/v1/virtual-try-on/sessions` | Session owner; current consent required | Partial; requires consent configuration |
| `FichierEssayage` | Virtual Try-On | Private file metadata managed by storage integration | Session owner; private storage only | Not implemented; no storage provider |
| `ConsentementEssayage` | Virtual Try-On | Created with session; explicit withdrawal endpoint | Session owner; server-controlled version and purpose | Partial; requires consent configuration |
| `Notification` | Notifications | List/count/read/read-all: `/api/v1/notifications` | Recipient only; clients cannot create or send | Partial; event generation/delivery not wired |
| `PreferenceNotification` | Notifications | `GET|PATCH /api/v1/notifications/preferences` | Preference owner | Partial |
| `JournalAudit` | Admin / Store Audit | Admin audit logs and paginated store history: `/api/v1/admin/audit-logs`, `/api/v1/stores/:storeId/activity` | SUPER_ADMIN or Owner/Manager membership in the path store | Append-only trigger; store mutation integration is partial |

### Coverage summary

- Total Prisma models: **44**
- Models with a domain API surface at this implementation checkpoint: **41**
  (including the user/store/catalog/inventory modules, store listings, cart and
  orders, prescriptions, appointments, reviews, favorites, selected social
  operations, notification preferences/read APIs, and optical specification
  reads.)
- Models with complete CRUD: **0**
- Models with partial or nested business operations: **41**
- Models intentionally internal-only or provider-dependent: payment webhook
  events, publication/try-on file metadata, and payment/refund processing.
  Order item/history snapshots are internal to owned order views. Audit writes
  are server-side, with a SUPER_ADMIN audit read and review-moderation trail.
- Remaining models: explicitly listed above with their intended owner domain.
- Stories: no story model exists in the schema; no story endpoint is exposed.
- Recommendations/chatbot: no model or AI integration exists; no fabricated
  recommendations are returned.
- Payments/refunds: no payment provider or signed webhook is configured, so
  order payment execution, refunds, and webhook ingestion remain unavailable.
- Virtual try-on files: no private storage provider is configured; file upload,
  retrieval, and deletion are unavailable. Session processing is not exposed.
- Appointment slots: the schema has no store schedule or slot uniqueness
  constraint, so the API cannot guarantee collision-free booking.
- Social media delivery remains outstanding; review moderation and its audit
  trail are implemented for SUPER_ADMIN.

## Separate schema proposal: Stories

No Stories model or endpoint has been added. Before implementation, review and
approve a separate schema change with:

- `Story`: UUID, exactly one user or store owner, caption, visibility, created /
  published / expiry timestamps, and soft-delete timestamp. Add an index on
  visibility and expiry and enforce that an active story has not expired.
- `StoryMedia`: UUID, story foreign key, media type, private storage key,
  position, creation timestamp, and optional expiry. Storage keys must not be
  returned to clients; access should use short-lived authorized delivery URLs
  from a configured private-storage provider.
- `StoryView`: UUID, story and viewer foreign keys, viewed timestamp, and a
  unique constraint on `(story_id, viewer_id)`.

The proposal needs product decisions for retention, maximum story lifetime,
visibility rules, and whether stores and users share the same visibility
policy. No Prisma schema or migration was modified.

## Enum inventory

The schema defines these 30 enums:

`RolePlateforme`, `StatutUtilisateur`, `RoleMembre`, `StatutAdhesion`,
`StatutMagasin`, `TypeAdresse`, `TypeProduit`, `StatutProduit`, `PublicCible`,
`TypeConceptionVerre`, `TraitementVerre`, `FrequenceRemplacementLentille`,
`StatutAnnonce`, `TypeEmplacementStock`, `TypeMouvementStock`, `CoteOeil`,
`StatutPanier`, `StatutCommande`, `StatutPaiement`, `FournisseurPaiement`,
`StatutRemboursement`, `StatutRendezVous`, `StatutAvis`,
`VisibilitePublication`, `TypeMedia`, `StatutEssayage`, `TypeFichierEssayage`,
`TypeNotification`, `CanalNotification`, and `StatutNotification`.

Enum members, field types/defaults, nullable markers, and all relation/index/
constraint metadata remain exactly as declared in the Prisma schema; API DTOs
must map to those declarations and must not broaden allowed platform or store
roles.
