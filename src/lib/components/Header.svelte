<script lang="ts">
	import { onMount } from 'svelte';
	import { config, getSortedMenu } from '$lib/config';
	import CartBadge from '$lib/components/CartBadge.svelte';
	import { initializeCart, getCartCount } from '$lib/stores/cart.svelte';

	// Mobile menu state using Svelte 5 runes
	let mobileMenuOpen = $state(false);

	// Get sorted menu items
	const menuItems = getSortedMenu();

	// Initialize cart from localStorage on client mount
	onMount(() => {
		initializeCart();
	});

	function openMobileMenu() {
		mobileMenuOpen = true;
		// Prevent body scroll when menu is open
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'hidden';
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
		// Restore body scroll
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && mobileMenuOpen) {
			closeMobileMenu();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="sticky top-0 z-40 bg-header-bg shadow-sm">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 text-header-text">
			<img src="/CookieIsleLogo.png" alt="" class="h-10 w-auto" aria-hidden="true" />
			<span class="text-xl font-semibold">{config.title}</span>
		</a>

		<!-- Desktop Navigation -->
		<nav class="hidden items-center gap-6 md:flex">
			{#each menuItems as item (item.url)}
				<a href={item.url} class="text-header-text transition-colors hover:text-primary">
					{item.name}
				</a>
			{/each}

			<!-- Calendar link (if enabled) -->
			{#if config.calendar.enabled && config.calendar.pageEnabled}
				<a href="/calendar" class="text-header-text transition-colors hover:text-primary">
					Calendar
				</a>
			{/if}
		</nav>

		<!-- Desktop Actions (Cart + Social) -->
		<div class="hidden items-center gap-4 md:flex">
			<!-- Social Icons -->
			{#if config.social.instagramEnabled}
				<a
					href={config.social.instagram}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Follow us on Instagram"
					class="text-header-text transition-colors hover:text-primary"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
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
					class="text-header-text transition-colors hover:text-primary"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
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

			<!-- Cart Button -->
			{#if config.cart.enabled}
				<a
					href="/checkout"
					class="relative text-header-text transition-colors hover:text-primary"
					aria-label="Shopping Cart"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="9" cy="21" r="1"></circle>
						<circle cx="20" cy="21" r="1"></circle>
						<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
					</svg>
					<!-- Cart Badge -->
					<CartBadge />
				</a>
			{/if}
		</div>

		<!-- Mobile Menu Toggle -->
		<button
			class="flex flex-col gap-1.5 p-2 md:hidden"
			onclick={openMobileMenu}
			aria-label="Open menu"
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-nav"
		>
			<span class="block h-0.5 w-6 bg-header-text"></span>
			<span class="block h-0.5 w-6 bg-header-text"></span>
			<span class="block h-0.5 w-6 bg-header-text"></span>
		</button>
	</div>
</header>

<!-- Mobile Navigation Overlay -->
{#if mobileMenuOpen}
	<div
		class="fixed inset-0 z-40 bg-black/50 md:hidden"
		onclick={closeMobileMenu}
		onkeydown={(e) => e.key === 'Enter' && closeMobileMenu()}
		role="button"
		tabindex="0"
		aria-label="Close menu"
	></div>
{/if}

<!-- Mobile Slide-out Navigation -->
<nav
	id="mobile-nav"
	class="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] transform bg-tertiary-light shadow-xl transition-transform duration-300 ease-in-out md:hidden {mobileMenuOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	aria-hidden={!mobileMenuOpen}
>
	<!-- Mobile Nav Header -->
	<div class="flex items-center justify-between border-b border-tertiary-medium p-4">
		<a href="/" class="flex items-center gap-2 text-secondary" onclick={closeMobileMenu}>
			<img src="/CookieIsleLogo.png" alt="" class="h-8 w-auto" aria-hidden="true" />
			<span class="text-lg font-semibold">{config.title}</span>
		</a>
		<button onclick={closeMobileMenu} aria-label="Close menu" class="p-2 text-secondary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	</div>

	<!-- Mobile Nav Links -->
	<ul class="flex flex-col p-4">
		{#each menuItems as item (item.url)}
			<li>
				<a
					href={item.url}
					class="block py-3 text-lg text-secondary transition-colors hover:text-primary"
					onclick={closeMobileMenu}
				>
					{item.name}
				</a>
			</li>
		{/each}

		<!-- Calendar link (if enabled) -->
		{#if config.calendar.enabled && config.calendar.pageEnabled}
			<li>
				<a
					href="/calendar"
					class="block py-3 text-lg text-secondary transition-colors hover:text-primary"
					onclick={closeMobileMenu}
				>
					Calendar
				</a>
			</li>
		{/if}

		<!-- Cart Link -->
		{#if config.cart.enabled}
			<li>
				<a
					href="/checkout"
					class="flex items-center gap-2 py-3 text-lg text-secondary transition-colors hover:text-primary"
					onclick={closeMobileMenu}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<circle cx="9" cy="21" r="1"></circle>
						<circle cx="20" cy="21" r="1"></circle>
						<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
					</svg>
					Cart
					{#if getCartCount() > 0}
						<span
							class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
						>
							{getCartCount() > 99 ? '99+' : getCartCount()}
						</span>
					{/if}
				</a>
			</li>
		{/if}
	</ul>

	<!-- Mobile Nav Footer (Contact + Social) -->
	<div class="absolute right-0 bottom-0 left-0 border-t border-tertiary-medium p-4">
		<!-- Contact Links -->
		{#if config.contact.emailEnabled}
			<a
				href="mailto:{config.contact.email}"
				class="mb-2 flex items-center gap-2 text-sm text-text-light hover:text-primary"
			>
				<span>✉️</span>
				{config.contact.email}
			</a>
		{/if}

		{#if config.contact.phoneEnabled}
			<a
				href="tel:{config.contact.phone}"
				class="mb-4 flex items-center gap-2 text-sm text-text-light hover:text-primary"
			>
				<span>📞</span>
				{config.contact.phone}
			</a>
		{/if}

		<!-- Social Links -->
		<div class="flex gap-4">
			{#if config.social.instagramEnabled}
				<a
					href={config.social.instagram}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Follow us on Instagram"
					class="text-secondary transition-colors hover:text-primary"
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
					class="text-secondary transition-colors hover:text-primary"
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
	</div>
</nav>
