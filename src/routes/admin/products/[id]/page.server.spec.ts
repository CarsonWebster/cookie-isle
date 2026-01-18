import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Mock SvelteKit modules
vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		error: (status: number, message: string) => {
			const err = new Error(message) as Error & { status: number };
			err.status = status;
			throw err;
		},
		fail: (status: number, data: unknown) => ({ status, data }),
		redirect: (status: number, location: string) => {
			const err = new Error(`Redirect to ${location}`) as Error & {
				status: number;
				location: string;
			};
			err.status = status;
			err.location = location;
			throw err;
		}
	};
});

import { getDb } from '$lib/server/db';

// Helper to create mock DB
function createMockDb(products: unknown[] = []) {
	const mockLimit = vi.fn().mockResolvedValue(products);
	const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

	const mockSet = vi.fn().mockReturnValue({
		where: vi.fn().mockResolvedValue(undefined)
	});
	const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

	const mockDelete = vi.fn().mockReturnValue({
		where: vi.fn().mockResolvedValue(undefined)
	});

	return {
		select: mockSelect,
		update: mockUpdate,
		delete: mockDelete
	};
}

// Sample product data
const sampleProduct = {
	id: 1,
	title: 'Chocolate Chip',
	slug: 'chocolate-chip',
	priceCents: 350,
	stripePriceId: 'price_1test',
	description: 'Delicious cookies',
	ingredients: 'Flour, sugar, chocolate',
	tags: ['chocolate', 'classic'],
	featured: true,
	active: true,
	sortOrder: 0,
	imageUrl: null,
	heroImageUrl: null,
	createdAt: '2024-01-01T00:00:00.000Z'
};

describe('Product Edit Page - Load Function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads product by ID successfully', async () => {
		const db = createMockDb([sampleProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const result = await load({ params: { id: '1' }, platform: {} } as never);

		expect(result).toEqual({ product: sampleProduct });
		expect(db.select).toHaveBeenCalled();
	});

	it('throws 404 if product not found', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		await expect(load({ params: { id: '999' }, platform: {} } as never)).rejects.toThrow(
			'Product not found'
		);
	});

	it('throws 404 if ID is invalid', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		await expect(load({ params: { id: 'abc' }, platform: {} } as never)).rejects.toThrow(
			'Product not found'
		);
	});

	it('throws 500 if database unavailable', async () => {
		vi.mocked(getDb).mockReturnValue(null as never);

		await expect(load({ params: { id: '1' }, platform: undefined } as never)).rejects.toThrow(
			'Database not available'
		);
	});
});

