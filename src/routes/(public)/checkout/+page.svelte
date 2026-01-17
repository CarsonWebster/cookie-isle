<script lang="ts">
	/**
	 * Checkout Page - Cart Display & Customer Form
	 *
	 * Displays the user's cart with quantity controls, remove buttons, and subtotal.
	 * Shows empty state when cart is empty with link to browse menu.
	 * Includes customer information form and fulfillment type selection.
	 *
	 * PRD Reference: 3.5, 3.6
	 */

	import { onMount } from 'svelte';
	import { config, formatPrice, isZipAllowedForDelivery } from '$lib/config';
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

	// ============================================================================
	// Customer Form State (PRD 3.6)
	// ============================================================================

	// Form fields
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');

	// Fulfillment type: 'pickup' or 'delivery'
	let fulfillmentType = $state<'pickup' | 'delivery'>('pickup');

	// Delivery address fields
	let street = $state('');
	let apt = $state('');
	let city = $state('');
	let addressState = $state('CA');
	let zip = $state('');

	// Form validation state
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	// Derived validation states
	let isValidEmail = $derived(email.includes('@') && email.includes('.') && email.length >= 5);
	let isValidPhone = $derived(phone.replace(/\D/g, '').length >= 10);
	let isValidZip = $derived(
		fulfillmentType === 'pickup' || (zip.length === 5 && /^\d{5}$/.test(zip))
	);
	let isDeliveryZipAllowed = $derived(fulfillmentType === 'pickup' || isZipAllowedForDelivery(zip));

	// Check if pickup/delivery are enabled from config
	let pickupEnabled = config.fulfillment.pickupEnabled;
	let deliveryEnabled = config.fulfillment.deliveryEnabled;

	// Show delivery fields only when delivery is selected
	let showDeliveryFields = $derived(fulfillmentType === 'delivery');

	// ============================================================================
	// Form Validation Functions
	// ============================================================================

	/**
	 * Validates a single field and updates the errors state
	 */
	function validateField(field: string): boolean {
		let isValid = true;
		const newErrors = { ...errors };

		switch (field) {
			case 'firstName':
				if (!firstName.trim()) {
					newErrors.firstName = 'First name is required';
					isValid = false;
				} else {
					delete newErrors.firstName;
				}
				break;
			case 'lastName':
				if (!lastName.trim()) {
					newErrors.lastName = 'Last name is required';
					isValid = false;
				} else {
					delete newErrors.lastName;
				}
				break;
			case 'email':
				if (!email.trim()) {
					newErrors.email = 'Email is required';
					isValid = false;
				} else if (!isValidEmail) {
					newErrors.email = 'Please enter a valid email address';
					isValid = false;
				} else {
					delete newErrors.email;
				}
				break;
			case 'phone':
				if (!phone.trim()) {
					newErrors.phone = 'Phone number is required';
					isValid = false;
				} else if (!isValidPhone) {
					newErrors.phone = 'Please enter a valid 10-digit phone number';
					isValid = false;
				} else {
					delete newErrors.phone;
				}
				break;
			case 'street':
				if (fulfillmentType === 'delivery' && !street.trim()) {
					newErrors.street = 'Street address is required for delivery';
					isValid = false;
				} else {
					delete newErrors.street;
				}
				break;
			case 'city':
				if (fulfillmentType === 'delivery' && !city.trim()) {
					newErrors.city = 'City is required for delivery';
					isValid = false;
				} else {
					delete newErrors.city;
				}
				break;
			case 'zip':
				if (fulfillmentType === 'delivery') {
					if (!zip.trim()) {
						newErrors.zip = 'ZIP code is required for delivery';
						isValid = false;
					} else if (!isValidZip) {
						newErrors.zip = 'Please enter a valid 5-digit ZIP code';
						isValid = false;
					} else if (!isDeliveryZipAllowed) {
						newErrors.zip = config.fulfillment.deliveryZipError;
						isValid = false;
					} else {
						delete newErrors.zip;
					}
				} else {
					delete newErrors.zip;
				}
				break;
		}

		errors = newErrors;
		return isValid;
	}

	/**
	 * Handles field blur event for validation
	 */
	function handleBlur(field: string) {
		touched = { ...touched, [field]: true };
		validateField(field);
	}

	/**
	 * Formats phone number as user types
	 */
	function formatPhone(value: string): string {
		const digits = value.replace(/\D/g, '').slice(0, 10);
		if (digits.length === 0) return '';
		if (digits.length <= 3) return `(${digits}`;
		if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}

	/**
	 * Handles phone input and formats it
	 */
	function handlePhoneInput(event: Event) {
		const input = event.target as HTMLInputElement;
		phone = formatPhone(input.value);
	}

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

				<!-- Customer Information Form (PRD 3.6) -->
				<div class="mt-8 rounded-xl bg-white p-6 shadow-md">
					<h2 class="text-xl font-semibold text-secondary">Your Information</h2>
					<p class="mt-1 text-sm text-text-light">
						Please provide your contact details for order updates.
					</p>

					<form class="mt-6 space-y-6" novalidate>
						<!-- Name Fields -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- First Name -->
							<div>
								<label for="firstName" class="block text-sm font-medium text-secondary">
									First Name <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="firstName"
									name="firstName"
									bind:value={firstName}
									onblur={() => handleBlur('firstName')}
									class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.firstName &&
									errors.firstName
										? 'border-red-500'
										: 'border-tertiary-medium'}"
									placeholder="Jane"
									autocomplete="given-name"
									required
								/>
								{#if touched.firstName && errors.firstName}
									<p class="mt-1 text-sm text-red-500">{errors.firstName}</p>
								{/if}
							</div>

							<!-- Last Name -->
							<div>
								<label for="lastName" class="block text-sm font-medium text-secondary">
									Last Name <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="lastName"
									name="lastName"
									bind:value={lastName}
									onblur={() => handleBlur('lastName')}
									class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.lastName &&
									errors.lastName
										? 'border-red-500'
										: 'border-tertiary-medium'}"
									placeholder="Doe"
									autocomplete="family-name"
									required
								/>
								{#if touched.lastName && errors.lastName}
									<p class="mt-1 text-sm text-red-500">{errors.lastName}</p>
								{/if}
							</div>
						</div>

						<!-- Contact Fields -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Email -->
							<div>
								<label for="email" class="block text-sm font-medium text-secondary">
									Email <span class="text-red-500">*</span>
								</label>
								<input
									type="email"
									id="email"
									name="email"
									bind:value={email}
									onblur={() => handleBlur('email')}
									class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.email &&
									errors.email
										? 'border-red-500'
										: 'border-tertiary-medium'}"
									placeholder="jane@example.com"
									autocomplete="email"
									required
								/>
								{#if touched.email && errors.email}
									<p class="mt-1 text-sm text-red-500">{errors.email}</p>
								{/if}
							</div>

							<!-- Phone -->
							<div>
								<label for="phone" class="block text-sm font-medium text-secondary">
									Phone <span class="text-red-500">*</span>
								</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									value={phone}
									oninput={handlePhoneInput}
									onblur={() => handleBlur('phone')}
									class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.phone &&
									errors.phone
										? 'border-red-500'
										: 'border-tertiary-medium'}"
									placeholder="(555) 123-4567"
									autocomplete="tel"
									required
								/>
								{#if touched.phone && errors.phone}
									<p class="mt-1 text-sm text-red-500">{errors.phone}</p>
								{/if}
							</div>
						</div>

						<!-- Fulfillment Type Toggle -->
						{#if pickupEnabled || deliveryEnabled}
							<div>
								<label class="block text-sm font-medium text-secondary">
									How would you like to receive your order? <span class="text-red-500">*</span>
								</label>
								<div class="mt-2 flex gap-2">
									{#if pickupEnabled}
										<button
											type="button"
											onclick={() => (fulfillmentType = 'pickup')}
											class="flex-1 rounded-lg border-2 px-4 py-3 text-center font-medium transition-all {fulfillmentType ===
											'pickup'
												? 'border-primary bg-primary/10 text-primary'
												: 'border-tertiary-medium bg-white text-text-light hover:border-primary/50'}"
										>
											<svg
												class="mx-auto mb-1 h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
											Pickup
										</button>
									{/if}
									{#if deliveryEnabled}
										<button
											type="button"
											onclick={() => (fulfillmentType = 'delivery')}
											class="flex-1 rounded-lg border-2 px-4 py-3 text-center font-medium transition-all {fulfillmentType ===
											'delivery'
												? 'border-primary bg-primary/10 text-primary'
												: 'border-tertiary-medium bg-white text-text-light hover:border-primary/50'}"
										>
											<svg
												class="mx-auto mb-1 h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"
												/>
											</svg>
											Delivery
										</button>
									{/if}
								</div>
								{#if fulfillmentType === 'pickup'}
									<p class="mt-2 text-sm text-text-light">
										Pickup location: {config.fulfillment.pickupLocation}
									</p>
								{:else if fulfillmentType === 'delivery'}
									<p class="mt-2 text-sm text-text-light">
										We deliver to: {config.fulfillment.deliveryArea}
									</p>
								{/if}
							</div>
						{/if}

						<!-- Delivery Address Fields (conditional) -->
						{#if showDeliveryFields}
							<div class="rounded-lg border border-tertiary-medium bg-tertiary/50 p-4">
								<h3 class="text-sm font-medium text-secondary">Delivery Address</h3>

								<div class="mt-4 space-y-4">
									<!-- Street Address -->
									<div>
										<label for="street" class="block text-sm font-medium text-secondary">
											Street Address <span class="text-red-500">*</span>
										</label>
										<input
											type="text"
											id="street"
											name="street"
											bind:value={street}
											onblur={() => handleBlur('street')}
											class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.street &&
											errors.street
												? 'border-red-500'
												: 'border-tertiary-medium'}"
											placeholder="123 Main St"
											autocomplete="street-address"
											required
										/>
										{#if touched.street && errors.street}
											<p class="mt-1 text-sm text-red-500">{errors.street}</p>
										{/if}
									</div>

									<!-- Apt/Suite -->
									<div>
										<label for="apt" class="block text-sm font-medium text-secondary">
											Apt / Suite / Unit
										</label>
										<input
											type="text"
											id="apt"
											name="apt"
											bind:value={apt}
											class="mt-1 block w-full rounded-lg border border-tertiary-medium px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
											placeholder="Apt 4B (optional)"
											autocomplete="address-line2"
										/>
									</div>

									<!-- City, State, ZIP -->
									<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
										<!-- City -->
										<div class="col-span-2 sm:col-span-2">
											<label for="city" class="block text-sm font-medium text-secondary">
												City <span class="text-red-500">*</span>
											</label>
											<input
												type="text"
												id="city"
												name="city"
												bind:value={city}
												onblur={() => handleBlur('city')}
												class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.city &&
												errors.city
													? 'border-red-500'
													: 'border-tertiary-medium'}"
												placeholder="Coronado"
												autocomplete="address-level2"
												required
											/>
											{#if touched.city && errors.city}
												<p class="mt-1 text-sm text-red-500">{errors.city}</p>
											{/if}
										</div>

										<!-- State -->
										<div>
											<label for="addressState" class="block text-sm font-medium text-secondary">
												State
											</label>
											<input
												type="text"
												id="addressState"
												name="addressState"
												bind:value={addressState}
												class="mt-1 block w-full rounded-lg border border-tertiary-medium px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
												placeholder="CA"
												maxlength="2"
												autocomplete="address-level1"
											/>
										</div>

										<!-- ZIP -->
										<div>
											<label for="zip" class="block text-sm font-medium text-secondary">
												ZIP <span class="text-red-500">*</span>
											</label>
											<input
												type="text"
												id="zip"
												name="zip"
												bind:value={zip}
												onblur={() => handleBlur('zip')}
												class="mt-1 block w-full rounded-lg border px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none {touched.zip &&
												errors.zip
													? 'border-red-500'
													: 'border-tertiary-medium'}"
												placeholder="92118"
												maxlength="5"
												pattern="[0-9]{5}"
												autocomplete="postal-code"
												required
											/>
											{#if touched.zip && errors.zip}
												<p class="mt-1 text-sm text-red-500">{errors.zip}</p>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/if}
					</form>
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
