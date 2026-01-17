<script lang="ts">
	/**
	 * Cookie Detail Page
	 *
	 * Displays detailed information about a single product including:
	 * - Hero image (large, full-width on mobile)
	 * - Title, price, and description
	 * - Ingredients list
	 * - Tags
	 * - Large "Add to Cart" button
	 * - "Back to Menu" link
	 *
	 * PRD Reference: 2.5
	 */

	import { config, formatPrice } from '$lib/config';
	import AddToCartButton from '$lib/components/AddToCartButton.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Format the price for display
	let formattedPrice = $derived(formatPrice(data.product.priceCents));

	// Check if we have ingredients to display
	let hasIngredients = $derived(
		data.product.ingredients && data.product.ingredients.trim().length > 0
	);

	// Check if we have tags to display
	let hasTags = $derived(data.product.tags && data.product.tags.length > 0);
</script>

<svelte:head>
	<title>{data.product.title} | {config.title}</title>
	<meta
		name="description"
		content={data.product.description ||
			`${data.product.title} - freshly baked with love at ${config.title}`}
	/>
	<!-- Open Graph -->
	<meta property="og:title" content="{data.product.title} | {config.title}" />
	<meta
		property="og:description"
		content={data.product.description ||
			`${data.product.title} - freshly baked with love at ${config.title}`}
	/>
	{#if data.product.heroImageUrl || data.product.imageUrl}
		<meta property="og:image" content={data.product.heroImageUrl || data.product.imageUrl} />
	{/if}
</svelte:head>

<!-- Cookie Detail Page Content -->
<article class="bg-tertiary">
	<!-- Hero Image Section -->
	<div class="relative">
		{#if data.product.heroImageUrl || data.product.imageUrl}
			<div class="aspect-[16/9] w-full overflow-hidden bg-tertiary-medium md:aspect-[21/9]">
				<img
					src={data.product.heroImageUrl || data.product.imageUrl}
					alt={data.product.title}
					class="h-full w-full object-cover"
				/>
			</div>
		{:else}
			<!-- Placeholder when no image -->
			<div
				class="flex aspect-[16/9] w-full items-center justify-center bg-tertiary-medium md:aspect-[21/9]"
			>
				<span class="text-9xl" aria-hidden="true">🍪</span>
			</div>
		{/if}
	</div>

	<!-- Product Details Section -->
	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
		<!-- Two-column layout on desktop -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
			<!-- Left Column: Title, Price, Description -->
			<div>
				<!-- Back to Menu link -->
				<a
					href={'/menu'}
					class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
					Back to Menu
				</a>

				<!-- Title -->
				<h1 class="text-3xl font-bold text-secondary sm:text-4xl lg:text-5xl">
					{data.product.title}
				</h1>

				<!-- Price -->
				<p class="mt-4 text-2xl font-bold text-primary sm:text-3xl">
					{formattedPrice}
				</p>

				<!-- Description -->
				{#if data.product.description}
					<p class="mt-6 text-lg leading-relaxed text-text-light">
						{data.product.description}
					</p>
				{/if}

				<!-- Tags -->
				{#if hasTags && data.product.tags}
					<div class="mt-6 flex flex-wrap gap-2">
						{#each data.product.tags as tag, i (i)}
							<span
								class="inline-block rounded-full bg-tertiary-medium px-3 py-1 text-sm font-medium text-secondary"
							>
								{tag}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Right Column: Ingredients and Add to Cart -->
			<div class="flex flex-col">
				<!-- Ingredients Section -->
				{#if hasIngredients}
					<div class="rounded-xl bg-card-bg p-6 shadow-md">
						<h2 class="text-lg font-semibold text-secondary">Ingredients</h2>
						<p class="mt-3 text-text-light">
							{data.product.ingredients}
						</p>
					</div>
				{/if}

				<!-- Spacer to push button to bottom on desktop -->
				<div class="flex-1"></div>

				<!-- Add to Cart Button -->
				<AddToCartButton product={data.product} size="large" class="mt-8" />
			</div>
		</div>
	</div>
</article>
