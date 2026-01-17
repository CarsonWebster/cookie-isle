import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	validateCheckoutRequest,
	validateCartItemsAgainstDb,
	buildStripeLineItems,
	buildOrderMetadata,
	type CheckoutRequest,
	type CheckoutCartItem
} from './+server';

// Mock the config module
vi.mock('$lib/config', () => ({
	config: {
		order: {
			maxOrderQuantity: 50,
			taxEnabled: false,
			salesTaxRate: 0.0775
		},
		giftBox: {
			enabled: true,
			priceCents: 300,
			stripePriceId: 'price_giftbox_123'
		},
		fulfillment: {
			allowedDeliveryZips: ['92118'],
			deliveryZipError: 'Sorry, we only deliver to Coronado Island (ZIP 92118).'
		}
	},
	isZipAllowedForDelivery: (zip: string) => zip === '92118'
}));

// ============================================================================
// Test Data Helpers
// ============================================================================

function createValidCartItem(overrides: Partial<CheckoutCartItem> = {}): CheckoutCartItem {
	return {
		productId: 1,
		slug: 'chocolate-chip',
		title: 'Chocolate Chip Cookie',
		priceCents: 350,
		stripePriceId: 'price_123',
		quantity: 2,
		...overrides
	};
}

function createValidCheckoutRequest(overrides: Partial<CheckoutRequest> = {}): CheckoutRequest {
	return {
		items: [createValidCartItem()],
		customer: {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '(555) 123-4567'
		},
		fulfillment: {
			type: 'pickup',
			slotId: 1,
			date: '2026-01-20',
			startTime: '10:00',
			endTime: '12:00'
		},
		tipCents: 0,
		includeGiftBox: false,
		...overrides
	};
}

function createValidDeliveryRequest(): CheckoutRequest {
	return createValidCheckoutRequest({
		fulfillment: {
			type: 'delivery',
			slotId: 2,
			date: '2026-01-21',
			startTime: '14:00',
			endTime: '16:00',
			address: {
				street: '123 Beach St',
				apt: 'Unit A',
				city: 'Coronado',
				state: 'CA',
				zip: '92118'
			}
		}
	});
}

// ============================================================================
// validateCheckoutRequest Tests
// ============================================================================