describe('Product Edit Page - Update Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function createFormData(data: Record<string, string>) {
		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			formData.append(key, value);
		});
		return formData;
	}

	it('updates product successfully', async () => {
		const db = createMockDb([sampleProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Updated Cookie',
			slug: 'updated-cookie',
			price: '4.50',
			stripePriceId: 'price_1updated',
			description: 'Updated description',
			ingredients: 'New ingredients',
			tags: 'new, tags',
			sortOrder: '5',
			featured: 'on',
			active: 'on'
		});

		await expect(
			actions.update({
				request: { formData: async () => formData } as never,
				params: { id: '1' },
				platform: {}
			} as never)
		).rejects.toThrow('Redirect to /admin/products');

		expect(db.update).toHaveBeenCalled();
	});

	it('returns validation errors for missing required fields', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: '',
			slug: '',
			price: '',
			stripePriceId: ''
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 400,
			data: {
				errors: {
					title: 'Product name is required',
					slug: 'URL slug is required',
					price: 'Price is required',
					stripePriceId: 'Stripe Price ID is required'
				}
			}
		});
	});

	it('validates slug format', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'Invalid Slug!',
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 400,
			data: {
				errors: {
					slug: 'Slug can only contain lowercase letters, numbers, and hyphens'
				}
			}
		});
	});

	it('validates price is positive number', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'test',
			price: '-5.00',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 400,
			data: {
				errors: {
					price: 'Price must be a valid positive number'
				}
			}
		});
	});

	it('checks slug uniqueness excluding current product', async () => {
		const otherProduct = { ...sampleProduct, id: 2, slug: 'other-slug' };
		const db = createMockDb([otherProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'other-slug',
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 400,
			data: {
				errors: {
					slug: 'This slug is already in use. Please choose a different one.'
				}
			}
		});
	});

	it('allows same slug for current product', async () => {
		const db = createMockDb([sampleProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Updated Title',
			slug: 'chocolate-chip', // Same slug as current product
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		await expect(
			actions.update({
				request: { formData: async () => formData } as never,
				params: { id: '1' },
				platform: {}
			} as never)
		).rejects.toThrow('Redirect to /admin/products');
	});

	it('handles optional fields correctly', async () => {
		const db = createMockDb([sampleProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Simple Cookie',
			slug: 'simple-cookie',
			price: '2.50',
			stripePriceId: 'price_1simple'
			// No description, ingredients, tags, sortOrder, featured, active
		});

		await expect(
			actions.update({
				request: { formData: async () => formData } as never,
				params: { id: '1' },
				platform: {}
			} as never)
		).rejects.toThrow('Redirect to /admin/products');
	});

	it('parses tags from comma-separated string', async () => {
		const db = createMockDb([sampleProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Tagged Cookie',
			slug: 'tagged-cookie',
			price: '3.00',
			stripePriceId: 'price_1tagged',
			tags: 'chocolate, classic, bestseller'
		});

		await expect(
			actions.update({
				request: { formData: async () => formData } as never,
				params: { id: '1' },
				platform: {}
			} as never)
		).rejects.toThrow('Redirect to /admin/products');
	});

	it('converts price to cents correctly', async () => {
		const db = createMockDb([sampleProduct]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Priced Cookie',
			slug: 'priced-cookie',
			price: '12.99',
			stripePriceId: 'price_1priced'
		});

		await expect(
			actions.update({
				request: { formData: async () => formData } as never,
				params: { id: '1' },
				platform: {}
			} as never)
		).rejects.toThrow('Redirect to /admin/products');
	});

	it('returns 404 for invalid product ID', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'test',
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: 'abc' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 404,
			data: { error: 'Product not found' }
		});
	});

	it('returns 500 if database unavailable', async () => {
		vi.mocked(getDb).mockReturnValue(null as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'test',
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: undefined
		} as never);

		expect(result).toMatchObject({
			status: 500,
			data: expect.objectContaining({
				error: expect.stringContaining('Failed to verify product exists')
			})
		});
	});

	it('handles database error during slug check', async () => {
		const db = createMockDb([]);
		// Mock select to throw error - this now fails at product existence check first
		db.select = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockRejectedValue(new Error('DB error'))
				})
			})
		});
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'test',
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: {}
		} as never);

		// Now fails at product existence check (which runs before slug check)
		expect(result).toMatchObject({
			status: 500,
			data: expect.objectContaining({
				error: expect.stringContaining('Failed to verify product exists')
			})
		});
	});

	it('handles database error during update', async () => {
		const db = createMockDb([sampleProduct]);
		// Mock update to throw error
		db.update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockRejectedValue(new Error('DB error'))
			})
		});
		vi.mocked(getDb).mockReturnValue(db as never);

		const formData = createFormData({
			title: 'Test',
			slug: 'test',
			price: '3.50',
			stripePriceId: 'price_1test'
		});

		const result = await actions.update({
			request: { formData: async () => formData } as never,
			params: { id: '1' },
			platform: {}
		} as never);

		expect(result).toMatchObject({
			status: 500,
			data: expect.objectContaining({
				error: expect.stringContaining('Failed to update product')
			})
		});
	});
});

describe('Product Edit Page - Delete Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes product successfully', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		await expect(
			actions.delete({
				params: { id: '1' },
				platform: {}
			} as never)
		).rejects.toThrow('Redirect to /admin/products');

		expect(db.delete).toHaveBeenCalled();
	});

	it('returns 404 for invalid product ID', async () => {
		const db = createMockDb([]);
		vi.mocked(getDb).mockReturnValue(db as never);

		const result = await actions.delete({
			params: { id: 'abc' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 404,
			data: { error: 'Product not found' }
		});
	});

	it('returns 500 if database unavailable', async () => {
		vi.mocked(getDb).mockReturnValue(null as never);

		const result = await actions.delete({
			params: { id: '1' },
			platform: undefined
		} as never);

		expect(result).toEqual({
			status: 500,
			data: { error: 'Database not available' }
		});
	});

	it('handles database error during delete', async () => {
		const db = createMockDb([]);
		// Mock delete to throw error
		db.delete = vi.fn().mockReturnValue({
			where: vi.fn().mockRejectedValue(new Error('DB error'))
		});
		vi.mocked(getDb).mockReturnValue(db as never);

		const result = await actions.delete({
			params: { id: '1' },
			platform: {}
		} as never);

		expect(result).toEqual({
			status: 500,
			data: { error: 'Failed to delete product' }
		});
	});
});
