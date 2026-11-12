# Frontend implementation status

The interface is a functional Next.js App Router test client for the available API. Lists and forms use live HTTP requests through the shared API client; no business data is hard-coded.

## Pages and journeys

| Page or feature | Status | API integration |
|---|---|---|
| Login, registration, session restore, logout | Implemented | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`; logout is local because the API has no logout endpoint. |
| Client dashboard | Implemented | Authenticated account details and navigation; no fabricated statistics. |
| Client account and client-specific profile | Implemented | `GET/PATCH /users/me`, `GET/PATCH /clients/me`. |
| Store exploration and details | Implemented | `GET /stores`, `GET /stores/:storeId`; follow, favorites, appointment request, and reviews are available from store details. |
| Product catalog and details | Implemented | `GET /products`, `GET /products/:productId`, `GET /products/:productId/variants`; product reviews and favorites are available from details. |
| Following and public user profiles | Implemented | User listing/profile, followers/following, follow and unfollow endpoints. |
| Address list/create/edit/delete | Implemented | `/users/me/addresses` collection and item routes. |
| Cart and orders | Implemented | Cart read/update/clear, order checkout/list/detail/cancel; prices and stock remain server-controlled. |
| Payment/refund information | Read-only | Order payment/refund records can be viewed; payment initiation and refunds require backend/provider support. |
| Social feed | Implemented for text | Feed, own publications, publication creation, comments, likes, and reposts. Media upload is unavailable. |
| Appointments | Implemented | Client list/request/cancel; store list and status transitions for authorized store members. |
| Prescriptions | Implemented | List/create/delete with eye-specific JSON submitted to backend validation. |
| Product/store favorites | Implemented | List/add/remove API operations; add is available from the relevant detail pages. |
| Notifications | Implemented | List, unread count, mark one/all read, and notification preferences. |
| Virtual try-on | Consent/session only | Policy, session list, and consented session creation; no file upload or AI processing. |
| Optician dashboard and store setup | Implemented with API constraints | Date-filtered gross revenue/refunds, orders/inventory/employees/activity dashboard, store creation/details/update/archive. Store ID must be saved or re-entered. |
| Employees | Implemented using memberships | Owner creates employee accounts, sets a temporary password, chooses role and individual permissions, and manages/removes members. Employees must change temporary passwords at first login. |
| Store locations | Implemented | List/create/update/deactivate using the locations API. |
| Catalog and store listings | Implemented | Catalog is read-only for ordinary store members; store listings and priced variants use store-specific routes. |
| Inventory and movements | Implemented | List/create/update/reorder threshold and movement history/create; every new movement returns quantity-before/after snapshots and uses backend transactions. |
| Store orders | Implemented | Store-scoped list, status/date/search filters, order details/history, and valid status transitions. |
| Store transactions | Read-only | Store-scoped payment/refund records with provider/status/date/search filters; no provider integration or financial mutation is simulated. |
| Activity history | Implemented for supported mutations | Paginated search/date/actor/action/entity filters, event detail, and actor/before-after snapshots. |
| Shop management/settings | Implemented for existing store fields | Update contact, branding URLs, timezone, currency and core profile; product listings remain separate from the global catalog. |
| Backoffice assistant | Placeholder only | Floating popup with a clear Coming soon message; no AI request or simulated answer. |
| Store customers and purchase history | Implemented | Store customers and per-customer orders. |
| Optician profile | Implemented subject to backend membership | Read/update `/opticians/me` for active store owners and opticians. |
| Stories, AI recommendations, private media files | Not implemented | Missing backend/schema/provider capabilities are listed in `FRONTEND_BACKEND_GAPS.md`. |

## API client and UX

- Browser requests use the same-origin `/api/v1` path and Next.js proxies them to `LUNETTY_API_PROXY_TARGET`. The local `.env.local` points to the Swagger-verified backend at `http://localhost:3002`; deployments should set this server-side variable to their backend origin. This avoids browser CORS and port/hostname mismatches.
- Docker Compose starts the frontend on `http://localhost:3001` and routes its API proxy internally to `http://backend:3000`.
- Compose waits for the backend Swagger healthcheck before starting the frontend; the backend synchronizes its mounted dependencies before Prisma client generation and Nest startup. No database migration is run.
- Bearer auth is sent by the centralized API client. Tokens use tab-scoped `sessionStorage` because the current API does not support secure cookie auth.
- Forms submit real API requests and show pending, success, and API validation/network errors. Destructive actions use browser confirmation.
- Client/optician workspaces are navigation contexts only; backend authorization remains authoritative.

## Validation status

- `npm run lint` passes.
- `npm run build` passes.
- Latest backoffice verification: `npm run lint` and `npm run build` pass with the dashboard, employee, order, transactions, activity, settings, and placeholder UI.
- Browser smoke check confirmed login/registration render and an unauthenticated `/client/dashboard` request redirects to `/login`.
- `.env.local` sets `LUNETTY_API_PROXY_TARGET=http://localhost:3002` for the currently running backend. A POST through the frontend proxy to `/api/v1/auth/register` returned the API's expected HTTP 400 validation response to an empty request, confirming that the frontend reaches the backend. No real account was created.
- Swagger responds at `http://localhost:3002/api/docs-json`; public product and store reads have returned HTTP 500, so database-backed journeys still need verification.
- Set `LUNETTY_API_PROXY_TARGET` to the backend origin when starting the frontend in another environment. Browser requests use same-origin rewrites, so backend CORS does not need to be changed for the frontend.
- The frontend binds to IPv4 loopback on port `3001`; an existing IPv6 loopback WSL relay also listens on that port. Open `http://127.0.0.1:3001` to reach this frontend. For browser API calls from that address, configure backend `CORS_ORIGINS` to include `http://127.0.0.1:3001`; its default allows `http://localhost:3001`.
