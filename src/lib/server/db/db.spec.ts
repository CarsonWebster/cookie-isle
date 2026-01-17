import { describe, it, expect, vi } from 'vitest';
import { createDb, getDb, type Database } from './index';

// Mock drizzle-orm/d1 module
vi.mock('drizzle-orm/d1', () => ({
	drizzle: vi.fn((d1: D1Database, options: { schema: unknown }) => ({
		_d1: d1,
		_schema: options.schema,
		// Mock a minimal Drizzle instance for testing
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	}))
}));

// Create a minimal mock D1Database for testing
function createMockD1(): D1Database {
	return {
		prepare: vi.fn(),
		dump: vi.fn(),
		batch: vi.fn(),
		exec: vi.fn()
	} as unknown as D1Database;
}

describe('database helper', () => {
	describe('createDb', () => {
		it('creates a Drizzle instance from D1 binding', () => {
			const mockD1 = createMockD1();
			const db = createDb(mockD1);

			expect(db).toBeDefined();
			expect(typeof db).toBe('object');
		});

		it('returns an object with query methods', () => {
			const mockD1 = createMockD1();
			const db = createDb(mockD1);

			// Verify the mock drizzle instance has expected methods
			expect(db.select).toBeDefined();
			expect(db.insert).toBeDefined();
			expect(db.update).toBeDefined();
			expect(db.delete).toBeDefined();
		});

		it('passes the D1 binding to drizzle', async () => {
			const mockD1 = createMockD1();
			const db = createDb(mockD1) as Database & { _d1: D1Database };

			// Our mock stores the D1 binding for verification
			expect(db._d1).toBe(mockD1);
		});

		it('passes schema to drizzle', () => {
			const mockD1 = createMockD1();
			const db = createDb(mockD1) as Database & { _schema: unknown };

			// Verify schema was passed
			expect(db._schema).toBeDefined();
		});
	});

	describe('getDb', () => {
		it('throws when platform is undefined', () => {
			expect(() => getDb(undefined)).toThrow(
				'Database not available. Are you running in the Cloudflare environment?'
			);
		});

		it('throws when platform.env is undefined', () => {
			const platform = {} as App.Platform;
			expect(() => getDb(platform)).toThrow(
				'Database not available. Are you running in the Cloudflare environment?'
			);
		});

		it('throws when platform.env.DB is undefined', () => {
			const platform = { env: {} } as App.Platform;
			expect(() => getDb(platform)).toThrow(
				'Database not available. Are you running in the Cloudflare environment?'
			);
		});

		it('returns a database instance when DB binding is available', () => {
			const mockD1 = createMockD1();
			const platform = {
				env: { DB: mockD1 }
			} as unknown as App.Platform;

			const db = getDb(platform);

			expect(db).toBeDefined();
			expect(typeof db).toBe('object');
		});

		it('passes the DB binding from platform to createDb', () => {
			const mockD1 = createMockD1();
			const platform = {
				env: { DB: mockD1 }
			} as unknown as App.Platform;

			const db = getDb(platform) as Database & { _d1: D1Database };

			// Verify the correct D1 binding was passed through
			expect(db._d1).toBe(mockD1);
		});
	});

	describe('Database type', () => {
		it('exports Database type correctly', () => {
			// This is a compile-time check - if it compiles, the type is exported correctly
			const mockD1 = createMockD1();
			const db: Database = createDb(mockD1);
			expect(db).toBeDefined();
		});
	});
});
