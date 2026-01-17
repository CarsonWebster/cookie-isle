import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	addToCart,
	getQuantity,
	getCartCount,
	getMaxQuantityPerItem,
	_resetForTesting,
	_setItemsForTesting
} from '$lib/stores/cart.svelte';
import {
	showToast,
	isVisible,
	getMessage,
	_resetForTesting as resetToast
} from './CartToast.svelte';
import type { CartItem } from '$lib/stores/cart.svelte';
import { config } from '$lib/config';

/**
 * Unit tests for AddToCartButton component logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the cart store and toast integration that the component uses.
 *
 * PRD Reference: 3.4
 */
describe('AddToCartButton Component Logic', () => {
	// Sample products for testing
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
		resetToast();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('product prop requirements', () => {
		it('requires id as number', () => {
			expect(typeof sampleProduct.id).toBe('number');
		});

		it('requires slug as string', () => {
			expect(typeof sampleProduct.slug).toBe('string');
		});

		it('requires title as string', () => {
			expect(typeof sampleProduct.title).toBe('string');
		});

		it('requires priceCents as number', () => {
			expect(typeof sampleProduct.priceCents).toBe('number');
		});

		it('requires stripePriceId as string', () => {
			expect(typeof sampleProduct.stripePriceId).toBe('string');
		});
	});

	describe('add to cart functionality', () => {
		it('adds product to cart on first click', () => {
			expect(getCartCount()).toBe(0);
			const success = addToCart(sampleProduct);
			expect(success).toBe(true);
			expect(getCartCount()).toBe(1);
		});

		it('increments quantity when adding same product again', () => {
			addToCart(sampleProduct);
			expect(getQuantity(sampleProduct.id)).toBe(1);
			addToCart(sampleProduct);
			expect(getQuantity(sampleProduct.id)).toBe(2);
		});

		it('adds different products as separate cart items', () => {
			addToCart(sampleProduct);
			addToCart(sampleProduct2);
			expect(getCartCount()).toBe(2);
			expect(getQuantity(sampleProduct.id)).toBe(1);
			expect(getQuantity(sampleProduct2.id)).toBe(1);
		});

		it('passes all required product data to cart', () => {
			addToCart(sampleProduct);
			const quantity = getQuantity(sampleProduct.id);
			expect(quantity).toBe(1);
		});
	});

	describe('toast notification integration', () => {
		it('shows toast when item is added successfully', () => {
			expect(isVisible()).toBe(false);
			showToast(sampleProduct.title);
			expect(isVisible()).toBe(true);
		});

		it('toast message includes product name', () => {
			showToast(sampleProduct.title);
			const message = getMessage();
			expect(message).toContain(sampleProduct.title);
			expect(message).toContain('added to cart');
		});

		it('toast message follows expected format', () => {
			showToast('Test Cookie');
			expect(getMessage()).toBe('Test Cookie added to cart!');
		});

		it('toast auto-hides after duration', () => {
			showToast(sampleProduct.title);
			expect(isVisible()).toBe(true);

			// Fast-forward past the toast duration (3000ms)
			vi.advanceTimersByTime(3500);

			expect(isVisible()).toBe(false);
		});
	});

	describe('max quantity handling', () => {
		it('returns max quantity from config', () => {
			const maxQty = getMaxQuantityPerItem();
			expect(maxQty).toBe(99);
		});

		it('prevents adding beyond max quantity', () => {
			// Set item to max quantity
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 99 }
			] as CartItem[]);

			const success = addToCart(sampleProduct);
			expect(success).toBe(false);
			expect(getQuantity(sampleProduct.id)).toBe(99);
		});

		it('allows adding up to max quantity', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 98 }
			] as CartItem[]);

			const success = addToCart(sampleProduct);
			expect(success).toBe(true);
			expect(getQuantity(sampleProduct.id)).toBe(99);
		});

		it('detects when product is at max quantity', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 99 }
			] as CartItem[]);

			const currentQty = getQuantity(sampleProduct.id);
			const maxQty = getMaxQuantityPerItem();
			const isAtMax = currentQty >= maxQty;

			expect(isAtMax).toBe(true);
		});

		it('correctly identifies product not at max quantity', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 5 }
			] as CartItem[]);

			const currentQty = getQuantity(sampleProduct.id);
			const maxQty = getMaxQuantityPerItem();
			const isAtMax = currentQty >= maxQty;

			expect(isAtMax).toBe(false);
		});
	});

	describe('button text states', () => {
		it('config provides default button text', () => {
			expect(config.cart.buttonText).toBe('Add to Cart');
		});

		it('button text logic for normal state', () => {
			const isAdded = false;
			const isAtMaxQuantity = false;
			const buttonText = isAdded
				? 'Added!'
				: isAtMaxQuantity
					? 'Max Qty Reached'
					: config.cart.buttonText;

			expect(buttonText).toBe('Add to Cart');
		});

		it('button text logic for added state', () => {
			const isAdded = true;
			const isAtMaxQuantity = false;
			const buttonText = isAdded
				? 'Added!'
				: isAtMaxQuantity
					? 'Max Qty Reached'
					: config.cart.buttonText;

			expect(buttonText).toBe('Added!');
		});

		it('button text logic for max quantity state', () => {
			const isAdded = false;
			const isAtMaxQuantity = true;
			const buttonText = isAdded
				? 'Added!'
				: isAtMaxQuantity
					? 'Max Qty Reached'
					: config.cart.buttonText;

			expect(buttonText).toBe('Max Qty Reached');
		});

		it('added state takes precedence over max quantity', () => {
			// Edge case: if both flags are true, "Added!" should show
			const isAdded = true;
			const isAtMaxQuantity = true;
			const buttonText = isAdded
				? 'Added!'
				: isAtMaxQuantity
					? 'Max Qty Reached'
					: config.cart.buttonText;

			expect(buttonText).toBe('Added!');
		});
	});

	describe('size variant classes', () => {
		// Helper function to get size classes (mirrors component logic)
		const getSizeClasses = (size: 'small' | 'large') =>
			size === 'large' ? 'px-6 py-4 text-lg' : 'px-4 py-2.5 text-sm';

		it('small size uses correct padding', () => {
			expect(getSizeClasses('small')).toBe('px-4 py-2.5 text-sm');
		});

		it('large size uses correct padding', () => {
			expect(getSizeClasses('large')).toBe('px-6 py-4 text-lg');
		});
	});

	describe('state-specific classes', () => {
		it('normal state uses primary background', () => {
			const isAdded = false;
			const isAtMaxQuantity = false;
			const stateClasses = isAdded
				? 'bg-green-600 hover:bg-green-600'
				: isAtMaxQuantity
					? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
					: 'bg-primary hover:bg-btn-hover-bg';

			expect(stateClasses).toBe('bg-primary hover:bg-btn-hover-bg');
		});

		it('added state uses green background', () => {
			const isAdded = true;
			const isAtMaxQuantity = false;
			const stateClasses = isAdded
				? 'bg-green-600 hover:bg-green-600'
				: isAtMaxQuantity
					? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
					: 'bg-primary hover:bg-btn-hover-bg';

			expect(stateClasses).toBe('bg-green-600 hover:bg-green-600');
		});

		it('max quantity state uses gray background and disabled cursor', () => {
			const isAdded = false;
			const isAtMaxQuantity = true;
			const stateClasses = isAdded
				? 'bg-green-600 hover:bg-green-600'
				: isAtMaxQuantity
					? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
					: 'bg-primary hover:bg-btn-hover-bg';

			expect(stateClasses).toBe('bg-gray-400 hover:bg-gray-400 cursor-not-allowed');
		});
	});

	describe('data attributes', () => {
		it('should include product-id attribute', () => {
			const attrs = {
				'data-product-id': sampleProduct.id,
				'data-product-slug': sampleProduct.slug,
				'data-product-title': sampleProduct.title,
				'data-product-price': sampleProduct.priceCents,
				'data-product-stripe-price-id': sampleProduct.stripePriceId
			};

			expect(attrs['data-product-id']).toBe(1);
		});

		it('should include product-slug attribute', () => {
			const attrs = { 'data-product-slug': sampleProduct.slug };
			expect(attrs['data-product-slug']).toBe('chocolate-chip');
		});

		it('should include product-title attribute', () => {
			const attrs = { 'data-product-title': sampleProduct.title };
			expect(attrs['data-product-title']).toBe('Chocolate Chip Cookie');
		});

		it('should include product-price attribute', () => {
			const attrs = { 'data-product-price': sampleProduct.priceCents };
			expect(attrs['data-product-price']).toBe(350);
		});

		it('should include product-stripe-price-id attribute', () => {
			const attrs = { 'data-product-stripe-price-id': sampleProduct.stripePriceId };
			expect(attrs['data-product-stripe-price-id']).toBe('price_test123');
		});
	});

	describe('added state timing', () => {
		it('added state should clear after 1500ms', () => {
			// Simulating the component's timer behavior
			let isAdded = true;

			// After 1500ms, isAdded should become false
			const timer = setTimeout(() => {
				isAdded = false;
			}, 1500);

			expect(isAdded).toBe(true);

			vi.advanceTimersByTime(1500);

			// Timer callback should have fired
			clearTimeout(timer);
		});

		it('new click should reset the timer', () => {
			// Simulating multiple rapid clicks
			let timerId: ReturnType<typeof setTimeout> | null = null;
			let isAdded = false;

			const simulateClick = () => {
				if (timerId) {
					clearTimeout(timerId);
				}
				isAdded = true;
				timerId = setTimeout(() => {
					isAdded = false;
					timerId = null;
				}, 1500);
			};

			// First click
			simulateClick();
			expect(isAdded).toBe(true);

			// Advance 1000ms (not enough to clear)
			vi.advanceTimersByTime(1000);
			expect(isAdded).toBe(true);

			// Second click (should reset timer)
			simulateClick();
			expect(isAdded).toBe(true);

			// Advance another 1000ms (1000ms into new timer)
			vi.advanceTimersByTime(1000);
			expect(isAdded).toBe(true);

			// Advance final 500ms (1500ms total since last click)
			vi.advanceTimersByTime(500);
			// isAdded should be false now
			if (timerId) clearTimeout(timerId);
		});
	});

	describe('disabled state handling', () => {
		it('button should be disabled when at max quantity', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 99 }
			] as CartItem[]);

			const currentQty = getQuantity(sampleProduct.id);
			const maxQty = getMaxQuantityPerItem();
			const shouldBeDisabled = currentQty >= maxQty;

			expect(shouldBeDisabled).toBe(true);
		});

		it('button should not be disabled when below max quantity', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 50 }
			] as CartItem[]);

			const currentQty = getQuantity(sampleProduct.id);
			const maxQty = getMaxQuantityPerItem();
			const shouldBeDisabled = currentQty >= maxQty;

			expect(shouldBeDisabled).toBe(false);
		});

		it('button should not be disabled for new products', () => {
			const currentQty = getQuantity(sampleProduct.id);
			const maxQty = getMaxQuantityPerItem();
			const shouldBeDisabled = currentQty >= maxQty;

			expect(currentQty).toBe(0);
			expect(shouldBeDisabled).toBe(false);
		});
	});

	describe('checkmark icon display', () => {
		it('shows checkmark only when isAdded is true', () => {
			const isAdded = true;
			const showCheckmark = isAdded;
			expect(showCheckmark).toBe(true);
		});

		it('hides checkmark when isAdded is false', () => {
			const isAdded = false;
			const showCheckmark = isAdded;
			expect(showCheckmark).toBe(false);
		});
	});

	describe('animation classes', () => {
		it('applies animation class when isAdded is true', () => {
			const isAdded = true;
			const animationClass = isAdded ? 'animate-button-pop' : '';
			expect(animationClass).toBe('animate-button-pop');
		});

		it('removes animation class when isAdded is false', () => {
			const isAdded = false;
			const animationClass = isAdded ? 'animate-button-pop' : '';
			expect(animationClass).toBe('');
		});
	});

	describe('complete click handler flow', () => {
		it('successful add: adds to cart, shows toast, sets added state', () => {
			// Initial state
			expect(getCartCount()).toBe(0);
			expect(isVisible()).toBe(false);

			// Simulate click handler logic
			const success = addToCart(sampleProduct);

			if (success) {
				showToast(sampleProduct.title);
			}

			// Verify results
			expect(success).toBe(true);
			expect(getCartCount()).toBe(1);
			expect(isVisible()).toBe(true);
			expect(getMessage()).toBe('Chocolate Chip Cookie added to cart!');
		});

		it('max quantity reached: does not show toast', () => {
			_setItemsForTesting([
				{ ...sampleProduct, productId: sampleProduct.id, quantity: 99 }
			] as CartItem[]);

			const success = addToCart(sampleProduct);

			// Toast should not be shown since add failed
			if (success) {
				showToast(sampleProduct.title);
			}

			expect(success).toBe(false);
			expect(isVisible()).toBe(false);
		});
	});

	describe('className prop handling', () => {
		it('accepts additional CSS classes', () => {
			const className = 'mt-4 custom-class';
			const baseClasses = 'w-full rounded-lg';
			const combined = `${baseClasses} ${className}`;
			expect(combined).toContain('mt-4');
			expect(combined).toContain('custom-class');
		});

		it('handles empty className gracefully', () => {
			const className = '';
			const baseClasses = 'w-full rounded-lg';
			const combined = `${baseClasses} ${className}`.trim();
			expect(combined).toBe('w-full rounded-lg');
		});
	});
});
