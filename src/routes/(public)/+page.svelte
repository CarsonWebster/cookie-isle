<script lang="ts">
	/**
	 * Homepage
	 *
	 * The main landing page featuring a hero section with site branding,
	 * a grid of featured cookies, and a link to the full menu.
	 *
	 * PRD Reference: 2.2
	 */

	import { config } from '$lib/config';
	import Hero from '$lib/components/Hero.svelte';
	import MenuCard from '$lib/components/MenuCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Determine if we have featured products to display
	let hasFeaturedProducts = $derived(data.featuredProducts.length > 0);
</script>

<svelte:head>
	<title>Home | {config.title}</title>
	<meta name="description" content={config.description} />
</svelte:head>

<!-- Hero Section -->
<Hero title={config.title} tagline={config.tagline} ctaText="Browse Our Menu" ctaHref="/menu" />

<!-- Featured Cookies Section -->
<section class="bg-tertiary py-12 sm:py-16 lg:py-20">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Section Header -->
		<div class="text-center">
			<h2 class="text-3xl font-bold text-secondary sm:text-4xl">Featured Cookies</h2>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-text-light">
				Our most popular treats, freshly baked with love
			</p>
		</div>

		<!-- Products Grid -->
		{#if hasFeaturedProducts}
			<div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.featuredProducts as product (product.id)}
					<MenuCard {product} />
				{/each}
			</div>
		{:else}
			<!-- Empty state when no featured products -->
			<div class="mt-10 text-center">
				<div
					class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-tertiary-medium"
				>
					<img src="/Cookieart.png" alt="" class="h-12 w-auto" aria-hidden="true" />
				</div>
				<p class="mt-4 text-lg text-text-light">Our featured cookies are being freshly baked!</p>
				<p class="mt-2 text-text-light">Check back soon or browse our full menu.</p>
			</div>
		{/if}

		<!-- View Full Menu Button -->
		<div class="mt-12 text-center">
			<a
				href="/menu"
				class="inline-flex items-center justify-center rounded-full border-2 border-primary bg-transparent px-8 py-3 text-base font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
			>
				View Full Menu
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ml-2 h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
		</div>
	</div>
</section>
