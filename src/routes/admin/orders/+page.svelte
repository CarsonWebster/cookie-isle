<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Status badge color classes
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

	// Capitalize status string
	function formatStatus(status: string | null): string {
		if (!status) return 'Unknown';
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	// Format fulfillment date to readable format
	function formatFulfillmentDate(date: string | null): string {
		if (!date) return 'N/A';
		try {
			const d = new Date(date);
			return d.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return date;
		}
	}

	// Handle filter change
	function updateFilters(dateValue: string, statusValue: string) {
		const params = new URLSearchParams($page.url.searchParams);

		if (dateValue === 'all') {
			params.delete('date');
		} else {
			params.set('date', dateValue);
		}

		if (statusValue === 'all') {
			params.delete('status');
		} else {
			params.set('status', statusValue);
		}

		goto(`?${params.toString()}`, { replaceState: true });
	}

	function handleDateChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateFilters(target.value, data.statusFilter);
	}

	function handleStatusChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateFilters(data.dateFilter, target.value);
	}

	function handleRowClick(orderId: number) {
		goto(`/admin/orders/${orderId}`);
	}
</script>

<svelte:head>
	<title>Orders | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="border-b border-gray-200 pb-5">
		<h1 class="text-3xl font-bold text-gray-900">Orders</h1>
		<p class="mt-2 text-sm text-gray-600">View and manage customer orders</p>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-4">
		<!-- Date Filter -->
		<div class="min-w-[200px] flex-1">
			<label for="date-filter" class="mb-1 block text-sm font-medium text-gray-700">
				Fulfillment Date
			</label>
			<select
				id="date-filter"
				value={data.dateFilter}
				onchange={handleDateChange}
				class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
			>
				<option value="all">All Dates</option>
				<option value={data.todayDate}>Today</option>
				{#each data.availableDates as date}
					{#if date !== data.todayDate}
						<option value={date}>
							{formatFulfillmentDate(date)}
						</option>
					{/if}
				{/each}
			</select>
		</div>

		<!-- Status Filter -->
		<div class="min-w-[200px] flex-1">
			<label for="status-filter" class="mb-1 block text-sm font-medium text-gray-700">
				Order Status
			</label>
			<select
				id="status-filter"
				value={data.statusFilter}
				onchange={handleStatusChange}
				class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
			>
				<option value="all">All Statuses</option>
				<option value="pending">Pending</option>
				<option value="paid">Paid</option>
				<option value="fulfilled">Fulfilled</option>
				<option value="cancelled">Cancelled</option>
			</select>
		</div>
	</div>

	<!-- Orders Table (Desktop) -->
	<div class="hidden overflow-x-auto rounded-lg border border-gray-200 shadow-sm md:block">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Order #
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Customer
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Items
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Total
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Status
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Fulfillment
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Date
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if data.orders.length === 0}
					<tr>
						<td colspan="7" class="px-6 py-12 text-center">
							<div class="text-gray-500">
								<p class="text-lg font-medium">No orders found</p>
								<p class="mt-1 text-sm">Try adjusting your filters</p>
							</div>
						</td>
					</tr>
				{:else}
					{#each data.orders as order (order.id)}
						<tr
							class="cursor-pointer transition-colors hover:bg-gray-50"
							onclick={() => handleRowClick(order.id)}
						>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
								#{order.id}
							</td>
							<td class="px-6 py-4">
								<div class="text-sm font-medium text-gray-900">{order.customerName || 'N/A'}</div>
								<div class="text-sm text-gray-500">{order.customerEmail || ''}</div>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{order.itemsSummary}
							</td>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
								{order.totalFormatted}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusBadgeClass(
										order.status
									)}"
								>
									{formatStatus(order.status)}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								<div>{formatFulfillmentDate(order.fulfillmentDate)}</div>
								<div class="text-xs capitalize">{order.fulfillmentType || 'N/A'}</div>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{order.createdAtFormatted}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Orders Cards (Mobile) -->
	<div class="space-y-4 md:hidden">
		{#if data.orders.length === 0}
			<div class="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
				<div class="text-gray-500">
					<p class="text-lg font-medium">No orders found</p>
					<p class="mt-1 text-sm">Try adjusting your filters</p>
				</div>
			</div>
		{:else}
			{#each data.orders as order (order.id)}
				<button
					type="button"
					class="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
					onclick={() => handleRowClick(order.id)}
				>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-bold text-gray-900">Order #{order.id}</span>
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusBadgeClass(
										order.status
									)}"
								>
									{formatStatus(order.status)}
								</span>
							</div>
							<div class="mt-1 text-sm font-medium text-gray-700">
								{order.customerName || 'N/A'}
							</div>
							<div class="mt-1 text-xs text-gray-500">{order.customerEmail || ''}</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-bold text-gray-900">{order.totalFormatted}</div>
							<div class="mt-1 text-xs text-gray-500">{order.createdAtFormatted}</div>
						</div>
					</div>
					<div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
						<div class="text-sm text-gray-600">{order.itemsSummary}</div>
						<div class="text-xs text-gray-500">
							{formatFulfillmentDate(order.fulfillmentDate)}
						</div>
					</div>
				</button>
			{/each}
		{/if}
	</div>
</div>
