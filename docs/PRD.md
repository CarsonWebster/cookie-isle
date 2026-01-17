# Cookie Isle - SvelteKit Migration PRD

**Version:** 1.0  
**Created:** 2026-01-16  
**Branch:** `refactor`  
**Status:** In Progress

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Stack](#technical-stack)
3. [Directory Structure](#directory-structure)
4. [Development Standards](#development-standards)
5. [Phase 0: Repository Setup](#phase-0-repository-setup)
6. [Phase 1: Core Layout & Components](#phase-1-core-layout--components)
7. [Phase 2: Public Pages](#phase-2-public-pages)
8. [Phase 3: Cart System](#phase-3-cart-system)
9. [Phase 4: API Routes & Stripe](#phase-4-api-routes--stripe)
10. [Phase 5: Image Upload (R2)](#phase-5-image-upload-r2)
11. [Phase 6: Admin Dashboard](#phase-6-admin-dashboard)
12. [Phase 7: Data Migration & Deployment](#phase-7-data-migration--deployment)
13. [Phase 8: Cleanup](#phase-8-cleanup)
14. [Appendix A: Database Schema](#appendix-a-database-schema)
15. [Appendix B: Environment Variables](#appendix-b-environment-variables)
16. [Appendix C: Wrangler Configuration](#appendix-c-wrangler-configuration)
17. [Appendix D: Legacy Reference](#appendix-d-legacy-reference)

---

## Overview

### Project Summary

Migrate The Cookie Isle website from a fragmented Hugo + Cloudflare Workers + Google Sheets architecture to a unified SvelteKit application with Cloudflare D1 (SQLite), Cloudflare R2 (images), and Drizzle ORM.

### Current Architecture Problems

The legacy system consists of 6+ disconnected systems:

- Hugo static site generator (content in Markdown)
- 3 separate Cloudflare Workers (stripe-checkout, newsletter-signup, calendar-slots)
- Google Apps Script for data persistence
- Google Sheets as database
- Stripe Dashboard for product management
- Google Calendar for fulfillment slots

This fragmentation makes it difficult for a non-developer to manage content, view orders, or understand business metrics.

### Goals

1. **Single codebase** - Replace 6+ systems with one SvelteKit application
2. **Admin dashboard** - Visual interface for managing orders, products, and fulfillment slots
3. **Real database** - Proper SQL queries with Drizzle ORM + Cloudflare D1
4. **Modern stack** - Svelte 5 with runes, Tailwind CSS, TypeScript with strict mode
5. **Comprehensive testing** - Vitest unit and integration tests for all features
6. **Maintain free hosting** - Cloudflare Pages/D1/R2 free tiers

### URLs

| Environment               | URL                                   |
| ------------------------- | ------------------------------------- |
| Production                | https://thecookieisle.com             |
| Preview (refactor branch) | https://preview.cookie-isle.pages.dev |
| Local Development         | http://localhost:5173                 |

---

## Technical Stack

| Layer         | Technology                       | Documentation                                       |
| ------------- | -------------------------------- | --------------------------------------------------- |
| Runtime       | Bun                              | https://bun.sh/docs                                 |
| Framework     | SvelteKit (Svelte 5 with runes)  | https://svelte.dev/docs                             |
| Styling       | Tailwind CSS v4                  | https://tailwindcss.com/docs                        |
| Database      | Cloudflare D1 (SQLite)           | https://developers.cloudflare.com/d1/               |
| ORM           | Drizzle ORM                      | https://orm.drizzle.team/docs/connect-cloudflare-d1 |
| Image Storage | Cloudflare R2                    | https://developers.cloudflare.com/r2/               |
| Payments      | Stripe Checkout                  | https://stripe.com/docs/payments/checkout           |
| Hosting       | Cloudflare Pages                 | https://developers.cloudflare.com/pages/            |
| Auth (Admin)  | Simple password + session cookie | Custom implementation                               |
| Testing       | Vitest + @testing-library/svelte | https://svelte.dev/docs/svelte/testing              |
| Language      | TypeScript (strict mode)         | https://www.typescriptlang.org/docs/                |

### Key Documentation References

- **Svelte 5 Runes:** https://svelte.dev/docs/svelte/$state
- **SvelteKit + D1 Example:** https://developers.cloudflare.com/d1/examples/d1-and-sveltekit/
- **Drizzle + D1 Setup:** https://orm.drizzle.team/docs/get-started/d1-new
- **Svelte Testing:** https://svelte.dev/docs/svelte/testing

---

## Directory Structure

```
cookie-isle/
├── src/                      # SvelteKit application source
│   ├── lib/                  # Shared library code
│   │   ├── components/       # Reusable Svelte 5 components
│   │   ├── server/           # Server-only code (db, stripe, auth)
│   │   └── stores/           # Svelte stores (cart state)
│   ├── routes/               # SvelteKit file-based routing
│   │   ├── (public)/         # Public pages layout group
│   │   ├── admin/            # Protected admin routes
│   │   └── api/              # API endpoints
│   ├── app.css               # Tailwind CSS imports
│   ├── app.d.ts              # TypeScript declarations (Platform types)
│   └── app.html              # HTML template
├── drizzle/                  # Database schema and migrations
│   ├── schema.ts             # Drizzle table definitions
│   ├── migrations/           # Generated SQL migrations
│   └── seed.ts               # Seed script for legacy data
├── static/                   # Static assets (favicon, etc.)
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── _legacy/                  # Archived Hugo project (reference only)
├── docs/                     # Documentation
│   └── PRD.md                # This file
├── drizzle.config.ts         # Drizzle Kit configuration
├── svelte.config.js          # SvelteKit configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── vite.config.ts            # Vite configuration (includes Vitest)
├── vitest.config.ts          # Vitest configuration
├── wrangler.toml             # Cloudflare configuration
├── tsconfig.json             # TypeScript configuration (strict)
└── package.json              # Dependencies and scripts
```

---

## Development Standards

### TypeScript Requirements

All code MUST use TypeScript with strict mode enabled. The `tsconfig.json` must include:

```json
{
	"compilerOptions": {
		"strict": true,
		"noImplicitAny": true,
		"strictNullChecks": true,
		"strictFunctionTypes": true,
		"strictBindCallApply": true,
		"strictPropertyInitialization": true,
		"noImplicitThis": true,
		"alwaysStrict": true
	}
}
```

### Testing Requirements

**Every TODO item completion MUST:**

1. Compile with zero TypeScript errors
2. Compile with zero TypeScript warnings
3. Pass all existing unit tests
4. Include new unit tests for new functionality
5. Pass `bun run check` (svelte-check)

**Testing Stack:**

- **Vitest** - Test runner
- **@testing-library/svelte** - Component testing
- **@testing-library/jest-dom** - DOM matchers

**Test File Naming:**

- Unit tests: `*.test.ts` or `*.spec.ts`
- Component tests: `*.test.svelte.ts`
- Integration tests: `tests/integration/*.test.ts`

**Required scripts (run with `bun run <script>`):**

```json
{
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"test": "vitest",
		"test:unit": "vitest run",
		"test:watch": "vitest",
		"test:coverage": "vitest run --coverage",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
	}
}
```

### Svelte 5 Standards

- Use runes (`$state`, `$derived`, `$effect`) instead of legacy reactive statements
- Use `$props()` for component props
- Use `$bindable()` for two-way binding props
- Avoid `$:` reactive statements (legacy Svelte 4 syntax)

### Code Quality Checklist (Per TODO)

Before marking any TODO as complete:

- [ ] Code compiles: `bun run build` succeeds
- [ ] Type check passes: `bun run check` succeeds
- [ ] Tests pass: `bun run test:unit` succeeds
- [ ] New code has tests with >80% coverage for new files
- [ ] No `any` types (use proper typing)
- [ ] No `@ts-ignore` comments (fix the actual issue)

---

## Phase 0: Repository Setup

**Status:** Completed (except CF deployment tasks)

### 0.1 Archive legacy project

**Status:** Completed

| ID    | Task                                                                                            | Status      |
| ----- | ----------------------------------------------------------------------------------------------- | ----------- |
| 0.1.1 | Create `_legacy/` directory                                                                     | Completed   |
| 0.1.2 | Move all Hugo files to `_legacy/` (hugo.toml, content/, layouts/, static/, workers/, assets/)   | Completed   |
| 0.1.3 | Update root `.gitignore` for SvelteKit project (add node_modules, .svelte-kit, .env, .dev.vars) | Completed   |
| 0.1.4 | **Commit:** `chore: archive legacy Hugo project to _legacy/`                                    | Not Started |

### 0.2 Initialize SvelteKit project

**Status:** Completed

> Note: Project was initialized using `sv` (Svelte CLI) with Bun runtime. All items below were auto-configured.

| ID    | Task                                                                               | Status      |
| ----- | ---------------------------------------------------------------------------------- | ----------- |
| 0.2.1 | Run `sv create` - Selected: Skeleton project, TypeScript, ESLint, Prettier, Vitest | Completed   |
| 0.2.2 | Install Cloudflare adapter: `@sveltejs/adapter-cloudflare`                         | Completed   |
| 0.2.3 | Configure `svelte.config.js` with Cloudflare adapter                               | Completed   |
| 0.2.4 | Verify project runs: `bun run dev` shows welcome page                              | Completed   |
| 0.2.5 | **Commit:** `feat: initialize SvelteKit with Cloudflare adapter`                   | Not Started |

### 0.3 Configure TypeScript strict mode

**Status:** Completed

> Note: `sv` configured TypeScript with strict mode by default.

| ID    | Task                                                | Status      |
| ----- | --------------------------------------------------- | ----------- |
| 0.3.1 | Update `tsconfig.json` with strict compiler options | Completed   |
| 0.3.2 | Run `bun run check` - must pass with zero errors    | Completed   |
| 0.3.3 | **Commit:** `chore: enable TypeScript strict mode`  | Not Started |

### 0.4 Setup Vitest for testing

**Status:** Completed

> Note: `sv` configured Vitest with Playwright browser testing. Run `npx playwright install` to enable browser tests.

| ID    | Task                                                                       | Status      |
| ----- | -------------------------------------------------------------------------- | ----------- |
| 0.4.1 | Install testing dependencies: vitest, @vitest/browser-playwright           | Completed   |
| 0.4.2 | Create `vite.config.ts` with Vitest config (server + client test projects) | Completed   |
| 0.4.3 | Demo test exists at `src/demo.spec.ts`                                     | Completed   |
| 0.4.4 | Test scripts in `package.json` (test, test:unit)                           | Completed   |
| 0.4.5 | Run `bun run test` - server tests pass                                     | Completed   |
| 0.4.6 | **Optional:** Run `npx playwright install` for browser component tests     | Completed   |
| 0.4.7 | **Commit:** `feat: setup Vitest testing framework`                         | Not Started |

### 0.5 Setup Tailwind CSS

**Status:** Completed

> Note: `sv` configured Tailwind CSS v4 with @tailwindcss/vite plugin, forms, and typography.

| ID    | Task                                                                                                     | Status      |
| ----- | -------------------------------------------------------------------------------------------------------- | ----------- |
| 0.5.1 | Install Tailwind v4: `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/forms`, `@tailwindcss/typography` | Completed   |
| 0.5.2 | Tailwind configured via Vite plugin in `vite.config.ts`                                                  | Completed   |
| 0.5.3 | CSS file at `src/routes/layout.css` with `@import 'tailwindcss'`                                         | Completed   |
| 0.5.4 | Layout at `src/routes/+layout.svelte` imports CSS                                                        | Completed   |
| 0.5.5 | Add custom theme colors from legacy (see Appendix D)                                                     | Completed   |
| 0.5.6 | **Commit:** `feat: setup Tailwind CSS with custom theme`                                                 | Not Started |

### 0.6 Setup Drizzle ORM + Cloudflare D1

**Status:** Completed

> Note: D1 and R2 are now fully configured. Remote D1 has schema and seed data applied.

| ID    | Task                                                                                    | Status    |
| ----- | --------------------------------------------------------------------------------------- | --------- |
| 0.6.1 | Drizzle packages installed: `drizzle-orm`, `drizzle-kit`                                | Completed |
| 0.6.2 | Create D1 database: `npx wrangler d1 create cookie-isle-db`                             | Completed |
| 0.6.3 | Create R2 bucket: `npx wrangler r2 bucket create cookie-isle-images`                    | Completed |
| 0.6.4 | Update `wrangler.jsonc` with D1 and R2 bindings                                         | Completed |
| 0.6.5 | Update `drizzle.config.ts` for D1 with d1-http driver                                   | Completed |
| 0.6.6 | Update `src/lib/server/db/index.ts` to use D1 binding from platform.env                 | Completed |
| 0.6.7 | `src/app.d.ts` already has Platform interface (uses Env from worker-configuration.d.ts) | Completed |
| 0.6.8 | Run `npx wrangler types` to regenerate types after D1/R2 bindings                       | Completed |
| 0.6.9 | **Commit:** `feat: setup Drizzle ORM with Cloudflare D1 and R2 bindings`                | Completed |

### 0.7 Create database schema

**Status:** Completed

| ID     | Task                                                                    | Status      |
| ------ | ----------------------------------------------------------------------- | ----------- |
| 0.7.1  | Create `drizzle/schema.ts` with `products` table (see Appendix A)       | Completed   |
| 0.7.2  | Add `orders` table to schema                                            | Completed   |
| 0.7.3  | Add `newsletter` table to schema                                        | Completed   |
| 0.7.4  | Add `fulfillmentSlots` table to schema                                  | Completed   |
| 0.7.5  | Add `dailyCapacity` table to schema                                     | Completed   |
| 0.7.6  | Add `adminSessions` table to schema                                     | Completed   |
| 0.7.7  | Create TypeScript types for JSON columns (OrderItem, DeliveryAddress)   | Completed   |
| 0.7.8  | Run `bun run drizzle-kit generate` to create SQL migration              | Completed   |
| 0.7.9  | Run `bun run drizzle-kit push` to apply schema to D1                    | Completed   |
| 0.7.10 | Write unit tests for schema types in `src/lib/server/db/schema.spec.ts` | Completed   |
| 0.7.11 | **Commit:** `feat: create database schema with Drizzle`                 | Not Started |

### 0.8 Create database helper

**Status:** Completed

> Note: Database helper already exists at `src/lib/server/db/index.ts` with `getDb()` and `createDb()` functions.

| ID    | Task                                                                | Status    |
| ----- | ------------------------------------------------------------------- | --------- |
| 0.8.1 | Create `src/lib/server/db/index.ts` with `getDb(platform)` function | Completed |
| 0.8.2 | Export typed Drizzle instance that takes Platform.env.DB            | Completed |
| 0.8.3 | Add error handling for missing DB binding                           | Completed |
| 0.8.4 | Write unit test for db helper in `src/lib/server/db/db.spec.ts`     | Completed |
| 0.8.5 | Run `bun run check` and `bun run test:unit` - must pass             | Completed |
| 0.8.6 | **Commit:** `feat: add database connection helper`                  | Completed |

---

## Phase 1: Core Layout & Components

**Status:** Completed

### 1.1 Site configuration

**Status:** Completed

| ID    | Task                                                                                 | Status    |
| ----- | ------------------------------------------------------------------------------------ | --------- |
| 1.1.1 | Create `src/lib/config.ts` with typed site configuration object                      | Completed |
| 1.1.2 | Migrate settings from `_legacy/hugo.toml`: site title, tagline, description          | Completed |
| 1.1.3 | Add contact info: email, phone, instagram, facebook URLs                             | Completed |
| 1.1.4 | Add checkout settings: maxOrderQuantity (50), taxRate (0.0775), tipPercentages, etc. | Completed |
| 1.1.5 | Add delivery settings: allowedDeliveryZips, pickupEnabled, deliveryEnabled           | Completed |
| 1.1.6 | Add feature flags: comingSoonMode, newsletterEnabled, giftBoxEnabled                 | Completed |
| 1.1.7 | Write unit tests for config validation in `src/lib/config.spec.ts`                   | Completed |
| 1.1.8 | **Commit:** `feat: add site configuration module`                                    | Completed |

### 1.2 Root layout

**Status:** Completed

| ID    | Task                                                                  | Status    |
| ----- | --------------------------------------------------------------------- | --------- |
| 1.2.1 | Update `src/routes/+layout.svelte` with HTML structure (main wrapper) | Completed |
| 1.2.2 | Add `<svelte:head>` with meta tags (title, description, og:image)     | Completed |
| 1.2.3 | Add favicon links from `src/lib/assets/favicon.svg`                   | Completed |
| 1.2.4 | Verify layout renders with `bun run dev`                              | Completed |
| 1.2.5 | **Commit:** `feat: create root layout with meta tags`                 | Completed |

### 1.3 Header component

**Status:** Completed

| ID     | Task                                                             | Status    |
| ------ | ---------------------------------------------------------------- | --------- |
| 1.3.1  | Create `src/lib/components/Header.svelte` with Svelte 5 runes    | Completed |
| 1.3.2  | Add logo (image or text fallback) with link to home              | Completed |
| 1.3.3  | Add desktop navigation links: Menu, About, Calendar (if enabled) | Completed |
| 1.3.4  | Add cart button with badge showing item count                    | Completed |
| 1.3.5  | Add social icons (Instagram, Facebook) if enabled in config      | Completed |
| 1.3.6  | Create mobile menu state with `$state` rune                      | Completed |
| 1.3.7  | Add hamburger button for mobile (hidden on desktop)              | Completed |
| 1.3.8  | Create slide-out mobile drawer with navigation links             | Completed |
| 1.3.9  | Add overlay behind mobile drawer that closes menu on click       | Completed |
| 1.3.10 | Style with Tailwind: sticky header, responsive breakpoints       | Completed |
| 1.3.11 | Write component test in `src/lib/components/Header.spec.ts`      | Completed |
| 1.3.12 | **Commit:** `feat: create Header component with mobile nav`      | Completed |

### 1.4 Footer component

**Status:** Completed

| ID    | Task                                                        | Status    |
| ----- | ----------------------------------------------------------- | --------- |
| 1.4.1 | Create `src/lib/components/Footer.svelte`                   | Completed |
| 1.4.2 | Add brand section with site title and tagline               | Completed |
| 1.4.3 | Add contact section with email and phone links              | Completed |
| 1.4.4 | Add social media icons with links                           | Completed |
| 1.4.5 | Add copyright with current year                             | Completed |
| 1.4.6 | Style with Tailwind: dark background, responsive grid       | Completed |
| 1.4.7 | Write component test in `src/lib/components/Footer.spec.ts` | Completed |
| 1.4.8 | **Commit:** `feat: create Footer component`                 | Completed |

### 1.5 Public layout group

**Status:** Completed

| ID    | Task                                                 | Status    |
| ----- | ---------------------------------------------------- | --------- |
| 1.5.1 | Create `src/routes/(public)/+layout.svelte`          | Completed |
| 1.5.2 | Import and render Header component                   | Completed |
| 1.5.3 | Add `<main>` element with slot for page content      | Completed |
| 1.5.4 | Import and render Footer component                   | Completed |
| 1.5.5 | Add min-height to main for proper footer positioning | Completed |
| 1.5.6 | Verify layout with placeholder page content          | Completed |
| 1.5.7 | **Commit:** `feat: create public pages layout group` | Completed |

---

## Phase 2: Public Pages

**Status:** Completed

### 2.1 Hero component

**Status:** Completed

| ID    | Task                                                                                    | Status    |
| ----- | --------------------------------------------------------------------------------------- | --------- |
| 2.1.1 | Create `src/lib/components/Hero.svelte` with props for title, tagline, ctaText, ctaHref | Completed |
| 2.1.2 | Add gradient background using theme colors                                              | Completed |
| 2.1.3 | Add decorative elements (radial gradients, wave, bouncing cookie emoji)                 | Completed |
| 2.1.4 | Style CTA button with primary color and hover effects                                   | Completed |
| 2.1.5 | Make responsive: stack content on mobile, full width on large screens                   | Completed |
| 2.1.6 | Write component test in `src/lib/components/Hero.spec.ts` (19 tests)                    | Completed |
| 2.1.7 | **Commit:** `feat: create Hero component`                                               | Completed |

### 2.2 Homepage

**Status:** Completed

| ID    | Task                                                                                  | Status    |
| ----- | ------------------------------------------------------------------------------------- | --------- |
| 2.2.1 | Create `src/routes/(public)/+page.server.ts` to load featured products from D1        | Completed |
| 2.2.2 | Query: `SELECT * FROM products WHERE featured = 1 AND active = 1 ORDER BY sort_order` | Completed |
| 2.2.3 | Create `src/routes/(public)/+page.svelte`                                             | Completed |
| 2.2.4 | Render Hero component with site title and tagline from config                         | Completed |
| 2.2.5 | Add "Featured Cookies" section with heading                                           | Completed |
| 2.2.6 | Render grid of MenuCard components for featured products                              | Completed |
| 2.2.7 | Add "View Full Menu" button linking to /menu                                          | Completed |
| 2.2.8 | Write page test in `src/routes/(public)/page.server.spec.ts` (7 tests)                | Completed |
| 2.2.9 | **Commit:** `feat: create homepage with hero and featured products`                   | Completed |

### 2.3 MenuCard component

**Status:** Completed

| ID     | Task                                                                 | Status    |
| ------ | -------------------------------------------------------------------- | --------- |
| 2.3.1  | Create `src/lib/components/MenuCard.svelte` with Product type prop   | Completed |
| 2.3.2  | Display product image (from R2 URL) with aspect ratio container      | Completed |
| 2.3.3  | Add image placeholder when no image URL                              | Completed |
| 2.3.4  | Display title as link to `/menu/[slug]`                              | Completed |
| 2.3.5  | Display formatted price (cents to dollars)                           | Completed |
| 2.3.6  | Display description (truncated to 2 lines)                           | Completed |
| 2.3.7  | Display tags as small badges                                         | Completed |
| 2.3.8  | Add "Add to Cart" button with product data attributes                | Completed |
| 2.3.9  | Style with Tailwind: card shadow, hover lift effect, rounded corners | Completed |
| 2.3.10 | Write component test in `src/lib/components/MenuCard.spec.ts`        | Completed |
| 2.3.11 | **Commit:** `feat: create MenuCard component`                        | Completed |

### 2.4 Menu page

**Status:** Completed

| ID    | Task                                                                 | Status    |
| ----- | -------------------------------------------------------------------- | --------- |
| 2.4.1 | Create `src/routes/(public)/menu/+page.server.ts`                    | Completed |
| 2.4.2 | Query: `SELECT * FROM products WHERE active = 1 ORDER BY sort_order` | Completed |
| 2.4.3 | Create `src/routes/(public)/menu/+page.svelte`                       | Completed |
| 2.4.4 | Add page title "Our Menu" with decorative underline                  | Completed |
| 2.4.5 | Render responsive grid of MenuCard components                        | Completed |
| 2.4.6 | Add empty state message if no products                               | Completed |
| 2.4.7 | Write page test in `src/routes/(public)/menu/page.server.spec.ts`    | Completed |
| 2.4.8 | **Commit:** `feat: create menu page with product grid`               | Completed |

### 2.5 Cookie detail page

**Status:** Completed

| ID     | Task                                                                     | Status    |
| ------ | ------------------------------------------------------------------------ | --------- |
| 2.5.1  | Create `src/routes/(public)/menu/[slug]/+page.server.ts`                 | Completed |
| 2.5.2  | Query product by slug, throw 404 if not found or inactive                | Completed |
| 2.5.3  | Create `src/routes/(public)/menu/[slug]/+page.svelte`                    | Completed |
| 2.5.4  | Display hero image (large, full-width on mobile)                         | Completed |
| 2.5.5  | Display title, price, and description                                    | Completed |
| 2.5.6  | Display ingredients list                                                 | Completed |
| 2.5.7  | Display tags                                                             | Completed |
| 2.5.8  | Add large "Add to Cart" button                                           | Completed |
| 2.5.9  | Add "Back to Menu" link                                                  | Completed |
| 2.5.10 | Style with Tailwind: two-column layout on desktop                        | Completed |
| 2.5.11 | Write page test in `src/routes/(public)/menu/[slug]/page.server.spec.ts` | Completed |
| 2.5.12 | **Commit:** `feat: create cookie detail page`                            | Completed |

### 2.6 About page

**Status:** Completed

| ID    | Task                                                      | Status    |
| ----- | --------------------------------------------------------- | --------- |
| 2.6.1 | Create `src/routes/(public)/about/+page.svelte`           | Completed |
| 2.6.2 | Port content from `_legacy/content/about.md`              | Completed |
| 2.6.3 | Style with Tailwind prose classes for readable typography | Completed |
| 2.6.4 | Add page title with decorative styling                    | Completed |
| 2.6.5 | **Commit:** `feat: create about page`                     | Completed |

### 2.7 Coming soon mode

**Status:** Completed

| ID    | Task                                                                          | Status    |
| ----- | ----------------------------------------------------------------------------- | --------- |
| 2.7.1 | Create `src/lib/components/ComingSoon.svelte`                                 | Completed |
| 2.7.2 | Add logo, title, and coming soon headline                                     | Completed |
| 2.7.3 | Add newsletter signup form                                                    | Completed |
| 2.7.4 | Add email contact link                                                        | Completed |
| 2.7.5 | Add social media links                                                        | Completed |
| 2.7.6 | Style with centered layout, gradient background                               | Completed |
| 2.7.7 | Update root layout to show ComingSoon when `comingSoonMode` is true in config | Completed |
| 2.7.8 | Write component test in `src/lib/components/ComingSoon.spec.ts` (46 tests)    | Completed |
| 2.7.9 | **Commit:** `feat: create coming soon page with toggle`                       | Completed |

---

## Phase 3: Cart System

**Status:** Completed

### 3.1 Cart store

**Status:** Completed

| ID     | Task                                                                                  | Status    |
| ------ | ------------------------------------------------------------------------------------- | --------- |
| 3.1.1  | Create `src/lib/stores/cart.svelte.ts` using Svelte 5 runes                           | Completed |
| 3.1.2  | Define CartItem type: { productId, slug, title, priceCents, stripePriceId, quantity } | Completed |
| 3.1.3  | Create `$state` for cart items array                                                  | Completed |
| 3.1.4  | Implement `addToCart(product)` function - add or increment quantity                   | Completed |
| 3.1.5  | Implement `removeFromCart(productId)` function                                        | Completed |
| 3.1.6  | Implement `updateQuantity(productId, quantity)` function                              | Completed |
| 3.1.7  | Implement `clearCart()` function                                                      | Completed |
| 3.1.8  | Create getter for `cartCount` (total items)                                           | Completed |
| 3.1.9  | Create getter for `cartTotal` (total cents)                                           | Completed |
| 3.1.10 | Create getter for `cartTotalFormatted` (e.g., "$12.50")                               | Completed |
| 3.1.11 | Add localStorage persistence with SSR safety (check `typeof window`)                  | Completed |
| 3.1.12 | Load cart from localStorage on initialization                                         | Completed |
| 3.1.13 | Save cart to localStorage on every change                                             | Completed |
| 3.1.14 | Write comprehensive unit tests in `src/lib/stores/cart.spec.ts`                       | Completed |
| 3.1.15 | **Commit:** `feat: create cart store with localStorage persistence`                   | Completed |

### 3.2 Cart badge component

**Status:** Completed

| ID    | Task                                                              | Status    |
| ----- | ----------------------------------------------------------------- | --------- |
| 3.2.1 | Create `src/lib/components/CartBadge.svelte`                      | Completed |
| 3.2.2 | Import cart store and display `cartCount`                         | Completed |
| 3.2.3 | Hide badge when count is 0                                        | Completed |
| 3.2.4 | Add pop animation when count changes                              | Completed |
| 3.2.5 | Style with Tailwind: absolute positioned, circular, primary color | Completed |
| 3.2.6 | Update Header to use CartBadge component                          | Completed |
| 3.2.7 | Write component test in `src/lib/components/CartBadge.spec.ts`    | Completed |
| 3.2.8 | **Commit:** `feat: create CartBadge component`                    | Completed |

### 3.3 Cart toast notification

**Status:** Completed

| ID     | Task                                                           | Status    |
| ------ | -------------------------------------------------------------- | --------- |
| 3.3.1  | Create `src/lib/components/CartToast.svelte`                   | Completed |
| 3.3.2  | Create toast state with `$state` for visibility and message    | Completed |
| 3.3.3  | Export `showToast(productName)` function                       | Completed |
| 3.3.4  | Auto-hide toast after 3 seconds                                | Completed |
| 3.3.5  | Add slide-in animation from right                              | Completed |
| 3.3.6  | Include "View Cart" link to /checkout                          | Completed |
| 3.3.7  | Style with Tailwind: fixed position, dark background           | Completed |
| 3.3.8  | Add CartToast to root layout                                   | Completed |
| 3.3.9  | Write component test in `src/lib/components/CartToast.spec.ts` | Completed |
| 3.3.10 | **Commit:** `feat: create CartToast notification component`    | Completed |

### 3.4 Add to cart functionality

**Status:** Completed

| ID    | Task                                                                 | Status    |
| ----- | -------------------------------------------------------------------- | --------- |
| 3.4.1 | Create `src/lib/components/AddToCartButton.svelte`                   | Completed |
| 3.4.2 | Accept product prop with required cart data                          | Completed |
| 3.4.3 | On click: add to cart store, show toast, animate button              | Completed |
| 3.4.4 | Check max quantity limit before adding                               | Completed |
| 3.4.5 | Show "Added!" state briefly after click                              | Completed |
| 3.4.6 | Update MenuCard to use AddToCartButton                               | Completed |
| 3.4.7 | Update cookie detail page to use AddToCartButton                     | Completed |
| 3.4.8 | Write component test in `src/lib/components/AddToCartButton.spec.ts` | Completed |
| 3.4.9 | **Commit:** `feat: wire up Add to Cart functionality`                | Completed |

### 3.5 Checkout page - Cart display

**Status:** Completed

| ID     | Task                                                                      | Status    |
| ------ | ------------------------------------------------------------------------- | --------- |
| 3.5.1  | Create `src/routes/(public)/checkout/+page.svelte`                        | Completed |
| 3.5.2  | Add empty cart state with cookie icon and "Browse Menu" link              | Completed |
| 3.5.3  | Create cart items list with product name, price, quantity                 | Completed |
| 3.5.4  | Add quantity controls (+/- buttons) for each item                         | Completed |
| 3.5.5  | Add remove button (trash icon) for each item                              | Completed |
| 3.5.6  | Display subtotal                                                          | Completed |
| 3.5.7  | Add "Continue Shopping" link                                              | Completed |
| 3.5.8  | Style with Tailwind: table-like layout on desktop, card layout on mobile  | Completed |
| 3.5.9  | Write page test in `src/routes/(public)/checkout/page.spec.ts` (47 tests) | Completed |
| 3.5.10 | **Commit:** `feat: create checkout page with cart display`                | Completed |

### 3.6 Checkout page - Customer form

**Status:** Completed

| ID     | Task                                                                                                | Status    |
| ------ | --------------------------------------------------------------------------------------------------- | --------- |
| 3.6.1  | Add "Your Information" section header                                                               | Completed |
| 3.6.2  | Create form with fields: first_name, last_name, email, phone                                        | Completed |
| 3.6.3  | Add required field validation with error messages                                                   | Completed |
| 3.6.4  | Add email format validation                                                                         | Completed |
| 3.6.5  | Add phone format validation with auto-formatting                                                    | Completed |
| 3.6.6  | Create fulfillment type toggle (Pickup / Delivery buttons)                                          | Completed |
| 3.6.7  | Show/hide delivery address fields based on fulfillment type                                         | Completed |
| 3.6.8  | Add delivery address fields: street, apt, city, state, zip                                          | Completed |
| 3.6.9  | Add ZIP code validation against allowed list                                                        | Completed |
| 3.6.10 | Show ZIP error message for invalid ZIP codes (inline, not modal)                                    | Completed |
| 3.6.11 | Style form fields with Tailwind: focus states, error states                                         | Completed |
| 3.6.12 | Write form validation tests in `src/routes/(public)/checkout/page.spec.ts` (48 new tests, 95 total) | Completed |
| 3.6.13 | **Commit:** `feat: add customer form to checkout`                                                   | Completed |

### 3.7 Checkout page - Slots selection

**Status:** Completed

| ID     | Task                                                              | Status    |
| ------ | ----------------------------------------------------------------- | --------- |
| 3.7.1  | Create `src/routes/(public)/checkout/+page.server.ts`             | Completed |
| 3.7.2  | Load available fulfillment slots from D1 (active, future dates)   | Completed |
| 3.7.3  | Load daily capacity data to determine remaining capacity          | Completed |
| 3.7.4  | Create "Select a Time" section                                    | Completed |
| 3.7.5  | Group slots by date with date headers                             | Completed |
| 3.7.6  | Display time slots as radio buttons                               | Completed |
| 3.7.7  | Show slot type badge (pickup/delivery)                            | Completed |
| 3.7.8  | Disable sold-out slots and show "Sold Out" message                | Completed |
| 3.7.9  | Filter slots based on selected fulfillment type                   | Completed |
| 3.7.10 | Store selected slot in form state                                 | Completed |
| 3.7.11 | Add empty state when no slots available for fulfillment type      | Completed |
| 3.7.12 | Show low stock warning when remaining capacity <= 20              | Completed |
| 3.7.13 | Write tests in `src/routes/(public)/checkout/page.server.spec.ts` | Completed |
| 3.7.14 | **Commit:** `feat: add fulfillment slot selection`                | Completed |

### 3.8 Checkout page - Extras (tip, gift box)

**Status:** Completed

| ID     | Task                                                             | Status    |
| ------ | ---------------------------------------------------------------- | --------- |
| 3.8.1  | Add tip section with dollar input field                          | Completed |
| 3.8.2  | Add tip percentage preset buttons (5%, 10%, 20%)                 | Completed |
| 3.8.3  | Calculate tip amount from percentage of subtotal                 | Completed |
| 3.8.4  | Add gift box checkbox with price display                         | Completed |
| 3.8.5  | Show gift message textarea when gift box is checked              | Completed |
| 3.8.6  | Add character counter for gift message (max 200)                 | Completed |
| 3.8.7  | Update cart summary to show: subtotal, tip, gift box, tax, total | Completed |
| 3.8.8  | Calculate tax based on config rate                               | Completed |
| 3.8.9  | Update total in real-time as options change                      | Completed |
| 3.8.10 | Write tests in `src/routes/(public)/checkout/page.spec.ts`       | Completed |
| 3.8.11 | **Commit:** `feat: add tip and gift box options`                 | Completed |

### 3.9 Checkout page - Submit

**Status:** Completed

| ID    | Task                                                      | Status    |
| ----- | --------------------------------------------------------- | --------- |
| 3.9.1 | Add "Place Order" submit button                           | Completed |
| 3.9.2 | Validate all required fields on submit                    | Completed |
| 3.9.3 | Validate slot is selected                                 | Completed |
| 3.9.4 | Show loading state on button during submission            | Completed |
| 3.9.5 | Disable form during submission                            | Completed |
| 3.9.6 | Handle max quantity exceeded modal                        | Completed |
| 3.9.7 | Style button: full width, primary color, disabled state   | Completed |
| 3.9.8 | Write tests for submit functionality (72 tests)           | Completed |
| 3.9.9 | **Commit:** `feat: add checkout form submission handling` | Completed |

---

## Phase 4: API Routes & Stripe

**Status:** Completed

### 4.1 Stripe checkout endpoint

**Status:** Completed

| ID     | Task                                                                       | Status    |
| ------ | -------------------------------------------------------------------------- | --------- |
| 4.1.1  | Install Stripe SDK: `bun add stripe`                                       | Completed |
| 4.1.2  | Create `src/lib/server/stripe.ts` with Stripe client initialization        | Completed |
| 4.1.3  | Create `src/routes/api/checkout/+server.ts` POST handler                   | Completed |
| 4.1.4  | Define request body type with Zod or manual validation                     | Completed |
| 4.1.5  | Validate cart items: check products exist in DB and are active             | Completed |
| 4.1.6  | Validate prices match database (prevent price manipulation)                | Completed |
| 4.1.7  | Build Stripe line_items array with stripe_price_id from DB                 | Completed |
| 4.1.8  | Add tip as separate line item if present                                   | Completed |
| 4.1.9  | Add gift box as separate line item if present                              | Completed |
| 4.1.10 | Create Stripe checkout session with metadata (customer info, slot, etc.)   | Completed |
| 4.1.11 | Set success_url to `/checkout/success?session_id={CHECKOUT_SESSION_ID}`    | Completed |
| 4.1.12 | Set cancel_url to `/checkout`                                              | Completed |
| 4.1.13 | Return session URL for frontend redirect                                   | Completed |
| 4.1.14 | Add CORS headers for allowed origins                                       | Completed |
| 4.1.15 | Write unit tests for validation logic in `tests/unit/checkout-api.test.ts` | Completed |
| 4.1.16 | **Commit:** `feat: create Stripe checkout API endpoint`                    | Completed |

### 4.2 Connect checkout form to API

**Status:** Completed

| ID    | Task                                                      | Status    |
| ----- | --------------------------------------------------------- | --------- |
| 4.2.1 | Update checkout page to POST to `/api/checkout` on submit | Completed |
| 4.2.2 | Build request payload from cart + form data               | Completed |
| 4.2.3 | Handle API response and redirect to Stripe                | Completed |
| 4.2.4 | Handle API errors and display error message               | Completed |
| 4.2.5 | Add try/catch with user-friendly error handling           | Completed |
| 4.2.6 | **Commit:** `feat: connect checkout form to Stripe API`   | Completed |

### 4.3 Stripe webhook endpoint

**Status:** Completed

| ID     | Task                                                                                | Status    |
| ------ | ----------------------------------------------------------------------------------- | --------- |
| 4.3.1  | Create `src/routes/api/webhook/+server.ts` POST handler                             | Completed |
| 4.3.2  | Get raw body from request for signature verification                                | Completed |
| 4.3.3  | Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET                         | Completed |
| 4.3.4  | Return 400 if signature verification fails                                          | Completed |
| 4.3.5  | Handle `checkout.session.completed` event type                                      | Completed |
| 4.3.6  | Extract order data from session metadata                                            | Completed |
| 4.3.7  | Parse line items from session                                                       | Completed |
| 4.3.8  | Insert order record into D1 `orders` table                                          | Completed |
| 4.3.9  | Update `dailyCapacity` table: increment cookies_ordered for date                    | Completed |
| 4.3.10 | Return 200 OK on successful processing                                              | Completed |
| 4.3.11 | Log errors but still return 200 to prevent Stripe retries on non-recoverable errors | Completed |
| 4.3.12 | Write unit tests for webhook processing in `src/routes/api/webhook/server.spec.ts`  | Completed |
| 4.3.13 | **Commit:** `feat: create Stripe webhook handler`                                   | Completed |

### 4.4 Checkout success page

**Status:** Completed

| ID     | Task                                                                                     | Status    |
| ------ | ---------------------------------------------------------------------------------------- | --------- |
| 4.4.1  | Create `src/routes/(public)/checkout/success/+page.server.ts`                            | Completed |
| 4.4.2  | Get session_id from URL query params                                                     | Completed |
| 4.4.3  | Retrieve session from Stripe to verify it's valid                                        | Completed |
| 4.4.4  | Load order from D1 by stripe_session_id                                                  | Completed |
| 4.4.5  | Return 404 if order not found                                                            | Completed |
| 4.4.6  | Create `src/routes/(public)/checkout/success/+page.svelte`                               | Completed |
| 4.4.7  | Display success icon and "Order Confirmed!" heading                                      | Completed |
| 4.4.8  | Display order summary: items, quantities, total                                          | Completed |
| 4.4.9  | Display fulfillment details: date, time, type                                            | Completed |
| 4.4.10 | Display customer info confirmation                                                       | Completed |
| 4.4.11 | Clear cart from localStorage on page load                                                | Completed |
| 4.4.12 | Add "Back to Home" button                                                                | Completed |
| 4.4.13 | Write page test in `src/routes/(public)/checkout/success/page.server.spec.ts` (27 tests) | Completed |
| 4.4.14 | **Commit:** `feat: create checkout success page`                                         | Completed |

### 4.5 Newsletter signup endpoint

**Status:** Completed

| ID     | Task                                                                      | Status    |
| ------ | ------------------------------------------------------------------------- | --------- |
| 4.5.1  | Create `src/routes/api/newsletter/+server.ts` POST handler                | Completed |
| 4.5.2  | Validate email format with regex                                          | Completed |
| 4.5.3  | Check if email already exists in newsletter table                         | Completed |
| 4.5.4  | If exists, return success with "Already subscribed" message               | Completed |
| 4.5.5  | Insert new email into newsletter table                                    | Completed |
| 4.5.6  | Return success response with thank you message                            | Completed |
| 4.5.7  | Handle database errors gracefully                                         | Completed |
| 4.5.8  | Add rate limiting consideration (future TODO)                             | Deferred  |
| 4.5.9  | Write unit tests in `src/routes/api/newsletter/server.spec.ts` (54 tests) | Completed |
| 4.5.10 | **Commit:** `feat: create newsletter signup API`                          | Completed |

### 4.6 Connect newsletter form

**Status:** Completed

| ID    | Task                                                     | Status    |
| ----- | -------------------------------------------------------- | --------- |
| 4.6.1 | Update ComingSoon component to POST to `/api/newsletter` | Completed |
| 4.6.2 | Add loading state to submit button                       | Completed |
| 4.6.3 | Display success/error message below form                 | Completed |
| 4.6.4 | Clear input on success                                   | Completed |
| 4.6.5 | **Commit:** `feat: connect newsletter form to API`       | Completed |

---

## Phase 5: Image Upload (R2)

**Status:** Not Started

### 5.1 R2 upload endpoint

**Status:** Not Started

| ID     | Task                                                             | Status      |
| ------ | ---------------------------------------------------------------- | ----------- |
| 5.1.1  | Create `src/routes/api/upload/+server.ts` POST handler           | Not Started |
| 5.1.2  | Require admin authentication (check session cookie)              | Not Started |
| 5.1.3  | Parse multipart form data to get file                            | Not Started |
| 5.1.4  | Validate file type: only allow image/jpeg, image/png, image/webp | Not Started |
| 5.1.5  | Validate file size: max 5MB                                      | Not Started |
| 5.1.6  | Generate unique filename: `{timestamp}-{random}.{ext}`           | Not Started |
| 5.1.7  | Upload file to R2 bucket using platform.env.IMAGES               | Not Started |
| 5.1.8  | Return public URL for uploaded image                             | Not Started |
| 5.1.9  | Handle upload errors with appropriate status codes               | Not Started |
| 5.1.10 | Write unit tests in `tests/unit/upload-api.test.ts`              | Not Started |
| 5.1.11 | **Commit:** `feat: create R2 image upload endpoint`              | Not Started |

### 5.2 Image serving configuration

**Status:** Not Started

| ID    | Task                                                                           | Status      |
| ----- | ------------------------------------------------------------------------------ | ----------- |
| 5.2.1 | Configure R2 bucket for public access via custom domain or Cloudflare settings | Not Started |
| 5.2.2 | OR create `src/routes/images/[...path]/+server.ts` to serve images             | Not Started |
| 5.2.3 | Add caching headers for images (Cache-Control: public, max-age=31536000)       | Not Started |
| 5.2.4 | Document image URL format for frontend use                                     | Not Started |
| 5.2.5 | **Commit:** `feat: configure R2 image serving`                                 | Not Started |

### 5.3 Migrate legacy images to R2

**Status:** Not Started

| ID    | Task                                                | Status      |
| ----- | --------------------------------------------------- | ----------- |
| 5.3.1 | Create migration script `scripts/migrate-images.ts` | Not Started |
| 5.3.2 | Read all image files from `_legacy/static/`         | Not Started |
| 5.3.3 | Upload each image to R2 bucket                      | Not Started |
| 5.3.4 | Create mapping of old filename to new R2 URL        | Not Started |
| 5.3.5 | Update products in D1 with new image URLs           | Not Started |
| 5.3.6 | **Commit:** `feat: migrate legacy images to R2`     | Not Started |

---

## Phase 6: Admin Dashboard

**Status:** Completed

### 6.1 Admin authentication

**Status:** Completed

| ID    | Task                                                                             | Status    |
| ----- | -------------------------------------------------------------------------------- | --------- |
| 6.1.1 | Create `src/lib/server/auth.ts`                                                  | Completed |
| 6.1.2 | Implement `verifyPassword(password)` - compare with ADMIN_PASSWORD env var       | Completed |
| 6.1.3 | Implement `createSession()` - generate random ID, store in adminSessions table   | Completed |
| 6.1.4 | Implement `validateSession(sessionId)` - check if session exists and not expired | Completed |
| 6.1.5 | Implement `deleteSession(sessionId)` - remove session on logout                  | Completed |
| 6.1.6 | Set session expiration to 7 days                                                 | Completed |
| 6.1.7 | Write unit tests in `src/lib/server/auth.spec.ts` (66 tests)                     | Completed |
| 6.1.8 | **Commit:** `feat: add admin authentication helpers`                             | Completed |

### 6.2 Admin login page

**Status:** Completed

| ID     | Task                                                                     | Status    |
| ------ | ------------------------------------------------------------------------ | --------- |
| 6.2.1  | Create `src/routes/admin/login/+page.svelte`                             | Completed |
| 6.2.2  | Add password input field                                                 | Completed |
| 6.2.3  | Add "Login" submit button                                                | Completed |
| 6.2.4  | Create `src/routes/admin/login/+page.server.ts` with form action         | Completed |
| 6.2.5  | On submit: verify password, create session, set cookie                   | Completed |
| 6.2.6  | Set cookie: `admin_session`, httpOnly, secure, sameSite=lax, path=/admin | Completed |
| 6.2.7  | Redirect to /admin on success                                            | Completed |
| 6.2.8  | Show error message on invalid password                                   | Completed |
| 6.2.9  | Style with centered card layout                                          | Completed |
| 6.2.10 | Write page test in `src/routes/admin/login/page.server.spec.ts`          | Completed |
| 6.2.11 | **Commit:** `feat: create admin login page`                              | Completed |

### 6.3 Admin auth guard

**Status:** Completed

| ID    | Task                                                         | Status    |
| ----- | ------------------------------------------------------------ | --------- |
| 6.3.1 | Create `src/routes/admin/+layout.server.ts`                  | Completed |
| 6.3.2 | Get `admin_session` cookie from request                      | Completed |
| 6.3.3 | Validate session using auth helper                           | Completed |
| 6.3.4 | If invalid or missing, redirect to `/admin/login`            | Completed |
| 6.3.5 | If valid, continue to requested page                         | Completed |
| 6.3.6 | Exclude `/admin/login` from auth check                       | Completed |
| 6.3.7 | Write unit tests in `src/routes/admin/layout.server.spec.ts` | Completed |
| 6.3.8 | **Commit:** `feat: add admin authentication guard`           | Completed |

### 6.4 Admin layout

**Status:** Completed

| ID    | Task                                                                              | Status    |
| ----- | --------------------------------------------------------------------------------- | --------- |
| 6.4.1 | Create `src/routes/admin/+layout.svelte`                                          | Completed |
| 6.4.2 | Add sidebar navigation with links: Dashboard, Orders, Products, Slots, Newsletter | Completed |
| 6.4.3 | Highlight current page in sidebar                                                 | Completed |
| 6.4.4 | Add site title/logo at top of sidebar                                             | Completed |
| 6.4.5 | Add logout button at bottom of sidebar                                            | Completed |
| 6.4.6 | Create main content area with slot                                                | Completed |
| 6.4.7 | Make layout responsive: sidebar collapses to top nav on mobile                    | Completed |
| 6.4.8 | Style with Tailwind: dark sidebar, light content area                             | Completed |
| 6.4.9 | **Commit:** `feat: create admin layout with sidebar`                              | Completed |

### 6.5 Admin logout

**Status:** Completed

| ID    | Task                                               | Status    |
| ----- | -------------------------------------------------- | --------- |
| 6.5.1 | Create `src/routes/admin/logout/+page.server.ts`   | Completed |
| 6.5.2 | Delete session from database                       | Completed |
| 6.5.3 | Clear admin_session cookie                         | Completed |
| 6.5.4 | Redirect to `/admin/login`                         | Completed |
| 6.5.5 | **Commit:** `feat: add admin logout functionality` | Completed |

### 6.6 Admin dashboard

**Status:** Completed

| ID     | Task                                                                | Status    |
| ------ | ------------------------------------------------------------------- | --------- |
| 6.6.1  | Create `src/routes/admin/+page.server.ts`                           | Completed |
| 6.6.2  | Query today's orders count and total revenue                        | Completed |
| 6.6.3  | Query orders for today grouped by product for "cookies needed"      | Deferred  |
| 6.6.4  | Query pending orders count                                          | Completed |
| 6.6.5  | Query this week's revenue                                           | Deferred  |
| 6.6.6  | Load 5 most recent orders                                           | Completed |
| 6.6.7  | Create `src/routes/admin/+page.svelte`                              | Completed |
| 6.6.8  | Display stat cards: Today's Orders, Today's Revenue, Pending Orders | Completed |
| 6.6.9  | Display "Cookies Needed Today" breakdown by product                 | Deferred  |
| 6.6.10 | Display recent orders list with status badges                       | Completed |
| 6.6.11 | Add quick links to common actions                                   | Completed |
| 6.6.12 | Style with Tailwind: card grid, clean typography                    | Completed |
| 6.6.13 | Write page test in `src/routes/admin/page.server.spec.ts`           | Completed |
| 6.6.14 | **Commit:** `feat: implement admin dashboard with real data`        | Completed |

### 6.7 Orders list page

**Status:** Completed

| ID     | Task                                                                       | Status      |
| ------ | -------------------------------------------------------------------------- | ----------- |
| 6.7.1  | Create `src/routes/admin/orders/+page.server.ts`                           | Completed   |
| 6.7.2  | Accept query params: date filter, status filter                            | Completed   |
| 6.7.3  | Query orders with filters, ordered by created_at DESC                      | Completed   |
| 6.7.4  | Create `src/routes/admin/orders/+page.svelte`                              | Completed   |
| 6.7.5  | Add date picker filter (default to today)                                  | Completed   |
| 6.7.6  | Add status filter dropdown (all, pending, paid, fulfilled)                 | Completed   |
| 6.7.7  | Display orders table: ID, Customer, Items, Total, Status, Date             | Completed   |
| 6.7.8  | Add status badges with colors (pending=yellow, paid=blue, fulfilled=green) | Completed   |
| 6.7.9  | Make rows clickable to go to order detail                                  | Completed   |
| 6.7.10 | Add pagination if >20 orders                                               | Deferred    |
| 6.7.11 | Show empty state when no orders match filters                              | Completed   |
| 6.7.12 | Write page test in `src/routes/admin/orders/page.server.spec.ts`           | Completed   |
| 6.7.13 | **Commit:** `feat: create orders list page`                                | Not Started |

### 6.8 Order detail page

**Status:** Completed

| ID     | Task                                                                  | Status    |
| ------ | --------------------------------------------------------------------- | --------- |
| 6.8.1  | Create `src/routes/admin/orders/[id]/+page.server.ts`                 | Completed |
| 6.8.2  | Load order by ID, return 404 if not found                             | Completed |
| 6.8.3  | Create `src/routes/admin/orders/[id]/+page.svelte`                    | Completed |
| 6.8.4  | Display order status with large badge                                 | Completed |
| 6.8.5  | Display customer info section: name, email, phone                     | Completed |
| 6.8.6  | Display fulfillment info: type, date, time, address (if delivery)     | Completed |
| 6.8.7  | Display order items with quantities and prices                        | Completed |
| 6.8.8  | Display order totals: subtotal, tip, gift box, tax, total             | Completed |
| 6.8.9  | Display gift message if present                                       | Completed |
| 6.8.10 | Add "Mark as Fulfilled" button (if status is "paid")                  | Completed |
| 6.8.11 | Create form action to update order status                             | Completed |
| 6.8.12 | Add "Back to Orders" link                                             | Completed |
| 6.8.13 | Write page test in `src/routes/admin/orders/[id]/page.server.spec.ts` | Completed |
| 6.8.14 | **Commit:** `feat: create order detail page with status update`       | Completed |

### 6.9 Products list page

**Status:** Completed

| ID     | Task                                                                          | Status    |
| ------ | ----------------------------------------------------------------------------- | --------- |
| 6.9.1  | Create `src/routes/admin/products/+page.server.ts`                            | Completed |
| 6.9.2  | Load all products ordered by sort_order                                       | Completed |
| 6.9.3  | Create `src/routes/admin/products/+page.svelte`                               | Completed |
| 6.9.4  | Add "Add Product" button linking to /admin/products/new                       | Completed |
| 6.9.5  | Display products table: Image thumbnail, Title, Price, Active toggle, Actions | Completed |
| 6.9.6  | Add inline toggle for active/inactive status                                  | Completed |
| 6.9.7  | Create form action to toggle product active status                            | Completed |
| 6.9.8  | Add Edit button for each product                                              | Completed |
| 6.9.9  | Show featured badge if product is featured                                    | Completed |
| 6.9.10 | Support drag-and-drop reordering (future enhancement)                         | Deferred  |
| 6.9.11 | Write page test in `src/routes/admin/products/page.server.spec.ts`            | Completed |
| 6.9.12 | **Commit:** `feat: create products list page`                                 | Completed |

### 6.10 Product create page

**Status:** Completed (except image upload - deferred to Phase 5.1)

| ID      | Task                                                                                  | Status    |
| ------- | ------------------------------------------------------------------------------------- | --------- |
| 6.10.1  | Create `src/routes/admin/products/new/+page.svelte`                                   | Completed |
| 6.10.2  | Create product form with fields: title, slug (auto-generated), price, stripe_price_id | Completed |
| 6.10.3  | Add description textarea                                                              | Completed |
| 6.10.4  | Add ingredients textarea                                                              | Completed |
| 6.10.5  | Add tags input (comma-separated or tag chips)                                         | Completed |
| 6.10.6  | Add featured checkbox                                                                 | Completed |
| 6.10.7  | Add active checkbox (default true)                                                    | Completed |
| 6.10.8  | Add sort_order number input                                                           | Completed |
| 6.10.9  | Create image upload component with drag-and-drop                                      | Deferred  |
| 6.10.10 | Upload image to R2 via /api/upload                                                    | Deferred  |
| 6.10.11 | Display uploaded image preview                                                        | Deferred  |
| 6.10.12 | Allow selecting from previously uploaded images                                       | Deferred  |
| 6.10.13 | Add separate hero image upload                                                        | Deferred  |
| 6.10.14 | Create `+page.server.ts` with form action to insert product                           | Completed |
| 6.10.15 | Validate required fields                                                              | Completed |
| 6.10.16 | Generate slug from title if not provided                                              | Completed |
| 6.10.17 | Redirect to /admin/products on success                                                | Completed |
| 6.10.18 | Write page test in `page.server.spec.ts` (12 tests)                                   | Completed |
| 6.10.19 | **Commit:** `feat: create product create page with form and validation`               | Completed |

### 6.11 Product edit page

**Status:** Completed

| ID      | Task                                                                    | Status    |
| ------- | ----------------------------------------------------------------------- | --------- |
| 6.11.1  | Create `src/routes/admin/products/[id]/+page.server.ts`                 | Completed |
| 6.11.2  | Load product by ID, return 404 if not found                             | Completed |
| 6.11.3  | Create `src/routes/admin/products/[id]/+page.svelte`                    | Completed |
| 6.11.4  | Reuse product form component from create page                           | Completed |
| 6.11.5  | Pre-populate form with existing product data                            | Completed |
| 6.11.6  | Show current images with option to replace                              | Deferred  |
| 6.11.7  | Create form action to update product                                    | Completed |
| 6.11.8  | Add "Delete Product" button with confirmation modal                     | Completed |
| 6.11.9  | Create form action to delete product                                    | Completed |
| 6.11.10 | Redirect to /admin/products on success                                  | Completed |
| 6.11.11 | Write page test in `src/routes/admin/products/[id]/page.server.spec.ts` | Completed |
| 6.11.12 | **Commit:** `feat: create product edit page with delete`                | Completed |

### 6.12 Fulfillment slots page

**Status:** Completed

| ID      | Task                                                                                       | Status    |
| ------- | ------------------------------------------------------------------------------------------ | --------- |
| 6.12.1  | Create `src/routes/admin/slots/+page.server.ts`                                            | Completed |
| 6.12.2  | Load all slots ordered by date, start_time                                                 | Completed |
| 6.12.3  | Load daily capacity data for slots                                                         | Completed |
| 6.12.4  | Create `src/routes/admin/slots/+page.svelte`                                               | Completed |
| 6.12.5  | Display slots grouped by date                                                              | Completed |
| 6.12.6  | Show for each slot: time range, type, capacity used/max, active toggle                     | Completed |
| 6.12.7  | Add form to create new slot: date picker, start time, end time, type dropdown, max cookies | Completed |
| 6.12.8  | Create form action to insert new slot                                                      | Completed |
| 6.12.9  | Add inline active toggle with form action                                                  | Completed |
| 6.12.10 | Add delete button for each slot                                                            | Completed |
| 6.12.11 | Create form action to delete slot                                                          | Completed |
| 6.12.12 | Write page test in `src/routes/admin/slots/page.server.spec.ts` (21 tests)                 | Completed |
| 6.12.13 | **Commit:** `feat: create fulfillment slots management`                                    | Completed |

### 6.13 Newsletter subscribers page

**Status:** Completed

| ID      | Task                                                                 | Status      |
| ------- | -------------------------------------------------------------------- | ----------- |
| 6.13.1  | Create `src/routes/admin/newsletter/+page.server.ts`                 | Completed   |
| 6.13.2  | Load all newsletter subscribers ordered by subscribed_at DESC        | Completed   |
| 6.13.3  | Create `src/routes/admin/newsletter/+page.svelte`                    | Completed   |
| 6.13.4  | Display subscribers table: Email, Source, Subscribed Date            | Completed   |
| 6.13.5  | Add total subscriber count                                           | Completed   |
| 6.13.6  | Add "Export to CSV" button                                           | Completed   |
| 6.13.7  | Create form action to generate CSV                                   | Completed   |
| 6.13.8  | Trigger CSV download on click                                        | Completed   |
| 6.13.9  | Write page test in `src/routes/admin/newsletter/page.server.spec.ts` | Completed   |
| 6.13.10 | **Commit:** `feat: create newsletter subscribers page`               | Not Started |

---

## Phase 7: Data Migration & Deployment

**Status:** Not Started

### 7.1 Seed products from legacy

**Status:** Not Started

| ID    | Task                                                                                   | Status      |
| ----- | -------------------------------------------------------------------------------------- | ----------- |
| 7.1.1 | Create `drizzle/seed.ts` script                                                        | Not Started |
| 7.1.2 | Read `_legacy/content/menu/*.md` files                                                 | Not Started |
| 7.1.3 | Parse TOML frontmatter from each file                                                  | Not Started |
| 7.1.4 | Extract: title, price_cents, stripe_price_id, description, ingredients, tags, featured | Not Started |
| 7.1.5 | Generate slug from filename                                                            | Not Started |
| 7.1.6 | Map image paths to R2 URLs (after image migration)                                     | Not Started |
| 7.1.7 | Insert products into D1 using Drizzle                                                  | Not Started |
| 7.1.8 | Add npm script: `"db:seed": "tsx drizzle/seed.ts"`                                     | Not Started |
| 7.1.9 | **Commit:** `feat: create product seed script from legacy data`                        | Not Started |

### 7.2 Create initial fulfillment slots

**Status:** Not Started

| ID    | Task                                                      | Status      |
| ----- | --------------------------------------------------------- | ----------- |
| 7.2.1 | Add slot seeding to `drizzle/seed.ts`                     | Not Started |
| 7.2.2 | Create sample slots for next 2 weeks                      | Not Started |
| 7.2.3 | Include variety of pickup and delivery slots              | Not Started |
| 7.2.4 | **Commit:** `feat: add initial fulfillment slots to seed` | Not Started |

### 7.3 Configure Cloudflare Pages

**Status:** Not Started

| ID     | Task                                                                               | Status      |
| ------ | ---------------------------------------------------------------------------------- | ----------- |
| 7.3.1  | Create Cloudflare Pages project in dashboard                                       | Not Started |
| 7.3.2  | Connect to GitHub repository                                                       | Not Started |
| 7.3.3  | Set production branch to `main`                                                    | Not Started |
| 7.3.4  | Set preview branch to `refactor`                                                   | Not Started |
| 7.3.5  | Configure build settings: command=`bun run build`, output=`.svelte-kit/cloudflare` | Not Started |
| 7.3.6  | Add D1 database binding: variable name `DB`                                        | Not Started |
| 7.3.7  | Add R2 bucket binding: variable name `IMAGES`                                      | Not Started |
| 7.3.8  | Set preview alias to `preview.cookie-isle.pages.dev`                               | Not Started |
| 7.3.9  | Document deployment configuration in README                                        | Not Started |
| 7.3.10 | **Commit:** `docs: add Cloudflare Pages deployment configuration`                  | Not Started |

### 7.4 Set environment variables

**Status:** Not Started

| ID    | Task                                                                  | Status      |
| ----- | --------------------------------------------------------------------- | ----------- |
| 7.4.1 | Add `STRIPE_SECRET_KEY` to Cloudflare Pages environment variables     | Not Started |
| 7.4.2 | Add `STRIPE_WEBHOOK_SECRET` to Cloudflare Pages environment variables | Not Started |
| 7.4.3 | Add `ADMIN_PASSWORD` to Cloudflare Pages environment variables        | Not Started |
| 7.4.4 | Create `.dev.vars` file locally with same variables (gitignored)      | Not Started |
| 7.4.5 | Document all required environment variables in README                 | Not Started |
| 7.4.6 | **Commit:** `docs: document environment variables`                    | Not Started |

### 7.5 Update Stripe webhook

**Status:** Not Started

| ID    | Task                                                                                   | Status      |
| ----- | -------------------------------------------------------------------------------------- | ----------- |
| 7.5.1 | Go to Stripe Dashboard > Webhooks                                                      | Not Started |
| 7.5.2 | Add new webhook endpoint: `https://thecookieisle.com/api/webhook`                      | Not Started |
| 7.5.3 | Select events: `checkout.session.completed`                                            | Not Started |
| 7.5.4 | Copy webhook signing secret to STRIPE_WEBHOOK_SECRET                                   | Not Started |
| 7.5.5 | Test webhook using Stripe CLI: `stripe listen --forward-to localhost:5173/api/webhook` | Not Started |
| 7.5.6 | Verify test order creates record in D1                                                 | Not Started |
| 7.5.7 | **Commit:** `docs: Stripe webhook configuration`                                       | Not Started |

### 7.6 End-to-end testing

**Status:** Not Started

| ID     | Task                                                    | Status      |
| ------ | ------------------------------------------------------- | ----------- |
| 7.6.1  | Test full checkout flow on preview URL                  | Not Started |
| 7.6.2  | Verify order appears in admin dashboard                 | Not Started |
| 7.6.3  | Test marking order as fulfilled                         | Not Started |
| 7.6.4  | Test adding new product via admin                       | Not Started |
| 7.6.5  | Test image upload to R2                                 | Not Started |
| 7.6.6  | Test newsletter signup                                  | Not Started |
| 7.6.7  | Test mobile responsiveness on real device               | Not Started |
| 7.6.8  | Test slot selection and capacity tracking               | Not Started |
| 7.6.9  | Document any bugs found and create fix TODOs            | Not Started |
| 7.6.10 | **Commit:** `test: verify all features work on preview` | Not Started |

### 7.7 Production deployment

**Status:** Not Started

| ID    | Task                                                | Status      |
| ----- | --------------------------------------------------- | ----------- |
| 7.7.1 | Merge `refactor` branch to `main`                   | Not Started |
| 7.7.2 | Verify Cloudflare Pages builds and deploys          | Not Started |
| 7.7.3 | Run database migrations on production D1            | Not Started |
| 7.7.4 | Run seed script on production D1                    | Not Started |
| 7.7.5 | Verify custom domain (thecookieisle.com) is working | Not Started |
| 7.7.6 | Verify SSL certificate is valid                     | Not Started |
| 7.7.7 | Test production checkout with real Stripe keys      | Not Started |
| 7.7.8 | Monitor for errors in Cloudflare dashboard          | Not Started |
| 7.7.9 | **Commit:** `docs: production deployment complete`  | Not Started |

---

## Phase 8: Cleanup

**Status:** Not Started

### 8.1 Remove legacy services

**Status:** Not Started

| ID    | Task                                                                   | Status      |
| ----- | ---------------------------------------------------------------------- | ----------- |
| 8.1.1 | Delete Cloudflare Worker: stripe-checkout                              | Not Started |
| 8.1.2 | Delete Cloudflare Worker: newsletter-signup                            | Not Started |
| 8.1.3 | Delete Cloudflare Worker: calendar-slots                               | Not Started |
| 8.1.4 | Archive Google Apps Script for orders (don't delete, keep for records) | Not Started |
| 8.1.5 | Archive Google Apps Script for newsletter                              | Not Started |
| 8.1.6 | Keep Google Sheets as historical backup                                | Not Started |
| 8.1.7 | Document what was removed and why                                      | Not Started |
| 8.1.8 | **Commit:** `docs: document legacy service cleanup`                    | Not Started |

### 8.2 Update documentation

**Status:** Not Started

| ID    | Task                                                                         | Status      |
| ----- | ---------------------------------------------------------------------------- | ----------- |
| 8.2.1 | Update root README.md with new project overview                              | Not Started |
| 8.2.2 | Document local development setup                                             | Not Started |
| 8.2.3 | Document deployment process                                                  | Not Started |
| 8.2.4 | Create admin user guide for non-developer (how to add products, view orders) | Not Started |
| 8.2.5 | Remove or archive legacy README content                                      | Not Started |
| 8.2.6 | **Commit:** `docs: update README for SvelteKit version`                      | Not Started |

### 8.3 Optional: Remove \_legacy folder

**Status:** Not Started

| ID    | Task                                                | Status      |
| ----- | --------------------------------------------------- | ----------- |
| 8.3.1 | After confirming all data migrated successfully     | Not Started |
| 8.3.2 | After 30 days of stable production                  | Not Started |
| 8.3.3 | Create git tag for last commit with \_legacy folder | Not Started |
| 8.3.4 | Delete \_legacy folder                              | Not Started |
| 8.3.5 | **Commit:** `chore: remove archived legacy project` | Not Started |

---

## Appendix A: Database Schema

```typescript
// drizzle/schema.ts
import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Type definitions for JSON columns
export interface OrderItem {
	productId: number;
	slug: string;
	title: string;
	priceCents: number;
	quantity: number;
}

export interface DeliveryAddress {
	street: string;
	apt?: string;
	city: string;
	state: string;
	zip: string;
}

// Products table
export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	priceCents: integer('price_cents').notNull(),
	stripePriceId: text('stripe_price_id').notNull(),
	description: text('description'),
	ingredients: text('ingredients'),
	imageUrl: text('image_url'),
	heroImageUrl: text('hero_image_url'),
	tags: text('tags', { mode: 'json' }).$type<string[]>(),
	featured: integer('featured', { mode: 'boolean' }).default(false),
	active: integer('active', { mode: 'boolean' }).default(true),
	sortOrder: integer('sort_order').default(0),
	createdAt: text('created_at').default(sql`(datetime('now'))`),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`)
});

// Orders table
export const orders = sqliteTable('orders', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	stripeSessionId: text('stripe_session_id').unique(),
	status: text('status').default('pending'), // pending, paid, fulfilled, cancelled
	customerName: text('customer_name'),
	customerEmail: text('customer_email'),
	customerPhone: text('customer_phone'),
	fulfillmentType: text('fulfillment_type'), // pickup, delivery
	fulfillmentDate: text('fulfillment_date'),
	fulfillmentTime: text('fulfillment_time'),
	deliveryAddress: text('delivery_address', { mode: 'json' }).$type<DeliveryAddress | null>(),
	items: text('items', { mode: 'json' }).notNull().$type<OrderItem[]>(),
	subtotalCents: integer('subtotal_cents'),
	tipCents: integer('tip_cents').default(0),
	giftBox: integer('gift_box', { mode: 'boolean' }).default(false),
	giftMessage: text('gift_message'),
	taxCents: integer('tax_cents').default(0),
	totalCents: integer('total_cents'),
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});

// Newsletter subscribers table
export const newsletter = sqliteTable('newsletter', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	source: text('source').default('website'),
	subscribedAt: text('subscribed_at').default(sql`(datetime('now'))`)
});

// Fulfillment slots table
export const fulfillmentSlots = sqliteTable('fulfillment_slots', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull(), // YYYY-MM-DD format
	startTime: text('start_time').notNull(), // HH:MM format
	endTime: text('end_time').notNull(), // HH:MM format
	slotType: text('slot_type').default('both'), // pickup, delivery, both
	maxCookies: integer('max_cookies').default(200),
	active: integer('active', { mode: 'boolean' }).default(true)
});

// Daily capacity tracking table
export const dailyCapacity = sqliteTable('daily_capacity', {
	date: text('date').primaryKey(), // YYYY-MM-DD format
	cookiesOrdered: integer('cookies_ordered').default(0),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`)
});

// Admin sessions table
export const adminSessions = sqliteTable('admin_sessions', {
	id: text('id').primaryKey(), // Random UUID
	expiresAt: text('expires_at').notNull(), // ISO datetime
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});
```

---

## Appendix B: Environment Variables

### Required Environment Variables

| Variable                | Description                                        | Where to Set                                        |
| ----------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe API secret key (sk*live*... or sk*test*...) | Cloudflare Pages > Settings > Environment Variables |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec\_...)         | Cloudflare Pages > Settings > Environment Variables |
| `ADMIN_PASSWORD`        | Password for admin dashboard access                | Cloudflare Pages > Settings > Environment Variables |

### Local Development (.dev.vars)

Create a `.dev.vars` file in the project root (this file is gitignored):

```bash
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
ADMIN_PASSWORD=your_local_admin_password
```

### Drizzle Kit Environment (for migrations)

For running `drizzle-kit push` against remote D1:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_D1_TOKEN=your_api_token_with_d1_edit_permission
```

---

## Appendix C: Wrangler Configuration

### wrangler.toml

```toml
name = "cookie-isle"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "cookie-isle-db"
database_id = "YOUR_DATABASE_ID_HERE"

# R2 Bucket binding
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "cookie-isle-images"

# Environment variables (non-secret)
[vars]
PUBLIC_SITE_URL = "https://thecookieisle.com"
```

### svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};

export default config;
```

### src/app.d.ts

```typescript
declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				IMAGES: R2Bucket;
				STRIPE_SECRET_KEY: string;
				STRIPE_WEBHOOK_SECRET: string;
				ADMIN_PASSWORD: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
		}
	}
}

export {};
```

---

## Appendix D: Legacy Reference

### Theme Colors (from hugo.toml)

```javascript
// Tailwind config extension
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#3d8b8b', // Teal
        hover: '#2d6b6b',
      },
      secondary: {
        DEFAULT: '#5D4037', // Warm brown
        dark: '#3E2723',
      },
      tertiary: {
        DEFAULT: '#FFF8E1', // Warm cream
        light: '#FFFDF5',
        medium: '#F5E6C8',
      },
      accent: '#D4A574', // Golden accent
    }
  }
}
```

### Legacy File Mapping

| Legacy Location                 | New Location                                   |
| ------------------------------- | ---------------------------------------------- |
| `hugo.toml`                     | `src/lib/config.ts`                            |
| `content/menu/*.md`             | D1 `products` table                            |
| `layouts/*.html`                | `src/routes/**/*.svelte`                       |
| `static/js/*.js`                | `src/lib/**/*.ts`                              |
| `assets/css/main.css`           | Tailwind classes in components                 |
| `workers/stripe-checkout/`      | `src/routes/api/checkout/`                     |
| `workers/newsletter-signup/`    | `src/routes/api/newsletter/`                   |
| `workers/calendar-slots/`       | `src/routes/(public)/checkout/+page.server.ts` |
| `workers/google-apps-script.js` | D1 database (no more Google Sheets)            |

### Legacy Products to Migrate

From `_legacy/content/menu/`:

- chocolatechip.md
- (other cookie markdown files)

Each file contains TOML frontmatter with:

- `title` - Product name
- `price` - Display price ("$3.50")
- `price_cents` - Integer price (350)
- `stripe_price_id` - Stripe Price ID to preserve
- `description` - Short description
- `image` - Filename in static folder
- `hero_image` - Larger image filename
- `ingredients` - Ingredients list
- `tags` - Array of tags
- `featured` - Boolean
- `draft` - Boolean (inverse of active)

---

## Changelog

| Date       | Version | Changes             |
| ---------- | ------- | ------------------- |
| 2026-01-16 | 1.0     | Initial PRD created |

---

_This document serves as the complete specification for the Cookie Isle SvelteKit migration. Future development agents should read this document fully before implementing any phase or task._
