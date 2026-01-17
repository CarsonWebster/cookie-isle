<script lang="ts">
	/**
	 * Hero Component
	 *
	 * A full-width hero section with gradient background, title, tagline, and CTA button.
	 * Used on the homepage to create an impactful first impression.
	 *
	 * PRD Reference: 2.1
	 */

	interface Props {
		/** Main headline text */
		title: string;
		/** Subheadline or tagline text */
		tagline?: string;
		/** Call-to-action button text */
		ctaText?: string;
		/** Call-to-action button href */
		ctaHref?: string;
	}

	let { title, tagline, ctaText, ctaHref }: Props = $props();
</script>

<section
	class="relative overflow-hidden bg-gradient-to-br from-tertiary via-tertiary-light to-tertiary-medium"
>
	<!-- Decorative background elements -->
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-10"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-accent)_0%,_transparent_50%)] opacity-10"
		aria-hidden="true"
	></div>

	<!-- Content container -->
	<div class="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
		<div class="text-center">
			<!-- Cookie emoji decoration -->
			<div class="mb-4 text-4xl sm:text-5xl" aria-hidden="true">
				<span class="inline-block animate-bounce">🍪</span>
			</div>

			<!-- Title -->
			<h1
				class="text-3xl font-bold tracking-tight text-secondary sm:text-4xl md:text-5xl lg:text-6xl"
			>
				{title}
			</h1>

			<!-- Tagline -->
			{#if tagline}
				<p class="mx-auto mt-4 max-w-xl text-lg text-text-light sm:mt-6 sm:text-xl md:text-2xl">
					{tagline}
				</p>
			{/if}

			<!-- CTA Button -->
			{#if ctaText && ctaHref}
				<div class="mt-8 sm:mt-10">
					<a
						href={ctaHref}
						class="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-btn-text shadow-lg transition-all duration-200 hover:bg-btn-hover-bg hover:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none sm:px-10 sm:py-4 sm:text-lg"
					>
						{ctaText}
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
			{/if}
		</div>
	</div>

	<!-- Decorative wave at bottom -->
	<div class="absolute right-0 bottom-0 left-0" aria-hidden="true">
		<svg
			viewBox="0 0 1440 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="w-full text-tertiary"
			preserveAspectRatio="none"
		>
			<path d="M0 50C240 80 480 20 720 50C960 80 1200 20 1440 50V100H0V50Z" fill="currentColor" />
		</svg>
	</div>
</section>
