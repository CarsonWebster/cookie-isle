<script lang="ts">
	import { config, getSortedMenu } from '$lib/config';

	// Get sorted menu items for footer navigation
	const menuItems = getSortedMenu();

	// Get current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<footer class="bg-footer-bg text-footer-text">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Footer Grid -->
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
			<!-- Brand Section -->
			<div class="md:col-span-1 lg:col-span-2">
				<a href="/" class="flex items-center gap-2">
					<img src="/CookieIsleLogo.png" alt="" class="h-12 w-auto" aria-hidden="true" />
					<span class="text-2xl font-semibold text-footer-heading">{config.title}</span>
				</a>
				<p class="mt-3 max-w-md text-sm leading-relaxed text-footer-text/80">
					{config.tagline}
				</p>
				<p class="mt-2 max-w-md text-sm leading-relaxed text-footer-text/70">
					{config.description}
				</p>
			</div>

			<!-- Navigation Links -->
			<div>
				<h3 class="mb-4 text-sm font-semibold tracking-wider text-footer-heading uppercase">
					Navigation
				</h3>
				<nav>
					<ul class="space-y-2">
						{#each menuItems as item (item.url)}
							<li>
								<a
									href={item.url}
									class="text-sm text-footer-text/80 transition-colors hover:text-footer-heading"
								>
									{item.name}
								</a>
							</li>
						{/each}
						{#if config.calendar.enabled && config.calendar.pageEnabled}
							<li>
								<a
									href="/calendar"
									class="text-sm text-footer-text/80 transition-colors hover:text-footer-heading"
								>
									Calendar
								</a>
							</li>
						{/if}
					</ul>
				</nav>
			</div>

			<!-- Contact & Social Section -->
			<div>
				<h3 class="mb-4 text-sm font-semibold tracking-wider text-footer-heading uppercase">
					Connect
				</h3>

				<!-- Contact Links -->
				<div class="space-y-2">
					{#if config.contact.emailEnabled}
						<a
							href="mailto:{config.contact.email}"
							class="flex items-center gap-2 text-sm text-footer-text/80 transition-colors hover:text-footer-heading"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path
									d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
								></path>
								<polyline points="22,6 12,13 2,6"></polyline>
							</svg>
							<span>{config.contact.email}</span>
						</a>
					{/if}

					{#if config.contact.phoneEnabled}
						<a
							href="tel:{config.contact.phone}"
							class="flex items-center gap-2 text-sm text-footer-text/80 transition-colors hover:text-footer-heading"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path
									d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
								></path>
							</svg>
							<span>{config.contact.phone}</span>
						</a>
					{/if}
				</div>

				<!-- Social Icons -->
				{#if config.social.instagramEnabled || config.social.facebookEnabled}
					<div class="mt-4 flex gap-4">
						{#if config.social.instagramEnabled}
							<a
								href={config.social.instagram}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Follow us on Instagram"
								class="text-footer-text/80 transition-colors hover:text-footer-heading"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
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
								class="text-footer-text/80 transition-colors hover:text-footer-heading"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
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
		</div>

		<!-- Bottom Bar with Copyright -->
		<div class="mt-12 border-t border-footer-text/20 pt-8">
			<p class="text-center text-sm text-footer-text/60">
				&copy; {currentYear}
				{config.title}. All rights reserved.
			</p>
		</div>
	</div>
</footer>
