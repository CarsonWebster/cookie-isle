<script lang="ts">
	import { config } from '$lib/config';
</script>

<svelte:head>
	<title>Dashboard | Admin | {config.title}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-3xl font-bold text-secondary">Dashboard</h1>
		<p class="mt-2 text-text-light">Welcome to your admin dashboard</p>
	</div>

	<!-- Placeholder Stats -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Today's Orders</div>
			<div class="mt-2 text-3xl font-bold text-secondary">0</div>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Pending Orders</div>
			<div class="mt-2 text-3xl font-bold text-secondary">0</div>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Today's Revenue</div>
			<div class="mt-2 text-3xl font-bold text-secondary">$0.00</div>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Total Products</div>
			<div class="mt-2 text-3xl font-bold text-secondary">0</div>
		</div>
	</div>

	<!-- Coming Soon Message -->
	<div class="rounded-xl bg-white p-8 shadow-md">
		<div class="text-center">
			<span class="text-6xl">🚧</span>
			<h2 class="mt-4 text-xl font-bold text-secondary">Dashboard Coming Soon</h2>
			<p class="mt-2 text-text-light">
				The full admin dashboard with statistics and recent orders will be implemented in the next
				phase.
			</p>
			<p class="mt-1 text-sm text-text-light">
				For now, you can access Orders, Products, Slots, and Newsletter from the sidebar.
			</p>
		</div>
	</div>
</div>
