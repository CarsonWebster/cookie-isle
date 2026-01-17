import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	_queryOrderById as queryOrderById,
	_updateOrderStatus as updateOrderStatus
} from './+page.server';
import { formatDateTime, formatFulfillmentDate, formatTime } from '$lib/format';
import type { OrderItem, DeliveryAddress } from '$lib/server/db/schema';

// Mock the db module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

describe('Order Detail Page - Helper Functions', () => {
	describe('formatDateTime', () => {
		it('should format ISO datetime to readable format', () => {
			const result = formatDateTime('2026-01-16T15:30:00.000Z');
			expect(result).toMatch(/Jan 16, 2026/);
			expect(result).toMatch(/[0-9]+:[0-9]{2}/); // Has time component
		});

		it('should return "N/A" for null input', () => {
			expect(formatDateTime(null)).toBe('N/A');
		});

		it('should return "Invalid Date" for invalid date string', () => {
			expect(formatDateTime('not-a-date')).toBe('Invalid Date');
		});

		it('should return "Invalid Date" for date that throws error', () => {
			expect(formatDateTime('2026-13-45')).toBe('Invalid Date');
		});
	});

	describe('formatFulfillmentDate', () => {
		it('should format YYYY-MM-DD to readable format with weekday', () => {
			const result = formatFulfillmentDate('2026-01-16');
			expect(result).toMatch(/January 16, 2026/);
			expect(result).toMatch(/day/i); // Has weekday
		});

		it('should return empty string for null input', () => {
			expect(formatFulfillmentDate(null)).toBe('');
		});

		it('should handle dates at different years', () => {
			const result = formatFulfillmentDate('2025-12-25');
			expect(result).toMatch(/December 25, 2025/);
		});
	});

	describe('formatTime', () => {
		it('should format 24-hour time to 12-hour format', () => {
			expect(formatTime('15:30')).toBe('3:30 PM');
		});

		it('should format morning time correctly', () => {
			expect(formatTime('09:00')).toBe('9:00 AM');
		});

		it('should format noon correctly', () => {
			expect(formatTime('12:00')).toBe('12:00 PM');
		});

		it('should format midnight correctly', () => {
			expect(formatTime('00:00')).toBe('12:00 AM');
		});

		it('should return empty string for null input', () => {
			expect(formatTime(null)).toBe('');
		});

		it('should return original string for invalid time format', () => {
			const input = 'not-a-time';
			expect(formatTime(input)).toBe(input);
		});
	});
});

