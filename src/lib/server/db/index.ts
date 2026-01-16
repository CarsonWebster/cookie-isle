import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

/**
 * Creates a Drizzle ORM instance from a Cloudflare D1 binding.
 * Use this in server-side code: `const db = createDb(platform.env.DB)`
 */
export function createDb(d1: D1Database) {
	return drizzle(d1, { schema });
}

/**
 * Gets a database instance from the SvelteKit platform.
 * Throws if the DB binding is not available (e.g., running outside Cloudflare).
 */
export function getDb(platform: App.Platform | undefined) {
	if (!platform?.env?.DB) {
		throw new Error('Database not available. Are you running in the Cloudflare environment?');
	}
	return createDb(platform.env.DB);
}
