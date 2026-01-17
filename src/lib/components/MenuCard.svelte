<script lang="ts">
	/**
	 * MenuCard Component
	 *
	 * Displays a product card with image, title, price, description, tags, and add to cart button.
	 * Used on the menu page and homepage featured products grid.
	 *
	 * PRD Reference: 2.3
	 */

	import { formatPrice } from '$lib/config';
	import AddToCartButton from '$lib/components/AddToCartButton.svelte';

	/** Product data type matching the database schema */
	export interface Product {
		id: number;
		slug: string;
		title: string;
		priceCents: number;
		stripePriceId: string;
		description?: string | null;
		imageUrl?: string | null;
		tags?: string[] | null;
		// Focal points for card image cropping (0-100 percentages)
		cardFocalX?: number | null;
		cardFocalY?: number | null;
	}

	interface Props {
		/** Product data to display */
		product: Product;
	}

	let { product }: Props = $props();

	// Format the price for display
	let formattedPrice = $derived(formatPrice(product.priceCents));

	// Focal point for card image (default to center)
	let cardFocalX = $derived(product.cardFocalX ?? 50);
	let cardFocalY = $derived(product.cardFocalY ?? 50);
</script>

<article
	class="group flex flex-col overflow-hidden rounded-xl bg-card-bg shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
>
	<!-- Product Image -->
	<a
		href="/menu/{product.slug}"
		class="relative block aspect-square overflow-hidden bg-tertiary-medium"
	>
		{#if product.imageUrl}
			<img
				src={product.imageUrl}
				alt={product.title}
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				style="object-position: {cardFocalX}% {cardFocalY}%;"
				loading="lazy"
			/>
		{:else}
			<!-- Placeholder when no image -->
			<div
				class="flex h-full w-full items-center justify-center bg-tertiary-medium"
				aria-label="Cookie placeholder"
			>
				<img src="/Cookieart.png" alt="" class="h-16 w-auto" aria-hidden="true" />
			</div>
		{/if}
	</a>

	<!-- Card Content -->
	<div class="flex flex-1 flex-col p-4">
		<!-- Title -->
		<h3 class="text-lg font-semibold text-secondary">
			<a href="/menu/{product.slug}" class="hover:text-primary hover:underline">
				{product.title}
			</a>
		</h3>

		<!-- Price -->
		<p class="mt-1 text-lg font-bold text-primary">
			{formattedPrice}
		</p>

		<!-- Description (truncated to 2 lines) -->
		{#if product.description}
			<p class="mt-2 line-clamp-2 flex-1 text-sm text-text-light">
				{product.description}
			</p>
		{:else}
			<div class="flex-1"></div>
		{/if}

		<!-- Tags -->
		{#if product.tags && product.tags.length > 0}
			<div class="mt-3 flex flex-wrap gap-1">
				{#each product.tags as tag}
					<span
						class="inline-block rounded-full bg-tertiary-medium px-2 py-0.5 text-xs font-medium text-secondary"
					>
						{tag}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Add to Cart Button -->
		<AddToCartButton {product} size="small" class="mt-4" />
	</div>
</article>