describe('Order Detail Page - Database Functions', () => {
	describe('queryOrderById', () => {
		it('should query order by ID and return formatted order', async () => {
			const mockOrder = {
				id: 1,
				stripeSessionId: 'cs_test_123',
				status: 'paid',
				customerName: 'John Doe',
				customerEmail: 'john@example.com',
				customerPhone: '(555) 123-4567',
				fulfillmentType: 'pickup',
				fulfillmentDate: '2026-01-17',
				fulfillmentTime: '15:00',
				deliveryAddress: null,
				items: [
					{
						productId: 1,
						slug: 'chocolate-chip',
						title: 'Chocolate Chip',
						priceCents: 350,
						quantity: 2
					}
				],
				subtotalCents: 700,
				tipCents: 100,
				giftBox: false,
				giftMessage: null,
				taxCents: 54,
				totalCents: 854,
				createdAt: '2026-01-16T10:00:00.000Z'
			};

			const mockGet = vi.fn().mockResolvedValue(mockOrder);
			const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockDb = { select: mockSelect };

			const result = await queryOrderById(mockDb as any, 1);

			expect(result).toBeDefined();
			expect(result?.id).toBe(1);
			expect(result?.customerName).toBe('John Doe');
			expect(result?.subtotalFormatted).toBe('$7.00');
			expect(result?.tipFormatted).toBe('$1.00');
			expect(result?.taxFormatted).toBe('$0.54');
			expect(result?.totalFormatted).toBe('$8.54');
			expect(result?.createdAtFormatted).toMatch(/Jan 16, 2026/);
			expect(result?.fulfillmentDateFormatted).toMatch(/January 17, 2026/);
		});

		it('should return null if order not found', async () => {
			const mockGet = vi.fn().mockResolvedValue(null);
			const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockDb = { select: mockSelect };

			const result = await queryOrderById(mockDb as any, 999);

			expect(result).toBeNull();
		});

		it('should handle order with delivery address', async () => {
			const deliveryAddress: DeliveryAddress = {
				street: '123 Main St',
				apt: 'Apt 4B',
				city: 'San Diego',
				state: 'CA',
				zip: '92101'
			};

			const mockOrder = {
				id: 2,
				stripeSessionId: 'cs_test_456',
				status: 'fulfilled',
				customerName: 'Jane Smith',
				customerEmail: 'jane@example.com',
				customerPhone: '(555) 987-6543',
				fulfillmentType: 'delivery',
				fulfillmentDate: '2026-01-18',
				fulfillmentTime: '14:00',
				deliveryAddress,
				items: [
					{
						productId: 2,
						slug: 'brownie',
						title: 'Brownie',
						priceCents: 500,
						quantity: 1
					}
				],
				subtotalCents: 500,
				tipCents: 0,
				giftBox: true,
				giftMessage: 'Happy Birthday!',
				taxCents: 39,
				totalCents: 839,
				createdAt: '2026-01-15T14:30:00.000Z'
			};

			const mockGet = vi.fn().mockResolvedValue(mockOrder);
			const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockDb = { select: mockSelect };

			const result = await queryOrderById(mockDb as any, 2);

			expect(result).toBeDefined();
			expect(result?.id).toBe(2);
			expect(result?.fulfillmentType).toBe('delivery');
			expect(result?.deliveryAddress).toEqual(deliveryAddress);
			expect(result?.giftBox).toBe(true);
			expect(result?.giftMessage).toBe('Happy Birthday!');
		});

		it('should handle order with multiple items', async () => {
			const items: OrderItem[] = [
				{
					productId: 1,
					slug: 'chocolate-chip',
					title: 'Chocolate Chip',
					priceCents: 350,
					quantity: 3
				},
				{
					productId: 2,
					slug: 'brownie',
					title: 'Brownie',
					priceCents: 500,
					quantity: 2
				}
			];

			const mockOrder = {
				id: 3,
				stripeSessionId: 'cs_test_789',
				status: 'pending',
				customerName: 'Bob Johnson',
				customerEmail: 'bob@example.com',
				customerPhone: '(555) 555-1234',
				fulfillmentType: 'pickup',
				fulfillmentDate: '2026-01-19',
				fulfillmentTime: '16:30',
				deliveryAddress: null,
				items,
				subtotalCents: 2050,
				tipCents: 200,
				giftBox: false,
				giftMessage: null,
				taxCents: 174,
				totalCents: 2424,
				createdAt: '2026-01-16T12:00:00.000Z'
			};

			const mockGet = vi.fn().mockResolvedValue(mockOrder);
			const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockDb = { select: mockSelect };

			const result = await queryOrderById(mockDb as any, 3);

			expect(result).toBeDefined();
			expect(result?.items).toHaveLength(2);
			expect(result?.items[0].quantity).toBe(3);
			expect(result?.items[1].quantity).toBe(2);
		});

		it('should handle order with zero tip', async () => {
			const mockOrder = {
				id: 4,
				stripeSessionId: 'cs_test_abc',
				status: 'paid',
				customerName: 'Alice Brown',
				customerEmail: 'alice@example.com',
				customerPhone: '(555) 111-2222',
				fulfillmentType: 'pickup',
				fulfillmentDate: '2026-01-20',
				fulfillmentTime: '10:00',
				deliveryAddress: null,
				items: [
					{
						productId: 1,
						slug: 'chocolate-chip',
						title: 'Chocolate Chip',
						priceCents: 350,
						quantity: 1
					}
				],
				subtotalCents: 350,
				tipCents: 0,
				giftBox: false,
				giftMessage: null,
				taxCents: 27,
				totalCents: 377,
				createdAt: '2026-01-16T08:00:00.000Z'
			};

			const mockGet = vi.fn().mockResolvedValue(mockOrder);
			const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockDb = { select: mockSelect };

			const result = await queryOrderById(mockDb as any, 4);

			expect(result).toBeDefined();
			expect(result?.tipCents).toBe(0);
			expect(result?.tipFormatted).toBe('$0.00');
		});
	});

	describe('updateOrderStatus', () => {
		it('should update order status successfully', async () => {
			const mockRun = vi.fn().mockResolvedValue({});
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
			const mockDb = { update: mockUpdate };

			const result = await updateOrderStatus(mockDb as any, 1, 'fulfilled');

			expect(result).toBe(true);
			expect(mockUpdate).toHaveBeenCalled();
			expect(mockSet).toHaveBeenCalledWith({ status: 'fulfilled' });
		});

		it('should return false if update fails', async () => {
			const mockRun = vi.fn().mockRejectedValue(new Error('Database error'));
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
			const mockDb = { update: mockUpdate };

			const result = await updateOrderStatus(mockDb as any, 1, 'fulfilled');

			expect(result).toBe(false);
		});

		it('should handle different status values', async () => {
			const mockRun = vi.fn().mockResolvedValue({});
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
			const mockDb = { update: mockUpdate };

			const statuses = ['pending', 'paid', 'fulfilled', 'cancelled'];

			for (const status of statuses) {
				const result = await updateOrderStatus(mockDb as any, 1, status);
				expect(result).toBe(true);
			}
		});
	});
});

