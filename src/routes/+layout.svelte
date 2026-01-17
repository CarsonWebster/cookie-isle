<script lang="ts">
	import './layout.css';
	import { config } from '$lib/config';
	import favicon from '$lib/assets/favicon.svg';
	import ComingSoon from '$lib/components/ComingSoon.svelte';

	let { children } = $props();

	// Open Graph image URL (using a placeholder for now, will be updated when images are in R2)
	const ogImage = `${config.baseUrl}/og-image.png`;

	// Check if we should show the coming soon page
	const showComingSoon = config.features.comingSoonMode;
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{config.title}</title>
	<meta name="title" content={config.title} />
	<meta name="description" content={config.description} />
	<meta name="author" content={config.author} />

	<!-- Favicon -->
	<link rel="icon" type="image/svg+xml" href={favicon} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={config.baseUrl} />
	<meta property="og:title" content={config.title} />
	<meta property="og:description" content={config.description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:site_name" content={config.title} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={config.baseUrl} />
	<meta property="twitter:title" content={config.title} />
	<meta property="twitter:description" content={config.description} />
	<meta property="twitter:image" content={ogImage} />

	<!-- Theme Color (for mobile browser chrome) -->
	<meta name="theme-color" content={config.colors.primary} />
</svelte:head>

{#if showComingSoon}
	<ComingSoon />
{:else}
	<div class="flex min-h-screen flex-col bg-tertiary">
		{@render children()}
	</div>
{/if}
