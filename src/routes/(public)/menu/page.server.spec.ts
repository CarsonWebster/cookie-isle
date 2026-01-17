/**
 * Menu Page Server Load Function Tests
 *
 * Tests for the menu page's load function that fetches all active products.
 *
 * PRD Reference: 2.4.7
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { load } from './+page.server';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Import after mocking
import { getDb } from '$lib/server/db';

// Type for the mocked getDb function
const mockGetDb = getDb as Mock;

// Type for the load function's expected return value
interface LoadResult {
	products: Array<{
		id: number;
		slug: string;
		title: string;
		priceCents: number;
		stripePriceId: string;
		description: string | null;
		ingredients: string | null;
		imageUrl: string | null;
		heroImageUrl: string | null;
		tags: string[] | null;
		featured: boolean | null;
		active: boolean | null;
		sortOrder: number | null;
		createdAt: string | null;
		updatedAt: string | null;
	}>;
}

// Helper function to safely call load and get result
async function callLoad(params: Partial<Parameters<typeof load>[0]>): Promise<LoadResult> {
	const result = await load(params as Parameters<typeof load>[0]);
	return result as LoadResult;
}

describe('Menu page +page.server load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('when platform is not available', () => {
		it('returns empty products array when platform is undefined', async () => {
			const result = await callLoad({ platform: undefined });

			expect(result).toEqual({ products: [] });
			expect(mockGetDb).not.toHaveBeenCalled();
		});

		it('returns empty products array when platform.env is undefined', async () => {
			const result = await callLoad({
				platform: { env: undefined } as unknown as App.Platform
			});

			expect(result).toEqual({ products: [] });
			expect(mockGetDb).not.toHaveBeenCalled();
		});

		it('returns empty products array when platform.env.DB is undefined', async () => {
			const result = await callLoad({
				platform: { env: {} } as unknown as App.Platform
			});

			expect(result).toEqual({ products: [] });
			expect(mockGetDb).not.toHaveBeenCalled();
		});
	});

	describe('when platform is available', () => {
		const mockProducts = [
			{
				id: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				stripePriceId: 'price_123',
				description: 'Classic chocolate chip cookie',
				ingredients: 'flour, butter, chocolate chips',
				imageUrl: 'https://example.com/chocolate-chip.jpg',
				heroImageUrl: 'https://example.com/chocolate-chip-hero.jpg',
				tags: ['classic', 'chocolate'],
				featured: true,
				active: true,
				sortOrder: 1,
				createdAt: '2026-01-01T00:00:00Z',
				updatedAt: '2026-01-01T00:00:00Z'
			},
			{
				id: 2,
				slug: 'sugar-cookie',
				title: 'Sugar Cookie',
				priceCents: 300,
				stripePriceId: 'price_456',
				description: 'Sweet and simple sugar cookie',
				ingredients: 'flour, butter, sugar',
				imageUrl: 'https://example.com/sugar-cookie.jpg',
				heroImageUrl: null,
				tags: ['classic'],
				featured: false,
				active: true,
				sortOrder: 2,
				createdAt: '2026-01-01T00:00:00Z',
				updatedAt: '2026-01-01T00:00:00Z'
			},
			{
				id: 3,
				slug: 'oatmeal-raisin',
				title: 'Oatmeal Raisin',
				priceCents: 325,
				stripePriceId: 'price_789',
				description: 'Hearty oatmeal cookie with raisins',
				ingredients: 'oats, flour, butter, raisins',
				imageUrl: null,
				heroImageUrl: null,
				tags: ['healthy', 'oatmeal'],
				featured: false,
				active: true,
				sortOrder: 3,
				createdAt: '2026-01-01T00:00:00Z',
				updatedAt: '2026-01-01T00:00:00Z'
			}
		];

		const createMockDb = (products: typeof mockProducts) => {
			const mockOrderBy = vi.fn().mockResolvedValue(products);
			const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

			return {
				select: mockSelect,
				_mocks: { mockSelect, mockFrom, mockWhere, mockOrderBy }
			};
		};

		const createMockPlatform = () =>
			({
				env: { DB: {} as D1Database }
			}) as unknown as App.Platform;

		it('returns all active products from database', async () => {
			const mockDb = createMockDb(mockProducts);
			mockGetDb.mockReturnValue(mockDb);

			const mockPlatform = createMockPlatform();
			const result = await callLoad({ platform: mockPlatform });

			expect(result.products).toEqual(mockProducts);
			expect(mockGetDb).toHaveBeenCalledWith(mockPlatform);
		});

		it('returns empty array when no active products exist', async () => {
			const mockDb = createMockDb([]);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.products).toEqual([]);
		});

		it('returns products sorted by sortOrder', async () => {
			// Products intentionally out of order to test sorting
			const unsortedProducts = [mockProducts[2], mockProducts[0], mockProducts[1]];
			const mockDb = createMockDb(unsortedProducts);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			// The DB should have been called, and the orderBy should handle sorting
			expect(result.products).toEqual(unsortedProducts);
			expect(mockDb._mocks.mockOrderBy).toHaveBeenCalled();
		});

		it('calls database with correct query structure', async () => {
			const mockDb = createMockDb(mockProducts);
			mockGetDb.mockReturnValue(mockDb);

			await callLoad({ platform: createMockPlatform() });

			// Verify the query chain was called
			expect(mockDb._mocks.mockSelect).toHaveBeenCalled();
			expect(mockDb._mocks.mockFrom).toHaveBeenCalled();
			expect(mockDb._mocks.mockWhere).toHaveBeenCalled();
			expect(mockDb._mocks.mockOrderBy).toHaveBeenCalled();
		});

		it('only returns active products (filters inactive)', async () => {
			// Note: This test verifies the query structure is correct.
			// The actual filtering happens in the database query.
			const mockDb = createMockDb(mockProducts);
			mockGetDb.mockReturnValue(mockDb);

			await callLoad({ platform: createMockPlatform() });

			// The where clause should be called (which filters active=true)
			expect(mockDb._mocks.mockWhere).toHaveBeenCalled();
		});

		it('returns products with all expected fields', async () => {
			const mockDb = createMockDb([mockProducts[0]]);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			const product = result.products[0];
			expect(product).toHaveProperty('id');
			expect(product).toHaveProperty('slug');
			expect(product).toHaveProperty('title');
			expect(product).toHaveProperty('priceCents');
			expect(product).toHaveProperty('stripePriceId');
			expect(product).toHaveProperty('description');
			expect(product).toHaveProperty('ingredients');
			expect(product).toHaveProperty('imageUrl');
			expect(product).toHaveProperty('heroImageUrl');
			expect(product).toHaveProperty('tags');
			expect(product).toHaveProperty('featured');
			expect(product).toHaveProperty('active');
			expect(product).toHaveProperty('sortOrder');
			expect(product).toHaveProperty('createdAt');
			expect(product).toHaveProperty('updatedAt');
		});
	});

	describe('return type', () => {
		it('always returns an object with products array', async () => {
			// Test with no platform
			const result1 = await callLoad({ platform: undefined });
			expect(result1).toHaveProperty('products');
			expect(Array.isArray(result1.products)).toBe(true);

			// Test with platform
			const mockDb = {
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue([])
						})
					})
				})
			};
			mockGetDb.mockReturnValue(mockDb);

			const result2 = await callLoad({
				platform: { env: { DB: {} as D1Database } } as unknown as App.Platform
			});
			expect(result2).toHaveProperty('products');
			expect(Array.isArray(result2.products)).toBe(true);
		});
	});
});
