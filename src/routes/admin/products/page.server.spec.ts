import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	queryProducts,
	toggleProductActive,
	load,
	actions,
	type AdminProduct,
	type ProductsPageData
} from './+page.server';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

describe('queryProducts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should query all products ordered by sort_order and title', async () => {
		const mockProducts = [
			{
				id: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				stripePriceId: 'price_123',
				description: 'Classic cookie',
				ingredients: 'flour, sugar, chocolate',
				imageUrl: 'https://example.com/image.jpg',
				heroImageUrl: null,
				tags: ['classic'],
				featured: true,
				active: true,
				sortOrder: 1,
				createdAt: '2026-01-16T12:00:00Z',
				updatedAt: '2026-01-16T12:00:00Z'
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockProducts);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const result = await queryProducts(mockDb);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].slug).toBe('chocolate-chip');
		expect(result[0].title).toBe('Chocolate Chip');
		expect(result[0].priceCents).toBe(350);
		expect(result[0].priceFormatted).toBe('$3.50');
		expect(result[0].stripePriceId).toBe('price_123');
		expect(result[0].description).toBe('Classic cookie');
		expect(result[0].imageUrl).toBe('https://example.com/image.jpg');
		expect(result[0].featured).toBe(true);
		expect(result[0].active).toBe(true);
		expect(result[0].sortOrder).toBe(1);
	});

	it('should format prices correctly', async () => {
		const mockProducts = [
			{
				id: 1,
				slug: 'test',
				title: 'Test Cookie',
				priceCents: 1250,
				stripePriceId: 'price_123',
				description: null,
				ingredients: null,
				imageUrl: null,
				heroImageUrl: null,
				tags: null,
				featured: false,
				active: true,
				sortOrder: 0,
				createdAt: '2026-01-16T12:00:00Z',
				updatedAt: '2026-01-16T12:00:00Z'
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockProducts);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const result = await queryProducts(mockDb);

		expect(result[0].priceFormatted).toBe('$12.50');
	});

	it('should handle null values correctly', async () => {
		const mockProducts = [
			{
				id: 1,
				slug: 'test',
				title: 'Test Cookie',
				priceCents: 350,
				stripePriceId: 'price_123',
				description: null,
				ingredients: null,
				imageUrl: null,
				heroImageUrl: null,
				tags: null,
				featured: null,
				active: null,
				sortOrder: null,
				createdAt: null,
				updatedAt: null
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockProducts);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const result = await queryProducts(mockDb);

		expect(result[0].description).toBeNull();
		expect(result[0].imageUrl).toBeNull();
		expect(result[0].featured).toBeNull();
		expect(result[0].active).toBeNull();
		expect(result[0].sortOrder).toBeNull();
	});

	it('should return multiple products in order', async () => {
		const mockProducts = [
			{
				id: 1,
				slug: 'cookie-a',
				title: 'Cookie A',
				priceCents: 300,
				stripePriceId: 'price_1',
				description: null,
				ingredients: null,
				imageUrl: null,
				heroImageUrl: null,
				tags: null,
				featured: false,
				active: true,
				sortOrder: 1,
				createdAt: '2026-01-16T12:00:00Z',
				updatedAt: '2026-01-16T12:00:00Z'
			},
			{
				id: 2,
				slug: 'cookie-b',
				title: 'Cookie B',
				priceCents: 400,
				stripePriceId: 'price_2',
				description: null,
				ingredients: null,
				imageUrl: null,
				heroImageUrl: null,
				tags: null,
				featured: true,
				active: false,
				sortOrder: 2,
				createdAt: '2026-01-16T12:00:00Z',
				updatedAt: '2026-01-16T12:00:00Z'
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockProducts);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const result = await queryProducts(mockDb);

		expect(result).toHaveLength(2);
		expect(result[0].title).toBe('Cookie A');
		expect(result[1].title).toBe('Cookie B');
	});
});

describe('toggleProductActive', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should update product active status to true', async () => {
		const mockRun = vi.fn().mockResolvedValue({});
		const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
		const mockDb = { update: mockUpdate } as any;

		const result = await toggleProductActive(mockDb, 1, true);

		expect(result).toBe(true);
		expect(mockUpdate).toHaveBeenCalled();
		expect(mockSet).toHaveBeenCalledWith({ active: true });
	});

	it('should update product active status to false', async () => {
		const mockRun = vi.fn().mockResolvedValue({});
		const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
		const mockDb = { update: mockUpdate } as any;

		const result = await toggleProductActive(mockDb, 1, false);

		expect(result).toBe(true);
		expect(mockSet).toHaveBeenCalledWith({ active: false });
	});

	it('should return false on database error', async () => {
		const mockUpdate = vi.fn().mockImplementation(() => {
			throw new Error('Database error');
		});
		const mockDb = { update: mockUpdate } as any;

		const result = await toggleProductActive(mockDb, 1, true);

		expect(result).toBe(false);
	});
});

