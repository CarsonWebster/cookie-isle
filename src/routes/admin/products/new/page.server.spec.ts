import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

// Mock dependencies
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Import the mock
import { getDb } from '$lib/server/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRequestEvent = any;

function createMockRequest(formData: FormData): Request {
	return {
		formData: vi.fn().mockResolvedValue(formData)
	} as unknown as Request;
}

function createMockPlatform(hasDb = true): App.Platform {
	return {
		env: {
			DB: hasDb ? ({} as D1Database) : undefined
		},
		context: {
			waitUntil: vi.fn()
		}
	} as unknown as App.Platform;
}

describe('/admin/products/new - Server Actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Form Validation', () => {
		it('should return error when title is missing', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: vi.fn(),
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('slug', 'test-product');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						title: expect.stringContaining('required')
					})
				}
			});
		});

		it('should return error when slug is missing', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: vi.fn(),
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						slug: expect.stringContaining('required')
					})
				}
			});
		});

		it('should return error when slug has invalid characters', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: vi.fn(),
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'Test Product!');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						slug: expect.stringContaining('lowercase letters, numbers, and hyphens')
					})
				}
			});
		});

		it('should return error when price is missing', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: vi.fn(),
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						price: expect.stringContaining('required')
					})
				}
			});
		});

		it('should return error when price is negative', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: vi.fn(),
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('price', '-5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						price: expect.stringContaining('positive number')
					})
				}
			});
		});

		it('should return error when stripePriceId is missing', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: vi.fn(),
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('price', '5.00');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						stripePriceId: expect.stringContaining('required')
					})
				}
			});
		});
	});

	describe('Slug Uniqueness', () => {
		it('should return error when slug already exists', async () => {
			const mockLimit = vi.fn().mockResolvedValue([{ id: 1, slug: 'test-product' }]);
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: mockSelect,
				insert: vi.fn()
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: {
					errors: expect.objectContaining({
						slug: expect.stringContaining('already in use')
					})
				}
			});
		});
	});

	describe('Successful Product Creation', () => {
		it('should insert product with all fields and redirect', async () => {
			const mockLimit = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockValues = vi.fn().mockResolvedValue(undefined);
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: mockSelect,
				insert: mockInsert
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');
			formData.append('description', 'A test product');
			formData.append('ingredients', 'Flour, sugar');
			formData.append('tags', 'test, product');
			formData.append('sortOrder', '10');
			formData.append('featured', 'on');
			formData.append('active', 'on');

			try {
				await actions.default({
					request: createMockRequest(formData),
					platform: createMockPlatform()
				} as AnyRequestEvent);
				expect.fail('Should have thrown redirect');
			} catch (error: unknown) {
				// Should redirect
				expect((error as { status: number }).status).toBe(303);
				expect((error as { location: string }).location).toBe('/admin/products');
			}

			// Verify insert was called with correct data
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith({
				title: 'Test Product',
				slug: 'test-product',
				priceCents: 500, // $5.00 = 500 cents
				stripePriceId: 'price_123',
				description: 'A test product',
				ingredients: 'Flour, sugar',
				tags: ['test', 'product'],
				sortOrder: 10,
				featured: true,
				active: true
			});
		});

		it('should insert product with minimal fields (no optional data)', async () => {
			const mockLimit = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockValues = vi.fn().mockResolvedValue(undefined);
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: mockSelect,
				insert: mockInsert
			});

			const formData = new FormData();
			formData.append('title', 'Minimal Product');
			formData.append('slug', 'minimal-product');
			formData.append('price', '3.25');
			formData.append('stripePriceId', 'price_456');

			try {
				await actions.default({
					request: createMockRequest(formData),
					platform: createMockPlatform()
				} as AnyRequestEvent);
				expect.fail('Should have thrown redirect');
			} catch (error: unknown) {
				expect((error as { status: number }).status).toBe(303);
			}

			// Verify insert was called with nulls for optional fields
			expect(mockValues).toHaveBeenCalledWith({
				title: 'Minimal Product',
				slug: 'minimal-product',
				priceCents: 325, // $3.25 = 325 cents
				stripePriceId: 'price_456',
				description: null,
				ingredients: null,
				tags: null,
				sortOrder: 0,
				featured: false,
				active: false
			});
		});

		it('should parse tags correctly from comma-separated string', async () => {
			const mockLimit = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockValues = vi.fn().mockResolvedValue(undefined);
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: mockSelect,
				insert: mockInsert
			});

			const formData = new FormData();
			formData.append('title', 'Tagged Product');
			formData.append('slug', 'tagged-product');
			formData.append('price', '4.00');
			formData.append('stripePriceId', 'price_789');
			formData.append('tags', '  chocolate ,  premium, organic  ');

			try {
				await actions.default({
					request: createMockRequest(formData),
					platform: createMockPlatform()
				} as AnyRequestEvent);
				expect.fail('Should have thrown redirect');
			} catch (error: unknown) {
				expect((error as { status: number }).status).toBe(303);
			}

			// Verify tags were trimmed
			expect(mockValues).toHaveBeenCalledWith(
				expect.objectContaining({
					tags: ['chocolate', 'premium', 'organic']
				})
			);
		});
	});

	describe('Error Handling', () => {
		it('should return 500 error when database is not available', async () => {
			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue(null);

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform(false)
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 500,
				data: {
					error: expect.stringContaining('Database not available')
				}
			});
		});

		it('should return 500 error when insert fails', async () => {
			const mockLimit = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockValues = vi.fn().mockRejectedValue(new Error('Insert failed'));
			const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

			// @ts-expect-error - mocking
			(getDb as vi.Mock).mockReturnValue({
				select: mockSelect,
				insert: mockInsert
			});

			const formData = new FormData();
			formData.append('title', 'Test Product');
			formData.append('slug', 'test-product');
			formData.append('price', '5.00');
			formData.append('stripePriceId', 'price_123');

			const result = await actions.default({
				request: createMockRequest(formData),
				platform: createMockPlatform()
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 500,
				data: {
					error: expect.stringContaining('Failed to create product')
				}
			});
		});
	});
});
