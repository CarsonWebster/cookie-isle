# Memory - Cookie Isle Project

This file contains useful findings for future agents working on this project.

## Project Overview

- **Tech Stack:** SvelteKit + Svelte 5 (runes) + Cloudflare D1 + Drizzle ORM + Tailwind v4
- **Runtime:** Bun
- **Primary Documentation:** `docs/PRD.md` - Contains all migration tasks with status tracking

## Current Progress (as of 2026-01-16, Phase 6.1 Complete)

### Phase 0 Status: COMPLETE (except CF deployment tasks)

- 0.1-0.5: Completed (project setup, TypeScript, Vitest, Tailwind)
- 0.6: Partially complete (D1 configured, R2 pending - needs enabling in CF Dashboard)
- 0.7: Schema and Migrations COMPLETE
  - All 6 tables in schema: `products`, `orders`, `newsletter`, `fulfillmentSlots`, `dailyCapacity`, `adminSessions`
  - Migrations generated - DONE
  - Schema tests written (23 tests) - DONE (`src/lib/server/db/schema.spec.ts`)
  - Local D1 schema applied - DONE (via wrangler d1 execute --local)
  - Seed data created - DONE (`drizzle/seed.sql` with 4 products, 4 fulfillment slots)
  - Remaining: push to remote D1 (needs CF credentials)
- 0.8: Database helper COMPLETE
  - Implementation: `src/lib/server/db/index.ts` with `getDb()` and `createDb()` functions
  - Tests: `src/lib/server/db/db.spec.ts` (10 tests) - Tests cover error handling and successful DB creation

### Phase 1 Status: COMPLETE

- 1.1: Site Configuration COMPLETE
  - Implementation: `src/lib/config.ts` - Typed SiteConfig with all settings from hugo.toml
  - Tests: `src/lib/config.spec.ts` (35 tests) - Comprehensive validation of all config sections
  - Helper functions: `formatMaxOrderMessage()`, `isZipAllowedForDelivery()`, `getSortedMenu()`, `formatPrice()`, `calculateTax()`, `calculateTip()`
- 1.2: Root Layout COMPLETE
  - Implementation: `src/routes/+layout.svelte` - HTML structure with flex column, min-h-screen, bg-tertiary
  - Meta tags: title, description, og:image, twitter cards, theme-color from config
  - Favicon: SVG favicon from `src/lib/assets/favicon.svg`
  - Uses `$lib/config` for dynamic values (title, description, baseUrl, colors)
  - Now includes conditional ComingSoon rendering based on `config.features.comingSoonMode`
- 1.3: Header Component COMPLETE
  - Implementation: `src/lib/components/Header.svelte` - Svelte 5 runes, mobile nav
  - Tests: `src/lib/components/Header.spec.ts` (13 tests) - Config integration tests
  - Features: Logo, desktop nav, mobile slide-out drawer, cart badge, social icons, keyboard nav (Escape to close)
- 1.4: Footer Component COMPLETE
  - Implementation: `src/lib/components/Footer.svelte` - Brand, nav, contact, social, copyright
  - Tests: `src/lib/components/Footer.spec.ts` (15 tests) - Config integration tests
- 1.5: Public Layout Group COMPLETE
  - Implementation: `src/routes/(public)/+layout.svelte` - Wraps pages with Header and Footer
  - Uses Svelte 5 `$props()` for children slot
  - Main element has `flex-1` class for proper footer positioning
  - Homepage moved to `src/routes/(public)/+page.svelte` with placeholder content

### Phase 2 Status: COMPLETE

- 2.1: Hero Component COMPLETE
  - Implementation: `src/lib/components/Hero.svelte` - Full-width hero with gradient, CTA
  - Tests: `src/lib/components/Hero.spec.ts` (19 tests) - Config and props validation
  - Features: Gradient background, radial gradient overlays, bouncing cookie emoji, CTA button with arrow, decorative wave SVG
  - Props: `title` (required), `tagline`, `ctaText`, `ctaHref` (all optional)