describe('Order Detail Page - Load Function', () => {
	let load: any;

	beforeEach(async () => {
		// Import fresh module for each test
		const module = await import('./+page.server');
		load = module.load;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should throw 404 error for invalid order ID', async () => {
		await expect(
			load({
				platform: { env: { DB: {} } },
				params: { id: 'invalid' }
			})
		).rejects.toMatchObject({
			status: 404,
			body: { message: 'Order not found' }
		});
	});

	it('should throw 503 error when database is unavailable', async () => {
		await expect(
			load({
				platform: undefined,
				params: { id: '1' }
			})
		).rejects.toMatchObject({
			status: 503,
			body: { message: 'Database unavailable' }
		});
	});

	it('should throw 404 error when order not found in database', async () => {
		const { getDb } = await import('$lib/server/db');
		const mockGetDb = getDb as any;

		const mockGet = vi.fn().mockResolvedValue(null);
		const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

		mockGetDb.mockReturnValue({ select: mockSelect });

		await expect(
			load({
				platform: { env: { DB: {} } },
				params: { id: '999' }
			})
		).rejects.toMatchObject({
			status: 404,
			body: { message: 'Order not found' }
		});
	});

	it('should load order successfully', async () => {
		const { getDb } = await import('$lib/server/db');
		const mockGetDb = getDb as any;

		const mockOrder = {
			id: 1,
			stripeSessionId: 'cs_test_123',
			status: 'paid',
			customerName: 'Test User',
			customerEmail: 'test@example.com',
			customerPhone: '(555) 123-4567',
			fulfillmentType: 'pickup',
			fulfillmentDate: '2026-01-17',
			fulfillmentTime: '15:00',
			deliveryAddress: null,
			items: [
				{
					productId: 1,
					slug: 'test-cookie',
					title: 'Test Cookie',
					priceCents: 350,
					quantity: 1
				}
			],
			subtotalCents: 350,
			tipCents: 50,
			giftBox: false,
			giftMessage: null,
			taxCents: 31,
			totalCents: 431,
			createdAt: '2026-01-16T10:00:00.000Z'
		};

		const mockGet = vi.fn().mockResolvedValue(mockOrder);
		const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

		mockGetDb.mockReturnValue({ select: mockSelect });

		const result = await load({
			platform: { env: { DB: {} } },
			params: { id: '1' }
		});

		expect(result.order).toBeDefined();
		expect(result.order.id).toBe(1);
		expect(result.order.customerName).toBe('Test User');
	});

	it('should throw 500 error for database query failure', async () => {
		const { getDb } = await import('$lib/server/db');
		const mockGetDb = getDb as any;

		const mockGet = vi.fn().mockRejectedValue(new Error('Database connection failed'));
		const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

		mockGetDb.mockReturnValue({ select: mockSelect });

		await expect(
			load({
				platform: { env: { DB: {} } },
				params: { id: '1' }
			})
		).rejects.toMatchObject({
			status: 500,
			body: { message: 'Failed to load order' }
		});
	});
});

describe('Order Detail Page - Actions', () => {
	let actions: any;

	beforeEach(async () => {
		// Import fresh module for each test
		const module = await import('./+page.server');
		actions = module.actions;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('markFulfilled action', () => {
		it('should return 400 error for invalid order ID', async () => {
			const result = await actions.markFulfilled({
				platform: { env: { DB: {} } },
				params: { id: 'invalid' }
			});

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Invalid order ID' }
			});
		});

		it('should return 503 error when database is unavailable', async () => {
			const result = await actions.markFulfilled({
				platform: undefined,
				params: { id: '1' }
			});

			expect(result).toMatchObject({
				status: 503,
				data: { error: 'Database unavailable' }
			});
		});

		it('should update order status successfully', async () => {
			const { getDb } = await import('$lib/server/db');
			const mockGetDb = getDb as any;

			const mockRun = vi.fn().mockResolvedValue({});
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

			mockGetDb.mockReturnValue({ update: mockUpdate });

			const result = await actions.markFulfilled({
				platform: { env: { DB: {} } },
				params: { id: '1' }
			});

			expect(result).toEqual({ success: true });
		});

		it('should return 500 error if update fails', async () => {
			const { getDb } = await import('$lib/server/db');
			const mockGetDb = getDb as any;

			const mockRun = vi.fn().mockRejectedValue(new Error('Update failed'));
			const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

			mockGetDb.mockReturnValue({ update: mockUpdate });

			const result = await actions.markFulfilled({
				platform: { env: { DB: {} } },
				params: { id: '1' }
			});

			expect(result).toMatchObject({
				status: 500,
				data: { error: 'Failed to update order status' }
			});
		});
	});
});
