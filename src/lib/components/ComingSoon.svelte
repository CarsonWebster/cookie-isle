<script lang="ts">
	/**
	 * ComingSoon Component
	 *
	 * A full-page coming soon landing page with newsletter signup form,
	 * contact information, and social media links.
	 *
	 * This component is shown when config.features.comingSoonMode is true,
	 * replacing the normal site layout.
	 *
	 * PRD Reference: 2.7
	 */

	import { config } from '$lib/config';

	// Newsletter form state using Svelte 5 runes
	let email = $state('');
	let isSubmitting = $state(false);
	let submitStatus = $state<'idle' | 'success' | 'error'>('idle');
	let submitMessage = $state('');

	// Derived state for form validation
	let isValidEmail = $derived(email.includes('@') && email.includes('.'));

	/**
	 * Handle newsletter form submission
	 * For now, this just shows a success message.
	 * In Phase 4.6, this will POST to /api/newsletter
	 */
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!isValidEmail || isSubmitting) return;

		isSubmitting = true;
		submitStatus = 'idle';
		submitMessage = '';

		try {
			// TODO: In Phase 4.6, this will POST to /api/newsletter
			// For now, simulate a successful submission
			await new Promise((resolve) => setTimeout(resolve, 500));

			submitStatus = 'success';
			submitMessage = config.newsletter.successMessage;
			email = ''; // Clear the form
		} catch {
			submitStatus = 'error';
			submitMessage = config.newsletter.errorMessage;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<!-- Coming Soon Full Page -->
<section
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-tertiary via-tertiary-light to-tertiary-medium"
>
	<!-- Decorative background elements (same pattern as Hero) -->
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-10"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-accent)_0%,_transparent_50%)] opacity-10"
		aria-hidden="true"
	></div>

	<!-- Content container -->
	<div class="relative z-10 mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
		<!-- Logo / Brand -->
		<div class="mb-8">
			<div class="mb-4 text-6xl sm:text-7xl" aria-hidden="true">
				<span class="inline-block animate-bounce">🍪</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-secondary sm:text-4xl md:text-5xl">
				{config.title}
			</h1>
		</div>

		<!-- Coming Soon Headline -->
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-semibold text-primary sm:text-2xl">
				{config.features.comingSoonHeadline}
			</h2>
			<!-- Multiline text with whitespace preserved -->
			<p class="mx-auto max-w-lg text-base leading-relaxed whitespace-pre-line text-text-light">
				{config.features.comingSoonText}
			</p>
		</div>

		<!-- Newsletter Signup Form -->
		{#if config.newsletter.enabled}
			<div class="mx-auto mb-10 max-w-md">
				<h3 class="mb-4 text-lg font-medium text-secondary">
					{config.newsletter.headline}
				</h3>
				<form onsubmit={handleSubmit} class="flex flex-col gap-3 sm:flex-row">
					<label for="newsletter-email" class="sr-only">Email address</label>
					<input
						id="newsletter-email"
						type="email"
						bind:value={email}
						placeholder={config.newsletter.placeholder}
						required
						disabled={isSubmitting}
						class="flex-1 rounded-full border border-tertiary-medium bg-white px-5 py-3 text-secondary placeholder-text-light/60 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					/>
					<button
						type="submit"
						disabled={isSubmitting || !isValidEmail}
						class="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-btn-text shadow-md transition-all hover:bg-btn-hover-bg hover:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSubmitting}
							<svg
								class="mr-2 h-5 w-5 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Submitting...
						{:else}
							{config.newsletter.buttonText}
						{/if}
					</button>
				</form>

				<!-- Status Messages -->
				{#if submitStatus === 'success'}
					<p class="mt-3 text-sm font-medium text-green-600" role="status" aria-live="polite">
						{submitMessage}
					</p>
				{:else if submitStatus === 'error'}
					<p class="mt-3 text-sm font-medium text-red-600" role="alert" aria-live="polite">
						{submitMessage}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Contact Email -->
		{#if config.contact.emailEnabled}
			<div class="mb-8">
				<p class="text-sm text-text-light">
					Questions? Reach out at{' '}
					<a
						href="mailto:{config.contact.email}"
						class="font-medium text-primary transition-colors hover:text-btn-hover-bg hover:underline"
					>
						{config.contact.email}
					</a>
				</p>
			</div>
		{/if}

		<!-- Social Media Links -->
		{#if config.social.instagramEnabled || config.social.facebookEnabled}
			<div class="flex justify-center gap-6">
				{#if config.social.instagramEnabled}
					<a
						href={config.social.instagram}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Follow us on Instagram"
						class="text-text-light transition-colors hover:text-primary"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
							/>
						</svg>
					</a>
				{/if}

				{#if config.social.facebookEnabled}
					<a
						href={config.social.facebook}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Follow us on Facebook"
						class="text-text-light transition-colors hover:text-primary"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
							/>
						</svg>
					</a>
				{/if}
			</div>
		{/if}
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
