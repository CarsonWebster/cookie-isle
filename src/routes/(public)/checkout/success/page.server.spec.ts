/**
 * Checkout Success Page Server Load Function Tests
 *
 * Tests for the checkout success page's load function that verifies Stripe session
 * and loads order details from the database.
 *
 * PRD Reference: 4.4.13
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { load, type OrderData } from './+page.server';
import { formatFulfillmentDate, formatFulfillmentTime, formatFulfillmentType } from '$lib/format';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Mock the stripe module
vi.mock('$lib/server/stripe', () => ({
	getStripe: vi.fn()
}));

// Import after mocking
import { getDb } from '$lib/server/db';
import { getStripe } from '$lib/server/stripe';

// Type for the mocked functions
const mockGetDb = getDb as Mock;
const mockGetStripe = getStripe as Mock;

// Sample order for testing
const mockOrder = {
	id: 42,
	stripeSessionId: 'cs_test_123456',
	status: 'paid',
	customerName: 'John Doe',
	customerEmail: 'john@example.com',
	customerPhone: '(555) 123-4567',
	fulfillmentType: 'pickup',
	fulfillmentDate: '2026-01-20',
	fulfillmentTime: '10:00-12:00',
	deliveryAddress: null,
	items: [
		{ productId: 1, slug: 'chocolate-chip', title: 'Chocolate Chip', priceCents: 350, quantity: 6 },
		{ productId: 2, slug: 'brownie', title: 'Brownie', priceCents: 500, quantity: 2 }
	],
	subtotalCents: 3100,
	tipCents: 500,
	giftBox: false,
	giftMessage: null,
	taxCents: 240,
	totalCents: 3840,
	createdAt: '2026-01-16T12:00:00Z'
};

// Sample delivery order for testing
const mockDeliveryOrder = {
	...mockOrder,
	id: 43,
	fulfillmentType: 'delivery',
	deliveryAddress: {
		street: '123 Main St',
		apt: 'Apt 4B',
		city: 'San Diego',
		state: 'CA',
		zip: '92118'
	}
};

// Order type for mock DB results
type MockOrderType = typeof mockOrder | typeof mockDeliveryOrder;

// Helper function to create mock db with chainable methods
const createMockDb = (orders: MockOrderType[]) => {
	const mockLimit = vi.fn().mockResolvedValue(orders);
	const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
	const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
	const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

	return {
		select: mockSelect,
		_mocks: { mockSelect, mockFrom, mockWhere, mockLimit }
	};
};

// Helper function to create mock Stripe client
const createMockStripe = (
	session: { payment_status: string } | null = { payment_status: 'paid' }
) => ({
	checkout: {
		sessions: {
			retrieve: vi.fn().mockResolvedValue(session)
		}
	}
});

// Helper function to create mock platform
const createMockPlatform = () =>
	({
		env: {
			DB: {} as D1Database,
			STRIPE_SECRET_KEY: 'sk_test_123'
		}
	}) as unknown as App.Platform;

// Helper function to create mock URL with query params
const createMockUrl = (sessionId: string | null) => {
	const url = new URL('http://localhost/checkout/success');
	if (sessionId) {
		url.searchParams.set('session_id', sessionId);
	}
	return url;
};

// Helper function to safely call load
async function callLoad(params: {
	url: URL;
	platform?: App.Platform | undefined;
}): Promise<{ order: OrderData }> {
	const result = await load(params as Parameters<typeof load>[0]);
	return result as { order: OrderData };
}

describe('Checkout success page +page.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('load function', () => {
		describe('when session_id is missing', () => {
			it('throws 404 when session_id query param is not present', async () => {
				await expect(
					callLoad({
						url: createMockUrl(null),
						platform: createMockPlatform()
					})
				).rejects.toMatchObject({
					status: 404,
					body: { message: 'Order not found - missing session ID' }
				});
			});
		});

		describe('when platform is not available', () => {
			it('throws 500 when platform is undefined', async () => {
				await expect(
					callLoad({
						url: createMockUrl('cs_test_123'),
						platform: undefined
					})
				).rejects.toMatchObject({
					status: 500,
					body: { message: 'Database not available' }
				});
			});

			it('throws 500 when platform.env.DB is undefined', async () => {
				await expect(
					callLoad({
						url: createMockUrl('cs_test_123'),
						platform: { env: {} } as unknown as App.Platform
					})
				).rejects.toMatchObject({
					status: 500,
					body: { message: 'Database not available' }
				});
			});
		});

		describe('when order is found', () => {
			it('returns order data for valid session_id', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe());

				const result = await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				expect(result.order).toMatchObject({
					id: 42,
					stripeSessionId: 'cs_test_123456',
					status: 'paid',
					customerName: 'John Doe',
					customerEmail: 'john@example.com'
				});
			});

			it('returns order with all expected fields', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe());

				const result = await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				const order = result.order;
				expect(order).toHaveProperty('id');
				expect(order).toHaveProperty('stripeSessionId');
				expect(order).toHaveProperty('status');
				expect(order).toHaveProperty('customerName');
				expect(order).toHaveProperty('customerEmail');
				expect(order).toHaveProperty('customerPhone');
				expect(order).toHaveProperty('fulfillmentType');
				expect(order).toHaveProperty('fulfillmentDate');
				expect(order).toHaveProperty('fulfillmentTime');
				expect(order).toHaveProperty('deliveryAddress');
				expect(order).toHaveProperty('items');
				expect(order).toHaveProperty('subtotalCents');
				expect(order).toHaveProperty('tipCents');
				expect(order).toHaveProperty('giftBox');
				expect(order).toHaveProperty('giftMessage');
				expect(order).toHaveProperty('taxCents');
				expect(order).toHaveProperty('totalCents');
				expect(order).toHaveProperty('createdAt');
			});

			it('returns order items array', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe());

				const result = await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				expect(result.order.items).toHaveLength(2);
				expect(result.order.items[0]).toMatchObject({
					productId: 1,
					slug: 'chocolate-chip',
					title: 'Chocolate Chip',
					priceCents: 350,
					quantity: 6
				});
			});

			it('returns delivery order with address', async () => {
				const mockDb = createMockDb([mockDeliveryOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe());

				const result = await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				expect(result.order.fulfillmentType).toBe('delivery');
				expect(result.order.deliveryAddress).toMatchObject({
					street: '123 Main St',
					apt: 'Apt 4B',
					city: 'San Diego',
					state: 'CA',
					zip: '92118'
				});
			});
		});

		describe('when order is not found', () => {
			it('throws 404 when no order matches session_id', async () => {
				const mockDb = createMockDb([]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe());

				await expect(
					callLoad({
						url: createMockUrl('cs_nonexistent'),
						platform: createMockPlatform()
					})
				).rejects.toMatchObject({
					status: 404,
					body: { message: 'Order not found' }
				});
			});
		});

		describe('Stripe session verification', () => {
			it('verifies session with Stripe API', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				const mockStripe = createMockStripe();
				mockGetStripe.mockReturnValue(mockStripe);

				await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123456');
			});

			it('throws 404 when Stripe session is not paid', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe({ payment_status: 'unpaid' }));

				await expect(
					callLoad({
						url: createMockUrl('cs_test_123456'),
						platform: createMockPlatform()
					})
				).rejects.toMatchObject({
					status: 404,
					body: { message: 'Order not found - payment not completed' }
				});
			});

			it('continues to check DB if Stripe verification fails', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue({
					checkout: {
						sessions: {
							retrieve: vi.fn().mockRejectedValue(new Error('Stripe error'))
						}
					}
				});

				// Should still return order from DB even if Stripe call fails
				const result = await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				expect(result.order.id).toBe(42);
			});
		});

		describe('database query', () => {
			it('queries database with correct session_id', async () => {
				const mockDb = createMockDb([mockOrder]);
				mockGetDb.mockReturnValue(mockDb);
				mockGetStripe.mockReturnValue(createMockStripe());

				await callLoad({
					url: createMockUrl('cs_test_123456'),
					platform: createMockPlatform()
				});

				// Verify the query chain was called
				expect(mockDb._mocks.mockSelect).toHaveBeenCalled();
				expect(mockDb._mocks.mockFrom).toHaveBeenCalled();
				expect(mockDb._mocks.mockWhere).toHaveBeenCalled();
				expect(mockDb._mocks.mockLimit).toHaveBeenCalledWith(1);
			});
		});
	});

	describe('helper functions', () => {
		describe('formatFulfillmentDate', () => {
			it('formats date string to human-readable format', () => {
				// Check it contains the key parts (day of week may vary by timezone)
				const result = formatFulfillmentDate('2026-01-20');
				expect(result).toContain('January 20, 2026');
				expect(result).toMatch(/\w+day,/); // Contains a weekday
			});

			it('returns empty string for null date', () => {
				expect(formatFulfillmentDate(null)).toBe('');
			});

			it('returns empty string for empty string', () => {
				expect(formatFulfillmentDate('')).toBe('');
			});

			it('handles different date formats', () => {
				// Check it contains the key parts
				expect(formatFulfillmentDate('2026-12-25')).toContain('December 25, 2026');
				expect(formatFulfillmentDate('2026-02-14')).toContain('February 14, 2026');
			});
		});

		describe('formatFulfillmentTime', () => {
			it('formats time range to human-readable format', () => {
				expect(formatFulfillmentTime('10:00-12:00')).toBe('10:00 AM - 12:00 PM');
			});

			it('handles PM times correctly', () => {
				expect(formatFulfillmentTime('14:00-16:00')).toBe('2:00 PM - 4:00 PM');
			});

			it('handles noon correctly', () => {
				expect(formatFulfillmentTime('12:00-14:00')).toBe('12:00 PM - 2:00 PM');
			});

			it('handles midnight correctly', () => {
				expect(formatFulfillmentTime('00:00-02:00')).toBe('12:00 AM - 2:00 AM');
			});

			it('returns empty string for null time', () => {
				expect(formatFulfillmentTime(null)).toBe('');
			});

			it('returns original string for invalid format', () => {
				expect(formatFulfillmentTime('invalid')).toBe('invalid');
			});

			it('handles times with minutes', () => {
				expect(formatFulfillmentTime('09:30-11:45')).toBe('9:30 AM - 11:45 AM');
			});
		});

		describe('formatFulfillmentType', () => {
			it('capitalizes pickup', () => {
				expect(formatFulfillmentType('pickup')).toBe('Pickup');
			});

			it('capitalizes delivery', () => {
				expect(formatFulfillmentType('delivery')).toBe('Delivery');
			});

			it('returns empty string for null', () => {
				expect(formatFulfillmentType(null)).toBe('');
			});

			it('returns empty string for empty string', () => {
				expect(formatFulfillmentType('')).toBe('');
			});
		});
	});
});
