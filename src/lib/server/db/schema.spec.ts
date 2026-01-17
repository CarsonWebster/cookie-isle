import { describe, it, expect } from 'vitest';
import {
	products,
	orders,
	newsletter,
	fulfillmentSlots,
	dailyCapacity,
	adminSessions,
	images,
	type OrderItem,
	type DeliveryAddress
} from './schema';
import { getTableName, getTableColumns } from 'drizzle-orm';

describe('database schema', () => {
	describe('products table', () => {
		it('has the correct table name', () => {
			expect(getTableName(products)).toBe('products');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(products);
			expect(columns.id).toBeDefined();
			expect(columns.slug).toBeDefined();
			expect(columns.title).toBeDefined();
			expect(columns.priceCents).toBeDefined();
			expect(columns.stripePriceId).toBeDefined();
			expect(columns.description).toBeDefined();
			expect(columns.ingredients).toBeDefined();
			expect(columns.imageUrl).toBeDefined();
			expect(columns.heroImageUrl).toBeDefined();
			// Focal points for image cropping
			expect(columns.cardFocalX).toBeDefined();
			expect(columns.cardFocalY).toBeDefined();
			expect(columns.heroFocalX).toBeDefined();
			expect(columns.heroFocalY).toBeDefined();
			expect(columns.tags).toBeDefined();
			expect(columns.featured).toBeDefined();
			expect(columns.active).toBeDefined();
			expect(columns.sortOrder).toBeDefined();
			expect(columns.createdAt).toBeDefined();
			expect(columns.updatedAt).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(products);
			expect(Object.keys(columns)).toHaveLength(19);
		});
	});

	describe('orders table', () => {
		it('has the correct table name', () => {
			expect(getTableName(orders)).toBe('orders');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(orders);
			expect(columns.id).toBeDefined();
			expect(columns.stripeSessionId).toBeDefined();
			expect(columns.status).toBeDefined();
			expect(columns.customerName).toBeDefined();
			expect(columns.customerEmail).toBeDefined();
			expect(columns.customerPhone).toBeDefined();
			expect(columns.fulfillmentType).toBeDefined();
			expect(columns.fulfillmentDate).toBeDefined();
			expect(columns.fulfillmentTime).toBeDefined();
			expect(columns.deliveryAddress).toBeDefined();
			expect(columns.items).toBeDefined();
			expect(columns.subtotalCents).toBeDefined();
			expect(columns.tipCents).toBeDefined();
			expect(columns.giftBox).toBeDefined();
			expect(columns.giftMessage).toBeDefined();
			expect(columns.taxCents).toBeDefined();
			expect(columns.totalCents).toBeDefined();
			expect(columns.createdAt).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(orders);
			expect(Object.keys(columns)).toHaveLength(18);
		});
	});

	describe('newsletter table', () => {
		it('has the correct table name', () => {
			expect(getTableName(newsletter)).toBe('newsletter');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(newsletter);
			expect(columns.id).toBeDefined();
			expect(columns.email).toBeDefined();
			expect(columns.source).toBeDefined();
			expect(columns.subscribedAt).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(newsletter);
			expect(Object.keys(columns)).toHaveLength(4);
		});
	});

	describe('fulfillmentSlots table', () => {
		it('has the correct table name', () => {
			expect(getTableName(fulfillmentSlots)).toBe('fulfillment_slots');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(fulfillmentSlots);
			expect(columns.id).toBeDefined();
			expect(columns.date).toBeDefined();
			expect(columns.startTime).toBeDefined();
			expect(columns.endTime).toBeDefined();
			expect(columns.slotType).toBeDefined();
			expect(columns.maxCookies).toBeDefined();
			expect(columns.active).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(fulfillmentSlots);
			expect(Object.keys(columns)).toHaveLength(7);
		});
	});

	describe('dailyCapacity table', () => {
		it('has the correct table name', () => {
			expect(getTableName(dailyCapacity)).toBe('daily_capacity');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(dailyCapacity);
			expect(columns.date).toBeDefined();
			expect(columns.cookiesOrdered).toBeDefined();
			expect(columns.updatedAt).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(dailyCapacity);
			expect(Object.keys(columns)).toHaveLength(3);
		});
	});

	describe('adminSessions table', () => {
		it('has the correct table name', () => {
			expect(getTableName(adminSessions)).toBe('admin_sessions');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(adminSessions);
			expect(columns.id).toBeDefined();
			expect(columns.expiresAt).toBeDefined();
			expect(columns.createdAt).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(adminSessions);
			expect(Object.keys(columns)).toHaveLength(3);
		});
	});

	describe('OrderItem type', () => {
		it('accepts valid OrderItem objects', () => {
			const validItem: OrderItem = {
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip Cookie',
				priceCents: 350,
				quantity: 6
			};

			expect(validItem.productId).toBe(1);
			expect(validItem.slug).toBe('chocolate-chip');
			expect(validItem.title).toBe('Chocolate Chip Cookie');
			expect(validItem.priceCents).toBe(350);
			expect(validItem.quantity).toBe(6);
		});

		it('enforces required fields', () => {
			// TypeScript compile-time check - this test verifies the type structure
			const item: OrderItem = {
				productId: 1,
				slug: 'test',
				title: 'Test',
				priceCents: 100,
				quantity: 1
			};
			// All fields are required and have correct types
			expect(typeof item.productId).toBe('number');
			expect(typeof item.slug).toBe('string');
			expect(typeof item.title).toBe('string');
			expect(typeof item.priceCents).toBe('number');
			expect(typeof item.quantity).toBe('number');
		});
	});

	describe('images table', () => {
		it('has the correct table name', () => {
			expect(getTableName(images)).toBe('images');
		});

		it('has all required columns', () => {
			const columns = getTableColumns(images);
			expect(columns.id).toBeDefined();
			expect(columns.filename).toBeDefined();
			expect(columns.originalName).toBeDefined();
			expect(columns.url).toBeDefined();
			expect(columns.mimeType).toBeDefined();
			expect(columns.sizeBytes).toBeDefined();
			expect(columns.cardFocalX).toBeDefined();
			expect(columns.cardFocalY).toBeDefined();
			expect(columns.heroFocalX).toBeDefined();
			expect(columns.heroFocalY).toBeDefined();
			expect(columns.createdAt).toBeDefined();
		});

		it('has correct column count', () => {
			const columns = getTableColumns(images);
			expect(Object.keys(columns)).toHaveLength(11);
		});
	});

	describe('DeliveryAddress type', () => {
		it('accepts valid DeliveryAddress with all fields', () => {
			const fullAddress: DeliveryAddress = {
				street: '123 Main St',
				apt: 'Apt 4B',
				city: 'Springfield',
				state: 'IL',
				zip: '62701'
			};

			expect(fullAddress.street).toBe('123 Main St');
			expect(fullAddress.apt).toBe('Apt 4B');
			expect(fullAddress.city).toBe('Springfield');
			expect(fullAddress.state).toBe('IL');
			expect(fullAddress.zip).toBe('62701');
		});

		it('accepts DeliveryAddress without optional apt field', () => {
			const addressWithoutApt: DeliveryAddress = {
				street: '456 Oak Ave',
				city: 'Riverside',
				state: 'CA',
				zip: '92501'
			};

			expect(addressWithoutApt.street).toBe('456 Oak Ave');
			expect(addressWithoutApt.apt).toBeUndefined();
			expect(addressWithoutApt.city).toBe('Riverside');
			expect(addressWithoutApt.state).toBe('CA');
			expect(addressWithoutApt.zip).toBe('92501');
		});

		it('enforces required fields have correct types', () => {
			const address: DeliveryAddress = {
				street: '789 Pine Rd',
				city: 'Oakland',
				state: 'CA',
				zip: '94601'
			};
			expect(typeof address.street).toBe('string');
			expect(typeof address.city).toBe('string');
			expect(typeof address.state).toBe('string');
			expect(typeof address.zip).toBe('string');
		});
	});
});
