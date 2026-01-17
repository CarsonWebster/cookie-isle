<script lang="ts">
	/**
	 * Checkout Page - Cart Display
	 *
	 * Displays the user's cart with quantity controls, remove buttons, and subtotal.
	 * Shows empty state when cart is empty with link to browse menu.
	 *
	 * PRD Reference: 3.5
	 */

	import { onMount } from 'svelte';
	import { config, formatPrice } from '$lib/config';
	import {
		getItems,
		getCartTotal,
		getCartTotalFormatted,
		isCartEmpty,
		updateQuantity,
		removeFromCart,
		initializeCart,
		getMaxQuantityPerItem
	} from '$lib/stores/cart.svelte';

	// Initialize cart from localStorage on client
	onMount(() => {
		initializeCart();
	});

	// Reactive derived values
	let cartEmpty = $derived(isCartEmpty());
	let cartItems = $derived(getItems());
	let subtotal = $derived(getCartTotalFormatted());

	// Handle quantity increment
	function incrementQuantity(productId: number, currentQty: number) {
		if (currentQty < getMaxQuantityPerItem()) {
			updateQuantity(productId, currentQty + 1);
		}
	}

	// Handle quantity decrement
	function decrementQuantity(productId: number, currentQty: number) {
		if (currentQty > 1) {
			updateQuantity(productId, currentQty - 1);
		} else {
			removeFromCart(productId);
		}
	}

	// Handle remove item
	function handleRemove(productId: number) {
		removeFromCart(productId);
	}
</script>

<svelte:head>
	<title>{config.cart.checkoutPageTitle} | {config.title}</title>
	<meta name="description" content="Review your cart and proceed to checkout at {config.title}." />
</svelte:head>

