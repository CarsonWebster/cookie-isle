<script lang="ts">
	import { config } from '$lib/config';
</script>

<svelte:head>
	<title>Home | {config.title}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-secondary sm:text-5xl">
			Welcome to {config.title}
		</h1>
		<p class="mx-auto mt-4 max-w-2xl text-lg text-text-light">
			{config.tagline}
		</p>
		<div class="mt-8">
			<a
				href="/menu"
				class="inline-block rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-primary/90"
			>
				Browse Our Menu
			</a>
		</div>
	</div>
</div>
