import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	parseWebhookMetadata,
	parseOrderItems,
	parseDeliveryAddress,
	calculateSubtotal,
	calculateTotalQuantity,
	type WebhookMetadata
} from './+server';

// ============================================================================
// parseWebhookMetadata Tests
// ============================================================================

describe('parseWebhookMetadata', () => {
	const validMetadata: WebhookMetadata = {
		customer_firstName: 'John',
		customer_lastName: 'Doe',
		customer_email: 'john@example.com',
		customer_phone: '(555) 123-4567',
		fulfillment_type: 'pickup',
		fulfillment_slotId: '1',
		fulfillment_date: '2026-01-20',
		fulfillment_startTime: '10:00',
		fulfillment_endTime: '12:00',
		tip_cents: '500',
		include_gift_box: 'false',
		items_json: JSON.stringify([
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 2
			}
		])
	};

	it('should parse valid metadata', () => {
		const result = parseWebhookMetadata(validMetadata as unknown as Record<string, string>);
		expect(result).not.toBeNull();
		expect(result?.customer_firstName).toBe('John');
		expect(result?.fulfillment_type).toBe('pickup');
	});

	it('should return null for null metadata', () => {
		const result = parseWebhookMetadata(null);
		expect(result).toBeNull();
	});

	it('should return null for empty object', () => {
		const result = parseWebhookMetadata({});
		expect(result).toBeNull();
	});

	it('should return null if customer_firstName is missing', () => {
		const { customer_firstName, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if customer_lastName is missing', () => {
		const { customer_lastName, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if customer_email is missing', () => {
		const { customer_email, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if customer_phone is missing', () => {
		const { customer_phone, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if fulfillment_type is missing', () => {
		const { fulfillment_type, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if fulfillment_slotId is missing', () => {
		const { fulfillment_slotId, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if fulfillment_date is missing', () => {
		const { fulfillment_date, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should return null if items_json is missing', () => {
		const { items_json, ...incomplete } = validMetadata;
		const result = parseWebhookMetadata(incomplete as unknown as Record<string, string>);
		expect(result).toBeNull();
	});

	it('should include optional gift_message field', () => {
		const withGift = { ...validMetadata, gift_message: 'Happy Birthday!' };
		const result = parseWebhookMetadata(withGift as unknown as Record<string, string>);
		expect(result?.gift_message).toBe('Happy Birthday!');
	});

	it('should include optional delivery_address field', () => {
		const withAddress = {
			...validMetadata,
			fulfillment_type: 'delivery' as const,
			delivery_address: JSON.stringify({
				street: '123 Main St',
				city: 'San Diego',
				state: 'CA',
				zip: '92101'
			})
		};
		const result = parseWebhookMetadata(withAddress as unknown as Record<string, string>);
		expect(result?.delivery_address).toBeTruthy();
	});
});

// ============================================================================
// parseOrderItems Tests
// ============================================================================

describe('parseOrderItems', () => {
	it('should parse valid items JSON', () => {
		const itemsJson = JSON.stringify([
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 2
			},
			{ productId: 2, slug: 'brownie', title: 'Brownie', priceCents: 500, quantity: 1 }
		]);

		const result = parseOrderItems(itemsJson);
		expect(result).toHaveLength(2);
		expect(result[0].productId).toBe(1);
		expect(result[0].slug).toBe('chocolate-chip');
		expect(result[0].title).toBe('Chocolate Chip');
		expect(result[0].priceCents).toBe(350);
		expect(result[0].quantity).toBe(2);
		expect(result[1].productId).toBe(2);
	});

	it('should return empty array for invalid JSON', () => {
		const result = parseOrderItems('invalid json');
		expect(result).toEqual([]);
	});

	it('should return empty array for non-array JSON', () => {
		const result = parseOrderItems('{"not": "array"}');
		expect(result).toEqual([]);
	});

	it('should return empty array for empty string', () => {
		const result = parseOrderItems('');
		expect(result).toEqual([]);
	});

	it('should parse empty array', () => {
		const result = parseOrderItems('[]');
		expect(result).toEqual([]);
	});

	it('should handle items with missing fields', () => {
		const itemsJson = JSON.stringify([
			{ productId: 1, title: 'Test' } // missing slug, priceCents, quantity
		]);

		const result = parseOrderItems(itemsJson);
		expect(result).toHaveLength(1);
		expect(result[0].productId).toBe(1);
		expect(result[0].slug).toBeUndefined();
	});
});

// ============================================================================
// parseDeliveryAddress Tests
// ============================================================================

describe('parseDeliveryAddress', () => {
	it('should parse valid address JSON', () => {
		const addressJson = JSON.stringify({
			street: '123 Main St',
			apt: 'Suite 100',
			city: 'San Diego',
			state: 'CA',
			zip: '92101'
		});

		const result = parseDeliveryAddress(addressJson);
		expect(result).not.toBeNull();
		expect(result?.street).toBe('123 Main St');
		expect(result?.apt).toBe('Suite 100');
		expect(result?.city).toBe('San Diego');
		expect(result?.state).toBe('CA');
		expect(result?.zip).toBe('92101');
	});

	it('should return null for undefined input', () => {
		const result = parseDeliveryAddress(undefined);
		expect(result).toBeNull();
	});

	it('should return null for empty string', () => {
		const result = parseDeliveryAddress('');
		expect(result).toBeNull();
	});

	it('should return null for invalid JSON', () => {
		const result = parseDeliveryAddress('invalid json');
		expect(result).toBeNull();
	});

	it('should return null for object without street', () => {
		const result = parseDeliveryAddress(JSON.stringify({ city: 'San Diego' }));
		expect(result).toBeNull();
	});

	it('should handle address without optional apt field', () => {
		const addressJson = JSON.stringify({
			street: '123 Main St',
			city: 'San Diego',
			state: 'CA',
			zip: '92101'
		});

		const result = parseDeliveryAddress(addressJson);
		expect(result).not.toBeNull();
		expect(result?.apt).toBeUndefined();
	});

	it('should return null for non-object JSON', () => {
		const result = parseDeliveryAddress('"just a string"');
		expect(result).toBeNull();
	});

	it('should return null for array JSON', () => {
		const result = parseDeliveryAddress('[]');
		expect(result).toBeNull();
	});
});

// ============================================================================
// calculateSubtotal Tests
// ============================================================================

describe('calculateSubtotal', () => {
	it('should calculate subtotal for single item', () => {
		const items = [
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 1
			}
		];
		expect(calculateSubtotal(items)).toBe(350);
	});

	it('should calculate subtotal for single item with quantity > 1', () => {
		const items = [
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 3
			}
		];
		expect(calculateSubtotal(items)).toBe(1050);
	});

	it('should calculate subtotal for multiple items', () => {
		const items = [
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 2
			},
			{ productId: 2, slug: 'brownie', title: 'Brownie', priceCents: 500, quantity: 1 }
		];
		expect(calculateSubtotal(items)).toBe(1200); // (350 * 2) + (500 * 1)
	});

	it('should return 0 for empty array', () => {
		expect(calculateSubtotal([])).toBe(0);
	});

	it('should handle items with 0 price', () => {
		const items = [
			{ productId: 1, slug: 'free-sample', title: 'Free Sample', priceCents: 0, quantity: 5 }
		];
		expect(calculateSubtotal(items)).toBe(0);
	});

	it('should handle large orders', () => {
		const items = [
			{ productId: 1, slug: 'cookie', title: 'Cookie', priceCents: 350, quantity: 50 }
		];
		expect(calculateSubtotal(items)).toBe(17500);
	});
});

// ============================================================================
// calculateTotalQuantity Tests
// ============================================================================

describe('calculateTotalQuantity', () => {
	it('should calculate quantity for single item', () => {
		const items = [
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 1
			}
		];
		expect(calculateTotalQuantity(items)).toBe(1);
	});

	it('should sum quantities for multiple items', () => {
		const items = [
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 5
			},
			{ productId: 2, slug: 'brownie', title: 'Brownie', priceCents: 500, quantity: 3 }
		];
		expect(calculateTotalQuantity(items)).toBe(8);
	});

	it('should return 0 for empty array', () => {
		expect(calculateTotalQuantity([])).toBe(0);
	});

	it('should handle large quantities', () => {
		const items = [
			{ productId: 1, slug: 'cookie', title: 'Cookie', priceCents: 350, quantity: 50 }
		];
		expect(calculateTotalQuantity(items)).toBe(50);
	});

	it('should handle many different items', () => {
		const items = [
			{ productId: 1, slug: 'a', title: 'A', priceCents: 100, quantity: 1 },
			{ productId: 2, slug: 'b', title: 'B', priceCents: 100, quantity: 2 },
			{ productId: 3, slug: 'c', title: 'C', priceCents: 100, quantity: 3 },
			{ productId: 4, slug: 'd', title: 'D', priceCents: 100, quantity: 4 }
		];
		expect(calculateTotalQuantity(items)).toBe(10);
	});
});

