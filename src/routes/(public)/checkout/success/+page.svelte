<!--
	Checkout Success Page
	
	Displays order confirmation after successful Stripe checkout.
	Shows order summary, fulfillment details, and customer info.
	Clears cart from localStorage on page load.
	
	PRD Reference: 4.4.6 - 4.4.12
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { config, formatPrice } from '$lib/config';
	import { clearCart, clearStorage } from '$lib/stores/cart.svelte';
	import { formatFulfillmentDate, formatFulfillmentTime, formatFulfillmentType } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const order = $derived(data.order);

	// Clear cart on successful checkout
	onMount(() => {
		clearCart();
		clearStorage();
	});

	// Helper to check if address should be displayed
	const showDeliveryAddress = $derived(
		order.fulfillmentType === 'delivery' && order.deliveryAddress
	);

	// Calculate item count
	const itemCount = $derived(order.items.reduce((sum, item) => sum + item.quantity, 0));
</script>

<svelte:head>
	<title>Order Confirmed | {config.title}</title>
	<meta name="description" content="Thank you for your order!" />
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="bg-tertiary py-12 sm:py-16 lg:py-20">
	<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
		<!-- Success Header -->
		<div class="mb-10 text-center">
			<!-- Success Icon -->
			<div
				class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
			>
				<svg
					class="h-12 w-12 text-green-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>

			<h1 class="mb-2 text-3xl font-bold text-secondary sm:text-4xl">Order Confirmed!</h1>
			<p class="text-lg text-text-light">
				Thank you for your order. We've sent a confirmation to
				<span class="font-medium text-secondary">{order.customerEmail}</span>.
			</p>
		</div>

		<!-- Order Details Card -->
		<div class="overflow-hidden rounded-2xl bg-white shadow-lg">
			<!-- Order Header -->
			<div class="border-b border-tertiary-medium bg-tertiary-light px-6 py-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div>
						<p class="text-sm text-text-light">Order Number</p>
						<p class="text-lg font-semibold text-secondary">#{order.id}</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-text-light">Status</p>
						<span
							class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
						>
							{order.status === 'paid' ? 'Payment Confirmed' : order.status}
						</span>
					</div>
				</div>
			</div>

			<!-- Fulfillment Details -->
			<div class="border-b border-tertiary-medium px-6 py-5">
				<h2 class="mb-4 text-lg font-semibold text-secondary">
					{formatFulfillmentType(order.fulfillmentType)} Details
				</h2>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-text-light">Date</p>
						<p class="font-medium text-secondary">
							{formatFulfillmentDate(order.fulfillmentDate)}
						</p>
					</div>
					<div>
						<p class="text-sm text-text-light">Time</p>
						<p class="font-medium text-secondary">
							{formatFulfillmentTime(order.fulfillmentTime)}
						</p>
					</div>
				</div>

				{#if showDeliveryAddress && order.deliveryAddress}
					<div class="mt-4">
						<p class="text-sm text-text-light">Delivery Address</p>
						<p class="font-medium text-secondary">
							{order.deliveryAddress.street}
							{#if order.deliveryAddress.apt}
								<br />{order.deliveryAddress.apt}
							{/if}
							<br />
							{order.deliveryAddress.city}, {order.deliveryAddress.state}
							{order.deliveryAddress.zip}
						</p>
					</div>
				{:else if order.fulfillmentType === 'pickup'}
					<div class="mt-4">
						<p class="text-sm text-text-light">Pickup Location</p>
						<p class="font-medium text-secondary">{config.fulfillment.pickupLocation}</p>
					</div>
				{/if}
			</div>

			<!-- Customer Information -->
			<div class="border-b border-tertiary-medium px-6 py-5">
				<h2 class="mb-4 text-lg font-semibold text-secondary">Customer Information</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-text-light">Name</p>
						<p class="font-medium text-secondary">{order.customerName}</p>
					</div>
					<div>
						<p class="text-sm text-text-light">Email</p>
						<p class="font-medium text-secondary">{order.customerEmail}</p>
					</div>
					{#if order.customerPhone}
						<div>
							<p class="text-sm text-text-light">Phone</p>
							<p class="font-medium text-secondary">{order.customerPhone}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Order Items -->
			<div class="border-b border-tertiary-medium px-6 py-5">
				<h2 class="mb-4 text-lg font-semibold text-secondary">
					Order Summary ({itemCount}
					{itemCount === 1 ? 'item' : 'items'})
				</h2>

				<ul class="divide-y divide-tertiary-medium">
					{#each order.items as item}
						<li class="flex justify-between py-3">
							<div>
								<p class="font-medium text-secondary">{item.title}</p>
								<p class="text-sm text-text-light">Qty: {item.quantity}</p>
							</div>
							<p class="font-medium text-secondary">
								{formatPrice(item.priceCents * item.quantity)}
							</p>
						</li>
					{/each}
				</ul>

				<!-- Gift Box -->
				{#if order.giftBox}
					<div class="mt-4 rounded-lg bg-tertiary-light p-3">
						<div class="flex items-center gap-2">
							<span class="text-lg">🎁</span>
							<span class="font-medium text-secondary">Gift Box Included</span>
						</div>
						{#if order.giftMessage}
							<p class="mt-2 text-sm text-text-light italic">"{order.giftMessage}"</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Order Totals -->
			<div class="px-6 py-5">
				<div class="space-y-2">
					<div class="flex justify-between text-text-light">
						<span>Subtotal</span>
						<span>{formatPrice(order.subtotalCents ?? 0)}</span>
					</div>

					{#if order.tipCents && order.tipCents > 0}
						<div class="flex justify-between text-text-light">
							<span>Tip</span>
							<span>{formatPrice(order.tipCents)}</span>
						</div>
					{/if}

					{#if order.giftBox && config.giftBox.enabled}
						<div class="flex justify-between text-text-light">
							<span>Gift Box</span>
							<span>{formatPrice(config.giftBox.priceCents)}</span>
						</div>
					{/if}

					{#if order.taxCents && order.taxCents > 0}
						<div class="flex justify-between text-text-light">
							<span>Tax</span>
							<span>{formatPrice(order.taxCents)}</span>
						</div>
					{/if}

					<div class="flex justify-between border-t border-tertiary-medium pt-3 text-lg font-bold">
						<span class="text-secondary">Total</span>
						<span class="text-primary">{formatPrice(order.totalCents ?? 0)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
			<a
				href="/"
				class="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-btn-hover-bg hover:shadow-lg"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Back to Home
			</a>

			<a
				href="/menu"
				class="inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-3 font-semibold text-primary transition-all hover:bg-primary hover:text-white"
			>
				Order More Cookies
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M14 5l7 7m0 0l-7 7m7-7H3"
					/>
				</svg>
			</a>
		</div>

		<!-- Help Text -->
		<div class="mt-8 text-center">
			<p class="text-sm text-text-light">
				Questions about your order? Contact us at
				{#if config.contact.emailEnabled}
					<a href="mailto:{config.contact.email}" class="font-medium text-primary hover:underline">
						{config.contact.email}
					</a>
				{:else}
					<span class="font-medium text-primary">{config.contact.email}</span>
				{/if}
			</p>
		</div>
	</div>
</section>
