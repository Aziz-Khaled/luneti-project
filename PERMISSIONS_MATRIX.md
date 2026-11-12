# Store Permission Matrix

The permission codes below are the stable backend catalog in
`backend/src/common/guards/store-permissions.ts`. An action is available only
when the effective permission set contains that exact code. `view` never
implicitly grants a mutation.

| Module | Permission code | API behavior |
|---|---|---|
| Dashboard | `dashboard.view` | Read the store dashboard |
| Dashboard | `dashboard.view_financials` | Include revenue, refunds, payment counts, and trends |
| Inventory | `inventory.view` | List and read store stock |
| Inventory | `inventory.create` | Create stock records |
| Inventory | `inventory.update` | Change reorder thresholds |
| Inventory | `inventory.adjust_stock` | Record stock movements/adjustments |
| Inventory | `inventory.view_history` | Read stock movement history |
| Inventory | `inventory.manage_locations` | Create/update store inventory locations |
| Orders | `orders.view` | List and read store orders |
| Orders | `orders.accept` | Confirm a paid order |
| Orders | `orders.update_status` | Perform allowed non-cancel status transitions |
| Orders | `orders.cancel` | Cancel an eligible unpaid order |
| Customers | `customers.view` | Read the store-scoped customer list |
| Customers | `customers.view_contact` | Include customer contact details where supported |
| Customers | `customers.view_order_history` | Read a customer's orders from this store |
| Customers | `customers.view_address` | Include delivery address snapshots on store orders |
| Employees | `employees.view` | List store memberships |
| Employees | `employees.create` | Create an employee account and active store membership (owner only) |
| Employees | `employees.update` | Change permitted non-owner membership status/role fields |
| Employees | `employees.remove` | Remove eligible non-manager memberships |
| Employees | `employees.manage_permissions` | Read/configure eligible member permission sets, subject to delegation limits |
| Transactions | `transactions.view` | Read sanitized store payment records |
| Transactions | `transactions.view_refunds` | Include refund details and refunded amounts |
| Shop | `shop.view` | Read the managed store profile |
| Shop | `shop.update` | Update supported store profile fields |
| Shop | `shop.manage_products` | Create/update shop product listings and variants |
| Activity | `activity.view_all` | Read store activity for all actors |
| Activity | `activity.view_own` | Read only the authenticated actor's store activity |
| Appointments | `appointments.view` | List store appointments |
| Appointments | `appointments.update` | Make supported appointment status transitions |
| Appointments | `appointments.cancel` | Cancel an eligible appointment |

Unavailable operations such as payment refunds, transaction export, publication
moderation, employee payroll, and customer account editing are intentionally
not represented as permissions because there is no corresponding implemented
API operation.

## Preset starting sets

Presets only initialize the baseline set. The owner can change any permission
after selection; explicit overrides are applied afterward.

| Preset | Starting permissions |
|---|---|
| `read_only` | `dashboard.view`, `inventory.view`, `inventory.view_history`, `orders.view`, `customers.view`, `shop.view`, `activity.view_own` |
| `stock_manager` | `inventory.view`, `inventory.create`, `inventory.update`, `inventory.adjust_stock`, `inventory.view_history`, `inventory.manage_locations` |
| `order_manager` | `orders.view`, `orders.accept`, `orders.update_status` |
| `customer_service` | `customers.view`, `customers.view_contact`, `customers.view_order_history`, `orders.view` |
| `custom` | No permissions |

No role other than `PROPRIETAIRE` implicitly grants permissions. Existing
non-owner memberships with no preset remain deny-by-default.

## Owner-only invariants

- Owners have the complete catalog regardless of preset/override rows.
- Employees cannot change their own permission set or access another store's
  membership permission record.
- Only an owner can grant `GERANT`, modify an owner membership, or remove a
  manager. The last active owner cannot be removed.
- A delegated permission manager can assign only permissions currently in
  their own effective set.