<!-- Checkout Page Content -->
<section class="bg-tertiary py-12 sm:py-16 lg:py-20">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<!-- Page Header -->
		<div class="text-center">
			<h1 class="text-4xl font-bold text-secondary sm:text-5xl">{config.cart.checkoutPageTitle}</h1>
			<!-- Decorative underline -->
			<div class="mt-4 flex justify-center">
				<div class="h-1 w-24 rounded-full bg-primary"></div>
			</div>
		</div>

		{#if cartEmpty}
			<!-- Empty Cart State -->
			<div class="mt-16 text-center">
				<div
					class="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-tertiary-medium"
				>
					<span class="text-6xl" aria-hidden="true">🍪</span>
				</div>
				<h2 class="mt-6 text-2xl font-semibold text-secondary">Your Cart is Empty</h2>
				<p class="mt-3 text-lg text-text-light">
					{config.cart.emptyMessage}
				</p>
				<a
					href="/menu"
					class="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-btn-hover-bg hover:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
				>
					Browse Menu
					<svg
						class="ml-2 h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/>
					</svg>
				</a>
			</div>
		{:else}
			<!-- Cart Items -->
			<div class="mt-12">
				<!-- Desktop Table View (hidden on mobile) -->
				<div class="hidden md:block">
					<table class="w-full">
						<thead>
							<tr class="border-b border-tertiary-medium">
								<th class="pb-4 text-left text-sm font-semibold text-secondary">Product</th>
								<th class="pb-4 text-center text-sm font-semibold text-secondary">Price</th>
								<th class="pb-4 text-center text-sm font-semibold text-secondary">Quantity</th>
								<th class="pb-4 text-right text-sm font-semibold text-secondary">Total</th>
								<th class="pb-4 text-right text-sm font-semibold text-secondary">
									<span class="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-tertiary-medium">
							{#each cartItems as item (item.productId)}
								<tr>
									<!-- Product Name -->
									<td class="py-6">
										<a
											href="/menu/{item.slug}"
											class="text-lg font-medium text-secondary transition-colors hover:text-primary"
										>
											{item.title}
										</a>
									</td>

									<!-- Unit Price -->
									<td class="py-6 text-center text-text-light">
										{formatPrice(item.priceCents)}
									</td>

									<!-- Quantity Controls -->
									<td class="py-6">
										<div class="flex items-center justify-center gap-2">
											<button
												type="button"
												onclick={() => decrementQuantity(item.productId, item.quantity)}
												class="flex h-8 w-8 items-center justify-center rounded-full border border-tertiary-medium bg-white text-secondary transition-colors hover:bg-tertiary-light focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none"
												aria-label="Decrease quantity of {item.title}"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M20 12H4"
													/>
												</svg>
											</button>

											<span
												class="w-12 text-center text-lg font-medium text-secondary"
												aria-label="Quantity: {item.quantity}"
											>
												{item.quantity}
											</span>

											<button
												type="button"
												onclick={() => incrementQuantity(item.productId, item.quantity)}
												disabled={item.quantity >= getMaxQuantityPerItem()}
												class="flex h-8 w-8 items-center justify-center rounded-full border border-tertiary-medium bg-white text-secondary transition-colors hover:bg-tertiary-light focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
												aria-label="Increase quantity of {item.title}"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 4v16m8-8H4"
													/>
												</svg>
											</button>
										</div>
									</td>

									<!-- Line Total -->
									<td class="py-6 text-right font-medium text-secondary">
										{formatPrice(item.priceCents * item.quantity)}
									</td>

									<!-- Remove Button -->
									<td class="py-6 text-right">
										<button
											type="button"
											onclick={() => handleRemove(item.productId)}
											class="rounded p-1 text-text-light transition-colors hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
											aria-label="Remove {item.title} from cart"
										>
											<svg
												class="h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile Card View (hidden on desktop) -->
				<div class="space-y-4 md:hidden">
					{#each cartItems as item (item.productId)}
						<div class="rounded-xl bg-white p-4 shadow-md">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<a
										href="/menu/{item.slug}"
										class="text-lg font-medium text-secondary transition-colors hover:text-primary"
									>
										{item.title}
									</a>
									<p class="mt-1 text-sm text-text-light">
										{formatPrice(item.priceCents)} each
									</p>
								</div>

								<!-- Remove Button -->
								<button
									type="button"
									onclick={() => handleRemove(item.productId)}
									class="rounded p-1 text-text-light transition-colors hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
									aria-label="Remove {item.title} from cart"
								>
									<svg
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>

							<div class="mt-4 flex items-center justify-between">
								<!-- Quantity Controls -->
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => decrementQuantity(item.productId, item.quantity)}
										class="flex h-10 w-10 items-center justify-center rounded-full border border-tertiary-medium bg-white text-secondary transition-colors hover:bg-tertiary-light focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none"
										aria-label="Decrease quantity of {item.title}"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M20 12H4"
											/>
										</svg>
									</button>

									<span
										class="w-12 text-center text-lg font-medium text-secondary"
										aria-label="Quantity: {item.quantity}"
									>
										{item.quantity}
									</span>

									<button
										type="button"
										onclick={() => incrementQuantity(item.productId, item.quantity)}
										disabled={item.quantity >= getMaxQuantityPerItem()}
										class="flex h-10 w-10 items-center justify-center rounded-full border border-tertiary-medium bg-white text-secondary transition-colors hover:bg-tertiary-light focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										aria-label="Increase quantity of {item.title}"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
									</button>
								</div>

								<!-- Line Total -->
								<span class="text-lg font-semibold text-secondary">
									{formatPrice(item.priceCents * item.quantity)}
								</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Cart Summary -->
				<div class="mt-8 rounded-xl bg-white p-6 shadow-md">
					<div class="flex items-center justify-between border-b border-tertiary-medium pb-4">
						<span class="text-lg font-medium text-secondary">Subtotal</span>
						<span class="text-2xl font-bold text-secondary">{subtotal}</span>
					</div>

					<p class="mt-4 text-sm text-text-light">
						Shipping, taxes, and tip will be calculated at checkout.
					</p>

					<!-- Continue Shopping Link -->
					<div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<a
							href="/menu"
							class="inline-flex items-center justify-center text-primary transition-colors hover:text-btn-hover-bg focus:outline-none"
						>
							<svg
								class="mr-2 h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16l-4-4m0 0l4-4m-4 4h18"
								/>
							</svg>
							Continue Shopping
						</a>

						<!-- Placeholder for future checkout button (Phase 3.9) -->
						<div class="text-sm text-text-light italic">Checkout options coming soon...</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
