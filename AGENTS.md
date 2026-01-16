# Cookie Isle - Agent Instructions

## Project Overview

**The Cookie Isle** is a cottage bakery e-commerce website being migrated from Hugo + Cloudflare Workers + Google Sheets to a unified SvelteKit application.

**IMPORTANT:** Read `docs/PRD.md` for the complete migration plan, task list with status tracking, database schema, and all implementation details. The PRD contains atomic, commit-sized TODOs organized into 8 phases.

### Tech Stack
- **Runtime:** Bun
- **Framework:** SvelteKit with Svelte 5 (runes)
- **Styling:** Tailwind CSS v4
- **Database:** Cloudflare D1 (SQLite) with Drizzle ORM
- **Image Storage:** Cloudflare R2
- **Hosting:** Cloudflare Pages
- **Testing:** Vitest with Playwright browser testing

### Key Directories
- `src/routes/` - SvelteKit file-based routing
- `src/lib/components/` - Reusable Svelte 5 components
- `src/lib/server/` - Server-only code (db, auth, stripe)
- `src/lib/stores/` - Svelte stores (cart state)
- `docs/PRD.md` - Complete migration specification
- `_legacy/` - Archived Hugo project (reference only)

---

## Build, Lint, and Test Commands

All commands use Bun as the runtime.

```bash
# Development
bun run dev              # Start dev server at localhost:5173
bun run build            # Build for production
bun run preview          # Preview production build with Wrangler

# Type Checking
bun run check            # Run svelte-check (TypeScript)
bun run check:watch      # Watch mode for type checking

# Linting & Formatting
bun run lint             # Check formatting (Prettier) and lint (ESLint)
bun run format           # Auto-format all files with Prettier

# Testing
bun run test             # Run all tests once
bun run test:unit        # Run tests in watch mode

# Run a single test file
bunx vitest run src/demo.spec.ts
bunx vitest run src/routes/page.svelte.spec.ts

# Run tests matching a pattern
bunx vitest run -t "adds 1 + 2"

# Database (Drizzle)
bun run db:generate      # Generate SQL migrations
bun run db:push          # Push schema to D1
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio

# Cloudflare
bun run types            # Regenerate worker-configuration.d.ts
npx wrangler d1 execute cookie-isle-db --local --command "SELECT 1"
```

---

## Code Style Guidelines

### Formatting (Prettier)
- **Tabs** for indentation (not spaces)
- **Single quotes** for strings
- **No trailing commas**
- **100 character** print width
- Tailwind classes are auto-sorted via `prettier-plugin-tailwindcss`

### TypeScript
- **Strict mode enabled** - no implicit any, strict null checks
- **No `any` types** - use proper typing or `unknown`
- **No `@ts-ignore`** - fix the actual type issue
- Use `$lib/` path alias for imports from `src/lib/`
- Platform types come from `worker-configuration.d.ts` (auto-generated)

### Svelte 5 Conventions
- **Use runes** - `$state`, `$derived`, `$effect`, `$props`, `$bindable`
- **Avoid legacy syntax** - no `$:` reactive statements, no `export let`
- Props pattern:
  ```svelte
  <script lang="ts">
    interface Props {
      title: string;
      count?: number;
    }
    let { title, count = 0 }: Props = $props();
  </script>
  ```
- State pattern:
  ```svelte
  <script lang="ts">
    let count = $state(0);
    let doubled = $derived(count * 2);
  </script>
  ```

### Naming Conventions
- **Files:** kebab-case (`menu-card.svelte`, `cart-store.ts`)
- **Components:** PascalCase in code (`MenuCard`, `CartBadge`)
- **Variables/functions:** camelCase (`cartTotal`, `addToCart`)
- **Constants:** SCREAMING_SNAKE_CASE for true constants
- **Database columns:** snake_case (`price_cents`, `stripe_price_id`)
- **TypeScript interfaces:** PascalCase (`OrderItem`, `DeliveryAddress`)

### Import Order
1. Svelte/SvelteKit imports
2. External library imports
3. `$lib/` imports
4. Relative imports
5. Type imports (use `import type` when possible)

```typescript
import { page } from '$app/state';
import { drizzle } from 'drizzle-orm/d1';
import { db } from '$lib/server/db';
import Header from './Header.svelte';
import type { PageData } from './$types';
```

### Error Handling
- Use SvelteKit's `error()` helper for HTTP errors
- Validate inputs at API boundaries
- Return typed error responses from API routes
- Log errors server-side, show user-friendly messages client-side

```typescript
import { error, json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
  if (!platform?.env.DB) {
    throw error(500, 'Database not configured');
  }
  // ... handle request
  return json({ success: true });
}
```

---

## Testing Conventions

### Test File Naming
- **Server/unit tests:** `*.spec.ts` or `*.test.ts`
- **Component tests:** `*.svelte.spec.ts` or `*.svelte.test.ts`

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('feature name', () => {
  it('should do something specific', () => {
    expect(result).toBe(expected);
  });
});
```

### Component Testing
```typescript
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Component from './Component.svelte';

it('renders correctly', async () => {
  render(Component, { props: { title: 'Test' } });
  await expect.element(page.getByRole('heading')).toBeInTheDocument();
});
```

### Test Requirements
- Tests MUST have at least one assertion (`expect`)
- Run `bun run check` before committing - must pass
- Run `bun run test` before committing - must pass

---

## Commit Guidelines

- Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- Reference PRD task IDs when applicable
- Keep commits atomic and focused
- Update PRD task status after completing items

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `bun run dev` |
| Type check | `bun run check` |
| Run all tests | `bun run test` |
| Run single test | `bunx vitest run path/to/test.ts` |
| Format code | `bun run format` |
| Lint code | `bun run lint` |
| Generate DB types | `bun run types` |
