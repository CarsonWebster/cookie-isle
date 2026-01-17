<script lang="ts">
	/**
	 * Cookie Detail Page
	 *
	 * Displays detailed information about a single product including:
	 * - 3:2 aspect ratio image (right side on desktop, top on mobile)
	 * - Title, price, and description (left side on desktop)
	 * - Full-width card with ingredients, tags, and "Add to Cart" button
	 * - "Back to Menu" link at bottom
	 *
	 * Layout:
	 * - Desktop (lg+): Two-column grid with text left, 3:2 image right
	 * - Mobile: Single column with 3:2 image on top, content below
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

	// Focal point for hero image (default to center)
	let heroFocalX = $derived(data.product.heroFocalX ?? 50);
	let heroFocalY = $derived(data.product.heroFocalY ?? 50);
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
	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
		<!-- Main Content: Two-column on desktop, single column on mobile -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
			<!-- Image Section (appears first on mobile, second on desktop) -->
			<div class="order-1 lg:order-2">
				{#if data.product.heroImageUrl || data.product.imageUrl}
					<div class="aspect-[3/2] w-full overflow-hidden rounded-xl bg-tertiary-medium shadow-lg">
						<img
							src={data.product.heroImageUrl || data.product.imageUrl}
							alt={data.product.title}
							class="h-full w-full object-cover"
							style="object-position: {heroFocalX}% {heroFocalY}%;"
						/>
					</div>
				{:else}
					<!-- Placeholder when no image -->
					<div
						class="flex aspect-[3/2] w-full items-center justify-center rounded-xl bg-tertiary-medium shadow-lg"
					>
						<img src="/images/Cookieart.png" alt="" class="h-32 w-auto" aria-hidden="true" />
					</div>
				{/if}
			</div>

			<!-- Text Content (appears second on mobile, first on desktop) -->
			<div class="order-2 flex flex-col lg:order-1">
				<!-- Title -->
				<h1 class="text-3xl font-bold text-secondary sm:text-4xl lg:text-5xl">
					{data.product.title}
				</h1>

				<!-- Decorative divider -->
				<div class="mt-4 h-1 w-16 rounded-full bg-primary"></div>

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
			</div>
		</div>

		<!-- Full-width Card: Ingredients, Tags, and Add to Cart -->
		<div class="mt-8 rounded-xl bg-card-bg p-6 shadow-md sm:p-8 lg:mt-12">
			<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<!-- Left side: Ingredients and Tags -->
				<div class="flex-1 space-y-4">
					<!-- Ingredients -->
					{#if hasIngredients}
						<div>
							<h2 class="text-sm font-semibold tracking-wide text-secondary uppercase">
								Ingredients
							</h2>
							<p class="mt-2 text-text-light">
								{data.product.ingredients}
							</p>
						</div>
					{/if}

					<!-- Tags -->
					{#if hasTags && data.product.tags}
						<div>
							<h2 class="text-sm font-semibold tracking-wide text-secondary uppercase">Tags</h2>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each data.product.tags as tag, i (i)}
									<span
										class="inline-block rounded-full bg-tertiary-medium px-3 py-1 text-sm font-medium text-secondary"
									>
										{tag}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Right side: Price and Add to Cart (Z-pattern reading) -->
				<div class="flex flex-col items-start gap-3 lg:items-end">
					<p class="text-2xl font-bold text-primary sm:text-3xl">
						{formattedPrice}
					</p>
					<AddToCartButton product={data.product} size="large" />
				</div>
			</div>
		</div>

		<!-- Back to Menu link -->
		<div class="mt-8 lg:mt-12">
			<a
				href="/menu"
				class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
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
		</div>
	</div>
</article>
