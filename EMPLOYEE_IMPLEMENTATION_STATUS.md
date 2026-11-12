# Employee Portal — Implementation Status

## Delivered

- Separate `/employee/*` workspace and navigation; the employee workspace is
  distinct from the owner `/optician/*` backoffice and client portal.
- `GET /api/v1/employee/me` and `/employee/stores` return only the user's active
  store memberships, store selector information, role, preset, and effective
  permission codes.
- Multi-store selection is limited in the UI to returned memberships. Every
  store-scoped backend request independently rechecks active membership and
  permissions; selected store IDs and frontend state are not authorization.
- Navigation and operation controls are generated from the currently selected
  membership's effective permissions. Financial dashboard data is omitted
  unless `dashboard.view_financials` is explicitly granted.
- Inventory, order, customer, appointment, activity, and profile pages reuse
  existing API-backed surfaces where the relevant permission and endpoint
  exist. The backend remains the enforcement boundary.
- Employee activity is restricted to the authenticated actor unless
  `activity.view_all` is granted.
- The owner employee screen creates new employee accounts and active store
  memberships together, assigns a role and starting permission preset, and
  allows individual permission customization. Owners set a temporary password;
  employees must change it before accessing other authenticated APIs.

## Existing invitation compatibility

Previously created pending invitations remain accepted through the existing
membership acceptance route. New accounts are created directly and do not
depend on email delivery.

## Not supported by existing platform integrations

- Payroll and salary management.
- Payment checkout, verified provider webhooks, refund initiation, and
  transaction export.
- Shop publication moderation, employee customer notes, and store-side customer
  account edits.
- Features without a corresponding existing backend resource or API are not
  exposed as fake employee actions.

See [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) and
[PERMISSION_SYSTEM_DESIGN.md](./PERMISSION_SYSTEM_DESIGN.md) for effective
access semantics.
