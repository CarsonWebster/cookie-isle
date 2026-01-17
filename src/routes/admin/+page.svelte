<script lang="ts">
	import { config } from '$lib/config';
	import type { DashboardData } from './dashboard';

	interface Props {
		data: DashboardData;
	}

	let { data }: Props = $props();

	// Computed values
	let hasRecentOrders = $derived(data.recentOrders.length > 0);
	let hasCookiesNeeded = $derived(data.cookiesNeededToday.length > 0);
	let totalCookiesNeeded = $derived(
		data.cookiesNeededToday.reduce((sum: number, item) => sum + item.quantity, 0)
	);

	/**
	 * Get status badge color classes
	 */
	function getStatusBadgeClass(status: string | null): string {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'paid':
				return 'bg-blue-100 text-blue-800';
			case 'fulfilled':
				return 'bg-green-100 text-green-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	/**
	 * Format status text for display
	 */
	function formatStatus(status: string | null): string {
		if (!status) return 'Unknown';
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	/**
	 * Format date for display
	 */
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'Unknown';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
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

	<!-- Stats Grid -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Today's Orders</div>
			<div class="mt-2 text-3xl font-bold text-secondary">{data.stats.todayOrdersCount}</div>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Pending Orders</div>
			<div class="mt-2 text-3xl font-bold text-secondary">{data.stats.pendingOrdersCount}</div>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Today's Revenue</div>
			<div class="mt-2 text-3xl font-bold text-secondary">
				{data.stats.todayRevenueFormatted}
			</div>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="text-sm font-medium text-text-light">Total Products</div>
			<div class="mt-2 text-3xl font-bold text-secondary">{data.stats.totalProductsCount}</div>
		</div>
	</div>

	<!-- Cookies Needed Today -->
	<div class="rounded-xl bg-white p-6 shadow-md">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold text-secondary">Cookies Needed Today</h2>
			{#if hasCookiesNeeded}
				<span class="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
					{totalCookiesNeeded} total
				</span>
			{/if}
		</div>
		{#if hasCookiesNeeded}
			<div class="mt-4 space-y-2">
				{#each data.cookiesNeededToday as cookie}
					<div class="flex items-center justify-between rounded-lg bg-tertiary p-4">
						<div class="flex items-center gap-3">
							<img src="/Cookieart.png" alt="" class="h-8 w-auto" aria-hidden="true" />
							<span class="font-medium text-secondary">{cookie.productName}</span>
						</div>
						<span class="rounded-full bg-primary px-3 py-1 font-bold text-white">
							{cookie.quantity}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="mt-4 text-text-light">No orders for today's fulfillment.</p>
		{/if}
	</div>

	<!-- Recent Orders -->
	<div class="rounded-xl bg-white p-6 shadow-md">
		<h2 class="text-xl font-bold text-secondary">Recent Orders</h2>
		{#if hasRecentOrders}
			<div class="mt-4 overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-tertiary-medium text-left text-sm text-text-light">
							<th class="pb-3 font-medium">Order #</th>
							<th class="pb-3 font-medium">Customer</th>
							<th class="pb-3 font-medium">Total</th>
							<th class="pb-3 font-medium">Status</th>
							<th class="pb-3 font-medium">Date</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-tertiary-light">
						{#each data.recentOrders as order}
							<tr class="transition-colors hover:bg-tertiary">
								<td class="py-3 text-secondary">#{order.id}</td>
								<td class="py-3">{order.customerName || 'Unknown'}</td>
								<td class="py-3 font-medium">{order.totalFormatted}</td>
								<td class="py-3">
									<span
										class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusBadgeClass(
											order.status
										)}"
									>
										{formatStatus(order.status)}
									</span>
								</td>
								<td class="py-3 text-sm text-text-light">{formatDate(order.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="mt-4 text-text-light">No orders yet.</p>
		{/if}
	</div>

	<!-- Quick Links -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<a
			href="/admin/orders"
			class="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
		>
			<span class="text-4xl">📦</span>
			<span class="mt-2 font-medium text-secondary">View All Orders</span>
		</a>
		<a
			href="/admin/products"
			class="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
		>
			<img src="/Cookieart.png" alt="" class="h-12 w-auto" aria-hidden="true" />
			<span class="mt-2 font-medium text-secondary">Manage Products</span>
		</a>
		<a
			href="/admin/slots"
			class="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
		>
			<span class="text-4xl">📅</span>
			<span class="mt-2 font-medium text-secondary">Fulfillment Slots</span>
		</a>
		<a
			href="/admin/newsletter"
			class="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
		>
			<span class="text-4xl">📧</span>
			<span class="mt-2 font-medium text-secondary">Newsletter</span>
		</a>
	</div>
</div>
