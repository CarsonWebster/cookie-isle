/**
 * Cart Store
 *
 * Svelte 5 runes-based cart state management with localStorage persistence.
 * This store manages the shopping cart state for the entire application.
 *
 * Note: Since Svelte 5 doesn't allow exporting $derived values directly from modules,
 * we use getter functions to expose the current derived values.
 */

import { formatPrice } from '$lib/config';

// ============================================================================
// Types
// ============================================================================

/** Product data needed to add an item to cart */
export interface CartProduct {
	id: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
}

/** Item stored in the cart with quantity */
export interface CartItem {
	productId: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
	quantity: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'cookie-isle-cart';
const MAX_QUANTITY_PER_ITEM = 99;

// ============================================================================
// State
// ============================================================================

/** The cart items array - reactive state */
let items = $state<CartItem[]>([]);

/** Flag to track if we've initialized from localStorage */
let initialized = false;

// ============================================================================
// Derived Values (exposed via getter functions)
// ============================================================================

/**
 * Get total number of items in cart (sum of all quantities).
 * Computes the value from current items state.
 */
export function getCartCount(): number {
	return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get total price in cents.
 * Computes the value from current items state.
 */
export function getCartTotal(): number {
	return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}

/**
 * Get total price formatted as currency string (e.g., "$12.50").
 * Computes the value from current items state.
 */
export function getCartTotalFormatted(): string {
	return formatPrice(getCartTotal());
}

/**
 * Check if cart is empty.
 * Computes the value from current items state.
 */
export function isCartEmpty(): boolean {
	return items.length === 0;
}

/**
 * Get current cart items (read-only snapshot).
 * This is reactive when used in Svelte components.
 */
export function getItems(): readonly CartItem[] {
	return items;
}

// ============================================================================
// Cart Actions
// ============================================================================

/**
 * Add a product to the cart or increment its quantity if already present.
 * @param product - The product to add
 * @returns true if the item was added, false if max quantity was reached
 */
export function addToCart(product: CartProduct): boolean {
	const existingIndex = items.findIndex((item) => item.productId === product.id);

	if (existingIndex >= 0) {
		// Item exists - increment quantity if under max
		const existing = items[existingIndex];
		if (existing.quantity >= MAX_QUANTITY_PER_ITEM) {
			return false;
		}
		items[existingIndex] = {
			...existing,
			quantity: existing.quantity + 1
		};
	} else {
		// New item - add to cart
		items = [
			...items,
			{
				productId: product.id,
				slug: product.slug,
				title: product.title,
				priceCents: product.priceCents,
				stripePriceId: product.stripePriceId,
				quantity: 1
			}
		];
	}

	saveToStorage();
	return true;
}

/**
 * Remove a product from the cart entirely.
 * @param productId - The ID of the product to remove
 */
export function removeFromCart(productId: number): void {
	items = items.filter((item) => item.productId !== productId);
	saveToStorage();
}

/**
 * Update the quantity of a cart item.
 * If quantity is 0 or negative, the item is removed.
 * @param productId - The ID of the product to update
 * @param quantity - The new quantity
 */
export function updateQuantity(productId: number, quantity: number): void {
	if (quantity <= 0) {
		removeFromCart(productId);
		return;
	}

	const clampedQuantity = Math.min(quantity, MAX_QUANTITY_PER_ITEM);
	const existingIndex = items.findIndex((item) => item.productId === productId);

	if (existingIndex >= 0) {
		items[existingIndex] = {
			...items[existingIndex],
			quantity: clampedQuantity
		};
		saveToStorage();
	}
}

/**
 * Clear all items from the cart.
 */
export function clearCart(): void {
	items = [];
	saveToStorage();
}

/**
 * Get a specific cart item by product ID.
 * @param productId - The ID of the product to find
 * @returns The cart item or undefined if not found
 */
export function getCartItem(productId: number): CartItem | undefined {
	return items.find((item) => item.productId === productId);
}

/**
 * Check if a product is in the cart.
 * @param productId - The ID of the product to check
 * @returns true if the product is in the cart
 */
export function isInCart(productId: number): boolean {
	return items.some((item) => item.productId === productId);
}

/**
 * Get the quantity of a specific product in the cart.
 * @param productId - The ID of the product
 * @returns The quantity or 0 if not in cart
 */
export function getQuantity(productId: number): number {
	const item = items.find((i) => i.productId === productId);
	return item?.quantity ?? 0;
}

// ============================================================================
// localStorage Persistence
// ============================================================================

/**
 * Initialize the cart from localStorage.
 * Should be called once when the app starts (client-side only).
 */
export function initializeCart(): void {
	if (initialized) return;
	if (typeof window === 'undefined') return;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				// Validate each item has required fields
				items = parsed.filter(
					(item): item is CartItem =>
						typeof item === 'object' &&
						item !== null &&
						typeof item.productId === 'number' &&
						typeof item.slug === 'string' &&
						typeof item.title === 'string' &&
						typeof item.priceCents === 'number' &&
						typeof item.stripePriceId === 'string' &&
						typeof item.quantity === 'number' &&
						item.quantity > 0
				);
			}
		}
	} catch {
		// If parsing fails, start with empty cart
		items = [];
	}

	initialized = true;
}

/**
 * Save the current cart state to localStorage.
 * Called automatically after every cart modification.
 */
function saveToStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		// localStorage might be full or disabled - silently fail
		console.warn('Failed to save cart to localStorage');
	}
}

/**
 * Clear cart data from localStorage without affecting current state.
 * Useful for testing or explicit cache clearing.
 */
export function clearStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Silently fail
	}
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Reset the cart state for testing purposes.
 * This bypasses persistence and resets the initialized flag.
 */
export function _resetForTesting(): void {
	items = [];
	initialized = false;
}

/**
 * Set items directly for testing purposes.
 * This bypasses persistence.
 */
export function _setItemsForTesting(newItems: CartItem[]): void {
	items = [...newItems];
}

/**
 * Get the storage key for testing purposes.
 */
export function _getStorageKey(): string {
	return STORAGE_KEY;
}

/**
 * Get the max quantity per item.
 */
export function getMaxQuantityPerItem(): number {
	return MAX_QUANTITY_PER_ITEM;
}
