<script lang="ts">
	/**
	 * Menu Page
	 *
	 * Displays all active products in a responsive grid with page title
	 * and decorative underline. Shows empty state when no products exist.
	 *
	 * PRD Reference: 2.4
	 */

	import { config } from '$lib/config';
	import MenuCard from '$lib/components/MenuCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Determine if we have products to display
	let hasProducts = $derived(data.products.length > 0);
</script>

<svelte:head>
	<title>Our Menu | {config.title}</title>
	<meta
		name="description"
		content="Browse our selection of freshly baked cookies. Each cookie is made with love using quality ingredients."
	/>
</svelte:head>

<!-- Menu Page Content -->
<section class="bg-tertiary py-12 sm:py-16 lg:py-20">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Page Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-secondary sm:text-5xl">Our Menu</h1>
			<!-- Decorative underline -->
			<div class="mt-4 flex justify-center">
				<div class="h-1 w-24 rounded-full bg-primary"></div>
			</div>
			<p class="mx-auto mt-6 max-w-2xl text-lg text-text-light">
				Freshly baked with love, each cookie is crafted using quality ingredients
			</p>
		</div>

		<!-- Products Grid -->
		{#if hasProducts}
			<div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.products as product (product.id)}
					<MenuCard {product} />
				{/each}
			</div>
		{:else}
			<!-- Empty state when no products -->
			<div class="mt-16 text-center">
				<div
					class="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-tertiary-medium"
				>
					<span class="text-6xl" aria-hidden="true">🍪</span>
				</div>
				<h2 class="mt-6 text-2xl font-semibold text-secondary">No Cookies Available</h2>
				<p class="mt-3 text-lg text-text-light">
					Our bakers are hard at work! Check back soon for freshly baked treats.
				</p>
				<a
					href="/"
					class="mt-8 inline-flex items-center justify-center rounded-full border-2 border-primary bg-transparent px-8 py-3 text-base font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
				>
					Back to Home
				</a>
			</div>
		{/if}
	</div>
</section>
