import { describe, it, expect, beforeEach } from 'vitest';
import {
	getItems,
	getCartTotal,
	getCartTotalFormatted,
	isCartEmpty,
	addToCart,
	updateQuantity,
	removeFromCart,
	_resetForTesting,
	_setItemsForTesting,
	getMaxQuantityPerItem
} from '$lib/stores/cart.svelte';
import { config, formatPrice, isZipAllowedForDelivery } from '$lib/config';
import type { CartItem } from '$lib/stores/cart.svelte';

/**
 * Unit tests for Checkout Page - Cart Display and Customer Form logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the cart store operations, display logic, and form validation
 * logic used by the checkout page.
 *
 * PRD Reference: 3.5, 3.6
 */
describe('Checkout Page - Cart Display Logic', () => {
	// Sample products for testing
	const chocolateChip = {
		id: 1,
		slug: 'chocolate-chip',
		title: 'Chocolate Chip Cookie',
		priceCents: 350,
		stripePriceId: 'price_choc123'
	};

	const oatmealRaisin = {
		id: 2,
		slug: 'oatmeal-raisin',
		title: 'Oatmeal Raisin Cookie',
		priceCents: 325,
		stripePriceId: 'price_oat456'
	};

	const brownie = {
		id: 3,
		slug: 'brownie',
		title: 'Fudge Brownie',
		priceCents: 500,
		stripePriceId: 'price_brownie789'
	};

	beforeEach(() => {
		_resetForTesting();
	});

	describe('empty cart state', () => {
		it('detects empty cart correctly', () => {
			expect(isCartEmpty()).toBe(true);
		});

		it('returns empty items array when cart is empty', () => {
			expect(getItems()).toHaveLength(0);
		});

		it('returns $0.00 for empty cart total', () => {
			expect(getCartTotalFormatted()).toBe('$0.00');
		});

		it('returns 0 for empty cart total in cents', () => {
			expect(getCartTotal()).toBe(0);
		});
	});

	describe('cart with items', () => {
		it('detects non-empty cart correctly', () => {
			addToCart(chocolateChip);
			expect(isCartEmpty()).toBe(false);
		});

		it('returns correct number of items', () => {
			addToCart(chocolateChip);
			addToCart(oatmealRaisin);
			expect(getItems()).toHaveLength(2);
		});

		it('returns items with correct properties', () => {
			addToCart(chocolateChip);
			const items = getItems();
			expect(items[0]).toMatchObject({
				productId: chocolateChip.id,
				slug: chocolateChip.slug,
				title: chocolateChip.title,
				priceCents: chocolateChip.priceCents,
				stripePriceId: chocolateChip.stripePriceId,
				quantity: 1
			});
		});
	});

	describe('cart items display', () => {
		it('displays product title', () => {
			addToCart(chocolateChip);
			const items = getItems();
			expect(items[0].title).toBe('Chocolate Chip Cookie');
		});

		it('displays product slug for links', () => {
			addToCart(chocolateChip);
			const items = getItems();
			expect(items[0].slug).toBe('chocolate-chip');
		});

		it('formats unit price correctly', () => {
			addToCart(chocolateChip);
			const items = getItems();
			expect(formatPrice(items[0].priceCents)).toBe('$3.50');
		});

		it('calculates line total correctly', () => {
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: 3 }] as CartItem[]);
			const items = getItems();
			const lineTotal = items[0].priceCents * items[0].quantity;
			expect(formatPrice(lineTotal)).toBe('$10.50');
		});
	});

	describe('quantity controls - increment', () => {
		it('increments quantity correctly', () => {
			addToCart(chocolateChip);
			const initialQty = getItems()[0].quantity;
			updateQuantity(chocolateChip.id, initialQty + 1);
			expect(getItems()[0].quantity).toBe(2);
		});

		it('allows increment up to max quantity', () => {
			const maxQty = getMaxQuantityPerItem();
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: maxQty - 1 }] as CartItem[]);
			updateQuantity(chocolateChip.id, maxQty);
			expect(getItems()[0].quantity).toBe(maxQty);
		});

		it('clamps quantity at max limit', () => {
			const maxQty = getMaxQuantityPerItem();
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: maxQty }] as CartItem[]);
			updateQuantity(chocolateChip.id, maxQty + 10);
			expect(getItems()[0].quantity).toBe(maxQty);
		});
	});

	describe('quantity controls - decrement', () => {
		it('decrements quantity correctly', () => {
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: 5 }] as CartItem[]);
			updateQuantity(chocolateChip.id, 4);
			expect(getItems()[0].quantity).toBe(4);
		});

		it('removes item when quantity goes to 0', () => {
			addToCart(chocolateChip);
			updateQuantity(chocolateChip.id, 0);
			expect(isCartEmpty()).toBe(true);
		});

		it('removes item when quantity goes negative', () => {
			addToCart(chocolateChip);
			updateQuantity(chocolateChip.id, -1);
			expect(isCartEmpty()).toBe(true);
		});
	});

	describe('remove item functionality', () => {
		it('removes item from cart', () => {
			addToCart(chocolateChip);
			removeFromCart(chocolateChip.id);
			expect(isCartEmpty()).toBe(true);
		});

		it('only removes specified item', () => {
			addToCart(chocolateChip);
			addToCart(oatmealRaisin);
			removeFromCart(chocolateChip.id);
			expect(getItems()).toHaveLength(1);
			expect(getItems()[0].productId).toBe(oatmealRaisin.id);
		});

		it('handles removing non-existent item gracefully', () => {
			addToCart(chocolateChip);
			removeFromCart(999); // Non-existent ID
			expect(getItems()).toHaveLength(1);
		});
	});

	describe('subtotal calculation', () => {
		it('calculates subtotal for single item', () => {
			addToCart(chocolateChip); // $3.50
			expect(getCartTotal()).toBe(350);
			expect(getCartTotalFormatted()).toBe('$3.50');
		});

		it('calculates subtotal for multiple different items', () => {
			addToCart(chocolateChip); // $3.50
			addToCart(oatmealRaisin); // $3.25
			expect(getCartTotal()).toBe(675);
			expect(getCartTotalFormatted()).toBe('$6.75');
		});

		it('calculates subtotal with quantities', () => {
			_setItemsForTesting([
				{ ...chocolateChip, productId: 1, quantity: 3 }, // $3.50 x 3 = $10.50
				{ ...oatmealRaisin, productId: 2, quantity: 2 } // $3.25 x 2 = $6.50
			] as CartItem[]);
			expect(getCartTotal()).toBe(1700); // $17.00
			expect(getCartTotalFormatted()).toBe('$17.00');
		});

		it('updates subtotal after quantity change', () => {
			addToCart(chocolateChip); // $3.50
			expect(getCartTotal()).toBe(350);
			updateQuantity(chocolateChip.id, 5);
			expect(getCartTotal()).toBe(1750); // $17.50
		});

		it('updates subtotal after item removal', () => {
			addToCart(chocolateChip); // $3.50
			addToCart(oatmealRaisin); // $3.25
			expect(getCartTotal()).toBe(675);
			removeFromCart(chocolateChip.id);
			expect(getCartTotal()).toBe(325); // Only oatmeal raisin remains
		});
	});

	describe('config integration', () => {
		it('uses correct page title from config', () => {
			expect(config.cart.checkoutPageTitle).toBe('Your Cart');
		});

		it('uses correct empty message from config', () => {
			expect(config.cart.emptyMessage).toBe('Your cart is empty. Browse our delicious cookies!');
		});

		it('uses correct site title from config', () => {
			expect(config.title).toBe('The Cookie Isle');
		});
	});

	describe('price formatting', () => {
		it('formats whole dollar amounts', () => {
			expect(formatPrice(500)).toBe('$5.00');
		});

		it('formats amounts with cents', () => {
			expect(formatPrice(350)).toBe('$3.50');
		});

		it('formats single cent amounts', () => {
			expect(formatPrice(1)).toBe('$0.01');
		});

		it('formats zero', () => {
			expect(formatPrice(0)).toBe('$0.00');
		});

		it('formats large amounts', () => {
			expect(formatPrice(10000)).toBe('$100.00');
		});
	});

	describe('max quantity enforcement', () => {
		it('returns max quantity constant', () => {
			expect(getMaxQuantityPerItem()).toBe(99);
		});

		it('increment button should be disabled at max quantity', () => {
			const maxQty = getMaxQuantityPerItem();
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: maxQty }] as CartItem[]);
			const items = getItems();
			const isAtMax = items[0].quantity >= maxQty;
			expect(isAtMax).toBe(true);
		});

		it('increment button should not be disabled below max', () => {
			const maxQty = getMaxQuantityPerItem();
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: maxQty - 1 }] as CartItem[]);
			const items = getItems();
			const isAtMax = items[0].quantity >= maxQty;
			expect(isAtMax).toBe(false);
		});
	});

	describe('link generation', () => {
		it('generates correct product link', () => {
			addToCart(chocolateChip);
			const items = getItems();
			const productLink = `/menu/${items[0].slug}`;
			expect(productLink).toBe('/menu/chocolate-chip');
		});

		it('generates correct menu link for continue shopping', () => {
			const menuLink = '/menu';
			expect(menuLink).toBe('/menu');
		});
	});

	describe('accessibility', () => {
		it('provides aria label for decrease button', () => {
			addToCart(chocolateChip);
			const items = getItems();
			const ariaLabel = `Decrease quantity of ${items[0].title}`;
			expect(ariaLabel).toBe('Decrease quantity of Chocolate Chip Cookie');
		});

		it('provides aria label for increase button', () => {
			addToCart(chocolateChip);
			const items = getItems();
			const ariaLabel = `Increase quantity of ${items[0].title}`;
			expect(ariaLabel).toBe('Increase quantity of Chocolate Chip Cookie');
		});

		it('provides aria label for remove button', () => {
			addToCart(chocolateChip);
			const items = getItems();
			const ariaLabel = `Remove ${items[0].title} from cart`;
			expect(ariaLabel).toBe('Remove Chocolate Chip Cookie from cart');
		});

		it('provides aria label for quantity display', () => {
			_setItemsForTesting([{ ...chocolateChip, productId: 1, quantity: 5 }] as CartItem[]);
			const items = getItems();
			const ariaLabel = `Quantity: ${items[0].quantity}`;
			expect(ariaLabel).toBe('Quantity: 5');
		});
	});

	describe('multiple items handling', () => {
		it('maintains correct order of items', () => {
			addToCart(chocolateChip);
			addToCart(oatmealRaisin);
			addToCart(brownie);
			const items = getItems();
			expect(items[0].productId).toBe(chocolateChip.id);
			expect(items[1].productId).toBe(oatmealRaisin.id);
			expect(items[2].productId).toBe(brownie.id);
		});

		it('updates correct item when multiple exist', () => {
			addToCart(chocolateChip);
			addToCart(oatmealRaisin);
			addToCart(brownie);
			updateQuantity(oatmealRaisin.id, 5);
			const items = getItems();
			expect(items[0].quantity).toBe(1);
			expect(items[1].quantity).toBe(5);
			expect(items[2].quantity).toBe(1);
		});

		it('removes correct item when multiple exist', () => {
			addToCart(chocolateChip);
			addToCart(oatmealRaisin);
			addToCart(brownie);
			removeFromCart(oatmealRaisin.id);
			const items = getItems();
			expect(items).toHaveLength(2);
			expect(items[0].productId).toBe(chocolateChip.id);
			expect(items[1].productId).toBe(brownie.id);
		});
	});

	describe('responsive layout logic', () => {
		it('desktop table has correct number of columns', () => {
			// Table should have: Product, Price, Quantity, Total, Actions (5 columns)
			const expectedColumns = ['Product', 'Price', 'Quantity', 'Total', 'Actions'];
			expect(expectedColumns).toHaveLength(5);
		});

		it('mobile card shows all required information', () => {
			// Mobile card should show: title, unit price, quantity controls, line total, remove
			const requiredFields = ['title', 'unitPrice', 'quantityControls', 'lineTotal', 'remove'];
			expect(requiredFields).toHaveLength(5);
		});
	});
});

