# Frontend: React + Vite

React 18, TypeScript 4.9 (`strict`), Vite 5, MUI 6 + Emotion, Redux Toolkit (cart), TanStack Query 5 (server data), React Router 6, react-hook-form, STOMP/SockJS, Firebase push, Google Maps. Capacitor 8 wraps it for Android (`android/`) and iOS (app id `com.bobs.restaurant`).

`README.md` is stale (Create React App text). The scripts below are the real ones.

## Commands

```bash
npm install
npm run dev          # Vite dev server on http://localhost:3000
npx tsc --noEmit     # type-check (baseline: clean)
npm run lint         # ESLint + Prettier (baseline: 12 errors, 9 warnings)
npm test             # Vitest (pure-logic tests, node env)
npm run lint:fix
npm run build        # tsc && vite build → dist/
npm run cap:android  # build + sync + open Android Studio
```

Tests use **Vitest** (`vitest.config.ts`, node env, `src/**/*.test.ts`) for pure logic: cart, storage migration and admin form rules. There's no React Testing Library/jsdom yet; UI is verified manually. Extract logic into utils so it can be tested.

## Layout (`src/`)

| Path | Contents |
|---|---|
| `main.tsx`, `App.tsx` | Entry point, providers (Redux, React Query, theme, `AddressContext`), routes |
| `config/api.ts` | `API_BASE_URL`, `API_BASE_SOCKET_URL`, `ENDPOINTS`. Add new endpoints here |
| `pages/` | Customer pages: `foodList` (menu), `cartPage`, `checkoutPage`, `addressesPage`, `addAddressPage`, `staticLanding`, `LoginPage`, `header` |
| `pages/admin/` | Admin dashboard tabs: `CurrentOrdersTab`, `OrdersTab`, `MenuTab`/`EditItemDrawer`, `PromotionalAddonsTab`, `DiscountsTab`, `Expense*Tab`, `ReportingTab` |
| `components/` | Shared UI: `listing/`, `promotionalAddons/`, `address/`, `auth/CustomerOtpDialog`, `ProtectedRoute`, `Receipt`, `PriceDisplay`, … |
| `data/hooks/` | React Query hooks per resource (`useFoodItems`, `useOrders`, `useCustomerAuth`, `usePromotionalAddons`, `useExpenses`, …). Most use `fetch` |
| `admin/` | Admin auth (`auth.ts`, `useLogin`, `isAuthenticatedAndAdmin`), `api/adminApi.ts` + `queryClient.ts`, `hooks/`, `types/` |
| `customer/auth.ts` | Customer JWT storage helpers |
| `redux/` | `store.ts` (cart slice, persisted to localStorage), `foodSlice.ts`, `selectors.ts` |
| `utils/` | Pricing (`priceUtils`), promo logic (`promotionalAddonStrategy`), `cartUtils`/`cartStorage`, `authHelpers` (builds the Bearer header), `orderWebSocketBroadcast`, `printService`, `geo`, `phone`, `analytics` |
| `types/` | Shared TS types that mirror backend DTOs |
| `data/*.ts`, `*.json` | Static/legacy menu data |

## Routes

| Path | Page |
|---|---|
| `/` | Redirects to `/bobs/foodList` |
| `/bobs`, `/bobs/menu`, `/bobs/foodList` | Menu (`FoodList`) |
| `/bobs/landing` | `StaticLanding` |
| `/cart`, `/checkout` | Cart and checkout |
| `/addresses`, `/addresses/new`, `/addresses/:id/edit` | Addresses |
| `/bobs/admin/login` | Admin login |
| `/bobs/admin` | Admin dashboard (`ProtectedRoute`) |

## Auth and state

- Admin JWT is in localStorage (`admin_auth_token` and related). The customer JWT is under `CUSTOMER_AUTH_KEY`. Requests add `Authorization: Bearer …` through `utils/authHelpers.ts` or inline in hooks.
- Cart items are identified by `id` + `option.{base,size,style}` + `isFreeClaim` + `isPromotionalAddon`. Keep that matching logic consistent when touching the cart.
- Server data goes through React Query. Don't duplicate it into Redux.

## Environment

`.env`, `.env.development`, `.env.production`, `.env.example`. Only `VITE_*` vars are exposed. Main ones: `VITE_API_BASE_URL`, `VITE_API_BASE_SOCKET_URL`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_FIREBASE_*`, `VITE_GA_MEASUREMENT_ID`. Never print or commit their values.

## Deployment

Azure Static Web Apps through `.github/workflows/*.yml`. `public/staticwebapp.config.json` handles SPA routing.

## Conventions and gotchas

- Functional components + hooks, MUI `sx`/theme (`styles/theme.ts`), Prettier (`src/.prettierrc`). Run `npm run lint:fix` on the files you touch.
- There's an `@` → `src` alias in Vite, but code mostly uses relative imports. Follow the surrounding file.
- `vite.config.js` duplicates `vite.config.ts`, and Vite prefers the `.js`. `build-ts/` is stale `tsc` output. `packages/` (web/shared/mobile) looks like an unused monorepo experiment. Don't edit these unless asked.
- `.github/agents` and `.agents/` hold generic Copilot agent files, which Claude Code doesn't use.
- Realtime order updates expect a backend STOMP broker that doesn't exist yet (see root `CLAUDE.md`).
- Types in `src/types/` must match the backend DTOs. Check the Java class when changing them.
