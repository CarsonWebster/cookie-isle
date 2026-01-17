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

### Phase 1 Status: IN PROGRESS

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
- 1.4-1.5: Not Started (Footer, Public layout)

## Key File Locations

| File                               | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `docs/PRD.md`                      | Complete migration spec with task tracking            |
| `src/lib/config.ts`                | Site configuration (migrated from hugo.toml)          |
| `src/lib/components/Header.svelte` | Header with desktop/mobile nav, cart badge            |
| `src/lib/server/db/schema.ts`      | Drizzle table definitions                             |
| `src/lib/server/db/index.ts`       | Database helper functions (`getDb`, `createDb`)       |
| `drizzle.config.ts`                | Drizzle Kit config (uses d1-http driver)              |
| `wrangler.jsonc`                   | Cloudflare bindings (D1 configured, R2 commented out) |
| `AGENTS.md`                        | Agent instructions and coding standards               |

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
9. **NEXT: Footer component (PRD 1.4)** - brand section, contact, social icons
10. Public layout group (PRD 1.5) - `src/routes/(public)/+layout.svelte`

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

| Test File                           | Tests | Purpose                            |
| ----------------------------------- | ----- | ---------------------------------- |
| `src/demo.spec.ts`                  | 1     | Demo test from sv create           |
| `src/lib/config.spec.ts`            | 35    | Site configuration and helpers     |
| `src/lib/server/db/schema.spec.ts`  | 23    | Schema table definitions and types |
| `src/lib/server/db/db.spec.ts`      | 10    | Database helper functions          |
| `src/lib/components/Header.spec.ts` | 13    | Header component config logic      |
| **Total**                           | 82    |                                    |

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
