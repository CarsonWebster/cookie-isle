<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatPrice } from '$lib/config';
	import { formatTime } from './+page.server';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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

	// Track form submission state
	let isSubmitting = $state(false);

	// Show if order can be marked as fulfilled (status is "paid")
	let canMarkFulfilled = $derived(data.order.status === 'paid');
</script>

<svelte:head>
	<title>Order #{data.order.id} | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header with Back Link -->
	<div class="flex items-center gap-4">
		<a
			href="/admin/orders"
			class="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Orders
		</a>
	</div>

	<div class="border-b border-gray-200 pb-5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Order #{data.order.id}</h1>
				<p class="mt-1 text-sm text-gray-500">Placed on {data.order.createdAtFormatted}</p>
			</div>
			<div>
				<span
					class="inline-flex rounded-full px-4 py-2 text-base font-semibold {getStatusBadgeClass(
						data.order.status
					)}"
				>
					{formatStatus(data.order.status)}
				</span>
			</div>
		</div>
	</div>

	<!-- Success Message -->
	{#if form?.success}
		<div class="rounded-md bg-green-50 p-4">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-green-800">Order status updated successfully</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if form?.error}
		<div class="rounded-md bg-red-50 p-4">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-red-800">{form.error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content Grid -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Left Column: Customer & Fulfillment Info -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Customer Information -->
			<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">Customer Information</h2>
				</div>
				<div class="p-6">
					<dl class="space-y-3">
						<div class="flex justify-between">
							<dt class="text-sm font-medium text-gray-500">Name</dt>
							<dd class="text-sm text-gray-900">{data.order.customerName || 'N/A'}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-sm font-medium text-gray-500">Email</dt>
							<dd class="text-sm text-gray-900">
								{#if data.order.customerEmail}
									<a href="mailto:{data.order.customerEmail}" class="text-primary hover:underline">
										{data.order.customerEmail}
									</a>
								{:else}
									N/A
								{/if}
							</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-sm font-medium text-gray-500">Phone</dt>
							<dd class="text-sm text-gray-900">
								{#if data.order.customerPhone}
									<a href="tel:{data.order.customerPhone}" class="text-primary hover:underline">
										{data.order.customerPhone}
									</a>
								{:else}
									N/A
								{/if}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<!-- Fulfillment Information -->
			<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">Fulfillment Information</h2>
				</div>
				<div class="p-6">
					<dl class="space-y-3">
						<div class="flex justify-between">
							<dt class="text-sm font-medium text-gray-500">Type</dt>
							<dd class="text-sm text-gray-900 capitalize">
								{data.order.fulfillmentType || 'N/A'}
							</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-sm font-medium text-gray-500">Date</dt>
							<dd class="text-sm text-gray-900">{data.order.fulfillmentDateFormatted}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-sm font-medium text-gray-500">Time</dt>
							<dd class="text-sm text-gray-900">
								{formatTime(data.order.fulfillmentTime)}
							</dd>
						</div>

						{#if data.order.fulfillmentType === 'delivery' && data.order.deliveryAddress}
							<div class="pt-3">
								<dt class="text-sm font-medium text-gray-500">Delivery Address</dt>
								<dd class="mt-2 text-sm text-gray-900">
									<div>{data.order.deliveryAddress.street}</div>
									{#if data.order.deliveryAddress.apt}
										<div>{data.order.deliveryAddress.apt}</div>
									{/if}
									<div>
										{data.order.deliveryAddress.city}, {data.order.deliveryAddress.state}
										{data.order.deliveryAddress.zip}
									</div>
								</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>

			<!-- Order Items -->
			<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">Order Items</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Item
								</th>
								<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
									Quantity
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									Price
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
									Total
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each data.order.items as item (item.productId)}
								<tr>
									<td class="px-6 py-4">
										<a
											href="/menu/{item.slug}"
											class="text-sm font-medium text-gray-900 hover:text-primary"
										>
											{item.title}
										</a>
									</td>
									<td class="px-6 py-4 text-center text-sm text-gray-500">
										{item.quantity}
									</td>
									<td class="px-6 py-4 text-right text-sm text-gray-900">
										{formatPrice(item.priceCents)}
									</td>
									<td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
										{formatPrice(item.priceCents * item.quantity)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Gift Message (if present) -->
			{#if data.order.giftBox && data.order.giftMessage}
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
					<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-900">Gift Message</h2>
					</div>
					<div class="p-6">
						<p class="text-sm whitespace-pre-wrap text-gray-700">{data.order.giftMessage}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Column: Order Summary & Actions -->
		<div class="space-y-6">
			<!-- Order Summary -->
			<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">Order Summary</h2>
				</div>
				<div class="p-6">
					<dl class="space-y-3">
						<div class="flex justify-between">
							<dt class="text-sm text-gray-600">Subtotal</dt>
							<dd class="text-sm font-medium text-gray-900">{data.order.subtotalFormatted}</dd>
						</div>

						{#if data.order.tipCents && data.order.tipCents > 0}
							<div class="flex justify-between">
								<dt class="text-sm text-gray-600">Tip</dt>
								<dd class="text-sm font-medium text-gray-900">{data.order.tipFormatted}</dd>
							</div>
						{/if}

						{#if data.order.giftBox}
							<div class="flex justify-between">
								<dt class="text-sm text-gray-600">Gift Box</dt>
								<dd class="text-sm font-medium text-gray-900">$3.00</dd>
							</div>
						{/if}

						<div class="flex justify-between">
							<dt class="text-sm text-gray-600">Tax</dt>
							<dd class="text-sm font-medium text-gray-900">{data.order.taxFormatted}</dd>
						</div>

						<div class="flex justify-between border-t border-gray-200 pt-3">
							<dt class="text-base font-semibold text-gray-900">Total</dt>
							<dd class="text-base font-bold text-gray-900">{data.order.totalFormatted}</dd>
						</div>
					</dl>
				</div>
			</div>

			<!-- Actions -->
			{#if canMarkFulfilled}
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
					<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-900">Actions</h2>
					</div>
					<div class="p-6">
						<form method="POST" action="?/markFulfilled" use:enhance>
							<button
								type="submit"
								disabled={isSubmitting}
								class="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
							>
								{isSubmitting ? 'Updating...' : 'Mark as Fulfilled'}
							</button>
						</form>
						<p class="mt-2 text-xs text-gray-500">
							This will update the order status to fulfilled.
						</p>
					</div>
				</div>
			{/if}

			<!-- Order Metadata -->
			<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">Order Details</h2>
				</div>
				<div class="p-6">
					<dl class="space-y-3">
						<div>
							<dt class="text-xs font-medium text-gray-500 uppercase">Order ID</dt>
							<dd class="mt-1 text-sm text-gray-900">#{data.order.id}</dd>
						</div>
						{#if data.order.stripeSessionId}
							<div>
								<dt class="text-xs font-medium text-gray-500 uppercase">Stripe Session</dt>
								<dd class="mt-1 text-xs break-all text-gray-600">
									{data.order.stripeSessionId}
								</dd>
							</div>
						{/if}
						<div>
							<dt class="text-xs font-medium text-gray-500 uppercase">Created</dt>
							<dd class="mt-1 text-sm text-gray-900">{data.order.createdAtFormatted}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	</div>
</div>
