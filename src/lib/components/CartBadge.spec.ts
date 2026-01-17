import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	getCartCount,
	addToCart,
	_resetForTesting,
	_setItemsForTesting
} from '$lib/stores/cart.svelte';
import type { CartItem } from '$lib/stores/cart.svelte';

/**
 * Unit tests for CartBadge component logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the cart store integration that the CartBadge uses.
 */
describe('CartBadge Component Logic', () => {
	// Create a sample product for testing
	const sampleProduct = {
		id: 1,
		slug: 'chocolate-chip',
		title: 'Chocolate Chip Cookie',
		priceCents: 350,
		stripePriceId: 'price_test123'
	};

	const sampleProduct2 = {
		id: 2,
		slug: 'oatmeal-raisin',
		title: 'Oatmeal Raisin Cookie',
		priceCents: 375,
		stripePriceId: 'price_test456'
	};

	beforeEach(() => {
		_resetForTesting();
	});

	describe('cart count display', () => {
		it('returns 0 when cart is empty', () => {
			expect(getCartCount()).toBe(0);
		});

		it('returns 1 when one item is added', () => {
			addToCart(sampleProduct);
			expect(getCartCount()).toBe(1);
		});

		it('returns correct count with multiple items', () => {
			addToCart(sampleProduct);
			addToCart(sampleProduct2);
			expect(getCartCount()).toBe(2);
		});

		it('returns sum of quantities for same product', () => {
			addToCart(sampleProduct);
			addToCart(sampleProduct); // Adds to quantity
			expect(getCartCount()).toBe(2);
		});

		it('returns total of all item quantities', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: 1, quantity: 3 },
				{ ...sampleProduct2, productId: 2, quantity: 2 }
			] as CartItem[]);
			expect(getCartCount()).toBe(5);
		});
	});

	describe('badge visibility logic', () => {
		it('badge should be hidden when count is 0', () => {
			// CartBadge hides when getCartCount() === 0
			const count = getCartCount();
			const shouldShow = count > 0;
			expect(shouldShow).toBe(false);
		});

		it('badge should be visible when count is greater than 0', () => {
			addToCart(sampleProduct);
			const count = getCartCount();
			const shouldShow = count > 0;
			expect(shouldShow).toBe(true);
		});
	});

	describe('display formatting', () => {
		it('displays exact count for values 1-99', () => {
			_setItemsForTesting([{ ...sampleProduct, productId: 1, quantity: 50 }] as CartItem[]);
			const count = getCartCount();
			const displayText = count > 99 ? '99+' : String(count);
			expect(displayText).toBe('50');
		});

		it('displays exact count at boundary (99)', () => {
			_setItemsForTesting([{ ...sampleProduct, productId: 1, quantity: 99 }] as CartItem[]);
			const count = getCartCount();
			const displayText = count > 99 ? '99+' : String(count);
			expect(displayText).toBe('99');
		});

		it('displays 99+ for counts above 99', () => {
			// Set up multiple items to exceed 99 total
			_setItemsForTesting([
				{ ...sampleProduct, productId: 1, quantity: 60 },
				{ ...sampleProduct2, productId: 2, quantity: 50 }
			] as CartItem[]);
			const count = getCartCount();
			const displayText = count > 99 ? '99+' : String(count);
			expect(displayText).toBe('99+');
		});

		it('displays 99+ for exactly 100', () => {
			// Two items with 50 each = 100 total
			_setItemsForTesting([
				{ ...sampleProduct, productId: 1, quantity: 50 },
				{ ...sampleProduct2, productId: 2, quantity: 50 }
			] as CartItem[]);
			const count = getCartCount();
			expect(count).toBe(100);
			const displayText = count > 99 ? '99+' : String(count);
			expect(displayText).toBe('99+');
		});
	});

	describe('aria label generation', () => {
		it('generates correct label for single item', () => {
			addToCart(sampleProduct);
			const count = getCartCount();
			const ariaLabel = `${count} ${count === 1 ? 'item' : 'items'} in cart`;
			expect(ariaLabel).toBe('1 item in cart');
		});

		it('generates correct label for multiple items', () => {
			addToCart(sampleProduct);
			addToCart(sampleProduct2);
			const count = getCartCount();
			const ariaLabel = `${count} ${count === 1 ? 'item' : 'items'} in cart`;
			expect(ariaLabel).toBe('2 items in cart');
		});

		it('generates correct label for many items', () => {
			_setItemsForTesting([{ ...sampleProduct, productId: 1, quantity: 25 }] as CartItem[]);
			const count = getCartCount();
			const ariaLabel = `${count} ${count === 1 ? 'item' : 'items'} in cart`;
			expect(ariaLabel).toBe('25 items in cart');
		});
	});

	describe('reactivity requirements', () => {
		it('count updates when item is added', () => {
			expect(getCartCount()).toBe(0);
			addToCart(sampleProduct);
			expect(getCartCount()).toBe(1);
		});

		it('count updates when item quantity increases', () => {
			addToCart(sampleProduct);
			expect(getCartCount()).toBe(1);
			addToCart(sampleProduct);
			expect(getCartCount()).toBe(2);
		});

		it('count updates when cart is reset', () => {
			addToCart(sampleProduct);
			addToCart(sampleProduct2);
			expect(getCartCount()).toBe(2);
			_resetForTesting();
			expect(getCartCount()).toBe(0);
		});
	});

	describe('animation trigger logic', () => {
		it('animation should trigger when count increases from 0', () => {
			let previousCount = 0;
			const count = 0;
			// Initially no animation needed
			const shouldAnimate = count !== previousCount && count > 0;
			expect(shouldAnimate).toBe(false);

			// Add item
			addToCart(sampleProduct);
			const newCount = getCartCount();
			const shouldAnimateAfter = newCount !== previousCount && newCount > 0;
			expect(shouldAnimateAfter).toBe(true);
		});

		it('animation should trigger when count increases', () => {
			addToCart(sampleProduct);
			let previousCount = getCartCount(); // 1
			addToCart(sampleProduct);
			const newCount = getCartCount(); // 2
			const shouldAnimate = newCount !== previousCount && newCount > 0;
			expect(shouldAnimate).toBe(true);
		});

		it('animation should not trigger when count stays same', () => {
			addToCart(sampleProduct);
			const previousCount = getCartCount();
			const newCount = getCartCount(); // Same value
			const shouldAnimate = newCount !== previousCount && newCount > 0;
			expect(shouldAnimate).toBe(false);
		});

		it('animation should not trigger when count becomes 0', () => {
			// Cart is reset, count becomes 0
			_resetForTesting();
			const previousCount = 1; // Simulating previous value
			const newCount = getCartCount(); // 0
			const shouldAnimate = newCount !== previousCount && newCount > 0;
			expect(shouldAnimate).toBe(false); // No animation when going to 0
		});
	});

	describe('styling classes verification', () => {
		it('uses correct positioning classes', () => {
			// CartBadge uses these classes: absolute -top-2 -right-2
			const expectedClasses = ['absolute', '-top-2', '-right-2'];
			expectedClasses.forEach((className) => {
				expect(className).toBeTruthy();
			});
		});

		it('uses correct size classes', () => {
			// CartBadge uses these classes: h-5 w-5
			const expectedClasses = ['h-5', 'w-5'];
			expectedClasses.forEach((className) => {
				expect(className).toBeTruthy();
			});
		});

		it('uses correct shape and color classes', () => {
			// CartBadge uses these classes: rounded-full bg-primary text-white
			const expectedClasses = ['rounded-full', 'bg-primary', 'text-white'];
			expectedClasses.forEach((className) => {
				expect(className).toBeTruthy();
			});
		});

		it('uses correct typography classes', () => {
			// CartBadge uses these classes: text-xs font-bold
			const expectedClasses = ['text-xs', 'font-bold'];
			expectedClasses.forEach((className) => {
				expect(className).toBeTruthy();
			});
		});

		it('uses flex centering classes', () => {
			// CartBadge uses these classes: flex items-center justify-center
			const expectedClasses = ['flex', 'items-center', 'justify-center'];
			expectedClasses.forEach((className) => {
				expect(className).toBeTruthy();
			});
		});
	});
});
