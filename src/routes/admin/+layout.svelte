<script lang="ts">
	import { page } from '$app/stores';
	import { config } from '$lib/config';

	let { children } = $props();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Navigation items
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/orders', label: 'Orders', icon: '📦' },
		{ href: '/admin/products', label: 'Products', icon: '🍪' },
		{ href: '/admin/gallery', label: 'Image Gallery', icon: '🖼️' },
		{ href: '/admin/slots', label: 'Fulfillment Slots', icon: '📅' },
		{ href: '/admin/newsletter', label: 'Newsletter', icon: '📧' }
	];

	// Check if a nav item is active (exact match or starts with path for subroutes)
	function isActive(href: string): boolean {
		const pathname = $page.url.pathname;
		if (href === '/admin') {
			// Dashboard: only active if exact match
			return pathname === '/admin';
		}
		// Other pages: active if starts with the href
		return pathname.startsWith(href);
	}

	// Close mobile menu when route changes
	$effect(() => {
		void $page.url.pathname;
		mobileMenuOpen = false;
	});

	// Close mobile menu on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && mobileMenuOpen) {
			mobileMenuOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Admin Dashboard | {config.title}</title>
</svelte:head>

<div class="flex min-h-screen bg-gray-100">
	<!-- Sidebar (Desktop) -->
	<aside
		class="fixed inset-y-0 left-0 z-30 hidden w-64 transform bg-footer-bg transition-transform md:block"
	>
		<div class="flex h-full flex-col">
			<!-- Logo/Brand -->
			<div class="flex items-center gap-3 border-b border-footer-text/20 px-6 py-4">
				<span class="text-3xl">🍪</span>
				<div>
					<h1 class="text-lg font-bold text-footer-text">{config.title}</h1>
					<p class="text-sm text-footer-text/70">Admin Dashboard</p>
				</div>
			</div>

			<!-- Navigation Links -->
			<nav class="flex-1 space-y-1 px-3 py-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{isActive(item.href) ? 'bg-primary text-white' : 'text-footer-text hover:bg-footer-text/10'}"
					>
						<span class="text-xl">{item.icon}</span>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Logout Button -->
			<div class="border-t border-footer-text/20 p-3">
				<form method="POST" action="/admin/logout">
					<button
						type="submit"
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-footer-text transition-colors hover:bg-footer-text/10"
					>
						<span class="text-xl">🚪</span>
						<span>Logout</span>
					</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Mobile Header -->
	<div class="fixed top-0 right-0 left-0 z-20 bg-footer-bg md:hidden">
		<div class="flex items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<span class="text-2xl">🍪</span>
				<h1 class="text-lg font-bold text-footer-text">{config.title}</h1>
			</div>
			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="rounded-lg p-2 text-footer-text hover:bg-footer-text/10"
				aria-label="Toggle menu"
				aria-expanded={mobileMenuOpen}
			>
				{#if mobileMenuOpen}
					<!-- Close icon -->
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{:else}
					<!-- Hamburger icon -->
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu Overlay -->
	{#if mobileMenuOpen}
		<div
			class="fixed inset-0 z-20 bg-black/50 md:hidden"
			onclick={() => (mobileMenuOpen = false)}
			aria-hidden="true"
		></div>
	{/if}

	<!-- Mobile Menu Drawer -->
	<aside
		class="fixed inset-y-0 left-0 z-30 w-64 transform bg-footer-bg transition-transform md:hidden
			{mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<div class="flex h-full flex-col">
			<!-- Logo/Brand -->
			<div class="flex items-center gap-3 border-b border-footer-text/20 px-6 py-4">
				<span class="text-3xl">🍪</span>
				<div>
					<h2 class="text-lg font-bold text-footer-text">{config.title}</h2>
					<p class="text-sm text-footer-text/70">Admin Dashboard</p>
				</div>
			</div>

			<!-- Navigation Links -->
			<nav class="flex-1 space-y-1 px-3 py-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{isActive(item.href) ? 'bg-primary text-white' : 'text-footer-text hover:bg-footer-text/10'}"
					>
						<span class="text-xl">{item.icon}</span>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Logout Button -->
			<div class="border-t border-footer-text/20 p-3">
				<form method="POST" action="/admin/logout">
					<button
						type="submit"
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-footer-text transition-colors hover:bg-footer-text/10"
					>
						<span class="text-xl">🚪</span>
						<span>Logout</span>
					</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="flex-1 pt-16 md:ml-64 md:pt-0">
		<div class="p-4 sm:p-6 lg:p-8">
			{@render children()}
		</div>
	</main>
</div>
