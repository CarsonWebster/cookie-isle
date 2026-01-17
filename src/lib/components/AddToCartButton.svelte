<script lang="ts">
	/**
	 * AddToCartButton Component
	 *
	 * A reusable button that adds products to the cart store, shows toast notifications,
	 * and displays visual feedback on click.
	 *
	 * Features:
	 * - Adds product to cart store on click
	 * - Shows toast notification via CartToast
	 * - Brief "Added!" state animation after click
	 * - Handles max quantity limit gracefully
	 * - Supports different sizes (small for cards, large for detail pages)
	 *
	 * PRD Reference: 3.4
	 */

	import { config } from '$lib/config';
	import {
		addToCart,
		getQuantity,
		getMaxQuantityPerItem,
		type CartProduct
	} from '$lib/stores/cart.svelte';
	import { showToast } from '$lib/components/CartToast.svelte';

	/** Product data type needed for the cart */
	export interface AddToCartProduct {
		id: number;
		slug: string;
		title: string;
		priceCents: number;
		stripePriceId: string;
	}

	interface Props {
		/** Product data to add to cart */
		product: AddToCartProduct;
		/** Button size variant */
		size?: 'small' | 'large';
		/** Additional CSS classes */
		class?: string;
	}

	let { product, size = 'small', class: className = '' }: Props = $props();

	// Button state for "Added!" feedback
	let isAdded = $state(false);
	let addedTimer: ReturnType<typeof setTimeout> | null = null;

	// Check if max quantity is reached
	const currentQuantity = $derived(getQuantity(product.id));
	const maxQuantity = getMaxQuantityPerItem();
	const isAtMaxQuantity = $derived(currentQuantity >= maxQuantity);

	// Button text based on state
	const buttonText = $derived(
		isAdded ? 'Added!' : isAtMaxQuantity ? 'Max Qty Reached' : config.cart.buttonText
	);

	/**
	 * Handle add to cart button click
	 */
	function handleClick(): void {
		// Clear any existing timer
		if (addedTimer) {
			clearTimeout(addedTimer);
			addedTimer = null;
		}

		// Attempt to add to cart
		const cartProduct: CartProduct = {
			id: product.id,
			slug: product.slug,
			title: product.title,
			priceCents: product.priceCents,
			stripePriceId: product.stripePriceId
		};

		const success = addToCart(cartProduct);

		if (success) {
			// Show toast notification
			showToast(product.title);

			// Show "Added!" state briefly
			isAdded = true;
			addedTimer = setTimeout(() => {
				isAdded = false;
				addedTimer = null;
			}, 1500);
		}
		// If not successful (max qty reached), button already shows "Max Qty Reached"
	}

	// Size-specific classes
	const sizeClasses = $derived(size === 'large' ? 'px-6 py-4 text-lg' : 'px-4 py-2.5 text-sm');

	// State-specific classes
	const stateClasses = $derived(
		isAdded
			? 'bg-green-600 hover:bg-green-600'
			: isAtMaxQuantity
				? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
				: 'bg-primary hover:bg-btn-hover-bg'
	);
</script>

<button
	type="button"
	onclick={handleClick}
	disabled={isAtMaxQuantity}
	class="w-full rounded-lg font-semibold text-btn-text transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none {sizeClasses} {stateClasses} {isAdded
		? 'animate-button-pop'
		: ''} {className}"
	data-product-id={product.id}
	data-product-slug={product.slug}
	data-product-title={product.title}
	data-product-price={product.priceCents}
	data-product-stripe-price-id={product.stripePriceId}
>
	{#if isAdded}
		<span class="inline-flex items-center gap-1">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			{buttonText}
		</span>
	{:else}
		{buttonText}
	{/if}
</button>

<style>
	@keyframes button-pop {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	.animate-button-pop {
		animation: button-pop 0.3s ease-out;
	}
</style>
