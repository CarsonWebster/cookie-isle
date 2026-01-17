# Memory - Cookie Isle Project

This file contains useful findings for future agents working on this project.

## Project Overview

- **Tech Stack:** SvelteKit + Svelte 5 (runes) + Cloudflare D1 + Drizzle ORM + Tailwind v4
- **Runtime:** Bun
- **Primary Documentation:** `docs/PRD.md` - Contains all migration tasks with status tracking

## Current Progress (as of 2026-01-16)

### Phase 0 Status: COMPLETE (except CF deployment tasks)

- 0.1-0.5: Completed (project setup, TypeScript, Vitest, Tailwind)
- 0.6: Partially complete (D1 configured, R2 pending - needs enabling in CF Dashboard)
- 0.7: Schema and Migrations COMPLETE
  - All 6 tables in schema: `products`, `orders`, `newsletter`, `fulfillmentSlots`, `dailyCapacity`, `adminSessions`
  - Migrations generated - DONE
  - Schema tests written (23 tests) - DONE (`src/lib/server/db/schema.spec.ts`)
  - Remaining: push to D1 (0.7.9 - needs CF credentials)
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

### Phase 2 Status: IN PROGRESS

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

## Key File Locations

| File                                 | Purpose                                               |
| ------------------------------------ | ----------------------------------------------------- |
| `docs/PRD.md`                        | Complete migration spec with task tracking            |
| `src/lib/config.ts`                  | Site configuration (migrated from hugo.toml)          |
| `src/lib/components/Header.svelte`   | Header with desktop/mobile nav, cart badge            |
| `src/lib/components/Footer.svelte`   | Footer with brand, nav, contact, social               |
| `src/lib/components/Hero.svelte`     | Hero section with gradient, CTA button                |
| `src/lib/components/MenuCard.svelte` | Product card with image, price, add to cart           |
| `src/routes/(public)/+layout.svelte` | Public pages layout (Header + main + Footer)          |
| `src/routes/(public)/+page.svelte`   | Homepage (placeholder, will add Hero in Phase 2)      |
| `src/lib/server/db/schema.ts`        | Drizzle table definitions                             |
| `src/lib/server/db/index.ts`         | Database helper functions (`getDb`, `createDb`)       |
| `drizzle.config.ts`                  | Drizzle Kit config (uses d1-http driver)              |
| `wrangler.jsonc`                     | Cloudflare bindings (D1 configured, R2 commented out) |
| `AGENTS.md`                          | Agent instructions and coding standards               |

## Testing Notes

- **Server tests:** `bunx vitest run --project=server` - Works out of the box
- **Browser tests:** Require `npx playwright install` first (optional per PRD 0.4.6)
- Running `bun run test` shows "1 passed" for server tests but errors for browser due to missing Playwright
- Use `bunx vitest run --project=server` for CI-safe testing without browser deps

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
16. **NEXT: About page (PRD 2.6)** - `src/routes/(public)/about/+page.svelte` with content from legacy

## Commands Reference

```bash
bun run dev          # Start dev server
bun run check        # TypeScript check (must pass before commits)
bun run test         # Run all tests
bunx vitest run --project=server  # Server tests only (no Playwright needed)
bun run db:generate  # Generate SQL migrations
bun run db:push      # Push schema to D1
```

## Gotchas

1. **Playwright not installed:** Browser tests will fail. Use `--project=server` for server-only tests
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

## Test Coverage Summary

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
| `src/routes/(public)/page.server.spec.ts`             | 7     | Homepage load function             |
| `src/routes/(public)/menu/page.server.spec.ts`        | 10    | Menu page load function            |
| `src/routes/(public)/menu/[slug]/page.server.spec.ts` | 10    | Cookie detail page load function   |
| **Total**                                             | 180   |                                    |

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
