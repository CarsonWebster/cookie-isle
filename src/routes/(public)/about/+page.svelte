<script lang="ts">
	/**
	 * About Page
	 *
	 * Displays information about The Cookie Isle bakery with prose-styled
	 * content migrated from legacy Hugo site.
	 *
	 * PRD Reference: 2.6
	 */

	import { config } from '$lib/config';
</script>

<svelte:head>
	<title>About Us | {config.title}</title>
	<meta name="description" content="Learn about {config.title} and our passion for baking" />
</svelte:head>

<!-- About Page Content -->
<section class="bg-tertiary py-12 sm:py-16 lg:py-20">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<!-- Page Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-secondary sm:text-5xl">About Us</h1>
			<!-- Decorative underline -->
			<div class="mt-4 flex justify-center">
				<div class="h-1 w-24 rounded-full bg-primary"></div>
			</div>
		</div>

		<!-- Prose Content -->
		<article
			class="mx-auto prose prose-lg mt-12 max-w-none prose-headings:text-secondary prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-bold prose-p:leading-relaxed prose-p:text-text-light prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-secondary prose-li:text-text-light"
		>
			<h2>Our Story</h2>
			<p>
				{config.title} started in a tiny home kitchen with a big dream: to bring the joy of fresh-baked
				cookies to our community. What began as batches for friends and family quickly grew into something
				more—a micro-bakery built on love, quality ingredients, and recipes perfected over generations.
			</p>

			<h2>Our Philosophy</h2>
			<p>
				We believe cookies should be more than just a snack. They're a moment of comfort, a sweet
				surprise in your day, and a way to show someone you care. That's why we:
			</p>
			<ul class="list-none space-y-3 pl-0">
				<li class="flex items-start gap-3">
					<span class="mt-1 text-primary">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
					<span><strong>Bake fresh daily</strong> – No day-old cookies here</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-primary">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
					<span
						><strong>Use real ingredients</strong> – Real butter, pure vanilla, premium chocolate</span
					>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-primary">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
					<span><strong>Make everything by hand</strong> – Each cookie is crafted with care</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-primary">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
					<span><strong>Keep it small</strong> – Quality over quantity, always</span>
				</li>
			</ul>

			<h2>Meet the Baker</h2>
			<p>
				Hi, I'm the heart and hands behind {config.title}. Baking has been my passion since I was
				tall enough to reach the counter (with a little help from a step stool). After years of
				perfecting recipes and sharing cookies with everyone who walked through my door, I decided
				to turn that passion into something more.
			</p>
			<p>
				Every cookie that leaves our kitchen carries a piece of that original joy—the simple
				happiness of pulling a warm tray from the oven and sharing it with someone special.
			</p>

			<h2>Visit Us</h2>
			<p>
				We'd love to see you! Stop by our kitchen for a warm cookie and a smile. Pre-orders are
				always welcome for special occasions, events, or just because you deserve a treat.
			</p>

			{#if config.contact.emailEnabled}
				<p>
					Have questions? Reach out to us at{' '}
					<a href="mailto:{config.contact.email}">{config.contact.email}</a>
				</p>
			{/if}
		</article>

		<!-- CTA Section -->
		<div class="mt-16 text-center">
			<a
				href="/menu"
				class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-btn-text shadow-lg transition-all duration-200 hover:bg-btn-hover-bg hover:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
			>
				Browse Our Menu
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
				</svg>
			</a>
		</div>
	</div>
</section>