describe('load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return empty products when platform unavailable', async () => {
		const result = (await load({ platform: undefined } as any)) as ProductsPageData;

		expect(result.products).toEqual([]);
	});

	it('should return empty products when DB unavailable', async () => {
		const result = (await load({
			platform: { env: {} }
		} as any)) as ProductsPageData;

		expect(result.products).toEqual([]);
	});

	it('should load products from database', async () => {
		const mockProducts = [
			{
				id: 1,
				slug: 'test',
				title: 'Test Cookie',
				priceCents: 350,
				stripePriceId: 'price_123',
				description: 'Delicious cookie',
				ingredients: null,
				imageUrl: null,
				heroImageUrl: null,
				tags: null,
				featured: true,
				active: true,
				sortOrder: 1,
				createdAt: '2026-01-16T12:00:00Z',
				updatedAt: '2026-01-16T12:00:00Z'
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockProducts);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const { getDb } = await import('$lib/server/db');
		(getDb as any).mockReturnValue(mockDb);

		const result = (await load({
			platform: { env: { DB: {} } }
		} as any)) as ProductsPageData;

		expect(result.products).toHaveLength(1);
		expect(result.products[0].title).toBe('Test Cookie');
		expect(result.products[0].priceFormatted).toBe('$3.50');
	});

	it('should handle database errors gracefully', async () => {
		const { getDb } = await import('$lib/server/db');
		(getDb as any).mockImplementation(() => {
			throw new Error('Database error');
		});

		const result = (await load({
			platform: { env: { DB: {} } }
		} as any)) as ProductsPageData;

		expect(result.products).toEqual([]);
	});
});

describe('actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('toggleActive action', () => {
		it('should return error when platform unavailable', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', '1');
			mockFormData.set('active', 'true');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const result = await actions.toggleActive({
				platform: undefined,
				request: mockRequest
			} as any);

			expect(result).toMatchObject({ status: 503, data: { error: 'Database unavailable' } });
		});

		it('should return error when DB unavailable', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', '1');
			mockFormData.set('active', 'true');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const result = await actions.toggleActive({
				platform: { env: {} },
				request: mockRequest
			} as any);

			expect(result).toMatchObject({ status: 503, data: { error: 'Database unavailable' } });
		});

		it('should return error for invalid product ID', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', 'invalid');
			mockFormData.set('active', 'true');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const result = await actions.toggleActive({
				platform: { env: { DB: {} } },
				request: mockRequest
			} as any);

			expect(result).toMatchObject({ status: 400, data: { error: 'Invalid product ID' } });
		});

		it('should toggle product to active', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', '1');
			mockFormData.set('active', 'true');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const mockRun = vi.fn().mockResolvedValue({});
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
			const mockDb = { update: mockUpdate } as any;

			const { getDb } = await import('$lib/server/db');
			(getDb as any).mockReturnValue(mockDb);

			const result = await actions.toggleActive({
				platform: { env: { DB: {} } },
				request: mockRequest
			} as any);

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith({ active: true });
		});

		it('should toggle product to inactive', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', '2');
			mockFormData.set('active', 'false');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const mockRun = vi.fn().mockResolvedValue({});
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
			const mockDb = { update: mockUpdate } as any;

			const { getDb } = await import('$lib/server/db');
			(getDb as any).mockReturnValue(mockDb);

			const result = await actions.toggleActive({
				platform: { env: { DB: {} } },
				request: mockRequest
			} as any);

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith({ active: false });
		});

		it('should return error when toggle fails', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', '1');
			mockFormData.set('active', 'true');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const mockUpdate = vi.fn().mockImplementation(() => {
				throw new Error('Database error');
			});
			const mockDb = { update: mockUpdate } as any;

			const { getDb } = await import('$lib/server/db');
			(getDb as any).mockReturnValue(mockDb);

			const result = await actions.toggleActive({
				platform: { env: { DB: {} } },
				request: mockRequest
			} as any);

			expect(result).toMatchObject({
				status: 500,
				data: { error: 'Failed to update product status' }
			});
		});

		it('should handle missing productId', async () => {
			const mockFormData = new FormData();
			mockFormData.set('active', 'true');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const result = await actions.toggleActive({
				platform: { env: { DB: {} } },
				request: mockRequest
			} as any);

			expect(result).toMatchObject({ status: 400, data: { error: 'Invalid product ID' } });
		});

		it('should handle missing active value', async () => {
			const mockFormData = new FormData();
			mockFormData.set('productId', '1');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(mockFormData)
			};

			const mockRun = vi.fn().mockResolvedValue({});
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
			const mockDb = { update: mockUpdate } as any;

			const { getDb } = await import('$lib/server/db');
			(getDb as any).mockReturnValue(mockDb);

			const result = await actions.toggleActive({
				platform: { env: { DB: {} } },
				request: mockRequest
			} as any);

			expect(result).toEqual({ success: true });
			expect(mockSet).toHaveBeenCalledWith({ active: false });
		});
	});
});

describe('Type exports', () => {
	it('should export AdminProduct interface', () => {
		const product: AdminProduct = {
			id: 1,
			slug: 'test',
			title: 'Test Cookie',
			priceCents: 350,
			priceFormatted: '$3.50',
			stripePriceId: 'price_123',
			description: 'Delicious cookie',
			imageUrl: 'https://example.com/image.jpg',
			featured: true,
			active: true,
			sortOrder: 1
		};

		expect(product.id).toBe(1);
	});

	it('should export ProductsPageData interface', () => {
		const data: ProductsPageData = {
			products: []
		};

		expect(data.products).toEqual([]);
	});
});
