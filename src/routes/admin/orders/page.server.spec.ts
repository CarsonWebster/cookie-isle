import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getTodayDate,
	formatItemsSummary,
	formatDateTime,
	queryOrders,
	load,
	type AdminOrder,
	type OrdersPageData
} from './+page.server';
import type { OrderItem } from '$lib/server/db/schema';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

describe('getTodayDate', () => {
	it('should return date in YYYY-MM-DD format', () => {
		const date = new Date('2026-01-16T12:00:00Z');
		const result = getTodayDate(date);
		expect(result).toBe('2026-01-16');
	});

	it('should handle single-digit months and days', () => {
		const date = new Date('2026-03-05T12:00:00Z');
		const result = getTodayDate(date);
		expect(result).toBe('2026-03-05');
	});

	it('should use current date when no argument provided', () => {
		const result = getTodayDate();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('formatItemsSummary', () => {
	it('should return "No items" for empty array', () => {
		const result = formatItemsSummary([]);
		expect(result).toBe('No items');
	});

	it('should show full details for 1 item', () => {
		const items: OrderItem[] = [
			{ productId: 1, slug: 'test', title: 'Chocolate Chip', priceCents: 350, quantity: 2 }
		];
		const result = formatItemsSummary(items);
		expect(result).toBe('2x Chocolate Chip');
	});

	it('should show full details for 2 items', () => {
		const items: OrderItem[] = [
			{ productId: 1, slug: 'test1', title: 'Chocolate Chip', priceCents: 350, quantity: 2 },
			{ productId: 2, slug: 'test2', title: 'Brownie', priceCents: 500, quantity: 1 }
		];
		const result = formatItemsSummary(items);
		expect(result).toBe('2x Chocolate Chip, 1x Brownie');
	});

	it('should show total count for 3+ items', () => {
		const items: OrderItem[] = [
			{ productId: 1, slug: 'test1', title: 'Chocolate Chip', priceCents: 350, quantity: 2 },
			{ productId: 2, slug: 'test2', title: 'Brownie', priceCents: 500, quantity: 1 },
			{ productId: 3, slug: 'test3', title: 'Oatmeal', priceCents: 325, quantity: 3 }
		];
		const result = formatItemsSummary(items);
		expect(result).toBe('6 items');
	});

	it('should handle null input gracefully', () => {
		const result = formatItemsSummary(null as any);
		expect(result).toBe('No items');
	});
});

describe('formatDateTime', () => {
	it('should format ISO datetime to readable format', () => {
		const result = formatDateTime('2026-01-16T15:30:00Z');
		expect(result).toMatch(/Jan 16/);
		expect(result).toMatch(/AM|PM/); // Accept either AM or PM (timezone dependent)
	});

	it('should return "N/A" for null input', () => {
		const result = formatDateTime(null);
		expect(result).toBe('N/A');
	});

	it('should return "Invalid Date" for invalid input', () => {
		const result = formatDateTime('invalid-date');
		expect(result).toBe('Invalid Date'); // JavaScript Date returns "Invalid Date" with capital D
	});

	it('should handle different times of day', () => {
		const morning = formatDateTime('2026-01-16T09:30:00Z');
		const afternoon = formatDateTime('2026-01-16T15:30:00Z');
		expect(morning).toMatch(/AM|PM/);
		expect(afternoon).toMatch(/AM|PM/);
	});
});

describe('queryOrders', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should query all orders when no filters provided', async () => {
		const mockOrders = [
			{
				id: 1,
				customerName: 'John Doe',
				customerEmail: 'john@example.com',
				items: [
					{ productId: 1, slug: 'test', title: 'Chocolate Chip', priceCents: 350, quantity: 2 }
				],
				totalCents: 700,
				status: 'paid',
				fulfillmentDate: '2026-01-17',
				fulfillmentType: 'pickup',
				createdAt: '2026-01-16T12:00:00Z',
				stripeSessionId: 'cs_test_123',
				customerPhone: '555-1234',
				fulfillmentTime: '10:00-11:00',
				deliveryAddress: null,
				subtotalCents: 700,
				tipCents: 0,
				giftBox: false,
				giftMessage: null,
				taxCents: 0,
				updatedAt: '2026-01-16T12:00:00Z'
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockOrders);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const result = await queryOrders(mockDb);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
		expect(result[0].customerName).toBe('John Doe');
		expect(result[0].itemsSummary).toBe('2x Chocolate Chip');
		expect(result[0].totalFormatted).toBe('$7.00');
	});

	it('should filter by date when dateFilter provided', async () => {
		const mockAll = vi.fn().mockResolvedValue([]);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		await queryOrders(mockDb, '2026-01-17', 'all');

		expect(mockWhere).toHaveBeenCalledWith(expect.anything());
	});

	it('should filter by status when statusFilter provided', async () => {
		const mockAll = vi.fn().mockResolvedValue([]);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		await queryOrders(mockDb, 'all', 'paid');

		expect(mockWhere).toHaveBeenCalledWith(expect.anything());
	});

	it('should not apply filters when "all" is selected', async () => {
		const mockAll = vi.fn().mockResolvedValue([]);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		await queryOrders(mockDb, 'all', 'all');

		expect(mockWhere).toHaveBeenCalledWith(undefined);
	});

	it('should format order data correctly', async () => {
		const mockOrders = [
			{
				id: 1,
				customerName: 'Jane Smith',
				customerEmail: 'jane@example.com',
				items: [
					{ productId: 1, slug: 'test1', title: 'Cookie A', priceCents: 350, quantity: 1 },
					{ productId: 2, slug: 'test2', title: 'Cookie B', priceCents: 400, quantity: 2 }
				],
				totalCents: 1150,
				status: 'fulfilled',
				fulfillmentDate: '2026-01-18',
				fulfillmentType: 'delivery',
				createdAt: '2026-01-16T14:30:00Z',
				stripeSessionId: 'cs_test_456',
				customerPhone: '555-5678',
				fulfillmentTime: '14:00-15:00',
				deliveryAddress: {
					street: '123 Main St',
					city: 'San Diego',
					state: 'CA',
					zip: '92101'
				},
				subtotalCents: 1150,
				tipCents: 0,
				giftBox: false,
				giftMessage: null,
				taxCents: 0,
				updatedAt: '2026-01-16T14:30:00Z'
			}
		];

		const mockAll = vi.fn().mockResolvedValue(mockOrders);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		const mockDb = { select: mockSelect } as any;

		const result = await queryOrders(mockDb);

		expect(result[0].id).toBe(1);
		expect(result[0].customerName).toBe('Jane Smith');
		expect(result[0].customerEmail).toBe('jane@example.com');
		expect(result[0].itemsSummary).toBe('1x Cookie A, 2x Cookie B');
		expect(result[0].totalCents).toBe(1150);
		expect(result[0].totalFormatted).toBe('$11.50');
		expect(result[0].status).toBe('fulfilled');
		expect(result[0].fulfillmentDate).toBe('2026-01-18');
		expect(result[0].fulfillmentType).toBe('delivery');
		expect(result[0].createdAt).toBe('2026-01-16T14:30:00Z');
		expect(result[0].createdAtFormatted).toMatch(/Jan 16/);
	});
});

describe('load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return empty data when platform unavailable', async () => {
		const mockUrl = {
			searchParams: {
				get: vi.fn().mockReturnValue(null)
			}
		};

		const result = (await load({ platform: undefined, url: mockUrl } as any)) as OrdersPageData;

		expect(result.orders).toEqual([]);
		expect(result.dateFilter).toBe('all');
		expect(result.statusFilter).toBe('all');
		expect(result.availableDates).toEqual([]);
		expect(result.todayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('should return empty data when DB unavailable', async () => {
		const mockUrl = {
			searchParams: {
				get: vi.fn().mockReturnValue(null)
			}
		};

		const result = (await load({
			platform: { env: {} },
			url: mockUrl
		} as any)) as OrdersPageData;

		expect(result.orders).toEqual([]);
		expect(result.availableDates).toEqual([]);
	});

	it('should read query params for filters', async () => {
		const mockUrl = {
			searchParams: {
				get: vi.fn((key: string) => {
					if (key === 'date') return '2026-01-17';
					if (key === 'status') return 'paid';
					return null;
				})
			}
		};

		const result = (await load({
			platform: { env: {} },
			url: mockUrl
		} as any)) as OrdersPageData;

		expect(result.dateFilter).toBe('2026-01-17');
		expect(result.statusFilter).toBe('paid');
	});

	it('should default to "all" when no query params provided', async () => {
		const mockUrl = {
			searchParams: {
				get: vi.fn().mockReturnValue(null)
			}
		};

		const result = (await load({
			platform: { env: {} },
			url: mockUrl
		} as any)) as OrdersPageData;

		expect(result.dateFilter).toBe('all');
		expect(result.statusFilter).toBe('all');
	});

	it('should query available dates for dropdown', async () => {
		const mockDates = [
			{ date: '2026-01-18' },
			{ date: '2026-01-17' },
			{ date: '2026-01-16' },
			{ date: null }
		];

		const mockAll = vi.fn().mockResolvedValue(mockDates);
		const mockOrderBy = vi.fn().mockReturnValue({ all: mockAll });
		const mockGroupBy = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
		const mockFrom = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

		const mockOrdersAll = vi.fn().mockResolvedValue([]);
		const mockOrdersOrderBy = vi.fn().mockReturnValue({ all: mockOrdersAll });
		const mockOrdersWhere = vi.fn().mockReturnValue({ orderBy: mockOrdersOrderBy });
		const mockOrdersFrom = vi.fn().mockReturnValue({ where: mockOrdersWhere });

		let selectCallCount = 0;
		const mockDb = {
			select: vi.fn((arg?: any) => {
				selectCallCount++;
				// First call is for orders, second is for dates
				if (selectCallCount === 1) {
					return { from: mockOrdersFrom };
				} else {
					return { from: mockFrom };
				}
			})
		} as any;

		const { getDb } = await import('$lib/server/db');
		(getDb as any).mockReturnValue(mockDb);

		const mockUrl = {
			searchParams: {
				get: vi.fn().mockReturnValue(null)
			}
		};

		const result = (await load({
			platform: { env: { DB: {} } },
			url: mockUrl
		} as any)) as OrdersPageData;

		expect(result.availableDates).toEqual(['2026-01-18', '2026-01-17', '2026-01-16']);
	});

	it('should handle database errors gracefully', async () => {
		const { getDb } = await import('$lib/server/db');
		(getDb as any).mockImplementation(() => {
			throw new Error('Database error');
		});

		const mockUrl = {
			searchParams: {
				get: vi.fn().mockReturnValue(null)
			}
		};

		const result = (await load({
			platform: { env: { DB: {} } },
			url: mockUrl
		} as any)) as OrdersPageData;

		expect(result.orders).toEqual([]);
		expect(result.availableDates).toEqual([]);
	});
});

describe('Type exports', () => {
	it('should export AdminOrder interface', () => {
		const order: AdminOrder = {
			id: 1,
			customerName: 'Test',
			customerEmail: 'test@example.com',
			itemsSummary: '2 items',
			totalCents: 1000,
			totalFormatted: '$10.00',
			status: 'paid',
			fulfillmentDate: '2026-01-17',
			fulfillmentType: 'pickup',
			createdAt: '2026-01-16T12:00:00Z',
			createdAtFormatted: 'Jan 16, 12:00 PM'
		};

		expect(order.id).toBe(1);
	});
});
