# Memory - Cookie Isle Project

This file contains useful findings for future agents working on this project.

## Project Overview

- **Tech Stack:** SvelteKit + Svelte 5 (runes) + Cloudflare D1 + Drizzle ORM + Tailwind v4
- **Runtime:** Bun
- **Primary Documentation:** `docs/PRD.md` - Contains all migration tasks with status tracking

## Current Progress (as of 2026-01-16)

### Phase 0 Status

- 0.1-0.5: Completed (project setup, TypeScript, Vitest, Tailwind)
- 0.6: Partially complete (D1 configured, R2 pending)
- 0.7: In progress - Schema tables being added
  - `products` - DONE
  - `orders` - DONE
  - `newsletter` - DONE
  - `fulfillmentSlots` - DONE
  - `dailyCapacity` - NOT STARTED
  - `adminSessions` - NOT STARTED
- 0.8: Not started (database helper - but `src/lib/server/db/index.ts` already exists with `getDb()`)

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

1. Add `dailyCapacity` table to schema (PRD 0.7.5)
2. Add `adminSessions` table to schema (PRD 0.7.6)
3. Generate and push migrations (PRD 0.7.8, 0.7.9)
4. Write schema type tests (PRD 0.7.10)
5. Complete database helper tasks (PRD 0.8)

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
