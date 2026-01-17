/**
 * Cookie Detail Page Server Load Function Tests
 *
 * Tests for the cookie detail page's load function that fetches a single product by slug.
 *
 * PRD Reference: 2.5.11
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

// Type for product result
interface ProductResult {
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
}

// Type for the load function's expected return value
interface LoadResult {
	product: ProductResult;
}

// Sample product for testing
const mockProduct: ProductResult = {
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
};

// Helper function to create mock db with chainable methods
const createMockDb = (products: ProductResult[]) => {
	const mockLimit = vi.fn().mockResolvedValue(products);
	const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

	return {
		select: mockSelect,
		_mocks: { mockSelect, mockFrom, mockWhere, mockLimit }
	};
};

// Helper function to create mock platform
const createMockPlatform = () =>
	({
		env: { DB: {} as D1Database }
	}) as unknown as App.Platform;

// Helper function to safely call load with partial params
async function callLoad(params: {
	params: { slug: string };
	platform?: App.Platform | undefined;
}): Promise<LoadResult> {
	const result = await load(params as Parameters<typeof load>[0]);
	return result as LoadResult;
}

describe('Cookie detail page +page.server load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('when platform is not available', () => {
		it('throws 404 when platform is undefined', async () => {
			await expect(
				callLoad({ params: { slug: 'chocolate-chip' }, platform: undefined })
			).rejects.toMatchObject({
				status: 404,
				body: { message: 'Product not found' }
			});

			expect(mockGetDb).not.toHaveBeenCalled();
		});

		it('throws 404 when platform.env is undefined', async () => {
			await expect(
				callLoad({
					params: { slug: 'chocolate-chip' },
					platform: { env: undefined } as unknown as App.Platform
				})
			).rejects.toMatchObject({
				status: 404,
				body: { message: 'Product not found' }
			});

			expect(mockGetDb).not.toHaveBeenCalled();
		});

		it('throws 404 when platform.env.DB is undefined', async () => {
			await expect(
				callLoad({
					params: { slug: 'chocolate-chip' },
					platform: { env: {} } as unknown as App.Platform
				})
			).rejects.toMatchObject({
				status: 404,
				body: { message: 'Product not found' }
			});

			expect(mockGetDb).not.toHaveBeenCalled();
		});
	});

	describe('when platform is available', () => {
		it('returns product when found by slug', async () => {
			const mockDb = createMockDb([mockProduct]);
			mockGetDb.mockReturnValue(mockDb);

			const mockPlatform = createMockPlatform();
			const result = await callLoad({
				params: { slug: 'chocolate-chip' },
				platform: mockPlatform
			});

			expect(result).toEqual({ product: mockProduct });
			expect(mockGetDb).toHaveBeenCalledWith(mockPlatform);
		});

		it('throws 404 when product is not found', async () => {
			const mockDb = createMockDb([]);
			mockGetDb.mockReturnValue(mockDb);

			await expect(
				callLoad({
					params: { slug: 'nonexistent-cookie' },
					platform: createMockPlatform()
				})
			).rejects.toMatchObject({
				status: 404,
				body: { message: 'Product not found' }
			});
		});

		it('calls database with correct query structure', async () => {
			const mockDb = createMockDb([mockProduct]);
			mockGetDb.mockReturnValue(mockDb);

			await callLoad({
				params: { slug: 'chocolate-chip' },
				platform: createMockPlatform()
			});

			// Verify the query chain was called
			expect(mockDb._mocks.mockSelect).toHaveBeenCalled();
			expect(mockDb._mocks.mockFrom).toHaveBeenCalled();
			expect(mockDb._mocks.mockWhere).toHaveBeenCalled();
			expect(mockDb._mocks.mockLimit).toHaveBeenCalledWith(1);
		});

		it('returns product with all expected fields', async () => {
			const mockDb = createMockDb([mockProduct]);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({
				params: { slug: 'chocolate-chip' },
				platform: createMockPlatform()
			});

			const product = result.product;
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

		it('returns product with nullable fields as null', async () => {
			const productWithNulls: ProductResult = {
				...mockProduct,
				description: null,
				ingredients: null,
				imageUrl: null,
				heroImageUrl: null,
				tags: null
			};

			const mockDb = createMockDb([productWithNulls]);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({
				params: { slug: 'chocolate-chip' },
				platform: createMockPlatform()
			});

			expect(result.product.description).toBeNull();
			expect(result.product.ingredients).toBeNull();
			expect(result.product.imageUrl).toBeNull();
			expect(result.product.heroImageUrl).toBeNull();
			expect(result.product.tags).toBeNull();
		});

		it('handles different slug formats', async () => {
			const slugs = ['chocolate-chip', 'double_chocolate', 'oatmealRaisin', 'peanut-butter-123'];

			for (const slug of slugs) {
				const productWithSlug: ProductResult = { ...mockProduct, slug };
				const mockDb = createMockDb([productWithSlug]);
				mockGetDb.mockReturnValue(mockDb);

				const result = await callLoad({
					params: { slug },
					platform: createMockPlatform()
				});

				expect(result.product.slug).toBe(slug);
			}
		});
	});

	describe('error handling', () => {
		it('throws 404 error with proper structure', async () => {
			const mockDb = createMockDb([]);
			mockGetDb.mockReturnValue(mockDb);

			try {
				await callLoad({
					params: { slug: 'nonexistent' },
					platform: createMockPlatform()
				});
				// Should not reach here
				expect(true).toBe(false);
			} catch (error: unknown) {
				const httpError = error as { status: number; body: { message: string } };
				expect(httpError.status).toBe(404);
				expect(httpError.body.message).toBe('Product not found');
			}
		});
	});
});
