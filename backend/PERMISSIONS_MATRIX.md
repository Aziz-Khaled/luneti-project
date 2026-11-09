# Permissions matrix

Platform roles and store membership roles are separate authorization scopes.
An active membership in one store never grants access to another store.

| Operation | Anonymous | USER | Store EMPLOYE | Store OPTICIEN | Store GERANT | Store PROPRIETAIRE | ADMIN | SUPER_ADMIN |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Read active public users/stores/products | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Read/update/deactivate own profile | No | Own account | Own account | Own account | Own account | Own account | Own account | Own account |
| Read/update own client profile | No | Own account | Own account | Own account | Own account | Own account | Own account | Own account |
| Read/update own optician profile | No | No | No | Active OPTICIEN membership | Active OPTICIEN membership | Active OPTICIEN membership | Not implicitly granted | Not implicitly granted |
| Read/manage own addresses | No | Own addresses | Own addresses | Own addresses | Own addresses | Own addresses | Not implicitly granted | Not implicitly granted |
| Follow/unfollow public user | No | Authenticated actor | Authenticated actor | Authenticated actor | Authenticated actor | Authenticated actor | Authenticated actor | Authenticated actor |
| Create a store | No | Yes (becomes owner) | Yes (becomes owner) | Yes (becomes owner) | Yes (becomes owner) | Yes (new store) | Yes | Yes |
| Update store profile | No | No | No | No | Active membership | Active membership | Not implicitly granted | Not implicitly granted |
| Archive store | No | No | No | No | No | Active membership | Not implicitly granted | Not implicitly granted |
| Invite store member | No | No | No | No | Active membership; cannot grant manager/owner | Active membership | Not implicitly granted | Not implicitly granted |
| Change membership role/status | No | Accept own invite only | No | No | No | Store membership administration | Not implicitly granted | Not implicitly granted |
| Read/write store inventory | No | No | No | Active membership | Active membership | Active membership | Not implicitly granted | Not implicitly granted |
| Manage store inventory locations | No | No | No | No | Active membership | Active membership | Not implicitly granted | Not implicitly granted |
| Create/update/archive global catalog product | No | No | No | No | No | No | Yes | Yes |
| Create global product variant | No | No | No | No | No | No | Yes | Yes |
| Store-specific listing and price changes | No | No | Planned | Planned | Planned | Planned | Not implicitly granted | Not implicitly granted |
| Platform-wide administration | No | No | No | No | No | No | Planned, explicit route policy | SUPER_ADMIN only |

The current membership acceptance path allows a user to activate only their
own invited membership. Product catalog writes are intentionally platform
admin-only; store membership does not currently grant global catalog access.
Unimplemented rows are targets, not claims of existing endpoints.
