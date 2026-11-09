# Lunetty API entity coverage

This inventory is based on `prisma/schema.prisma` (44 models, 30 enums). Prisma
remains the source of truth for scalar field names, optionality, relation
fields, foreign-key actions, unique constraints, indexes, defaults, and mapped
database names. No schema or migration was changed for this implementation.

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
| `ProfilOpticien` | Opticians | `GET|PATCH /api/v1/opticians/me`; create/read/update current user's profile | Own profile and active OPTICIEN store membership | Partial; membership gate tested |
| `Magasin` | Stores | Create/list/read/update/archive: `/api/v1/stores` | Public active read; owner/manager updates; owner archives | Partial; atomic owner creation tested |
| `MembreMagasin` | Stores / Memberships | List/invite/update/leave: `/api/v1/stores/:storeId/members` | Active membership; owner/manager permissions, owner-only role changes | Partial; no dedicated membership tests yet |
| `Adresse` | Users / Stores | User-owned CRUD: `/api/v1/users/me/addresses`; store address operations planned | Authenticated address owner | Partial; ownership-scoped writes |
| `EmplacementMagasin` | Stores / Inventory | List/create/update/deactivate: `/api/v1/stores/:storeId/locations` | Active owner or manager membership | Partial; location scope and uniqueness handled |
| `Produit` | Products | Search/read/create/update/archive: `/api/v1/products` | Active public read; platform ADMIN/SUPER_ADMIN writes | Partial |
| `VarianteProduit` | Products | List/create nested: `/api/v1/products/:productId/variants` | Public active read; platform ADMIN/SUPER_ADMIN writes | Partial |
| `CaracteristiqueMonture` | Products | Nested variant specification operation planned | Product/catalog administrator | Read only through product detail; writes not implemented |
| `CaracteristiqueVerre` | Products | Nested variant specification operation planned | Product/catalog administrator | Read only through product detail; writes not implemented |
| `CaracteristiqueLentilleContact` | Products | Nested variant specification operation planned | Product/catalog administrator | Read only through product detail; writes not implemented |
| `AnnonceMagasin` | Store Listings | Store-scoped listings planned | Store owner/manager/optician by operation | Not implemented |
| `VarianteAnnonceMagasin` | Store Listings | Nested listing price/availability operations planned | Authorized listing store | Not implemented |
| `Stock` | Inventory | Create/list/read/update reorder threshold: `/api/v1/stores/:storeId/inventory` | Owner/manager/optician active membership | Partial; movement rules tested |
| `MouvementStock` | Inventory | History/create: `/api/v1/stores/:storeId/inventory/:stockId/movements` | Authorized store membership; movement is immutable | Partial; reservation and insufficient-stock tests |
| `Ordonnance` | Prescriptions | Owner-scoped prescription operations planned | Client owner; limited authorized optician access | Not implemented |
| `OeilOrdonnance` | Prescriptions | Nested inside prescription create/update | Prescription owner/access policy | Not implemented |
| `Panier` | Cart | Current-user cart operations planned | Cart owner | Not implemented |
| `ArticlePanier` | Cart | Nested cart item operations planned | Cart owner; prices resolved server-side | Not implemented |
| `Commande` | Orders | Create/read/cancel/status-transition operations planned | Customer owner or authorized store staff | Not implemented |
| `ArticleCommande` | Orders | Created from cart/order use case; snapshots immutable | Parent order authorization | Not implemented |
| `HistoriqueStatutCommande` | Orders | Read-only order history, written during transitions | Parent order authorization | Not implemented |
| `Paiement` | Payments | Provider-backed order payment operations planned | Order owner; verified provider callbacks | Not implemented; providers not configured |
| `Remboursement` | Payments | Nested refund operation planned | Authorized payment/order staff | Not implemented; providers not configured |
| `EvenementWebhookPaiement` | Payments | Internal webhook ingestion/deduplication only | Provider signature verification | Not implemented; webhook secrets/providers absent |
| `RendezVous` | Appointments | Owner/store-scoped scheduling operations planned | Customer owner or store member | Not implemented |
| `AvisProduit` | Reviews | Nested product review operations planned | Author; moderation for status | Not implemented |
| `AvisMagasin` | Reviews | Nested store review operations planned | Author; moderation for status | Not implemented |
| `ProduitFavori` | Favorites | User-scoped add/remove/list operations planned | Favorite owner | Not implemented |
| `MagasinFavori` | Favorites | User-scoped add/remove/list operations planned | Favorite owner | Not implemented |
| `Publication` | Social | Feed and post CRUD planned | Author/store membership plus visibility | Not implemented |
| `MediaPublication` | Social | Nested media metadata; private storage integration required | Parent post authorization | Not implemented |
| `CommentairePublication` | Social | Nested comment/reply operations planned | Author or moderator | Not implemented |
| `AimePublication` | Social | Like/unlike use cases planned | Authenticated actor; unique by post/user | Not implemented |
| `AbonnementUtilisateur` | Social / Users | Follow/unfollow: `POST|DELETE /api/v1/users/:id/follow`; follower/following lists under `/api/v1/users/:id` | Authenticated actor; public active target; no self-follow or duplicate | Partial; user service tests |
| `AbonnementMagasin` | Social | Store follow/unfollow planned | Authenticated actor | Not implemented |
| `PartagePublication` | Social | Share/repost use case planned | Authenticated actor; unique by post/user | Not implemented |
| `SessionEssayage` | Virtual Try-On | Session lifecycle planned | Session owner | Not implemented; no AI provider |
| `FichierEssayage` | Virtual Try-On | Private file metadata managed by storage integration | Session owner; private storage only | Not implemented; no storage provider |
| `ConsentementEssayage` | Virtual Try-On | Explicit consent/withdrawal nested operation planned | Session owner | Not implemented |
| `Notification` | Notifications | Current-user feed/read operations planned | Recipient only | Not implemented |
| `PreferenceNotification` | Notifications | Current-user preference operations planned | Preference owner | Not implemented |
| `JournalAudit` | Admin / Audit | Read-only admin audit endpoint planned; write through audit service | SUPER_ADMIN read; trusted server-side writes | Not implemented |

### Coverage summary

- Total Prisma models: **44**
- Models with a domain API surface at this implementation checkpoint: **12**
  (`Utilisateur`, `ProfilClient`, `ProfilOpticien`, `Adresse`, `Magasin`,
  `MembreMagasin`, `EmplacementMagasin`, `Produit`, `VarianteProduit`,
  `Stock`, `MouvementStock`, `AbonnementUtilisateur`)
- Models with complete CRUD: **0**
- Models with partial or nested business operations: **12**
- Models intentionally internal-only by design: `ArticleCommande`,
  `HistoriqueStatutCommande`, `EvenementWebhookPaiement`, `JournalAudit`;
  their domain write/read services are still pending.
- Remaining models: explicitly listed above with their intended owner domain.
- Stories: no story model exists in the schema; no story endpoint is exposed.
- Recommendations/chatbot: no model or AI integration exists; no fabricated
  recommendations are returned.

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