- 2.3: MenuCard Component COMPLETE (done before 2.2 as it's a dependency)
  - Implementation: `src/lib/components/MenuCard.svelte` - Product card with image, title, price, description, tags, add to cart button
  - Tests: `src/lib/components/MenuCard.spec.ts` (37 tests) - Product type validation, price formatting, cart config
  - Features: Aspect-ratio image container, cookie emoji placeholder, line-clamp-2 description, tag badges, hover lift effect
  - Props: `product` (required) - Product type with id, slug, title, priceCents, stripePriceId, description?, imageUrl?, tags?
- 2.5: Cookie Detail Page COMPLETE
  - Server Load: `src/routes/(public)/menu/[slug]/+page.server.ts` - Queries by slug with active=true filter, throws 404 if not found
  - Page: `src/routes/(public)/menu/[slug]/+page.svelte` - Full product details with hero image, two-column layout
  - Tests: `src/routes/(public)/menu/[slug]/page.server.spec.ts` (10 tests) - Covers 404 cases, platform unavailability, successful loads
  - Features: Hero image (16:9 on mobile, 21:9 on desktop), cookie placeholder, ingredients card, tags, large Add to Cart button, Back to Menu link
- 2.7: Coming Soon Mode COMPLETE
  - Implementation: `src/lib/components/ComingSoon.svelte` - Full-page coming soon landing with newsletter signup
  - Tests: `src/lib/components/ComingSoon.spec.ts` (46 tests) - Config validation, email validation, state transitions
  - Root layout updated to conditionally render ComingSoon when `config.features.comingSoonMode` is true
  - Features: Gradient background (same pattern as Hero), bouncing cookie emoji, newsletter form with validation, contact email link, social media links

## Key File Locations

| File                                        | Purpose                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| `docs/PRD.md`                               | Complete migration spec with task tracking               |
| `src/lib/config.ts`                         | Site configuration (migrated from hugo.toml)             |
| `src/lib/stores/cart.svelte.ts`             | Cart state management with localStorage                  |
| `src/lib/components/Header.svelte`          | Header with desktop/mobile nav, cart badge               |
| `src/lib/components/Footer.svelte`          | Footer with brand, nav, contact, social                  |
| `src/lib/components/Hero.svelte`            | Hero section with gradient, CTA button                   |
| `src/lib/components/MenuCard.svelte`        | Product card with image, price, add to cart              |
| `src/lib/components/CartToast.svelte`       | Toast notification for cart actions                      |
| `src/lib/components/AddToCartButton.svelte` | Reusable add to cart button with feedback                |
| `src/routes/(public)/+layout.svelte`        | Public pages layout (Header + main + Footer)             |
| `src/routes/(public)/+page.svelte`          | Homepage with Hero and featured products                 |
| `src/lib/server/db/schema.ts`               | Drizzle table definitions                                |
| `src/lib/server/db/index.ts`                | Database helper functions (`getDb`, `createDb`)          |
| `src/lib/server/stripe.ts`                  | Stripe client helper (`getStripe`, `createStripeClient`) |
| `src/routes/api/checkout/+server.ts`        | Stripe checkout API endpoint (POST handler)              |
| `src/routes/api/webhook/+server.ts`         | Stripe webhook handler (order creation)                  |
| `src/routes/api/newsletter/+server.ts`      | Newsletter signup API endpoint                           |
| `src/lib/server/auth.ts`                    | Admin auth helpers (session mgmt, password verify)       |
| `drizzle.config.ts`                         | Drizzle Kit config (uses d1-http driver)                 |
| `wrangler.jsonc`                            | Cloudflare bindings (D1 configured, R2 commented out)    |
| `AGENTS.md`                                 | Agent instructions and coding standards                  |

## Testing Notes

- **Server tests:** `bunx vitest run --project=server` - Works out of the box
- **Browser tests:** `bunx vitest run --project=browser` - Requires Playwright browsers installed
- **All tests:** `bun run test` - Runs both server and browser tests
- Playwright browsers installed to `~/.cache/ms-playwright/` (Chromium, Firefox, WebKit)
- Note: Some system dependencies may be missing - run `sudo npx playwright install-deps` if browser tests fail

## Schema Pattern

All tables follow this pattern from `docs/PRD.md` Appendix A:

```typescript
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tableName = sqliteTable('table_name', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	// ... fields
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});
```

## Next Tasks (Priority Order)

1. ~~Add `adminSessions` table to schema (PRD 0.7.6)~~ DONE
2. ~~Generate migrations (PRD 0.7.8)~~ DONE - See `drizzle/migrations/0000_unknown_mandrill.sql`
3. ~~Write schema type tests (PRD 0.7.10)~~ DONE - 23 tests in `src/lib/server/db/schema.spec.ts`
4. ~~Write database helper tests (PRD 0.8.4)~~ DONE - 10 tests in `src/lib/server/db/db.spec.ts`
5. Push migrations to D1 (PRD 0.7.9) - Requires CF credentials in env vars (blocked on CF setup)
6. ~~Site configuration (PRD 1.1)~~ DONE - `src/lib/config.ts` with 35 tests
7. ~~Root layout (PRD 1.2)~~ DONE - `src/routes/+layout.svelte` with meta tags, favicon, flex container
8. ~~Header component (PRD 1.3)~~ DONE - `src/lib/components/Header.svelte` with 13 tests
9. ~~Footer component (PRD 1.4)~~ DONE - `src/lib/components/Footer.svelte` with 15 tests
10. ~~Public layout group (PRD 1.5)~~ DONE - `src/routes/(public)/+layout.svelte` with Header and Footer
11. ~~Hero component (PRD 2.1)~~ DONE - `src/lib/components/Hero.svelte` with 19 tests
12. ~~MenuCard component (PRD 2.3)~~ DONE - `src/lib/components/MenuCard.svelte` with 37 tests
13. ~~Homepage (PRD 2.2)~~ DONE - `src/routes/(public)/+page.svelte` with Hero and featured products (7 tests)
14. ~~Menu page (PRD 2.4)~~ DONE - `src/routes/(public)/menu/+page.svelte` with all products grid (10 tests)
15. ~~Cookie detail page (PRD 2.5)~~ DONE - `src/routes/(public)/menu/[slug]/+page.svelte` with product details (10 tests)
16. ~~About page (PRD 2.6)~~ DONE - `src/routes/(public)/about/+page.svelte` with prose styling (no server load needed)
17. ~~Coming Soon mode (PRD 2.7)~~ DONE - `src/lib/components/ComingSoon.svelte` with 46 tests
18. ~~Cart store (PRD 3.1)~~ DONE - `src/lib/stores/cart.svelte.ts` with Svelte 5 runes and localStorage persistence (57 tests)
19. ~~Cart badge component (PRD 3.2)~~ DONE - `src/lib/components/CartBadge.svelte` with 26 tests
20. ~~Cart toast notification (PRD 3.3)~~ DONE - `src/lib/components/CartToast.svelte` with 35 tests
21. ~~Add to cart functionality (PRD 3.4)~~ DONE - `src/lib/components/AddToCartButton.svelte` with 46 tests
22. ~~Checkout page - Cart display (PRD 3.5)~~ DONE - `src/routes/(public)/checkout/+page.svelte` with cart items list (47 tests)
23. ~~Checkout page - Customer form (PRD 3.6)~~ DONE - Customer info form with validation, fulfillment type toggle (95 total tests)
24. ~~Checkout page - Slots selection (PRD 3.7)~~ DONE - Server load for available slots, slot picker UI (25 tests)
25. ~~Checkout page - Extras (PRD 3.8)~~ DONE - Tip section, gift box, order summary with tax (165 total checkout tests)
26. ~~Checkout page - Submit (PRD 3.9)~~ DONE - Form validation, loading states, submit button, max qty modal (237 total checkout tests)
27. ~~Stripe SDK + client init (PRD 4.1.1-4.1.2)~~ DONE - `stripe` package installed, `src/lib/server/stripe.ts` with 19 tests
28. ~~Stripe checkout API endpoint (PRD 4.1.3-4.1.13, 4.1.15)~~ DONE - `src/routes/api/checkout/+server.ts` with 63 tests
29. ~~Connect checkout form to API (PRD 4.2)~~ DONE - `handleSubmit` in checkout page POSTs to `/api/checkout` and redirects to Stripe
30. ~~Stripe webhook handler (PRD 4.3)~~ DONE - `src/routes/api/webhook/+server.ts` with 44 tests
31. ~~Checkout success page (PRD 4.4)~~ DONE - `src/routes/(public)/checkout/success/` with 27 tests
32. ~~Newsletter signup endpoint (PRD 4.5)~~ DONE - `src/routes/api/newsletter/+server.ts` with 54 tests
33. ~~Connect newsletter form (PRD 4.6)~~ DONE - ComingSoon component now POSTs to `/api/newsletter`
34. **NEXT: Phase 5 - R2 Image Upload** - Start with R2 upload endpoint (PRD 5.1)

## Commands Reference

```bash
# Development
bun run dev          # Start dev server at localhost:5173
bun run check        # TypeScript check (must pass before commits)

# Testing
bun run test         # Run all tests (server + browser)
bunx vitest run --project=server   # Server tests only
bunx vitest run --project=browser  # Browser tests only (requires Playwright)

# Database (Drizzle)
bun run db:generate  # Generate SQL migrations
bun run db:push      # Push schema to remote D1

# Local D1 Database
npx wrangler d1 execute cookie-isle-db --local --file=drizzle/migrations/0000_unknown_mandrill.sql  # Apply migrations
npx wrangler d1 execute cookie-isle-db --local --file=drizzle/seed.sql  # Seed with sample data
npx wrangler d1 execute cookie-isle-db --local --command "SELECT * FROM products"  # Query local DB
```

## Gotchas

1. **Playwright installed:** Browser tests now work. Run `npx playwright install` if browsers get removed.
2. **R2 not enabled:** R2 bucket binding is commented out in `wrangler.jsonc` - needs enabling in CF Dashboard first
3. **Database helper exists:** Task 0.8 says "Not Started" but `src/lib/server/db/index.ts` already has `getDb()` function
4. **Commit message style:** Use conventional commits (`feat:`, `fix:`, `chore:`, etc.)
5. **Schema complete:** All 6 tables are now in schema.ts. Migrations have been generated.
6. **PRD sync:** Some PRD task statuses were out of sync - products/newsletter tables were marked "Not Started" but existed. Fixed in this session.
7. **Migrations generated:** The migration file `drizzle/migrations/0000_unknown_mandrill.sql` contains CREATE TABLE for all 6 tables. Ready to push to D1.
8. **drizzle-kit generate works locally:** The d1-http driver credentials are only needed for `push` operations, not `generate`.
9. **Test file locations:** Tests live in `src/` alongside source files, not in a separate `tests/` directory. Use `*.spec.ts` for server tests and `*.svelte.spec.ts` for browser tests.
10. **Drizzle introspection:** Use `getTableName()` and `getTableColumns()` from `drizzle-orm` to introspect schema for testing.
11. **Mocking drizzle-orm/d1:** When testing database helpers, mock the `drizzle-orm/d1` module with `vi.mock()`. See `db.spec.ts` for the pattern.
12. **D1Database mocking:** Create mock D1Database with `prepare`, `dump`, `batch`, `exec` methods. Cast as `unknown as D1Database` to satisfy TypeScript.
13. **Phase 0 complete:** All coding tasks in Phase 0 are done. Only blocked tasks are CF deployment (0.6.3 R2, 0.7.9 push to D1) which require manual CF Dashboard setup.
14. **Favicon location:** The favicon is at `src/lib/assets/favicon.svg`, not in `static/favicon/`. It's imported as a Svelte asset.
15. **Tailwind theme colors:** Custom colors are defined in `src/routes/layout.css` under `@theme`. Use them as `bg-tertiary`, `text-primary`, etc.
16. **Root layout pattern:** Uses Svelte 5 runes (`$props`) and imports config from `$lib/config`. Wraps content in `<div class="min-h-screen flex flex-col bg-tertiary">`.
17. **Testing .svelte.ts files:** Don't export `$derived` values directly - the Svelte compiler is needed. Use getter functions that compute values from `$state`. Tests in `.spec.ts` run in Node without Svelte compilation.
18. **Cart store testing:** Use `_resetForTesting()` before each test. Mock `window` and `localStorage` for persistence tests. See `cart.spec.ts` for patterns.

## Test Coverage Summary

| Test File                                                  | Tests | Purpose                              |
| ---------------------------------------------------------- | ----- | ------------------------------------ |
| `src/demo.spec.ts`                                         | 1     | Demo test from sv create             |
| `src/lib/config.spec.ts`                                   | 35    | Site configuration and helpers       |
| `src/lib/server/db/schema.spec.ts`                         | 23    | Schema table definitions and types   |
| `src/lib/server/db/db.spec.ts`                             | 10    | Database helper functions            |
| `src/lib/components/Header.spec.ts`                        | 13    | Header component config logic        |
| `src/lib/components/Footer.spec.ts`                        | 15    | Footer component config logic        |
| `src/lib/components/Hero.spec.ts`                          | 19    | Hero component config logic          |
| `src/lib/components/MenuCard.spec.ts`                      | 37    | MenuCard product type and config     |
| `src/lib/components/ComingSoon.spec.ts`                    | 46    | ComingSoon config, email, state      |
| `src/routes/(public)/page.server.spec.ts`                  | 7     | Homepage load function               |
| `src/routes/(public)/page.svelte.spec.ts`                  | 1     | Homepage component (browser test)    |
| `src/routes/(public)/menu/page.server.spec.ts`             | 10    | Menu page load function              |
| `src/routes/(public)/menu/[slug]/page.server.spec.ts`      | 10    | Cookie detail page load function     |
| `src/lib/stores/cart.spec.ts`                              | 57    | Cart store state and persistence     |
| `src/lib/components/CartBadge.spec.ts`                     | 26    | CartBadge component logic            |
| `src/lib/components/CartToast.spec.ts`                     | 35    | CartToast notification logic         |
| `src/lib/components/AddToCartButton.spec.ts`               | 46    | AddToCartButton integration logic    |
| `src/routes/(public)/checkout/page.spec.ts`                | 237   | Checkout page cart, form & extras    |
| `src/routes/(public)/checkout/page.server.spec.ts`         | 25    | Checkout slots load function         |
| `src/lib/server/stripe.spec.ts`                            | 19    | Stripe client module helpers         |
| `src/routes/api/checkout/server.spec.ts`                   | 63    | Checkout API validation & helpers    |
| `src/routes/api/webhook/server.spec.ts`                    | 44    | Webhook parsing and validation       |
| `src/routes/(public)/checkout/success/page.server.spec.ts` | 27    | Checkout success page load & helpers |
| `src/routes/api/newsletter/server.spec.ts`                 | 54    | Newsletter API validation & helpers  |
| `src/lib/server/auth.spec.ts`                              | 66    | Admin authentication helpers         |
| **Total**                                                  | 926   |                                      |

## Site Config Notes

The `src/lib/config.ts` module provides:

1. **Typed Interfaces:** `SiteConfig`, `ContactConfig`, `SocialConfig`, `HeroConfig`, `ColorsConfig`, etc.
2. **Configuration Object:** `config` - single source of truth for all site settings
3. **Helper Functions:**
   - `formatMaxOrderMessage(threshold?, email?)` - Format order limit message with placeholders
   - `isZipAllowedForDelivery(zip)` - Check if ZIP is in allowed delivery area
   - `getSortedMenu()` - Get navigation menu sorted by weight
   - `formatPrice(cents)` - Convert cents to "$X.XX" format
   - `calculateTax(subtotalCents)` - Compute tax (returns 0 if disabled)
   - `calculateTip(subtotalCents, percentage)` - Compute tip amount

Usage example:

```typescript
import { config, formatPrice, isZipAllowedForDelivery } from '$lib/config';

// Access config values
const title = config.title; // "The Cookie Isle"
const taxRate = config.order.salesTaxRate; // 0.0775

// Use helpers
const price = formatPrice(350); // "$3.50"
const canDeliver = isZipAllowedForDelivery('92118'); // true
```

## Header Component Notes

The `src/lib/components/Header.svelte` component implements:

1. **Desktop Navigation:** Horizontal nav using `getSortedMenu()` plus conditional Calendar link
2. **Mobile Navigation:** Slide-out drawer from right with overlay
3. **Svelte 5 State:** Uses `$state()` for `mobileMenuOpen` and `cartCount`
4. **Keyboard Navigation:** Escape key closes mobile menu via `<svelte:window onkeydown>`
5. **Cart Badge:** Placeholder `cartCount` state - will connect to cart store in Phase 3
6. **Social Icons:** Instagram/Facebook rendered conditionally based on config flags
7. **Body Scroll Lock:** Prevents scrolling when mobile menu is open

### Header Usage (for Public Layout)

```svelte
<script lang="ts">
	import Header from '$lib/components/Header.svelte';
</script>

<Header />
<main>
	{@render children()}
</main>
```

### Tailwind Theme Colors Used

- `bg-header-bg` / `text-header-text` - Header background and text
- `bg-tertiary-light` / `text-secondary` - Mobile nav drawer
- `border-tertiary-medium` - Mobile nav borders
- `text-text-light` - Contact info in mobile footer
- `bg-primary` - Cart badge background

## Footer Component Notes

The `src/lib/components/Footer.svelte` component implements:

1. **Brand Section:** Site title (with emoji), tagline, and description
2. **Navigation Links:** Uses `getSortedMenu()` plus conditional Calendar link
3. **Contact Section:** Email/phone links with icons (conditional on config flags)
4. **Social Icons:** Instagram/Facebook rendered conditionally based on config flags
5. **Copyright:** Dynamic current year with site title
6. **Responsive Grid:** 1-col on mobile, 3-col on md, 4-col on lg
7. **Dark Theme:** Uses `bg-footer-bg`, `text-footer-text`, `text-footer-heading` colors

### Footer Usage (for Public Layout)

```svelte
<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
</script>

<Footer />
```

### Footer Tailwind Theme Colors Used

- `bg-footer-bg` - Dark blue-green background (#264653)
- `text-footer-text` - Light cream text (#FBF8F3)
- `text-footer-heading` - Golden accent for headings (#E9B44C)
- `text-footer-text/80` - 80% opacity for secondary text
- `border-footer-text/20` - 20% opacity for divider line

## Hero Component Notes

The `src/lib/components/Hero.svelte` component implements:

1. **Props Interface:**
   - `title` (required): Main headline text
   - `tagline` (optional): Subheadline text
   - `ctaText` (optional): Button text
   - `ctaHref` (optional): Button destination URL
2. **Visual Design:**
   - Gradient background: `from-tertiary via-tertiary-light to-tertiary-medium`
   - Radial gradient overlays for depth (primary and accent colors at 10% opacity)
   - Decorative wave SVG at bottom
   - Bouncing cookie emoji decoration
3. **CTA Button Styling:**
   - Rounded-full, shadow-lg, bg-primary
   - Hover: bg-btn-hover-bg, shadow-xl
   - Includes arrow icon
4. **Responsive Breakpoints:**
   - Mobile: py-16, text-3xl title, text-lg tagline
   - SM: py-20, text-4xl title, text-xl tagline
   - MD: text-5xl title, text-2xl tagline
   - LG: py-28, text-6xl title

### Hero Usage (for Homepage)

```svelte
<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import { config } from '$lib/config';
</script>

<Hero title={config.title} tagline={config.tagline} ctaText="Browse Our Menu" ctaHref="/menu" />
```

## Public Layout Group Notes

The `src/routes/(public)/+layout.svelte` component:

1. **Route Group:** Uses SvelteKit's `(public)` route group - parentheses mean it doesn't appear in URL
2. **Layout Composition:** Combines Header + main + Footer for all public pages
3. **Svelte 5 Pattern:** Uses `$props()` to get `children` for slot rendering
4. **Flex Layout:** Main uses `flex-1` to fill available space (works with root layout's `flex flex-col min-h-screen`)
5. **No Tests Needed:** Simple composition component - Header and Footer already have tests

### Public Layout Implementation

```svelte
<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<Header />

<main class="flex-1">
	{@render children()}
</main>

<Footer />
```

### Adding New Public Pages

All pages under `src/routes/(public)/` automatically get Header and Footer:

```
src/routes/(public)/
├── +layout.svelte    # Header + main + Footer wrapper
├── +page.svelte      # Homepage (/)
├── menu/
│   ├── +page.svelte  # Menu page (/menu)
│   └── [slug]/
│       └── +page.svelte  # Product detail (/menu/chocolate-chip)
├── about/
│   └── +page.svelte  # About page (/about)
└── checkout/
    └── +page.svelte  # Checkout (/checkout)
```

## MenuCard Component Notes

The `src/lib/components/MenuCard.svelte` component implements:

1. **Props Interface:**
   - `product` (required): Product object with id, slug, title, priceCents, stripePriceId
   - Optional fields: description, imageUrl, tags
2. **Visual Design:**
   - Aspect-square image container with cover object-fit
   - Cookie emoji placeholder when no imageUrl
   - Card with rounded-xl, shadow-md, hover lift effect (-translate-y-1, shadow-xl)
   - line-clamp-2 for description truncation
   - Tag badges with rounded-full styling
3. **Data Attributes:** Button includes data attributes for cart integration:
   - `data-product-id`, `data-product-slug`, `data-product-title`
   - `data-product-price`, `data-product-stripe-price-id`

### MenuCard Usage (for Menu/Homepage)

```svelte
<script lang="ts">
	import MenuCard from '$lib/components/MenuCard.svelte';
	import type { Product } from '$lib/components/MenuCard.svelte';

	// Products from page.server.ts load function
	let { data } = $props();
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.products as product}
		<MenuCard {product} />
	{/each}
</div>
```

### Product Type (exported from MenuCard.svelte)

```typescript
interface Product {
	id: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
	description?: string | null;
	imageUrl?: string | null;
	tags?: string[] | null;
}
```

## Homepage Notes

The `src/routes/(public)/+page.svelte` page implements:

1. **Server Load Function (`+page.server.ts`):**
   - Loads featured products from D1: `featured=true AND active=true ORDER BY sortOrder`
   - Returns `{ featuredProducts: [] }` when database is unavailable (graceful fallback)
   - Uses Drizzle ORM with `getDb(platform)` helper

2. **Page Component (`+page.svelte`):**
   - Renders Hero with `config.title`, `config.tagline`, and CTA linking to `/menu`
   - Shows "Featured Cookies" section with responsive 3-column grid of MenuCard components
   - Displays empty state with cookie emoji when no featured products
   - "View Full Menu" button with outline style at bottom

3. **Key Patterns:**
   - Uses `$derived()` for `hasFeaturedProducts` boolean
   - Keyed `{#each}` with `product.id` for efficient updates
   - Meta description from `config.description`

### Homepage Data Flow

```
+page.server.ts (load)
      ↓
    D1 Query: SELECT ... WHERE featured=1 AND active=1
      ↓
    { featuredProducts: Product[] }
      ↓
+page.svelte (data prop)
      ↓
    Hero → MenuCard grid → "View Full Menu" button
```

### Testing Pattern for Server Load Functions

```typescript
// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Create mock db with chainable methods
const createMockDb = (products) => {
	const mockOrderBy = vi.fn().mockResolvedValue(products);
	const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
	return { select: mockSelect };
};

// Test with platform undefined (graceful fallback)
const result = await load({ platform: undefined });
expect(result).toEqual({ featuredProducts: [] });
```

## Cookie Detail Page Notes

The `src/routes/(public)/menu/[slug]/+page.svelte` page implements:

1. **Server Load Function (`+page.server.ts`):**
   - Queries by slug with `slug = ? AND active = true` filter
   - Throws 404 error if product not found or inactive
   - Throws 404 error if database unavailable (no graceful fallback since a specific product is required)
   - Returns `{ product }` with full product data including heroImageUrl and ingredients

2. **Page Component (`+page.svelte`):**
   - Hero image section: 16:9 aspect on mobile, 21:9 on larger screens
   - Cookie emoji placeholder when no image available
   - Two-column layout on desktop: left (title, price, description, tags), right (ingredients, Add to Cart)
   - Back to Menu link with arrow icon
   - Open Graph meta tags for social sharing with product image
   - Large full-width Add to Cart button with data attributes

3. **Key Patterns:**
   - Uses `$derived()` for `hasIngredients` and `hasTags` booleans
   - Keyed `{#each}` with index for tags since tags can have duplicates
   - Meta description fallback when product has no description

### Cookie Detail Data Flow

```
+page.server.ts (load)
      ↓
    D1 Query: SELECT ... WHERE slug=? AND active=1 LIMIT 1
      ↓
    { product } or 404 Error
      ↓
+page.svelte (data prop)
      ↓
    Hero Image → Product Details Grid → Add to Cart
```

### Difference from Menu Page

- Menu page: Returns array of products, graceful empty array fallback
- Detail page: Returns single product, throws 404 if not found (no fallback)

## Menu Page Notes

The `src/routes/(public)/menu/+page.svelte` page implements:

1. **Server Load Function (`+page.server.ts`):**
   - Loads all active products from D1: `active=true ORDER BY sortOrder`
   - Returns `{ products: [] }` when database is unavailable (graceful fallback)
   - Uses same pattern as homepage but without `featured` filter

2. **Page Component (`+page.svelte`):**
   - Page title "Our Menu" with decorative underline (primary color, h-1 w-24)
   - Subtitle describing freshly baked cookies
   - Responsive 3-column grid of MenuCard components
   - Empty state with large cookie emoji and "Back to Home" link

3. **Key Patterns:**
   - Uses `$derived()` for `hasProducts` boolean
   - Keyed `{#each}` with `product.id` for efficient updates
   - Meta description optimized for menu page

### Menu Page Data Flow

```
+page.server.ts (load)
      ↓
    D1 Query: SELECT ... WHERE active=1 ORDER BY sortOrder
      ↓
    { products: Product[] }
      ↓
+page.svelte (data prop)
      ↓
    Page Header → MenuCard grid (or empty state)
```

### Difference from Homepage

- Homepage: Filters for `featured=true AND active=true`, shows subset
- Menu page: Filters for only `active=true`, shows all products

## About Page Notes

The `src/routes/(public)/about/+page.svelte` page implements:

1. **No Server Load Function Needed:**
   - Static content page - all content is hardcoded in the component
   - Uses `config.title` and `config.contact.email` for dynamic values
   - No database queries required

2. **Page Component:**
   - Page title "About Us" with decorative underline (same pattern as Menu page)
   - Prose-styled article with Tailwind typography plugin classes
   - Content sections: Our Story, Our Philosophy, Meet the Baker, Visit Us
   - Custom list styling with checkmark icons instead of bullets
   - Conditional email link based on `config.contact.emailEnabled`
   - CTA button linking to /menu at the bottom

3. **Key Patterns:**
   - Uses `prose prose-lg` base classes for readable typography
   - Custom prose modifiers: `prose-headings:text-secondary`, `prose-p:text-text-light`
   - H2 spacing: `prose-h2:mt-10 prose-h2:mb-4`
   - Custom list items with flex layout and SVG checkmarks
   - Uses config for site title to maintain brand consistency

### About Page Implementation

```svelte
<script lang="ts">
	import { config } from '$lib/config';
</script>

<svelte:head>
	<title>About Us | {config.title}</title>
	<meta name="description" content="Learn about {config.title} and our passion for baking" />
</svelte:head>

<section class="bg-tertiary py-12 sm:py-16 lg:py-20">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<!-- Page Header with decorative underline -->
		<!-- Prose article with typography classes -->
		<!-- CTA button to /menu -->
	</div>
</section>
```

### Tailwind Typography Classes Used

- `prose prose-lg` - Base prose styling with large text
- `prose-headings:text-secondary` - Brown headings
- `prose-h2:text-2xl prose-h2:font-bold` - H2 sizing
- `prose-h2:mt-10 prose-h2:mb-4` - H2 spacing
- `prose-p:text-text-light prose-p:leading-relaxed` - Paragraph styling
- `prose-li:text-text-light` - List item text color
- `prose-strong:text-secondary` - Bold text color
- `prose-a:text-primary prose-a:no-underline hover:prose-a:underline` - Link styling

### About vs Other Pages

- **About:** Static content, no server load, prose-styled article, max-w-4xl container
- **Menu/Homepage:** Dynamic content, server load from D1, card grid layout, max-w-7xl container
- **Cookie Detail:** Dynamic content, server load with slug param, hero image + details layout

## ComingSoon Component Notes

The `src/lib/components/ComingSoon.svelte` component implements:

1. **Full-Page Landing:**
   - Replaces normal site when `config.features.comingSoonMode` is true
   - Centered content with min-h-screen flexbox layout
   - Same gradient background pattern as Hero component

2. **Content Sections:**
   - Logo: Bouncing cookie emoji + site title
   - Coming Soon headline from `config.features.comingSoonHeadline`
   - Multi-line description from `config.features.comingSoonText` (uses `whitespace-pre-line`)
   - Newsletter signup form (conditional on `config.newsletter.enabled`)
   - Contact email link (conditional on `config.contact.emailEnabled`)
   - Social media icons (conditional on each platform's enabled flag)

3. **Newsletter Form:**
   - Svelte 5 state management with `$state()` runes
   - Email validation: `isValidEmail = $derived(email.includes('@') && email.includes('.'))`
   - Three states: `'idle' | 'success' | 'error'`
   - Loading spinner during submission
   - Success/error messages from config
   - TODO: Connect to `/api/newsletter` in Phase 4.6

4. **Conditional Rendering in Root Layout:**
   ```svelte
   {#if showComingSoon}
   	<ComingSoon />
   {:else}
   	<div class="flex min-h-screen flex-col bg-tertiary">
   		{@render children()}
   	</div>
   {/if}
   ```

### Enabling Coming Soon Mode

To enable coming soon mode, set `comingSoonMode: true` in `src/lib/config.ts`:

```typescript
features: {
	comingSoonMode: true,  // Set to true to show coming soon page
	comingSoonHeadline: 'Coming Soon',
	comingSoonText: `I'm busy baking up something special!...`
}
```

### ComingSoon vs Regular Site

When `comingSoonMode` is **false** (default):

- Root layout renders normal site with Header/Footer via children slot
- All public routes work normally

When `comingSoonMode` is **true**:

- Root layout renders only the ComingSoon component
- No Header, Footer, or other routes are visible
- Newsletter signup is the primary CTA

## Cart Store Notes (Phase 3.1 - COMPLETE)

The `src/lib/stores/cart.svelte.ts` module implements cart state management.

### Key Design Decisions

1. **Svelte 5 Runes:** Uses `$state` for reactive cart items array
2. **Getter Functions:** Derived values exposed via functions (not `$derived` exports) for Node.js test compatibility
3. **localStorage Persistence:** Saves on every cart modification, loads on `initializeCart()` call
4. **SSR Safety:** All localStorage operations check `typeof window !== 'undefined'`
5. **Max Quantity:** Enforces 99 max items per product

### Exported Types

```typescript
interface CartProduct {
	id: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
}

interface CartItem extends CartProduct {
	productId: number; // Same as id
	quantity: number;
}
```

### Exported Functions

| Function                       | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `addToCart(product)`           | Add product or increment quantity            |
| `removeFromCart(productId)`    | Remove product entirely                      |
| `updateQuantity(productId, n)` | Set quantity (removes if n <= 0)             |
| `clearCart()`                  | Empty the cart                               |
| `getItems()`                   | Get readonly cart items array                |
| `getCartItem(productId)`       | Get specific item or undefined               |
| `isInCart(productId)`          | Check if product is in cart                  |
| `getQuantity(productId)`       | Get quantity for product (0 if not in cart)  |
| `getCartCount()`               | Total item count (sum of quantities)         |
| `getCartTotal()`               | Total price in cents                         |
| `getCartTotalFormatted()`      | Total price as "$X.XX" string                |
| `isCartEmpty()`                | Check if cart has no items                   |
| `initializeCart()`             | Load from localStorage (call once on client) |
| `clearStorage()`               | Remove localStorage data                     |
| `getMaxQuantityPerItem()`      | Get max quantity constant (99)               |

### Usage in Components

```svelte
<script lang="ts">
	import { addToCart, getCartCount, initializeCart } from '$lib/stores/cart.svelte';
	import { onMount } from 'svelte';

	// Initialize cart from localStorage on client
	onMount(() => {
		initializeCart();
	});

	// Add a product
	function handleAdd(product) {
		const success = addToCart(product);
		if (!success) {
			// Max quantity reached
		}
	}

	// Display cart count in template
	// Note: Call getCartCount() in template for reactivity
</script>

<span>Cart: {getCartCount()}</span>
```

### Testing Pattern

```typescript
import { _resetForTesting, _setItemsForTesting, addToCart } from './cart.svelte';

beforeEach(() => {
	_resetForTesting(); // Clear cart and reset initialized flag
});

// Mock localStorage for persistence tests
vi.stubGlobal('window', {});
vi.stubGlobal('localStorage', {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn()
});
```

## CartBadge Component Notes (Phase 3.2 - COMPLETE)

The `src/lib/components/CartBadge.svelte` component implements cart item count display.

### Key Features

1. **Reactive Count Display:** Uses `$derived(getCartCount())` for automatic updates
2. **Hidden When Empty:** Component renders nothing when count is 0
3. **Pop Animation:** CSS animation triggers when count changes using `$effect`
4. **Overflow Handling:** Displays "99+" for counts above 99
5. **Accessibility:** Includes aria-label with proper singular/plural handling

### Implementation Details

```svelte
<script lang="ts">
	import { getCartCount } from '$lib/stores/cart.svelte';

	let previousCount = $state(0);
	let animating = $state(false);
	const count = $derived(getCartCount());

	$effect(() => {
		if (count !== previousCount && count > 0) {
			animating = true;
			const timer = setTimeout(() => {
				animating = false;
			}, 300);
			previousCount = count;
			return () => clearTimeout(timer);
		}
		previousCount = count;
	});
</script>

{#if count > 0}
	<span
		class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center
		rounded-full bg-primary text-xs font-bold text-white
		{animating ? 'animate-badge-pop' : ''}"
	>
		{count > 99 ? '99+' : count}
	</span>
{/if}
```

### Header Integration

The Header component was updated to:

1. Import `CartBadge` and `initializeCart` from cart store
2. Call `initializeCart()` in `onMount()` to load cart from localStorage
3. Replace inline badge markup with `<CartBadge />` component (desktop cart icon)
4. Mobile cart uses `getCartCount()` directly for inline display

### Usage Pattern

```svelte
<a href="/checkout" class="relative">
	<CartIcon />
	<CartBadge />
</a>
```

The badge uses absolute positioning and appears in the top-right corner of the parent.

## CartToast Component Notes (Phase 3.3 - COMPLETE)

The `src/lib/components/CartToast.svelte` component implements cart notification feedback.

### Key Features

1. **Module Context State:** Uses Svelte 5 `$state` in module context for global toast state
2. **Auto-hide:** Toast automatically hides after 3 seconds (configurable via TOAST_DURATION constant)
3. **Slide-in Animation:** CSS keyframe animation from right side
4. **View Cart Link:** Links to /checkout for easy cart access
5. **Dismiss Button:** Manual close option
6. **Cart Count Display:** Shows current cart item count in toast

### Exported Functions (Module Context)

| Function             | Purpose                                 |
| -------------------- | --------------------------------------- |
| `showToast(name)`    | Show toast with product name            |
| `hideToast()`        | Hide toast immediately                  |
| `isVisible()`        | Check if toast is visible (for testing) |
| `getMessage()`       | Get current message (for testing)       |
| `_resetForTesting()` | Reset state for tests                   |

### Usage Pattern

```svelte
<script lang="ts">
	import { showToast } from '$lib/components/CartToast.svelte';
	import { addToCart } from '$lib/stores/cart.svelte';

	function handleAddToCart(product) {
		const success = addToCart(product);
		if (success) {
			showToast(product.title);
		}
	}
</script>
```

### Root Layout Integration

CartToast is added to `src/routes/+layout.svelte` at the end of the template, outside the main content wrapper. This ensures it displays above all page content with `z-50` positioning.

```svelte
{#if showComingSoon}
	<ComingSoon />
{:else}
	<div class="flex min-h-screen flex-col bg-tertiary">
		{@render children()}
	</div>
{/if}

<!-- Global cart toast notification -->
<CartToast />
```

### Styling Details

- **Position:** `fixed right-4 bottom-4 z-50`
- **Background:** `bg-footer-bg` (dark blue-green #264653)
- **Animation:** `animate-slide-in` - 0.3s ease-out slide from right
- **Button:** `bg-primary` with `hover:bg-primary-hover` transition
- **Accessibility:** `role="alert"`, `aria-live="polite"`, dismiss button has `aria-label`

## AddToCartButton Component Notes (Phase 3.4 - COMPLETE)

The `src/lib/components/AddToCartButton.svelte` component implements the add to cart interaction.

### Key Features

1. **Cart Integration:** Calls `addToCart()` from cart store and `showToast()` from CartToast
2. **Size Variants:** `small` (for MenuCard) and `large` (for detail pages)
3. **Visual Feedback:** "Added!" state with green background and checkmark icon for 1.5s
4. **Max Quantity Handling:** Disables button and shows "Max Qty Reached" when at limit (99)
5. **Animation:** Pop animation on successful add via CSS keyframes

### Props Interface

```typescript
interface Props {
	/** Product data to add to cart */
	product: AddToCartProduct;
	/** Button size variant */
	size?: 'small' | 'large';
	/** Additional CSS classes */
	class?: string;
}

interface AddToCartProduct {
	id: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
}
```

### Usage in MenuCard

```svelte
<AddToCartButton {product} size="small" class="mt-4" />
```

### Usage in Cookie Detail Page

```svelte
<AddToCartButton product={data.product} size="large" class="mt-8" />
```

### Button State Logic

| State        | Background     | Text              | Disabled |
| ------------ | -------------- | ----------------- | -------- |
| Normal       | `bg-primary`   | "Add to Cart"     | false    |
| Added (1.5s) | `bg-green-600` | "Added!" + check  | false    |
| Max Qty      | `bg-gray-400`  | "Max Qty Reached" | true     |

### Data Attributes (preserved for analytics/testing)

- `data-product-id`, `data-product-slug`, `data-product-title`
- `data-product-price`, `data-product-stripe-price-id`

## Local Development Setup

### First-time Setup

After cloning the repo, run these commands to set up local development:

```bash
# 1. Install dependencies
bun install

# 2. Install Playwright browsers (for browser tests)
npx playwright install

# 3. Apply database migrations to local D1
npx wrangler d1 execute cookie-isle-db --local --file=drizzle/migrations/0000_unknown_mandrill.sql

# 4. Seed the database with sample data
npx wrangler d1 execute cookie-isle-db --local --file=drizzle/seed.sql

# 5. Start the dev server
bun run dev
```

### Seed Data Contents

The `drizzle/seed.sql` file contains:

**Products (4 cookies):**
| slug | title | price | featured |
|------|-------|-------|----------|
| chocolate-chip | Chocolate Chip | $3.50 | Yes |
| brownie | Brownie | $5.00 | Yes |
| salted-caramel | Salted Caramel Bliss | $4.00 | Yes |
| oatmeal-raisin | Oatmeal Raisin | $3.25 | No |

**Fulfillment Slots (4 slots):**

- 2 pickup slots (tomorrow)
- 1 delivery slot (day after tomorrow)
- 1 both slot (3 days from now)

### Re-seeding the Database

To reset and re-seed the local database:

```bash
npx wrangler d1 execute cookie-isle-db --local --file=drizzle/seed.sql
```

The seed script includes `DELETE` statements to clear existing data first.

## Phase 3 Remaining Tasks

Files still to create for Phase 3:

1. ~~`src/lib/stores/cart.svelte.ts`~~ - DONE (57 tests)
2. ~~`src/lib/components/CartBadge.svelte`~~ - DONE (26 tests)
3. ~~`src/lib/components/CartToast.svelte`~~ - DONE (35 tests)
4. ~~`src/lib/components/AddToCartButton.svelte`~~ - DONE (46 tests)
5. ~~`src/routes/(public)/checkout/+page.svelte`~~ - DONE (47 tests) - Cart display with items list, quantity controls, subtotal
6. ~~Customer form (PRD 3.6)~~ - DONE (95 total tests) - Form fields, validation, fulfillment type toggle
7. ~~Slots selection (PRD 3.7)~~ - DONE (25 tests) - Server load for slots, slot picker UI with filtering
8. ~~Extras section (PRD 3.8)~~ - DONE (165 total tests) - Tip, gift box, order summary
9. **NEXT: Submit functionality (PRD 3.9)** - Form validation, loading states

## Checkout Page Notes (Phase 3.5 - COMPLETE)

The `src/routes/(public)/checkout/+page.svelte` page implements cart display.

### Key Features

1. **Empty Cart State:**
   - Cookie emoji icon in rounded container
   - "Your Cart is Empty" heading with config message
   - "Browse Menu" CTA button linking to /menu

2. **Cart Items Display:**
   - Desktop: HTML table with Product, Price, Quantity, Total, Actions columns
   - Mobile: Card layout with stacked content
   - Each item links to product detail page via slug

3. **Quantity Controls:**
   - Increment (+) and decrement (-) buttons
   - Increment disabled at max quantity (99)
   - Decrement removes item when quantity reaches 0

4. **Remove Functionality:**
   - Trash icon button with hover:text-red-600
   - Calls `removeFromCart(productId)` from cart store

5. **Subtotal Display:**
   - Uses `getCartTotalFormatted()` from cart store
   - Shows "Shipping, taxes, and tip will be calculated at checkout"

6. **Continue Shopping:**
   - Link with left arrow icon to /menu

### Usage of Cart Store Functions

```typescript
import {
	getItems, // Get cart items array
	getCartTotalFormatted, // Get "$X.XX" formatted total
	isCartEmpty, // Check if cart is empty
	updateQuantity, // Set new quantity
	removeFromCart, // Remove item entirely
	initializeCart, // Load from localStorage
	getMaxQuantityPerItem // Get max qty limit (99)
} from '$lib/stores/cart.svelte';
```

### Responsive Design Pattern

```svelte
<!-- Desktop Table (hidden on mobile) -->
<div class="hidden md:block">
	<table>...</table>
</div>

<!-- Mobile Cards (hidden on desktop) -->
<div class="space-y-4 md:hidden">
	{#each items as item}
		<div class="rounded-xl bg-white p-4 shadow-md">...</div>
	{/each}
</div>
```

## Customer Form Notes (Phase 3.6 - COMPLETE)

The checkout page now includes a customer information form between cart items and the cart summary.

### Form Fields

1. **Customer Information:**
   - First Name (required)
   - Last Name (required)
   - Email (required, validated)
   - Phone (required, auto-formatted)

2. **Fulfillment Type Toggle:**
   - Pickup button (if `config.fulfillment.pickupEnabled`)
   - Delivery button (if `config.fulfillment.deliveryEnabled`)
   - Shows pickup location or delivery area based on selection

3. **Delivery Address (conditional):**
   - Street Address (required)
   - Apt/Suite/Unit (optional)
   - City (required)
   - State (defaults to CA)
   - ZIP (required, validated against allowed list)

### Form State Management

```typescript
// Customer fields
let firstName = $state('');
let lastName = $state('');
let email = $state('');
let phone = $state('');

// Fulfillment type: 'pickup' or 'delivery'
let fulfillmentType = $state<'pickup' | 'delivery'>('pickup');

// Delivery address fields
let street = $state('');
let apt = $state('');
let city = $state('');
let addressState = $state('CA');
let zip = $state('');

// Validation state
let errors = $state<Record<string, string>>({});
let touched = $state<Record<string, boolean>>({});
```

### Validation Logic

```typescript
// Derived validation states
let isValidEmail = $derived(email.includes('@') && email.includes('.') && email.length >= 5);
let isValidPhone = $derived(phone.replace(/\D/g, '').length >= 10);
let isValidZip = $derived(
	fulfillmentType === 'pickup' || (zip.length === 5 && /^\d{5}$/.test(zip))
);
let isDeliveryZipAllowed = $derived(fulfillmentType === 'pickup' || isZipAllowedForDelivery(zip));
```

### Phone Formatting

Phone numbers are auto-formatted as the user types:

- Input: `5551234567`
- Output: `(555) 123-4567`

```typescript
function formatPhone(value: string): string {
	const digits = value.replace(/\D/g, '').slice(0, 10);
	if (digits.length === 0) return '';
	if (digits.length <= 3) return `(${digits}`;
	if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
	return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
```

### ZIP Code Validation

Two levels of ZIP validation:

1. **Format:** Must be exactly 5 digits
2. **Delivery Area:** Must be in `config.fulfillment.allowedDeliveryZips`

Error message from `config.fulfillment.deliveryZipError` is shown for invalid delivery ZIP.

### Test Coverage

48 new tests added for customer form validation (95 total checkout tests):

- Email validation (5 tests)
- Phone validation (5 tests)
- Phone formatting (7 tests)
- ZIP code validation (4 tests)
- ZIP delivery area validation (3 tests)
- Fulfillment type logic (5 tests)
- Form field requirements (3 tests)
- Validation state management (4 tests)
- Conditional delivery fields (5 tests)
- Form accessibility (3 tests)
- Error message display (4 tests)

## Slot Selection Notes (Phase 3.7 - COMPLETE)

The checkout page now includes fulfillment slot selection with server-side data loading.

### Server Load Function (`+page.server.ts`)

1. **Query Pattern:**
   - Loads `fulfillment_slots` where `active=true AND date >= today`
   - Loads all `daily_capacity` records for capacity lookup
   - Joins data to calculate remaining capacity per slot

2. **Exported Types:**

   ```typescript
   interface FulfillmentSlotWithCapacity {
   	id: number;
   	date: string; // YYYY-MM-DD
   	startTime: string; // HH:MM
   	endTime: string; // HH:MM
   	slotType: string | null; // 'pickup', 'delivery', 'both'
   	maxCookies: number | null;
   	cookiesOrdered: number; // From daily_capacity, defaults to 0
   	remainingCapacity: number;
   	isSoldOut: boolean; // remainingCapacity <= 0
   }

   interface SlotsByDate {
   	date: string;
   	formattedDate: string; // e.g., "Saturday, January 18"
   	slots: FulfillmentSlotWithCapacity[];
   }
   ```

3. **Helper Functions:**
   - `formatTimeDisplay(timeStr)` - Converts "14:00" to "2:00 PM"

### Slot Picker UI Features

1. **Filtering by Fulfillment Type:**
   - Slots filter automatically when user switches pickup/delivery
   - "both" type slots show for both pickup and delivery
   - Selected slot resets if it becomes invalid for new fulfillment type

2. **Visual Indicators:**
   - Selected slot: Primary color border and checkmark icon
   - Sold out: Red "Sold Out" badge, disabled state
   - Low stock (<=20 remaining): Yellow warning badge with count

3. **Empty State:**
   - Shows when no slots match selected fulfillment type
   - Calendar icon with helpful message

### State Management

```typescript
// Selected slot ID
let selectedSlotId = $state<number | null>(null);

// Filter slots by fulfillment type
let filteredSlotsByDate = $derived(() => {
	return data.slotsByDate
		.map((dateGroup) => ({
			...dateGroup,
			slots: dateGroup.slots.filter((slot) => {
				if (slot.slotType === 'both') return true;
				return slot.slotType === fulfillmentType;
			})
		}))
		.filter((dateGroup) => dateGroup.slots.length > 0);
});

// Reset slot when fulfillment type changes
$effect(() => {
	const currentSlot = selectedSlot();
	if (currentSlot) {
		const isValidForType =
			currentSlot.slotType === 'both' || currentSlot.slotType === fulfillmentType;
		if (!isValidForType) {
			selectedSlotId = null;
		}
	}
});
```

### Test Coverage

25 tests in `src/routes/(public)/checkout/page.server.spec.ts`:

- Platform unavailability handling (3 tests)
- Slot capacity calculation (6 tests)
- Sold out status detection (2 tests)
- Slot sorting by date and time (1 test)
- Grouping by date (2 tests)
- Time display formatting (6 tests)
- Return type validation (3 tests)
- Multiple capacity records handling (2 tests)

## Extras Section Notes (Phase 3.8 - COMPLETE)

The checkout page now includes tip selection and gift box options.

### Key Features

1. **Tip Section:**
   - Preset percentage buttons (5%, 10%, 20%) from config
   - "No Tip" button to clear tip
   - Custom dollar input with decimal handling
   - Real-time tip amount display
   - Selecting percentage updates input display
   - Entering custom amount clears percentage selection

2. **Gift Box Section:**
   - Checkbox to add gift box ($3.00 from config)
   - Gift message textarea appears when checked
   - Character counter (max 200 characters)
   - Warning color when remaining <= 20 characters
   - Red warning at exactly 0 remaining

3. **Order Summary:**
   - Shows subtotal, tip (if any), gift box (if selected), tax (if enabled), total
   - All values update in real-time with `$derived()`
   - Tax line only shows if `config.order.taxEnabled` is true
   - Uses `calculateTax()` and `calculateTip()` from config helpers

### State Management

```typescript
// Tip state
let tipAmountCents = $state(0);
let selectedTipPercentage = $state<number | null>(null);
let tipInputValue = $state(''); // For the custom dollar input

// Gift box state
let includeGiftBox = $state(false);
let giftMessage = $state('');
const GIFT_MESSAGE_MAX_LENGTH = 200;

// Derived totals
let giftBoxCents = $derived(includeGiftBox ? config.giftBox.priceCents : 0);
let taxCents = $derived(calculateTax(subtotalCents));
let orderTotalCents = $derived(subtotalCents + tipAmountCents + giftBoxCents + taxCents);
let orderTotalFormatted = $derived(formatPrice(orderTotalCents));
```

### Helper Functions Added to Checkout Page

| Function                   | Purpose                                 |
| -------------------------- | --------------------------------------- |
| `selectTipPercentage()`    | Select preset percentage, calculate tip |
| `handleTipInput()`         | Parse and sanitize custom tip input     |
| `clearTip()`               | Reset tip to zero                       |
| `handleGiftMessageInput()` | Enforce character limit on gift message |

### Test Coverage

70 new tests added to `src/routes/(public)/checkout/page.spec.ts` (165 total):

- Tip configuration (3 tests)
- Tip percentage calculations (6 tests)
- Custom tip input parsing (6 tests)
- Tip input validation (5 tests)
- Gift box configuration (4 tests)
- Gift message handling (5 tests)
- Tax calculation (5 tests)
- Order total calculation (6 tests)
- Order summary display (6 tests)
- Tip state management (4 tests)
- Gift box state management (3 tests)
- Extras UI visibility (4 tests)
- Character counter behavior (4 tests)
- Order summary line visibility (5 tests)
- Accessibility for extras (5 tests)

### Config Values Used

- `config.tip.enabled` - Whether to show tip section
- `config.tip.percentages` - Array of preset percentages [5, 10, 20]
- `config.giftBox.enabled` - Whether to show gift box section
- `config.giftBox.priceCents` - Gift box price (300 = $3.00)
- `config.order.taxEnabled` - Whether to calculate tax
- `config.order.salesTaxRate` - Tax rate (0.0775 = 7.75%)

## Submit Functionality Notes (Phase 3.9 - COMPLETE)

The checkout page now includes full form submission handling.

### Key Features

1. **Place Order Button:**
   - Full width, primary color background
   - Disabled state with gray color
   - Loading spinner animation during submission
   - aria-busy attribute for accessibility

2. **Form Validation on Submit:**
   - Validates all customer fields (firstName, lastName, email, phone)
   - Validates delivery address fields when delivery is selected
   - Validates slot selection is made
   - Scrolls to first error on validation failure
   - Marks all fields as touched to show errors

3. **Max Quantity Modal:**
   - Shows when cart exceeds `config.order.maxOrderQuantity` (50)
   - Uses `formatMaxOrderMessage()` for dynamic message
   - Includes "Edit Cart" and "Contact Us" buttons
   - Accessible with role="dialog", aria-modal, aria-labelledby

4. **Form Disabled During Submission:**
   - Uses `<fieldset disabled={isSubmitting}>` for native form disabling
   - Adds opacity-60 class for visual feedback
   - Prevents all form inputs during submission

5. **Error Display:**
   - Shows error message in red alert box
   - Uses role="alert" and aria-live="polite" for screen readers

### State Management

```typescript
// Submission state
let isSubmitting = $state(false);
let submitError = $state<string | null>(null);
let showMaxQuantityModal = $state(false);

// Derived states
let isMaxQuantityExceeded = $derived(getCartCount() > config.order.maxOrderQuantity);
let maxQuantityMessage = $derived(formatMaxOrderMessage(...));
let isFormValid = $derived(() => { /* validation logic */ });
let isSubmitDisabled = $derived(isSubmitting || !isFormValid() || isMaxQuantityExceeded);
```

### Validation Functions

| Function                  | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `validateAllFields()`     | Validates all form fields, returns boolean   |
| `validateSlotSelection()` | Checks slot is selected, sets submitError    |
| `handleSubmit(event)`     | Main submit handler, orchestrates validation |
| `closeMaxQuantityModal()` | Closes the max quantity modal                |

### Test Coverage

72 new tests added to `src/routes/(public)/checkout/page.spec.ts` (237 total):

- Form validity checks (16 tests)
- Max quantity handling (5 tests)
- Submit button state (5 tests)
- Form field validation on submit (12 tests)
- Slot selection validation (2 tests)
- Order data preparation (12 tests)
- Submission state management (7 tests)
- Form disabled during submission (2 tests)
- Button styling (6 tests)
- Accessibility (5 tests)

## Stripe Module Notes (Phase 4.1 - STARTED)

The `src/lib/server/stripe.ts` module implements Stripe client initialization for Cloudflare Workers.

### Key Design Decisions

1. **Cloudflare Workers Compatibility:** Uses `Stripe.createFetchHttpClient()` for fetch-based HTTP client
2. **Environment Variables:** Reads `STRIPE_SECRET_KEY` from platform.env (Cloudflare environment)
3. **Helper Functions Pattern:** Follows same pattern as database helper (`getDb` -> `getStripe`)
4. **Error Messages:** Provides helpful error messages pointing to `.dev.vars` and CF Pages env vars

### Exported Functions

| Function                     | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `createStripeClient(apiKey)` | Creates Stripe client with given API key   |
| `getStripeClient(env)`       | Gets Stripe client from env object         |
| `getStripe(platform)`        | Gets Stripe client from SvelteKit platform |
| `verifyWebhookSignature()`   | Verifies Stripe webhook signatures         |

### Usage in API Routes

```typescript
import { getStripe } from '$lib/server/stripe';
import { json, error } from '@sveltejs/kit';

export async function POST({ request, platform }) {
	const stripe = getStripe(platform);

	// Create checkout session
	const session = await stripe.checkout.sessions.create({
		line_items: [...],
		mode: 'payment',
		success_url: 'https://example.com/checkout/success?session_id={CHECKOUT_SESSION_ID}',
		cancel_url: 'https://example.com/checkout'
	});

	return json({ url: session.url });
}
```

### Environment Variables Required

Create `.dev.vars` in project root (gitignored):

```bash
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
ADMIN_PASSWORD=your_local_admin_password
```

For production, set these in Cloudflare Pages > Settings > Environment Variables.

### TypeScript Types Extended

The `src/app.d.ts` was updated to include Stripe env vars in the Platform interface:

```typescript
interface ExtendedEnv extends Env {
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	ADMIN_PASSWORD?: string;
}

interface Platform {
	env: ExtendedEnv;
	// ...
}
```

### Test Coverage

19 tests in `src/lib/server/stripe.spec.ts`:

- Client creation (2 tests)
- getStripeClient error handling (4 tests)
- getStripe error handling (4 tests)
- verifyWebhookSignature (2 tests)
- Error message quality (2 tests)
- Module exports (5 tests)

## Checkout API Endpoint Notes (Phase 4.1 - MOSTLY COMPLETE)

The `src/routes/api/checkout/+server.ts` module implements the Stripe checkout session creation endpoint.

### Key Features

1. **Request Validation:** Manual validation of all request fields without external dependencies (Zod)
2. **Database Validation:** Verifies products exist, are active, and prices match to prevent manipulation
3. **Stripe Line Items:** Builds line items from cart items, optional tip, and optional gift box
4. **Order Metadata:** Stores customer info, fulfillment details, and items JSON in Stripe session metadata
5. **Error Handling:** Returns detailed validation errors with 400 status

### Exported Types

```typescript
interface CheckoutCartItem {
	productId: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
	quantity: number;
}

interface CheckoutCustomer {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
}

interface CheckoutFulfillment {
	type: 'pickup' | 'delivery';
	slotId: number;
	date: string; // YYYY-MM-DD
	startTime: string; // HH:MM
	endTime: string; // HH:MM
	address?: CheckoutDeliveryAddress;
}

interface CheckoutRequest {
	items: CheckoutCartItem[];
	customer: CheckoutCustomer;
	fulfillment: CheckoutFulfillment;
	tipCents: number;
	includeGiftBox: boolean;
	giftMessage?: string;
}
```

### Exported Validation Functions

| Function                        | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `validateCheckoutRequest(body)` | Validates request body structure         |
| `validateCartItemsAgainstDb()`  | Validates items against database         |
| `buildStripeLineItems()`        | Builds Stripe line items array           |
| `buildOrderMetadata()`          | Builds order metadata for Stripe session |

### Usage in Checkout Form

```typescript
// Submit checkout form
const response = await fetch('/api/checkout', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		items: cartItems,
		customer: { firstName, lastName, email, phone },
		fulfillment: {
			type: fulfillmentType,
			slotId: selectedSlotId,
			date: selectedSlot.date,
			startTime: selectedSlot.startTime,
			endTime: selectedSlot.endTime,
			address: fulfillmentType === 'delivery' ? deliveryAddress : undefined
		},
		tipCents,
		includeGiftBox,
		giftMessage
	})
});

const data = await response.json();
if (data.url) {
	window.location.href = data.url; // Redirect to Stripe
}
```

### Test Coverage

63 tests in `src/routes/api/checkout/server.spec.ts`:

- Request body validation (4 tests)
- Items validation (12 tests)
- Max order quantity validation (2 tests)
- Customer validation (6 tests)
- Fulfillment validation (6 tests)
- Delivery address validation (8 tests)
- Tip validation (3 tests)
- Gift box validation (3 tests)
- Database validation (6 tests)
- Stripe line items building (5 tests)
- Order metadata building (6 tests)
- Type checks (2 tests)

### Next Tasks (Phase 4.4+)

1. ~~Connect checkout form to API (PRD 4.2)~~ DONE
2. ~~Stripe webhook handler (PRD 4.3)~~ DONE - 44 tests
3. **NEXT: Checkout success page (PRD 4.4)** - Display order confirmation after payment
4. Create newsletter signup API (PRD 4.5)

## Checkout Form API Integration Notes (Phase 4.2 - COMPLETE)

The `handleSubmit` function in `src/routes/(public)/checkout/+page.svelte` now:

1. **Builds checkout payload** from cart state and form fields matching the `CheckoutRequest` type
2. **POSTs to `/api/checkout`** with proper Content-Type header
3. **Handles API responses** with typed `CheckoutApiResponse` interface
4. **Shows error messages** from API validation errors (first error from `details` array)
5. **Redirects to Stripe** via `window.location.href = data.url` on success

### Checkout Payload Structure

```typescript
const checkoutPayload = {
	items: getItems().map((item) => ({
		productId: item.productId,
		slug: item.slug,
		title: item.title,
		priceCents: item.priceCents,
		stripePriceId: item.stripePriceId,
		quantity: item.quantity
	})),
	customer: {
		firstName: firstName.trim(),
		lastName: lastName.trim(),
		email: email.trim(),
		phone: phone.trim()
	},
	fulfillment: {
		type: fulfillmentType,
		slotId: slot.id,
		date: slot.date,
		startTime: slot.startTime,
		endTime: slot.endTime,
		address: fulfillmentType === 'delivery' ? { ... } : undefined
	},
	tipCents: tipAmountCents,
	includeGiftBox,
	giftMessage: includeGiftBox && giftMessage ? giftMessage.trim() : undefined
};
```

### Error Handling Pattern

```typescript
interface CheckoutApiResponse {
	url?: string;
	error?: string;
	details?: string[];
}

const data: CheckoutApiResponse = await response.json();

if (!response.ok) {
	if (data.error) {
		if (data.details && data.details.length > 0) {
			submitError = `${data.error}: ${data.details[0]}`;
		} else {
			submitError = data.error;
		}
	} else {
		submitError = 'An error occurred while processing your order. Please try again.';
	}
	return;
}
```

### Testing the Checkout Flow

To test the full checkout flow:

1. Start dev server with `.dev.vars` containing `STRIPE_SECRET_KEY`
2. Add items to cart
3. Fill out customer form and select a slot
4. Click "Place Order"
5. Should redirect to Stripe checkout
6. Use Stripe test card `4242 4242 4242 4242` to complete payment

## Test Coverage Summary (Updated - Phase 4.2 Complete)

| Test File                                             | Tests | Purpose                            |
| ----------------------------------------------------- | ----- | ---------------------------------- |
| `src/demo.spec.ts`                                    | 1     | Demo test from sv create           |
| `src/lib/config.spec.ts`                              | 35    | Site configuration and helpers     |
| `src/lib/server/db/schema.spec.ts`                    | 23    | Schema table definitions and types |
| `src/lib/server/db/db.spec.ts`                        | 10    | Database helper functions          |
| `src/lib/components/Header.spec.ts`                   | 13    | Header component config logic      |
| `src/lib/components/Footer.spec.ts`                   | 15    | Footer component config logic      |
| `src/lib/components/Hero.spec.ts`                     | 19    | Hero component config logic        |
| `src/lib/components/MenuCard.spec.ts`                 | 37    | MenuCard product type and config   |
| `src/lib/components/ComingSoon.spec.ts`               | 46    | ComingSoon config, email, state    |
| `src/routes/(public)/page.server.spec.ts`             | 7     | Homepage load function             |
| `src/routes/(public)/page.svelte.spec.ts`             | 1     | Homepage component (browser test)  |
| `src/routes/(public)/menu/page.server.spec.ts`        | 10    | Menu page load function            |
| `src/routes/(public)/menu/[slug]/page.server.spec.ts` | 10    | Cookie detail page load function   |
| `src/lib/stores/cart.spec.ts`                         | 57    | Cart store state and persistence   |
| `src/lib/components/CartBadge.spec.ts`                | 26    | CartBadge component logic          |
| `src/lib/components/CartToast.spec.ts`                | 35    | CartToast notification logic       |
| `src/lib/components/AddToCartButton.spec.ts`          | 46    | AddToCartButton integration logic  |
| `src/routes/(public)/checkout/page.spec.ts`           | 237   | Checkout page cart, form & extras  |
| `src/routes/(public)/checkout/page.server.spec.ts`    | 25    | Checkout slots load function       |
| `src/lib/server/stripe.spec.ts`                       | 19    | Stripe client module helpers       |
| `src/routes/api/checkout/server.spec.ts`              | 63    | Checkout API validation & building |
| `src/routes/api/webhook/server.spec.ts`               | 44    | Webhook parsing & validation       |
| **Total**                                             | 778   |                                    |

Note: Phase 4.2 (connect checkout form to API) added no new tests since the integration is a simple fetch call and the API endpoint already has comprehensive tests. The existing 237 checkout page tests cover form validation, state management, and UI logic.

## Stripe Webhook Handler Notes (Phase 4.3 - COMPLETE)

The `src/routes/api/webhook/+server.ts` module handles Stripe webhook events after payment completion.

### Key Features

1. **Signature Verification:** Uses `verifyWebhookSignature()` from stripe module with `STRIPE_WEBHOOK_SECRET`
2. **Idempotency:** Checks for existing order by `stripe_session_id` to handle webhook retries
3. **Metadata Parsing:** Extracts customer, fulfillment, and order data from Stripe session metadata
4. **Order Creation:** Inserts order into D1 `orders` table with all details
5. **Capacity Tracking:** Updates `daily_capacity` table with cookie count for the fulfillment date

### Exported Types

```typescript
interface WebhookMetadata {
	customer_firstName: string;
	customer_lastName: string;
	customer_email: string;
	customer_phone: string;
	fulfillment_type: 'pickup' | 'delivery';
	fulfillment_slotId: string;
	fulfillment_date: string;
	fulfillment_startTime: string;
	fulfillment_endTime: string;
	tip_cents: string;
	include_gift_box: string;
	gift_message?: string;
	items_json: string;
	delivery_address?: string;
}
```

### Exported Helper Functions

| Function                        | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `parseWebhookMetadata(meta)`    | Validates and parses Stripe session metadata |
| `parseOrderItems(json)`         | Parses items_json string to OrderItem[]      |
| `parseDeliveryAddress(json)`    | Parses delivery_address JSON string          |
| `calculateSubtotal(items)`      | Calculates total price in cents              |
| `calculateTotalQuantity()`      | Calculates total cookie count for capacity   |
| `insertOrder(db, ...)`          | Inserts order record into D1                 |
| `updateDailyCapacity(db, ...)`  | Upserts capacity for fulfillment date        |
| `orderExistsForSession(db, id)` | Checks for duplicate order (idempotency)     |

### Event Handling Flow

```
Stripe POST /api/webhook
      |
      v
Verify signature (400 if invalid)
      |
      v
Parse event type
      |
      v (checkout.session.completed)
Check payment_status === 'paid'
      |
      v
Check for duplicate order (idempotency)
      |
      v
Parse metadata from session
      |
      v
Insert order into D1 orders table
      |
      v
Update daily_capacity for fulfillment date
      |
      v
Return { received: true, orderId: N }
```

### Error Handling Strategy

- **400 Bad Request:** Missing signature, invalid signature
- **500 Internal Server Error:** Database insert failure (triggers Stripe retry)
- **200 OK with warning:** Database unavailable (prevents infinite retries, logged for manual review)
- **200 OK with duplicate flag:** Order already exists (idempotency)
- **200 OK with error flag:** Invalid metadata (non-recoverable, logged)

### Daily Capacity Update

Uses SQLite upsert pattern for atomic increment:

```typescript
await db
	.insert(dailyCapacity)
	.values({
		date,
		cookiesOrdered: quantityToAdd,
		updatedAt: sql`(datetime('now'))`
	})
	.onConflictDoUpdate({
		target: dailyCapacity.date,
		set: {
			cookiesOrdered: sql`${dailyCapacity.cookiesOrdered} + ${quantityToAdd}`,
			updatedAt: sql`(datetime('now'))`
		}
	});
```

### Test Coverage

44 tests in `src/routes/api/webhook/server.spec.ts`:

- Metadata parsing (12 tests)
- Order items parsing (6 tests)
- Delivery address parsing (8 tests)
- Subtotal calculation (6 tests)
- Quantity calculation (5 tests)
- Type safety (2 tests)
- Edge cases (5 tests)

### Environment Variables Required

Add `STRIPE_WEBHOOK_SECRET` to `.dev.vars`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Get this from Stripe Dashboard > Developers > Webhooks > Endpoint > Signing secret.

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:5173/api/webhook

# Note the webhook signing secret printed by the CLI
# Update .dev.vars with this temporary secret for testing
```

## Checkout Success Page Notes (Phase 4.4 - COMPLETE)

The `src/routes/(public)/checkout/success/` route displays order confirmation after successful Stripe checkout.

### Key Features

1. **Server Load Function (`+page.server.ts`):**
   - Gets `session_id` from URL query params
   - Verifies Stripe session is paid (throws 404 if not)
   - Falls back to DB check if Stripe API is unreachable
   - Loads order from D1 by `stripe_session_id`
   - Returns 404 if order not found
   - Re-throws HttpError (from error()) for proper status codes

2. **Page Component (`+page.svelte`):**
   - Success icon (green checkmark in circle)
   - "Order Confirmed!" heading with email confirmation message
   - Order details card with:
     - Order number and status badge
     - Fulfillment details (date, time, type, address/location)
     - Customer information (name, email, phone)
     - Order summary (items with quantities and prices)
     - Gift box indicator with message (if applicable)
     - Order totals (subtotal, tip, gift box, tax, total)
   - "Back to Home" and "Order More Cookies" action buttons
   - Help text with contact email

3. **Cart Clearing:**
   - Calls `clearCart()` and `clearStorage()` on mount
   - Ensures cart is empty after successful order

### Exported Helper Functions

| Function                     | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `formatFulfillmentDate(str)` | Formats "YYYY-MM-DD" to "Weekday, Month D, YYYY" |
| `formatFulfillmentTime(str)` | Formats "HH:MM-HH:MM" to "H:MM AM - H:MM PM"     |
| `formatFulfillmentType(str)` | Capitalizes "pickup" to "Pickup"                 |

### OrderData Interface

```typescript
interface OrderData {
	id: number;
	stripeSessionId: string | null;
	status: string | null;
	customerName: string | null;
	customerEmail: string | null;
	customerPhone: string | null;
	fulfillmentType: string | null;
	fulfillmentDate: string | null;
	fulfillmentTime: string | null;
	deliveryAddress: DeliveryAddress | null;
	items: OrderItem[];
	subtotalCents: number | null;
	tipCents: number | null;
	giftBox: boolean | null;
	giftMessage: string | null;
	taxCents: number | null;
	totalCents: number | null;
	createdAt: string | null;
}
```

### Test Coverage

27 tests in `src/routes/(public)/checkout/success/page.server.spec.ts`:

- Missing session_id handling (1 test)
- Platform unavailability (2 tests)
- Order found scenarios (4 tests)
- Order not found (1 test)
- Stripe session verification (3 tests)
- Database query structure (1 test)
- formatFulfillmentDate (4 tests)
- formatFulfillmentTime (7 tests)
- formatFulfillmentType (4 tests)

### URL Structure

After Stripe checkout completion, users are redirected to:

```
/checkout/success?session_id={CHECKOUT_SESSION_ID}
```

The `{CHECKOUT_SESSION_ID}` is replaced by Stripe with the actual session ID.

## Newsletter Signup API Notes (Phase 4.5 - COMPLETE)

The `src/routes/api/newsletter/+server.ts` module handles newsletter subscription requests.

### Key Features

1. **Email Validation:** Uses regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` with length checks (5-254 chars)
2. **Email Normalization:** Trims whitespace and converts to lowercase before storage
3. **Duplicate Handling:** Returns success for existing subscribers (privacy-preserving)
4. **Source Tracking:** Optional `source` field defaults to "website" for tracking signup origin
5. **Config Integration:** Uses `config.newsletter.successMessage` and `errorMessage` from config

### Exported Types

```typescript
interface NewsletterRequest {
	email: string;
	source?: string;
}

interface NewsletterResponse {
	success: boolean;
	message: string;
	alreadySubscribed?: boolean;
}

interface NewsletterErrorResponse {
	success: false;
	error: string;
	details?: string[];
}
```

### Exported Helper Functions

| Function                          | Purpose                           |
| --------------------------------- | --------------------------------- |
| `isValidEmail(email)`             | Validates email format with regex |
| `normalizeEmail(email)`           | Trims and lowercases email        |
| `validateNewsletterRequest(body)` | Validates request body structure  |

### Usage from ComingSoon Component

```typescript
const response = await fetch('/api/newsletter', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		email: email.trim(),
		source: 'coming-soon'
	})
});

const data = await response.json();
if (data.success) {
	// Show success message
} else {
	// Show error: data.error or data.details
}
```

### Test Coverage

54 tests in `src/routes/api/newsletter/server.spec.ts`:

- isValidEmail valid cases (8 tests)
- isValidEmail invalid cases (12 tests)
- normalizeEmail (5 tests)
- validateNewsletterRequest valid requests (3 tests)
- validateNewsletterRequest invalid body (5 tests)
- validateNewsletterRequest email validation (7 tests)
- validateNewsletterRequest source validation (5 tests)
- Multiple validation errors (1 test)
- Type exports (2 tests)
- Edge cases (4 tests)
- Function composition (2 tests)

### Error Handling

- **400 Bad Request:** Invalid JSON, missing email, invalid email format
- **503 Service Unavailable:** Newsletter disabled in config or database unavailable
- **500 Internal Server Error:** Database insert failure

### Phase 4.6 Complete - Newsletter Form Connected

The ComingSoon component now POSTs to `/api/newsletter` with:

- Real API call instead of simulated submission
- Error handling for validation errors (shows first detail error)
- Network error handling with fallback message from config
- Source tracking set to "coming-soon" for analytics

### Next Phase

**Phase 5: Image Upload (R2)** - BLOCKED (R2 bucket needs to be enabled in Cloudflare Dashboard first - 0.6.3 is still pending)

**Phase 6: Admin Dashboard** - Started with PRD 6.1 (Admin authentication)

## Admin Authentication Notes (Phase 6.1 - COMPLETE)

The `src/lib/server/auth.ts` module implements admin authentication for the dashboard.

### Key Features

1. **Constant-Time Password Verification:** Uses XOR comparison to prevent timing attacks
2. **UUID Session IDs:** Generates cryptographically secure session IDs with `crypto.randomUUID()`
3. **7-Day Session Expiration:** Sessions auto-expire after 7 days
4. **Automatic Cleanup:** Validates and auto-deletes expired sessions

### Exported Constants

| Constant                | Value                    | Purpose                            |
| ----------------------- | ------------------------ | ---------------------------------- |
| `SESSION_DURATION_MS`   | 604800000 (7 days in ms) | Session duration in milliseconds   |
| `SESSION_DURATION_DAYS` | 7                        | Session duration for documentation |

### Exported Functions

| Function                      | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `verifyPassword(pw, adminPw)` | Constant-time password comparison                 |
| `generateSessionId()`         | Create cryptographically secure UUID              |
| `calculateExpirationDate()`   | Calculate session expiration (7 days from now)    |
| `formatExpirationDate(date)`  | Format date as ISO string for storage             |
| `parseExpirationDate(str)`    | Parse ISO string back to Date                     |
| `isSessionExpired(exp, now)`  | Check if session has expired                      |
| `createSession(db, now?)`     | Create and store new session, returns ID + expiry |
| `validateSession(db, id)`     | Check session validity, auto-delete if expired    |
| `deleteSession(db, id)`       | Remove session (logout)                           |
| `cleanupExpiredSessions(db)`  | Delete all expired sessions (maintenance)         |
| `getAdminPassword(platform)`  | Get ADMIN_PASSWORD from env, throws if missing    |

### Usage in Admin Routes

```typescript
import {
	verifyPassword,
	createSession,
	validateSession,
	deleteSession,
	getAdminPassword
} from '$lib/server/auth';
import { getDb } from '$lib/server/db';

// Login: verify password and create session
export const actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const password = data.get('password') as string;
		const adminPassword = getAdminPassword(platform);

		if (!verifyPassword(password, adminPassword)) {
			return { error: 'Invalid password' };
		}

		const db = getDb(platform);
		const { sessionId, expiresAt } = await createSession(db);

		cookies.set('admin_session', sessionId, {
			path: '/admin',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			expires: expiresAt
		});

		redirect(303, '/admin');
	}
};

// Auth guard: validate session
export const load = async ({ cookies, platform }) => {
	const sessionId = cookies.get('admin_session');
	const db = getDb(platform);
	const { valid } = await validateSession(db, sessionId);

	if (!valid) {
		redirect(303, '/admin/login');
	}
};

// Logout: delete session
export const actions = {
	default: async ({ cookies, platform }) => {
		const sessionId = cookies.get('admin_session');
		const db = getDb(platform);
		await deleteSession(db, sessionId);
		cookies.delete('admin_session', { path: '/admin' });
		redirect(303, '/admin/login');
	}
};
```

### Test Coverage

66 tests in `src/lib/server/auth.spec.ts`:

- Constants (2 tests)
- verifyPassword (12 tests) - matching, non-matching, edge cases, unicode
- generateSessionId (4 tests) - UUID format, uniqueness
- calculateExpirationDate (4 tests) - 7-day offset, leap years, year boundaries
- formatExpirationDate (2 tests) - ISO format
- parseExpirationDate (6 tests) - valid, null, undefined, invalid
- isSessionExpired (4 tests) - future, past, exact, default now
- createSession (2 tests) - DB insert, UUID format
- validateSession (5 tests) - undefined, non-existent, valid, expired, invalid format
- deleteSession (3 tests) - undefined, success, not found
- cleanupExpiredSessions (3 tests) - delete count, zero results, provided date
- getAdminPassword (6 tests) - configured, undefined platform/env/password, empty string, error message
- Module exports (13 tests)

### Security Considerations

1. **Constant-time comparison:** Prevents timing attacks on password verification
2. **Cryptographic random IDs:** Uses Web Crypto API for secure session IDs
3. **Automatic cleanup:** Expired sessions are deleted on validation attempt
4. **No plaintext storage:** Only session ID stored in DB, not the password
5. **Error messages:** Generic errors don't leak security info

### Next Tasks (Phase 6.2+)

1. Create admin login page (PRD 6.2)
2. Create admin auth guard (PRD 6.3)
3. Create admin layout with sidebar (PRD 6.4)
4. Create admin logout (PRD 6.5)
5. Create admin dashboard (PRD 6.6)