// ============================================================================
// Integration-style Tests for Type Safety
// ============================================================================

describe('Type Safety', () => {
	it('should maintain OrderItem structure after parsing', () => {
		const itemsJson = JSON.stringify([
			{
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip',
				priceCents: 350,
				quantity: 2
			}
		]);

		const items = parseOrderItems(itemsJson);

		// TypeScript should allow these accesses
		const item = items[0];
		const productId: number = item.productId;
		const slug: string = item.slug;
		const title: string = item.title;
		const priceCents: number = item.priceCents;
		const quantity: number = item.quantity;

		expect(productId).toBe(1);
		expect(slug).toBe('chocolate-chip');
		expect(title).toBe('Chocolate Chip');
		expect(priceCents).toBe(350);
		expect(quantity).toBe(2);
	});

	it('should maintain DeliveryAddress structure after parsing', () => {
		const addressJson = JSON.stringify({
			street: '123 Main St',
			apt: 'Suite 100',
			city: 'San Diego',
			state: 'CA',
			zip: '92101'
		});

		const address = parseDeliveryAddress(addressJson);

		if (address) {
			// TypeScript should allow these accesses
			const street: string = address.street;
			const apt: string | undefined = address.apt;
			const city: string = address.city;
			const state: string = address.state;
			const zip: string = address.zip;

			expect(street).toBe('123 Main St');
			expect(apt).toBe('Suite 100');
			expect(city).toBe('San Diego');
			expect(state).toBe('CA');
			expect(zip).toBe('92101');
		}
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
	it('should handle metadata with extra fields', () => {
		const metadataWithExtra = {
			customer_firstName: 'John',
			customer_lastName: 'Doe',
			customer_email: 'john@example.com',
			customer_phone: '(555) 123-4567',
			fulfillment_type: 'pickup',
			fulfillment_slotId: '1',
			fulfillment_date: '2026-01-20',
			fulfillment_startTime: '10:00',
			fulfillment_endTime: '12:00',
			tip_cents: '0',
			include_gift_box: 'false',
			items_json: '[]',
			extra_field: 'should be ignored'
		};

		const result = parseWebhookMetadata(metadataWithExtra);
		expect(result).not.toBeNull();
	});

	it('should handle numeric tip_cents as string', () => {
		const metadata: WebhookMetadata = {
			customer_firstName: 'John',
			customer_lastName: 'Doe',
			customer_email: 'john@example.com',
			customer_phone: '(555) 123-4567',
			fulfillment_type: 'pickup',
			fulfillment_slotId: '1',
			fulfillment_date: '2026-01-20',
			fulfillment_startTime: '10:00',
			fulfillment_endTime: '12:00',
			tip_cents: '1500',
			include_gift_box: 'true',
			items_json: '[]'
		};

		const result = parseWebhookMetadata(metadata as unknown as Record<string, string>);
		expect(result).not.toBeNull();
		expect(result?.tip_cents).toBe('1500');
		expect(parseInt(result?.tip_cents || '0', 10)).toBe(1500);
	});

	it('should handle special characters in address', () => {
		const addressJson = JSON.stringify({
			street: '123 Main St #100',
			apt: 'Apt. A-1',
			city: 'San Diego',
			state: 'CA',
			zip: '92101'
		});

		const result = parseDeliveryAddress(addressJson);
		expect(result?.street).toBe('123 Main St #100');
		expect(result?.apt).toBe('Apt. A-1');
	});

	it('should handle unicode characters in product titles', () => {
		const itemsJson = JSON.stringify([
			{ productId: 1, slug: 'special', title: 'Caf\u00e9 Cookie', priceCents: 400, quantity: 1 }
		]);

		const items = parseOrderItems(itemsJson);
		expect(items[0].title).toBe('Caf\u00e9 Cookie');
	});
});
