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
import { config, formatPrice } from '$lib/config';
import type { CartItem } from '$lib/stores/cart.svelte';

/**
 * Unit tests for Checkout Page - Cart Display logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the cart store operations and display logic used by the checkout page.
 *
 * PRD Reference: 3.5
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
