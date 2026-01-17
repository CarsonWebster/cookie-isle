<script lang="ts" module>
	/**
	 * Cart Toast Notification Module
	 *
	 * Provides a global toast notification system for cart actions.
	 * Uses module context so the toast state is shared across the app.
	 */

	// Toast state - module-level for global access
	let visible = $state(false);
	let message = $state('');
	let timerId: ReturnType<typeof setTimeout> | null = null;

	// Duration before auto-hide (ms)
	const TOAST_DURATION = 3000;

	/**
	 * Show a toast notification for adding an item to cart
	 * @param productName - Name of the product added
	 */
	export function showToast(productName: string): void {
		// Clear any existing timer
		if (timerId) {
			clearTimeout(timerId);
		}

		// Set message and show toast
		message = `${productName} added to cart!`;
		visible = true;

		// Auto-hide after duration
		timerId = setTimeout(() => {
			visible = false;
			timerId = null;
		}, TOAST_DURATION);
	}

	/**
	 * Hide the toast immediately
	 */
	export function hideToast(): void {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
		visible = false;
	}

	/**
	 * Check if toast is currently visible (for testing)
	 */
	export function isVisible(): boolean {
		return visible;
	}

	/**
	 * Get current toast message (for testing)
	 */
	export function getMessage(): string {
		return message;
	}

	/**
	 * Reset toast state (for testing)
	 */
	export function _resetForTesting(): void {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
		visible = false;
		message = '';
	}
</script>

<script lang="ts">
	/**
	 * CartToast Component
	 *
	 * Displays a slide-in notification when items are added to cart.
	 * Features:
	 * - Fixed position at bottom-right of screen
	 * - Slide-in animation from the right
	 * - Auto-hides after 3 seconds
	 * - Includes "View Cart" link
	 * - Dark background with white text
	 * - Dismiss button
	 */

	import { getCartCount } from '$lib/stores/cart.svelte';

	// Get reactive cart count for display
	const cartCount = $derived(getCartCount());
</script>

{#if visible}
	<div
		class="animate-slide-in fixed right-4 bottom-4 z-50"
		role="alert"
		aria-live="polite"
		aria-atomic="true"
	>
		<div class="flex items-center gap-4 rounded-lg bg-footer-bg px-4 py-3 shadow-xl">
			<!-- Success icon -->
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
				<svg
					class="h-5 w-5 text-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>

			<!-- Message -->
			<div class="flex flex-col">
				<p class="text-sm font-medium text-footer-text">
					{message}
				</p>
				<p class="text-xs text-footer-text/70">
					{cartCount}
					{cartCount === 1 ? 'item' : 'items'} in cart
				</p>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2">
				<a
					href="/checkout"
					class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
				>
					View Cart
				</a>

				<!-- Dismiss button -->
				<button
					type="button"
					onclick={hideToast}
					class="rounded-md p-1.5 text-footer-text/70 transition-colors hover:bg-white/10 hover:text-footer-text"
					aria-label="Dismiss notification"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-in {
		0% {
			opacity: 0;
			transform: translateX(100%);
		}
		100% {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out forwards;
	}
</style>
