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

## Key File Locations

| File                          | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `docs/PRD.md`                 | Complete migration spec with task tracking            |
| `src/lib/server/db/schema.ts` | Drizzle table definitions                             |
| `src/lib/server/db/index.ts`  | Database helper functions (`getDb`, `createDb`)       |
| `drizzle.config.ts`           | Drizzle Kit config (uses d1-http driver)              |
| `wrangler.jsonc`              | Cloudflare bindings (D1 configured, R2 commented out) |
| `AGENTS.md`                   | Agent instructions and coding standards               |

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
6. **START Phase 1: Core Layout & Components**
   - 1.1 Site configuration (`src/lib/config.ts`) - migrate settings from `_legacy/hugo.toml`
   - 1.2 Root layout - HTML structure and meta tags
   - 1.3 Header component - with mobile nav
   - 1.4 Footer component
   - 1.5 Public layout group

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

## Test Coverage Summary

| Test File                          | Tests | Purpose                            |
| ---------------------------------- | ----- | ---------------------------------- |
| `src/demo.spec.ts`                 | 1     | Demo test from sv create           |
| `src/lib/server/db/schema.spec.ts` | 23    | Schema table definitions and types |
| `src/lib/server/db/db.spec.ts`     | 10    | Database helper functions          |
| **Total**                          | 34    |                                    |
