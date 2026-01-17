/**
 * Cart Store Tests
 *
 * Comprehensive tests for the cart store functionality including:
 * - Adding items
 * - Removing items
 * - Updating quantities
 * - Derived values (count, total, formatted)
 * - localStorage persistence
 * - Edge cases and validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	addToCart,
	removeFromCart,
	updateQuantity,
	clearCart,
	getItems,
	getCartItem,
	isInCart,
	getQuantity,
	initializeCart,
	clearStorage,
	getMaxQuantityPerItem,
	_resetForTesting,
	_setItemsForTesting,
	_getStorageKey,
	getCartCount,
	getCartTotal,
	getCartTotalFormatted,
	isCartEmpty,
	type CartProduct,
	type CartItem
} from './cart.svelte';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockProduct1: CartProduct = {
	id: 1,
	slug: 'chocolate-chip',
	title: 'Chocolate Chip Cookie',
	priceCents: 350,
	stripePriceId: 'price_chocolate_chip'
};

const mockProduct2: CartProduct = {
	id: 2,
	slug: 'oatmeal-raisin',
	title: 'Oatmeal Raisin Cookie',
	priceCents: 400,
	stripePriceId: 'price_oatmeal_raisin'
};

const mockProduct3: CartProduct = {
	id: 3,
	slug: 'peanut-butter',
	title: 'Peanut Butter Cookie',
	priceCents: 375,
	stripePriceId: 'price_peanut_butter'
};

// ============================================================================
// Setup and Teardown
// ============================================================================

describe('Cart Store', () => {
	beforeEach(() => {
		// Reset cart state before each test
		_resetForTesting();

		// Clear any localStorage mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up localStorage mock
		vi.restoreAllMocks();
	});

	// ==========================================================================
	// Type Exports
	// ==========================================================================

	describe('Type Exports', () => {
		it('exports CartProduct interface', () => {
			const product: CartProduct = mockProduct1;
			expect(product.id).toBe(1);
			expect(product.slug).toBe('chocolate-chip');
			expect(product.title).toBe('Chocolate Chip Cookie');
			expect(product.priceCents).toBe(350);
			expect(product.stripePriceId).toBe('price_chocolate_chip');
		});

		it('exports CartItem interface', () => {
			const item: CartItem = {
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip Cookie',
				priceCents: 350,
				stripePriceId: 'price_chocolate_chip',
				quantity: 2
			};
			expect(item.productId).toBe(1);
			expect(item.quantity).toBe(2);
		});
	});

	// ==========================================================================
	// Initial State
	// ==========================================================================

	describe('Initial State', () => {
		it('starts with empty cart', () => {
			expect(getItems()).toEqual([]);
		});

		it('getCartCount is 0 when empty', () => {
			expect(getCartCount()).toBe(0);
		});

		it('getCartTotal is 0 when empty', () => {
			expect(getCartTotal()).toBe(0);
		});

		it('getCartTotalFormatted is "$0.00" when empty', () => {
			expect(getCartTotalFormatted()).toBe('$0.00');
		});

		it('isCartEmpty is true when empty', () => {
			expect(isCartEmpty()).toBe(true);
		});
	});

	// ==========================================================================
	// addToCart
	// ==========================================================================

	describe('addToCart', () => {
		it('adds a new product to cart', () => {
			const result = addToCart(mockProduct1);

			expect(result).toBe(true);
			expect(getItems().length).toBe(1);
			expect(getItems()[0]).toEqual({
				productId: 1,
				slug: 'chocolate-chip',
				title: 'Chocolate Chip Cookie',
				priceCents: 350,
				stripePriceId: 'price_chocolate_chip',
				quantity: 1
			});
		});

		it('increments quantity when adding existing product', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct1);

			expect(getItems().length).toBe(1);
			expect(getItems()[0].quantity).toBe(2);
		});

		it('adds multiple different products', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct2);
			addToCart(mockProduct3);

			expect(getItems().length).toBe(3);
			expect(getItems().map((i) => i.productId)).toEqual([1, 2, 3]);
		});

		it('returns false when max quantity is reached', () => {
			// Set up an item at max quantity
			const maxQty = getMaxQuantityPerItem();
			_setItemsForTesting([
				{
					productId: mockProduct1.id,
					slug: mockProduct1.slug,
					title: mockProduct1.title,
					priceCents: mockProduct1.priceCents,
					stripePriceId: mockProduct1.stripePriceId,
					quantity: maxQty
				}
			]);

			const result = addToCart(mockProduct1);

			expect(result).toBe(false);
			expect(getItems()[0].quantity).toBe(maxQty);
		});

		it('does not exceed max quantity per item', () => {
			const maxQty = getMaxQuantityPerItem();

			// Add product multiple times up to and beyond max
			for (let i = 0; i < maxQty + 5; i++) {
				addToCart(mockProduct1);
			}

			expect(getItems()[0].quantity).toBe(maxQty);
		});
	});

	// ==========================================================================
	// removeFromCart
	// ==========================================================================

	describe('removeFromCart', () => {
		it('removes an item from cart', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct2);

			removeFromCart(mockProduct1.id);

			expect(getItems().length).toBe(1);
			expect(getItems()[0].productId).toBe(2);
		});

		it('does nothing when removing non-existent item', () => {
			addToCart(mockProduct1);

			removeFromCart(999);

			expect(getItems().length).toBe(1);
		});

		it('removes item regardless of quantity', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct1);
			addToCart(mockProduct1);

			removeFromCart(mockProduct1.id);

			expect(getItems().length).toBe(0);
		});
	});

	// ==========================================================================
	// updateQuantity
	// ==========================================================================

	describe('updateQuantity', () => {
		beforeEach(() => {
			addToCart(mockProduct1);
		});

		it('updates quantity of existing item', () => {
			updateQuantity(mockProduct1.id, 5);

			expect(getItems()[0].quantity).toBe(5);
		});

		it('removes item when quantity is 0', () => {
			updateQuantity(mockProduct1.id, 0);

			expect(getItems().length).toBe(0);
		});

		it('removes item when quantity is negative', () => {
			updateQuantity(mockProduct1.id, -1);

			expect(getItems().length).toBe(0);
		});

		it('clamps quantity to max', () => {
			const maxQty = getMaxQuantityPerItem();
			updateQuantity(mockProduct1.id, maxQty + 100);

			expect(getItems()[0].quantity).toBe(maxQty);
		});

		it('does nothing for non-existent item', () => {
			updateQuantity(999, 5);

			expect(getItems().length).toBe(1);
			expect(getItems()[0].quantity).toBe(1);
		});
	});

	// ==========================================================================
	// clearCart
	// ==========================================================================

	describe('clearCart', () => {
		it('removes all items from cart', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct2);
			addToCart(mockProduct3);

			clearCart();

			expect(getItems()).toEqual([]);
		});

		it('works on already empty cart', () => {
			clearCart();

			expect(getItems()).toEqual([]);
		});
	});

	// ==========================================================================
	// getCartItem
	// ==========================================================================

	describe('getCartItem', () => {
		it('returns item when found', () => {
			addToCart(mockProduct1);

			const item = getCartItem(mockProduct1.id);

			expect(item).toBeDefined();
			expect(item?.productId).toBe(1);
		});

		it('returns undefined when not found', () => {
			addToCart(mockProduct1);

			const item = getCartItem(999);

			expect(item).toBeUndefined();
		});
	});

	// ==========================================================================
	// isInCart
	// ==========================================================================

	describe('isInCart', () => {
		it('returns true when item is in cart', () => {
			addToCart(mockProduct1);

			expect(isInCart(mockProduct1.id)).toBe(true);
		});

		it('returns false when item is not in cart', () => {
			expect(isInCart(mockProduct1.id)).toBe(false);
		});
	});

	// ==========================================================================
	// getQuantity
	// ==========================================================================

	describe('getQuantity', () => {
		it('returns quantity when item is in cart', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct1);

			expect(getQuantity(mockProduct1.id)).toBe(2);
		});

		it('returns 0 when item is not in cart', () => {
			expect(getQuantity(999)).toBe(0);
		});
	});

	// ==========================================================================
	// Derived Values (via getter functions)
	// ==========================================================================

	describe('Derived Values', () => {
		describe('getCartCount', () => {
			it('sums all quantities', () => {
				addToCart(mockProduct1); // qty: 1
				addToCart(mockProduct1); // qty: 2
				addToCart(mockProduct2); // qty: 1

				expect(getCartCount()).toBe(3);
			});

			it('updates when items are removed', () => {
				addToCart(mockProduct1);
				addToCart(mockProduct2);

				expect(getCartCount()).toBe(2);

				removeFromCart(mockProduct1.id);

				expect(getCartCount()).toBe(1);
			});
		});

		describe('getCartTotal', () => {
			it('calculates total price in cents', () => {
				addToCart(mockProduct1); // 350 cents
				addToCart(mockProduct2); // 400 cents

				expect(getCartTotal()).toBe(750);
			});

			it('accounts for quantity', () => {
				addToCart(mockProduct1); // 350 cents x 1
				addToCart(mockProduct1); // 350 cents x 2

				expect(getCartTotal()).toBe(700);
			});

			it('updates when items are removed', () => {
				addToCart(mockProduct1);
				addToCart(mockProduct2);

				expect(getCartTotal()).toBe(750);

				removeFromCart(mockProduct1.id);

				expect(getCartTotal()).toBe(400);
			});
		});

		describe('getCartTotalFormatted', () => {
			it('formats total as currency', () => {
				addToCart(mockProduct1); // $3.50
				addToCart(mockProduct2); // $4.00

				expect(getCartTotalFormatted()).toBe('$7.50');
			});

			it('handles large totals', () => {
				_setItemsForTesting([
					{
						productId: 1,
						slug: 'test',
						title: 'Test',
						priceCents: 10000, // $100.00
						stripePriceId: 'price_test',
						quantity: 10
					}
				]);

				expect(getCartTotalFormatted()).toBe('$1000.00');
			});
		});

		describe('isCartEmpty', () => {
			it('is true when cart is empty', () => {
				expect(isCartEmpty()).toBe(true);
			});

			it('is false when cart has items', () => {
				addToCart(mockProduct1);

				expect(isCartEmpty()).toBe(false);
			});

			it('becomes true after clearing', () => {
				addToCart(mockProduct1);
				clearCart();

				expect(isCartEmpty()).toBe(true);
			});
		});
	});

	// ==========================================================================
	// localStorage Persistence
	// ==========================================================================

	describe('localStorage Persistence', () => {
		let mockLocalStorage: { [key: string]: string };

		beforeEach(() => {
			mockLocalStorage = {};

			// Stub window to make typeof window !== 'undefined' return true
			vi.stubGlobal('window', {});

			vi.stubGlobal('localStorage', {
				getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
				setItem: vi.fn((key: string, value: string) => {
					mockLocalStorage[key] = value;
				}),
				removeItem: vi.fn((key: string) => {
					delete mockLocalStorage[key];
				})
			});
		});

		it('saves to localStorage when adding item', () => {
			addToCart(mockProduct1);

			expect(localStorage.setItem).toHaveBeenCalledWith(_getStorageKey(), expect.any(String));
		});

		it('saves to localStorage when removing item', () => {
			addToCart(mockProduct1);
			vi.clearAllMocks();

			removeFromCart(mockProduct1.id);

			expect(localStorage.setItem).toHaveBeenCalled();
		});

		it('saves to localStorage when updating quantity', () => {
			addToCart(mockProduct1);
			vi.clearAllMocks();

			updateQuantity(mockProduct1.id, 5);

			expect(localStorage.setItem).toHaveBeenCalled();
		});

		it('saves to localStorage when clearing cart', () => {
			addToCart(mockProduct1);
			vi.clearAllMocks();

			clearCart();

			expect(localStorage.setItem).toHaveBeenCalled();
		});

		it('initializes from localStorage', () => {
			const storedItems: CartItem[] = [
				{
					productId: 1,
					slug: 'test',
					title: 'Test Cookie',
					priceCents: 500,
					stripePriceId: 'price_test',
					quantity: 3
				}
			];
			mockLocalStorage[_getStorageKey()] = JSON.stringify(storedItems);

			initializeCart();

			expect(getItems().length).toBe(1);
			expect(getItems()[0].quantity).toBe(3);
		});

		it('handles invalid JSON in localStorage', () => {
			mockLocalStorage[_getStorageKey()] = 'not valid json{{{';

			initializeCart();

			expect(getItems()).toEqual([]);
		});

		it('filters out invalid items from localStorage', () => {
			const mixedItems = [
				{
					productId: 1,
					slug: 'valid',
					title: 'Valid Cookie',
					priceCents: 500,
					stripePriceId: 'price_valid',
					quantity: 2
				},
				{
					// Missing required fields
					productId: 2,
					slug: 'invalid'
				},
				null,
				'not an object',
				{
					productId: 3,
					slug: 'zero-qty',
					title: 'Zero Qty',
					priceCents: 300,
					stripePriceId: 'price_zero',
					quantity: 0 // Invalid: zero quantity
				}
			];
			mockLocalStorage[_getStorageKey()] = JSON.stringify(mixedItems);

			initializeCart();

			expect(getItems().length).toBe(1);
			expect(getItems()[0].slug).toBe('valid');
		});

		it('only initializes once', () => {
			const storedItems: CartItem[] = [
				{
					productId: 1,
					slug: 'test',
					title: 'Test',
					priceCents: 500,
					stripePriceId: 'price_test',
					quantity: 1
				}
			];
			mockLocalStorage[_getStorageKey()] = JSON.stringify(storedItems);

			initializeCart();
			expect(getItems().length).toBe(1);

			// Change localStorage
			mockLocalStorage[_getStorageKey()] = JSON.stringify([
				...storedItems,
				{
					productId: 2,
					slug: 'test2',
					title: 'Test 2',
					priceCents: 600,
					stripePriceId: 'price_test2',
					quantity: 1
				}
			]);

			// Call again - should not re-initialize
			initializeCart();
			expect(getItems().length).toBe(1);
		});

		it('clearStorage removes from localStorage', () => {
			mockLocalStorage[_getStorageKey()] = JSON.stringify([]);

			clearStorage();

			expect(localStorage.removeItem).toHaveBeenCalledWith(_getStorageKey());
		});
	});

	// ==========================================================================
	// SSR Safety
	// ==========================================================================

	describe('SSR Safety', () => {
		it('handles undefined window gracefully in initializeCart', () => {
			// In server environment, window is undefined
			// The implementation checks typeof window === 'undefined'
			// In Node.js test environment, window is typically undefined
			// unless mocked, so this test verifies the guard exists

			// Reset and don't mock localStorage
			_resetForTesting();
			vi.unstubAllGlobals();

			// Should not throw
			expect(() => initializeCart()).not.toThrow();
		});
	});

	// ==========================================================================
	// Testing Utilities
	// ==========================================================================

	describe('Testing Utilities', () => {
		it('_resetForTesting clears all state', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct2);

			_resetForTesting();

			expect(getItems()).toEqual([]);
		});

		it('_setItemsForTesting sets items directly', () => {
			const testItems: CartItem[] = [
				{
					productId: 99,
					slug: 'test',
					title: 'Test',
					priceCents: 999,
					stripePriceId: 'price_test',
					quantity: 5
				}
			];

			_setItemsForTesting(testItems);

			expect(getItems().length).toBe(1);
			expect(getItems()[0].productId).toBe(99);
		});

		it('getMaxQuantityPerItem returns the max quantity constant', () => {
			expect(getMaxQuantityPerItem()).toBe(99);
		});

		it('_getStorageKey returns the storage key', () => {
			expect(_getStorageKey()).toBe('cookie-isle-cart');
		});
	});

	// ==========================================================================
	// Edge Cases
	// ==========================================================================

	describe('Edge Cases', () => {
		it('handles products with zero price', () => {
			const freeProduct: CartProduct = {
				id: 100,
				slug: 'free-sample',
				title: 'Free Sample',
				priceCents: 0,
				stripePriceId: 'price_free'
			};

			addToCart(freeProduct);
			addToCart(mockProduct1);

			expect(getCartTotal()).toBe(350);
			expect(getCartCount()).toBe(2);
		});

		it('handles very large quantities correctly', () => {
			_setItemsForTesting([
				{
					productId: 1,
					slug: 'test',
					title: 'Test',
					priceCents: 1,
					stripePriceId: 'price_test',
					quantity: 99
				}
			]);

			expect(getCartTotal()).toBe(99);
			expect(getCartCount()).toBe(99);
		});

		it('handles rapid sequential additions', () => {
			for (let i = 0; i < 10; i++) {
				addToCart(mockProduct1);
			}

			expect(getItems()[0].quantity).toBe(10);
		});

		it('maintains item order after modifications', () => {
			addToCart(mockProduct1);
			addToCart(mockProduct2);
			addToCart(mockProduct3);

			updateQuantity(mockProduct2.id, 5);

			const ids = getItems().map((i) => i.productId);
			expect(ids).toEqual([1, 2, 3]);
		});

		it('getItems returns read-only array', () => {
			addToCart(mockProduct1);

			const items = getItems();

			// Verify it's an array with data
			expect(items.length).toBe(1);
			// The return type is readonly CartItem[], enforced by TypeScript
		});
	});
});