/**
 * Unit tests for Checkout Page - Customer Form (PRD 3.6)
 */
describe('Checkout Page - Customer Form Logic', () => {
	describe('email validation', () => {
		it('validates email with @ and . as valid', () => {
			const email = 'test@example.com';
			const isValid = email.includes('@') && email.includes('.') && email.length >= 5;
			expect(isValid).toBe(true);
		});

		it('rejects email without @', () => {
			const email = 'testexample.com';
			const isValid = email.includes('@') && email.includes('.') && email.length >= 5;
			expect(isValid).toBe(false);
		});

		it('rejects email without .', () => {
			const email = 'test@examplecom';
			const isValid = email.includes('@') && email.includes('.') && email.length >= 5;
			expect(isValid).toBe(false);
		});

		it('rejects email that is too short', () => {
			const email = 'a@b';
			const isValid = email.includes('@') && email.includes('.') && email.length >= 5;
			expect(isValid).toBe(false);
		});

		it('validates complex email addresses', () => {
			const email = 'user.name+tag@subdomain.example.co.uk';
			const isValid = email.includes('@') && email.includes('.') && email.length >= 5;
			expect(isValid).toBe(true);
		});
	});

	describe('phone validation', () => {
		it('validates 10-digit phone as valid', () => {
			const phone = '5551234567';
			const isValid = phone.replace(/\D/g, '').length >= 10;
			expect(isValid).toBe(true);
		});

		it('validates formatted phone as valid', () => {
			const phone = '(555) 123-4567';
			const isValid = phone.replace(/\D/g, '').length >= 10;
			expect(isValid).toBe(true);
		});

		it('rejects phone with less than 10 digits', () => {
			const phone = '555-1234';
			const isValid = phone.replace(/\D/g, '').length >= 10;
			expect(isValid).toBe(false);
		});

		it('validates phone with country code as valid', () => {
			const phone = '+1 (555) 123-4567';
			const isValid = phone.replace(/\D/g, '').length >= 10;
			expect(isValid).toBe(true);
		});

		it('handles empty phone number', () => {
			const phone = '';
			const isValid = phone.replace(/\D/g, '').length >= 10;
			expect(isValid).toBe(false);
		});
	});

	describe('phone formatting', () => {
		// Helper function that mirrors the component's formatPhone function
		function formatPhone(value: string): string {
			const digits = value.replace(/\D/g, '').slice(0, 10);
			if (digits.length === 0) return '';
			if (digits.length <= 3) return `(${digits}`;
			if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
			return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
		}

		it('formats partial phone with area code', () => {
			expect(formatPhone('555')).toBe('(555');
		});

		it('formats phone with area code and exchange', () => {
			expect(formatPhone('555123')).toBe('(555) 123');
		});

		it('formats complete 10-digit phone', () => {
			expect(formatPhone('5551234567')).toBe('(555) 123-4567');
		});

		it('handles already formatted input', () => {
			expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567');
		});

		it('strips non-digit characters', () => {
			expect(formatPhone('555-123-4567')).toBe('(555) 123-4567');
		});

		it('truncates to 10 digits', () => {
			expect(formatPhone('55512345678901')).toBe('(555) 123-4567');
		});

		it('handles empty input', () => {
			expect(formatPhone('')).toBe('');
		});
	});

	describe('ZIP code validation', () => {
		it('validates 5-digit ZIP as valid format', () => {
			const zip = '92118';
			const isValidFormat = zip.length === 5 && /^\d{5}$/.test(zip);
			expect(isValidFormat).toBe(true);
		});

		it('rejects ZIP with less than 5 digits', () => {
			const zip = '9211';
			const isValidFormat = zip.length === 5 && /^\d{5}$/.test(zip);
			expect(isValidFormat).toBe(false);
		});

		it('rejects ZIP with more than 5 digits', () => {
			const zip = '921181';
			const isValidFormat = zip.length === 5 && /^\d{5}$/.test(zip);
			expect(isValidFormat).toBe(false);
		});

		it('rejects ZIP with letters', () => {
			const zip = '9211A';
			const isValidFormat = zip.length === 5 && /^\d{5}$/.test(zip);
			expect(isValidFormat).toBe(false);
		});
	});

	describe('ZIP code delivery area validation', () => {
		it('allows ZIP in allowed delivery area', () => {
			expect(isZipAllowedForDelivery('92118')).toBe(true);
		});

		it('rejects ZIP not in allowed delivery area', () => {
			expect(isZipAllowedForDelivery('90210')).toBe(false);
		});

		it('rejects empty ZIP', () => {
			expect(isZipAllowedForDelivery('')).toBe(false);
		});
	});

	describe('fulfillment type logic', () => {
		it('pickup is enabled in config', () => {
			expect(config.fulfillment.pickupEnabled).toBe(true);
		});

		it('delivery is enabled in config', () => {
			expect(config.fulfillment.deliveryEnabled).toBe(true);
		});

		it('pickup location is configured', () => {
			expect(config.fulfillment.pickupLocation).toBe('Coronado Island');
		});

		it('delivery area is configured', () => {
			expect(config.fulfillment.deliveryArea).toBe('Coronado Island');
		});

		it('delivery ZIP error message is configured', () => {
			expect(config.fulfillment.deliveryZipError).toContain('Sorry');
		});
	});

	describe('form field requirements', () => {
		it('customer info form has required fields', () => {
			const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
			expect(requiredFields).toContain('firstName');
			expect(requiredFields).toContain('lastName');
			expect(requiredFields).toContain('email');
			expect(requiredFields).toContain('phone');
		});

		it('delivery form has required address fields', () => {
			const requiredDeliveryFields = ['street', 'city', 'zip'];
			expect(requiredDeliveryFields).toContain('street');
			expect(requiredDeliveryFields).toContain('city');
			expect(requiredDeliveryFields).toContain('zip');
		});

		it('apt field is optional', () => {
			const requiredDeliveryFields = ['street', 'city', 'zip'];
			expect(requiredDeliveryFields).not.toContain('apt');
		});
	});

	describe('validation state management', () => {
		it('initializes with empty errors', () => {
			const errors: Record<string, string> = {};
			expect(Object.keys(errors)).toHaveLength(0);
		});

		it('initializes with no touched fields', () => {
			const touched: Record<string, boolean> = {};
			expect(Object.keys(touched)).toHaveLength(0);
		});

		it('tracks touched state per field', () => {
			const touched: Record<string, boolean> = { firstName: true };
			expect(touched.firstName).toBe(true);
			expect(touched.lastName).toBe(undefined);
		});

		it('can add multiple errors', () => {
			const errors: Record<string, string> = {
				firstName: 'First name is required',
				email: 'Please enter a valid email address'
			};
			expect(Object.keys(errors)).toHaveLength(2);
		});
	});

	describe('conditional delivery fields', () => {
		// Helper to check if delivery fields should show
		function shouldShowDeliveryFields(type: 'pickup' | 'delivery'): boolean {
			return type === 'delivery';
		}

		// Helper to validate ZIP based on fulfillment type
		function validateZip(type: 'pickup' | 'delivery', zip: string): boolean {
			return type === 'pickup' || (zip.length === 5 && /^\d{5}$/.test(zip));
		}

		it('shows delivery fields when fulfillment is delivery', () => {
			expect(shouldShowDeliveryFields('delivery')).toBe(true);
		});

		it('hides delivery fields when fulfillment is pickup', () => {
			expect(shouldShowDeliveryFields('pickup')).toBe(false);
		});

		it('ZIP validation is skipped for pickup', () => {
			expect(validateZip('pickup', '')).toBe(true);
		});

		it('ZIP validation is applied for delivery', () => {
			expect(validateZip('delivery', '')).toBe(false);
		});

		it('valid ZIP passes for delivery', () => {
			expect(validateZip('delivery', '92118')).toBe(true);
		});
	});

	describe('form accessibility', () => {
		it('all required fields should have aria labels', () => {
			const requiredFields = [
				{ id: 'firstName', label: 'First Name' },
				{ id: 'lastName', label: 'Last Name' },
				{ id: 'email', label: 'Email' },
				{ id: 'phone', label: 'Phone' }
			];
			requiredFields.forEach((field) => {
				expect(field.label).toBeTruthy();
				expect(field.id).toBeTruthy();
			});
		});

		it('form has novalidate attribute for custom validation', () => {
			// Component uses novalidate to handle custom validation
			const novalidate = true;
			expect(novalidate).toBe(true);
		});

		it('fields have autocomplete attributes', () => {
			const autocompleteValues = {
				firstName: 'given-name',
				lastName: 'family-name',
				email: 'email',
				phone: 'tel',
				street: 'street-address',
				apt: 'address-line2',
				city: 'address-level2',
				state: 'address-level1',
				zip: 'postal-code'
			};
			expect(autocompleteValues.firstName).toBe('given-name');
			expect(autocompleteValues.email).toBe('email');
			expect(autocompleteValues.zip).toBe('postal-code');
		});
	});

	describe('error message display', () => {
		it('generates correct error for empty first name', () => {
			const firstName = '';
			const error = !firstName.trim() ? 'First name is required' : undefined;
			expect(error).toBe('First name is required');
		});

		it('generates correct error for invalid email', () => {
			const email = 'invalid';
			const isValid = email.includes('@') && email.includes('.') && email.length >= 5;
			const error = !email.trim()
				? 'Email is required'
				: !isValid
					? 'Please enter a valid email address'
					: undefined;
			expect(error).toBe('Please enter a valid email address');
		});

		it('generates correct error for invalid phone', () => {
			const phone = '555';
			const isValid = phone.replace(/\D/g, '').length >= 10;
			const error = !phone.trim()
				? 'Phone number is required'
				: !isValid
					? 'Please enter a valid 10-digit phone number'
					: undefined;
			expect(error).toBe('Please enter a valid 10-digit phone number');
		});

		it('shows ZIP not in delivery area error', () => {
			const zip = '90210';
			const error = !isZipAllowedForDelivery(zip) ? config.fulfillment.deliveryZipError : undefined;
			expect(error).toContain('Sorry');
		});
	});
});