describe('validateCheckoutRequest', () => {
	describe('request body validation', () => {
		it('returns error for null body', () => {
			const errors = validateCheckoutRequest(null);
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('returns error for undefined body', () => {
			const errors = validateCheckoutRequest(undefined);
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('returns error for non-object body', () => {
			const errors = validateCheckoutRequest('string');
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('returns no errors for valid request', () => {
			const request = createValidCheckoutRequest();
			const errors = validateCheckoutRequest(request);
			expect(errors).toHaveLength(0);
		});
	});

	describe('items validation', () => {
		it('returns error when items is not an array', () => {
			const request = { ...createValidCheckoutRequest(), items: 'not-array' };
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items must be an array');
		});

		it('returns error when items is empty', () => {
			const request = createValidCheckoutRequest({ items: [] });
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('Cart cannot be empty');
		});

		it('returns error when item productId is invalid', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ productId: -1 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].productId must be a positive number');
		});

		it('returns error when item slug is empty', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ slug: '' })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].slug must be a non-empty string');
		});

		it('returns error when item title is empty', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ title: '' })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].title must be a non-empty string');
		});

		it('returns error when item priceCents is negative', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ priceCents: -100 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].priceCents must be a non-negative number');
		});

		it('returns error when item stripePriceId is empty', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ stripePriceId: '' })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].stripePriceId must be a non-empty string');
		});

		it('returns error when item quantity is zero', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ quantity: 0 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].quantity must be a positive integer');
		});

		it('returns error when item quantity is negative', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ quantity: -1 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].quantity must be a positive integer');
		});

		it('returns error when item quantity is not an integer', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ quantity: 1.5 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].quantity must be a positive integer');
		});

		it('validates multiple items and reports all errors', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ slug: '' }), createValidCartItem({ quantity: 0 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('items[0].slug must be a non-empty string');
			expect(errors).toContain('items[1].quantity must be a positive integer');
		});
	});

	describe('max order quantity validation', () => {
		it('returns error when total quantity exceeds max', () => {
			const request = createValidCheckoutRequest({
				items: [
					createValidCartItem({ quantity: 30 }),
					createValidCartItem({ productId: 2, quantity: 25 })
				]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('Order exceeds maximum quantity of 50 items');
		});

		it('allows order at exactly max quantity', () => {
			const request = createValidCheckoutRequest({
				items: [createValidCartItem({ quantity: 50 })]
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).not.toContain('Order exceeds maximum quantity of 50 items');
		});
	});

	describe('customer validation', () => {
		it('returns error when customer is missing', () => {
			const request = { ...createValidCheckoutRequest() };
			delete (request as Record<string, unknown>).customer;
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('customer information is required');
		});

		it('returns error when firstName is missing', () => {
			const request = createValidCheckoutRequest();
			request.customer.firstName = '';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('customer.firstName is required');
		});

		it('returns error when lastName is missing', () => {
			const request = createValidCheckoutRequest();
			request.customer.lastName = '';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('customer.lastName is required');
		});

		it('returns error for invalid email', () => {
			const request = createValidCheckoutRequest();
			request.customer.email = 'invalid-email';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('customer.email must be a valid email address');
		});

		it('returns error when phone is missing', () => {
			const request = createValidCheckoutRequest();
			request.customer.phone = '';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('customer.phone is required');
		});

		it('accepts valid email formats', () => {
			const request = createValidCheckoutRequest();
			request.customer.email = 'test@test.com';
			const errors = validateCheckoutRequest(request);
			expect(errors.filter((e) => e.includes('email'))).toHaveLength(0);
		});
	});

	describe('fulfillment validation', () => {
		it('returns error when fulfillment is missing', () => {
			const request = { ...createValidCheckoutRequest() };
			delete (request as Record<string, unknown>).fulfillment;
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment information is required');
		});

		it('returns error for invalid fulfillment type', () => {
			const request = createValidCheckoutRequest();
			(request.fulfillment as { type: string }).type = 'invalid';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.type must be "pickup" or "delivery"');
		});

		it('returns error when slotId is invalid', () => {
			const request = createValidCheckoutRequest();
			request.fulfillment.slotId = 0;
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.slotId must be a positive number');
		});

		it('returns error for invalid date format', () => {
			const request = createValidCheckoutRequest();
			request.fulfillment.date = '01-20-2026';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.date must be in YYYY-MM-DD format');
		});

		it('returns error for invalid startTime format', () => {
			const request = createValidCheckoutRequest();
			request.fulfillment.startTime = '10:00 AM';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.startTime must be in HH:MM format');
		});

		it('returns error for invalid endTime format', () => {
			const request = createValidCheckoutRequest();
			request.fulfillment.endTime = '12:00:00';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.endTime must be in HH:MM format');
		});
	});

	describe('delivery address validation', () => {
		it('returns error when delivery address is missing for delivery type', () => {
			const request = createValidCheckoutRequest({
				fulfillment: {
					type: 'delivery',
					slotId: 1,
					date: '2026-01-20',
					startTime: '10:00',
					endTime: '12:00'
				}
			});
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.address is required for delivery');
		});

		it('does not require address for pickup type', () => {
			const request = createValidCheckoutRequest();
			request.fulfillment.type = 'pickup';
			const errors = validateCheckoutRequest(request);
			expect(errors.filter((e) => e.includes('address'))).toHaveLength(0);
		});

		it('validates delivery address street', () => {
			const request = createValidDeliveryRequest();
			request.fulfillment.address!.street = '';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.address.street is required');
		});

		it('validates delivery address city', () => {
			const request = createValidDeliveryRequest();
			request.fulfillment.address!.city = '';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.address.city is required');
		});

		it('validates delivery address state', () => {
			const request = createValidDeliveryRequest();
			request.fulfillment.address!.state = '';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.address.state is required');
		});

		it('validates delivery address zip format', () => {
			const request = createValidDeliveryRequest();
			request.fulfillment.address!.zip = '1234';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('fulfillment.address.zip must be a 5-digit ZIP code');
		});

		it('validates delivery zip is in allowed area', () => {
			const request = createValidDeliveryRequest();
			request.fulfillment.address!.zip = '90210';
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('Sorry, we only deliver to Coronado Island (ZIP 92118).');
		});

		it('accepts valid delivery address', () => {
			const request = createValidDeliveryRequest();
			const errors = validateCheckoutRequest(request);
			expect(errors.filter((e) => e.includes('address'))).toHaveLength(0);
		});
	});

	describe('tip validation', () => {
		it('returns error when tipCents is negative', () => {
			const request = createValidCheckoutRequest({ tipCents: -100 });
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('tipCents must be a non-negative number');
		});

		it('accepts zero tip', () => {
			const request = createValidCheckoutRequest({ tipCents: 0 });
			const errors = validateCheckoutRequest(request);
			expect(errors.filter((e) => e.includes('tip'))).toHaveLength(0);
		});

		it('accepts positive tip', () => {
			const request = createValidCheckoutRequest({ tipCents: 500 });
			const errors = validateCheckoutRequest(request);
			expect(errors.filter((e) => e.includes('tip'))).toHaveLength(0);
		});
	});

	describe('gift box validation', () => {
		it('returns error when includeGiftBox is not boolean', () => {
			const request = { ...createValidCheckoutRequest(), includeGiftBox: 'yes' };
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('includeGiftBox must be a boolean');
		});

		it('returns error when giftMessage is not string', () => {
			const request = { ...createValidCheckoutRequest(), giftMessage: 123 };
			const errors = validateCheckoutRequest(request);
			expect(errors).toContain('giftMessage must be a string');
		});

		it('accepts valid gift message', () => {
			const request = createValidCheckoutRequest({
				includeGiftBox: true,
				giftMessage: 'Happy Birthday!'
			});
			const errors = validateCheckoutRequest(request);
			expect(errors.filter((e) => e.includes('gift'))).toHaveLength(0);
		});
	});
});

// ============================================================================
// validateCartItemsAgainstDb Tests
// ============================================================================

describe('validateCartItemsAgainstDb', () => {
	function createMockDb(
		products: Array<{ id: number; active: boolean; priceCents: number; stripePriceId: string }>
	) {
		const mockWhere = vi.fn().mockResolvedValue(products);
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		return { select: mockSelect } as unknown as ReturnType<typeof import('$lib/server/db').getDb>;
	}

	it('returns no errors when all products are valid', async () => {
		const items = [createValidCartItem()];
		const db = createMockDb([{ id: 1, active: true, priceCents: 350, stripePriceId: 'price_123' }]);

		const errors = await validateCartItemsAgainstDb(db, items);
		expect(errors).toHaveLength(0);
	});

	it('returns error when product not found', async () => {
		const items = [createValidCartItem()];
		const db = createMockDb([]);

		const errors = await validateCartItemsAgainstDb(db, items);
		expect(errors).toContain('Product "Chocolate Chip Cookie" (ID: 1) not found');
	});

	it('returns error when product is inactive', async () => {
		const items = [createValidCartItem()];
		const db = createMockDb([
			{ id: 1, active: false, priceCents: 350, stripePriceId: 'price_123' }
		]);

		const errors = await validateCartItemsAgainstDb(db, items);
		expect(errors).toContain('Product "Chocolate Chip Cookie" is no longer available');
	});

	it('returns error when price does not match', async () => {
		const items = [createValidCartItem({ priceCents: 350 })];
		const db = createMockDb([{ id: 1, active: true, priceCents: 400, stripePriceId: 'price_123' }]);

		const errors = await validateCartItemsAgainstDb(db, items);
		expect(errors).toContain(
			'Price for "Chocolate Chip Cookie" has changed. Please refresh and try again.'
		);
	});

	it('returns error when stripe price ID does not match', async () => {
		const items = [createValidCartItem({ stripePriceId: 'price_123' })];
		const db = createMockDb([{ id: 1, active: true, priceCents: 350, stripePriceId: 'price_456' }]);

		const errors = await validateCartItemsAgainstDb(db, items);
		expect(errors).toContain(
			'Product "Chocolate Chip Cookie" has been updated. Please refresh and try again.'
		);
	});

	it('validates multiple products and reports all errors', async () => {
		const items = [
			createValidCartItem({ productId: 1 }),
			createValidCartItem({ productId: 2, slug: 'brownie', title: 'Brownie' })
		];
		const db = createMockDb([
			{ id: 1, active: false, priceCents: 350, stripePriceId: 'price_123' }
			// Product 2 not in database
		]);

		const errors = await validateCartItemsAgainstDb(db, items);
		expect(errors).toContain('Product "Chocolate Chip Cookie" is no longer available');
		expect(errors).toContain('Product "Brownie" (ID: 2) not found');
	});
});

// ============================================================================
// buildStripeLineItems Tests
// ============================================================================

describe('buildStripeLineItems', () => {
	it('builds line items from cart items', () => {
		const items = [
			createValidCartItem({ stripePriceId: 'price_1', quantity: 2 }),
			createValidCartItem({ productId: 2, stripePriceId: 'price_2', quantity: 3 })
		];

		const lineItems = buildStripeLineItems(items, 0, false);

		expect(lineItems).toHaveLength(2);
		expect(lineItems[0]).toEqual({ price: 'price_1', quantity: 2 });
		expect(lineItems[1]).toEqual({ price: 'price_2', quantity: 3 });
	});

	it('adds tip as custom line item when present', () => {
		const items = [createValidCartItem()];
		const lineItems = buildStripeLineItems(items, 500, false);

		expect(lineItems).toHaveLength(2);
		expect(lineItems[1]).toEqual({
			price_data: {
				currency: 'usd',
				product_data: { name: 'Tip' },
				unit_amount: 500
			},
			quantity: 1
		});
	});

	it('does not add tip when zero', () => {
		const items = [createValidCartItem()];
		const lineItems = buildStripeLineItems(items, 0, false);

		expect(lineItems).toHaveLength(1);
	});

	it('adds gift box when included', () => {
		const items = [createValidCartItem()];
		const lineItems = buildStripeLineItems(items, 0, true);

		expect(lineItems).toHaveLength(2);
		expect(lineItems[1]).toEqual({
			price: 'price_giftbox_123',
			quantity: 1
		});
	});

	it('adds both tip and gift box when present', () => {
		const items = [createValidCartItem()];
		const lineItems = buildStripeLineItems(items, 200, true);

		expect(lineItems).toHaveLength(3);
		// Item
		expect(lineItems[0]).toEqual({ price: 'price_123', quantity: 2 });
		// Tip
		expect(lineItems[1]).toHaveProperty('price_data.product_data.name', 'Tip');
		// Gift box
		expect(lineItems[2]).toEqual({ price: 'price_giftbox_123', quantity: 1 });
	});
});

// ============================================================================
// buildOrderMetadata Tests
// ============================================================================

describe('buildOrderMetadata', () => {
	it('includes customer information', () => {
		const request = createValidCheckoutRequest();
		const metadata = buildOrderMetadata(request);

		expect(metadata.customer_firstName).toBe('John');
		expect(metadata.customer_lastName).toBe('Doe');
		expect(metadata.customer_email).toBe('john@example.com');
		expect(metadata.customer_phone).toBe('(555) 123-4567');
	});

	it('includes fulfillment information', () => {
		const request = createValidCheckoutRequest();
		const metadata = buildOrderMetadata(request);

		expect(metadata.fulfillment_type).toBe('pickup');
		expect(metadata.fulfillment_slotId).toBe('1');
		expect(metadata.fulfillment_date).toBe('2026-01-20');
		expect(metadata.fulfillment_startTime).toBe('10:00');
		expect(metadata.fulfillment_endTime).toBe('12:00');
	});

	it('includes extras information', () => {
		const request = createValidCheckoutRequest({
			tipCents: 300,
			includeGiftBox: true,
			giftMessage: 'Happy Birthday!'
		});
		const metadata = buildOrderMetadata(request);

		expect(metadata.tip_cents).toBe('300');
		expect(metadata.include_gift_box).toBe('true');
		expect(metadata.gift_message).toBe('Happy Birthday!');
	});

	it('includes items as JSON', () => {
		const request = createValidCheckoutRequest({
			items: [
				createValidCartItem({ productId: 1, slug: 'a', title: 'A', priceCents: 100, quantity: 1 }),
				createValidCartItem({ productId: 2, slug: 'b', title: 'B', priceCents: 200, quantity: 2 })
			]
		});
		const metadata = buildOrderMetadata(request);

		const items = JSON.parse(metadata.items_json);
		expect(items).toHaveLength(2);
		expect(items[0]).toEqual({ productId: 1, slug: 'a', title: 'A', priceCents: 100, quantity: 1 });
		expect(items[1]).toEqual({ productId: 2, slug: 'b', title: 'B', priceCents: 200, quantity: 2 });
	});

	it('includes delivery address when fulfillment is delivery', () => {
		const request = createValidDeliveryRequest();
		const metadata = buildOrderMetadata(request);

		const address = JSON.parse(metadata.delivery_address);
		expect(address).toEqual({
			street: '123 Beach St',
			apt: 'Unit A',
			city: 'Coronado',
			state: 'CA',
			zip: '92118'
		});
	});

	it('does not include delivery address for pickup', () => {
		const request = createValidCheckoutRequest();
		const metadata = buildOrderMetadata(request);

		expect(metadata.delivery_address).toBeUndefined();
	});

	it('truncates long gift message to 500 characters', () => {
		const longMessage = 'A'.repeat(600);
		const request = createValidCheckoutRequest({
			includeGiftBox: true,
			giftMessage: longMessage
		});
		const metadata = buildOrderMetadata(request);

		expect(metadata.gift_message).toHaveLength(500);
	});
});

// ============================================================================
// Integration Considerations
// ============================================================================

describe('checkout API types', () => {
	it('CheckoutCartItem has all required fields', () => {
		const item: CheckoutCartItem = {
			productId: 1,
			slug: 'test',
			title: 'Test',
			priceCents: 100,
			stripePriceId: 'price_test',
			quantity: 1
		};

		expect(item.productId).toBeDefined();
		expect(item.slug).toBeDefined();
		expect(item.title).toBeDefined();
		expect(item.priceCents).toBeDefined();
		expect(item.stripePriceId).toBeDefined();
		expect(item.quantity).toBeDefined();
	});

	it('CheckoutRequest has all required fields', () => {
		const request: CheckoutRequest = createValidCheckoutRequest();

		expect(request.items).toBeDefined();
		expect(request.customer).toBeDefined();
		expect(request.fulfillment).toBeDefined();
		expect(request.tipCents).toBeDefined();
		expect(request.includeGiftBox).toBeDefined();
	});
});
