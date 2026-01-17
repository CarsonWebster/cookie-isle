<script lang="ts">
	/**
	 * Checkout Page - Cart Display, Customer Form, Slot Selection, Extras & Submit
	 *
	 * Displays the user's cart with quantity controls, remove buttons, and subtotal.
	 * Shows empty state when cart is empty with link to browse menu.
	 * Includes customer information form, fulfillment type selection, slot picker,
	 * tip selection, gift box option, order summary with tax calculation, and
	 * form submission with validation and loading states.
	 *
	 * PRD Reference: 3.5, 3.6, 3.7, 3.8, 3.9
	 */

	import { onMount } from 'svelte';
	import {
		config,
		formatPrice,
		isZipAllowedForDelivery,
		calculateTax,
		calculateTip,
		formatMaxOrderMessage
	} from '$lib/config';
	import {
		getItems,
		getCartTotal,
		getCartTotalFormatted,
		getCartCount,
		isCartEmpty,
		updateQuantity,
		removeFromCart,
		initializeCart,
		getMaxQuantityPerItem
	} from '$lib/stores/cart.svelte';
	import { formatTimeDisplay } from './+page.server';
	import type { FulfillmentSlotWithCapacity, SlotsByDate } from './+page.server';

	// Page data from server load function
	interface Props {
		data: {
			slots: FulfillmentSlotWithCapacity[];
			slotsByDate: SlotsByDate[];
		};
	}

	let { data }: Props = $props();

	// Initialize cart from localStorage on client
	onMount(() => {
		initializeCart();
	});

	// Reactive derived values
	let cartEmpty = $derived(isCartEmpty());
	let cartItems = $derived(getItems());
	let subtotalCents = $derived(getCartTotal());
	let subtotal = $derived(getCartTotalFormatted());

	// ============================================================================
	// Extras State (PRD 3.8)
	// ============================================================================

	// Tip state
	let tipAmountCents = $state(0);
	let selectedTipPercentage = $state<number | null>(null);
	let tipInputValue = $state(''); // For the custom dollar input

	// Gift box state
	let includeGiftBox = $state(false);
	let giftMessage = $state('');
	const GIFT_MESSAGE_MAX_LENGTH = 200;

	// Derived gift message length
	let giftMessageLength = $derived(giftMessage.length);
	let giftMessageRemaining = $derived(GIFT_MESSAGE_MAX_LENGTH - giftMessage.length);

	// Calculate totals
	let giftBoxCents = $derived(includeGiftBox ? config.giftBox.priceCents : 0);
	let taxCents = $derived(calculateTax(subtotalCents));
	let orderTotalCents = $derived(subtotalCents + tipAmountCents + giftBoxCents + taxCents);
	let orderTotalFormatted = $derived(formatPrice(orderTotalCents));

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
	// Slot Selection State (PRD 3.7)
	// ============================================================================

	// Selected slot ID
	let selectedSlotId = $state<number | null>(null);

	// Filter slots by fulfillment type
	let filteredSlotsByDate = $derived(() => {
		return data.slotsByDate
			.map((dateGroup) => ({
				...dateGroup,
				slots: dateGroup.slots.filter((slot) => {
					// 'both' type slots are available for both pickup and delivery
					if (slot.slotType === 'both') return true;
					// Otherwise filter by matching type
					return slot.slotType === fulfillmentType;
				})
			}))
			.filter((dateGroup) => dateGroup.slots.length > 0);
	});

	// Check if any slots are available for the selected fulfillment type
	let hasAvailableSlots = $derived(filteredSlotsByDate().length > 0);

	// Get the selected slot details
	let selectedSlot = $derived(() => {
		if (!selectedSlotId) return null;
		return data.slots.find((slot) => slot.id === selectedSlotId) ?? null;
	});

	// Reset slot selection when fulfillment type changes
	$effect(() => {
		// When fulfillment type changes, check if current slot is still valid
		const currentSlot = selectedSlot();
		if (currentSlot) {
			const isValidForType =
				currentSlot.slotType === 'both' || currentSlot.slotType === fulfillmentType;
			if (!isValidForType) {
				selectedSlotId = null;
			}
		}
	});

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

	// ============================================================================
	// Tip Helper Functions (PRD 3.8)
	// ============================================================================

	/**
	 * Handles selecting a preset tip percentage
	 */
	function selectTipPercentage(percentage: number) {
		selectedTipPercentage = percentage;
		tipAmountCents = calculateTip(subtotalCents, percentage);
		// Update the input display to show calculated amount
		tipInputValue = (tipAmountCents / 100).toFixed(2);
	}

	/**
	 * Handles custom tip input
	 */
	function handleTipInput(event: Event) {
		const input = event.target as HTMLInputElement;
		let value = input.value;

		// Remove any non-numeric characters except decimal point
		value = value.replace(/[^0-9.]/g, '');

		// Ensure only one decimal point
		const parts = value.split('.');
		if (parts.length > 2) {
			value = parts[0] + '.' + parts.slice(1).join('');
		}

		// Limit to 2 decimal places
		if (parts.length === 2 && parts[1].length > 2) {
			value = parts[0] + '.' + parts[1].slice(0, 2);
		}

		tipInputValue = value;

		// Clear percentage selection when entering custom amount
		selectedTipPercentage = null;

		// Convert to cents
		const dollars = parseFloat(value) || 0;
		tipAmountCents = Math.round(dollars * 100);
	}

	/**
	 * Clears the tip
	 */
	function clearTip() {
		tipAmountCents = 0;
		selectedTipPercentage = null;
		tipInputValue = '';
	}

	/**
	 * Handles gift message input with character limit
	 */
	function handleGiftMessageInput(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		// Enforce max length
		if (textarea.value.length <= GIFT_MESSAGE_MAX_LENGTH) {
			giftMessage = textarea.value;
		} else {
			giftMessage = textarea.value.slice(0, GIFT_MESSAGE_MAX_LENGTH);
			textarea.value = giftMessage;
		}
	}

	// ============================================================================
	// Form Submission State (PRD 3.9)
	// ============================================================================

	// Submission state
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let showMaxQuantityModal = $state(false);

	// Check if max order quantity is exceeded
	let isMaxQuantityExceeded = $derived(getCartCount() > config.order.maxOrderQuantity);
	let maxQuantityMessage = $derived(
		formatMaxOrderMessage(config.order.maxOrderQuantity, config.contact.email)
	);

	// Derived validation state for form completeness
	let isFormValid = $derived(() => {
		// Check customer info fields
		if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
			return false;
		}
		if (!isValidEmail || !isValidPhone) {
			return false;
		}

		// Check delivery address if delivery is selected
		if (fulfillmentType === 'delivery') {
			if (!street.trim() || !city.trim() || !zip.trim()) {
				return false;
			}
			if (!isValidZip || !isDeliveryZipAllowed) {
				return false;
			}
		}

		// Check slot selection
		if (!selectedSlotId) {
			return false;
		}

		// Check cart is not empty
		if (isCartEmpty()) {
			return false;
		}

		return true;
	});

	// Button disabled state
	let isSubmitDisabled = $derived(isSubmitting || !isFormValid() || isMaxQuantityExceeded);

	/**
	 * Validates all form fields and returns whether the form is valid
	 */
	function validateAllFields(): boolean {
		let isValid = true;

		// Validate customer fields
		isValid = validateField('firstName') && isValid;
		isValid = validateField('lastName') && isValid;
		isValid = validateField('email') && isValid;
		isValid = validateField('phone') && isValid;

		// Validate delivery fields if applicable
		if (fulfillmentType === 'delivery') {
			isValid = validateField('street') && isValid;
			isValid = validateField('city') && isValid;
			isValid = validateField('zip') && isValid;
		}

		// Mark all fields as touched
		touched = {
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
			street: true,
			city: true,
			zip: true
		};

		return isValid;
	}

	/**
	 * Validates slot selection
	 */
	function validateSlotSelection(): boolean {
		if (!selectedSlotId) {
			submitError = 'Please select a fulfillment time slot';
			return false;
		}
		return true;
	}

	/**
	 * Handles form submission - POSTs to /api/checkout and redirects to Stripe
	 */
	async function handleSubmit(event: Event) {
		event.preventDefault();

		// Clear any previous errors
		submitError = null;

		// Check max quantity first
		if (isMaxQuantityExceeded) {
			showMaxQuantityModal = true;
			return;
		}

		// Validate all fields
		const isFieldsValid = validateAllFields();
		const isSlotValid = validateSlotSelection();

		if (!isFieldsValid || !isSlotValid) {
			// Scroll to first error
			const firstError = document.querySelector('.text-red-500');
			if (firstError) {
				firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		// Get the selected slot details for the request
		const slot = selectedSlot();
		if (!slot) {
			submitError = 'Please select a fulfillment time slot';
			return;
		}

		// Set submitting state
		isSubmitting = true;

		try {
			// Build the checkout request payload
			const checkoutPayload = {
				items: getItems().map((item) => ({
					productId: item.productId,
					slug: item.slug,
					title: item.title,
					priceCents: item.priceCents,
					stripePriceId: item.stripePriceId,
					quantity: item.quantity
				})),
				customer: {
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email.trim(),
					phone: phone.trim()
				},
				fulfillment: {
					type: fulfillmentType,
					slotId: slot.id,
					date: slot.date,
					startTime: slot.startTime,
					endTime: slot.endTime,
					...(fulfillmentType === 'delivery' && {
						address: {
							street: street.trim(),
							apt: apt.trim() || undefined,
							city: city.trim(),
							state: addressState.trim(),
							zip: zip.trim()
						}
					})
				},
				tipCents: tipAmountCents,
				includeGiftBox,
				...(includeGiftBox && giftMessage.trim() && { giftMessage: giftMessage.trim() })
			};

			// POST to checkout API
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(checkoutPayload)
			});

			// Type the response data
			interface CheckoutApiResponse {
				url?: string;
				error?: string;
				details?: string[];
			}

			const data: CheckoutApiResponse = await response.json();

			// Handle error responses
			if (!response.ok) {
				// Extract error message from response
				if (data.error) {
					// Format detailed errors if available
					if (data.details && data.details.length > 0) {
						submitError = `${data.error}: ${data.details[0]}`;
					} else {
						submitError = data.error;
					}
				} else {
					submitError = 'An error occurred while processing your order. Please try again.';
				}
				return;
			}

			// Redirect to Stripe checkout
			if (data.url) {
				window.location.href = data.url;
			} else {
				submitError = 'Unable to redirect to payment. Please try again.';
			}
		} catch (err) {
			console.error('Checkout error:', err);
			submitError = 'An error occurred while processing your order. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * Closes the max quantity modal
	 */
	function closeMaxQuantityModal() {
		showMaxQuantityModal = false;
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

					<form class="mt-6 space-y-6" novalidate onsubmit={handleSubmit}>
						<fieldset disabled={isSubmitting} class="space-y-6 disabled:opacity-60">
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
								<fieldset>
									<legend class="block text-sm font-medium text-secondary">
										How would you like to receive your order? <span class="text-red-500">*</span>
									</legend>
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
								</fieldset>
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
						</fieldset>
					</form>
				</div>

				<!-- Slot Selection (PRD 3.7) -->
				<div class="mt-8 rounded-xl bg-white p-6 shadow-md">
					<h2 class="text-xl font-semibold text-secondary">Select a Time</h2>
					<p class="mt-1 text-sm text-text-light">
						Choose when you'd like to {fulfillmentType === 'pickup' ? 'pick up' : 'receive'} your order.
					</p>

					{#if !hasAvailableSlots}
						<!-- No slots available state -->
						<div
							class="mt-6 rounded-lg border border-tertiary-medium bg-tertiary/50 p-6 text-center"
						>
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-medium"
							>
								<svg
									class="h-8 w-8 text-text-light"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<p class="mt-4 text-secondary">
								No {fulfillmentType} slots are currently available.
							</p>
							<p class="mt-2 text-sm text-text-light">
								Please check back later or try a different fulfillment option.
							</p>
						</div>
					{:else}
						<!-- Slot picker grouped by date -->
						<div class="mt-6 space-y-6">
							{#each filteredSlotsByDate() as dateGroup (dateGroup.date)}
								<div>
									<!-- Date heading -->
									<h3 class="text-sm font-semibold text-secondary">{dateGroup.formattedDate}</h3>

									<!-- Slots for this date -->
									<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
										{#each dateGroup.slots as slot (slot.id)}
											{@const isSelected = selectedSlotId === slot.id}
											{@const isDisabled = slot.isSoldOut}
											<label
												class="relative flex cursor-pointer rounded-lg border-2 p-4 transition-all {isDisabled
													? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
													: isSelected
														? 'border-primary bg-primary/5'
														: 'border-tertiary-medium bg-white hover:border-primary/50'}"
											>
												<input
													type="radio"
													name="fulfillment-slot"
													value={slot.id}
													disabled={isDisabled}
													checked={isSelected}
													onchange={() => (selectedSlotId = slot.id)}
													class="sr-only"
												/>

												<!-- Slot content -->
												<div class="flex flex-1 items-center justify-between">
													<div class="flex items-center gap-3">
														<!-- Time icon -->
														<div
															class="flex h-10 w-10 items-center justify-center rounded-full {isSelected
																? 'bg-primary text-white'
																: 'bg-tertiary-light text-secondary'}"
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
																	d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
																/>
															</svg>
														</div>

														<div>
															<!-- Time range -->
															<p class="font-medium text-secondary">
																{formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(
																	slot.endTime
																)}
															</p>

															<!-- Slot type badge (only show if different from selected fulfillment type) -->
															{#if slot.slotType === 'both'}
																<span
																	class="mt-1 inline-flex items-center rounded-full bg-tertiary-light px-2 py-0.5 text-xs text-text-light"
																>
																	Pickup & Delivery
																</span>
															{/if}
														</div>
													</div>

													<!-- Status indicators -->
													<div class="text-right">
														{#if isDisabled}
															<span
																class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
															>
																Sold Out
															</span>
														{:else if slot.remainingCapacity <= 20}
															<span
																class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
															>
																{slot.remainingCapacity} left
															</span>
														{:else if isSelected}
															<svg
																class="h-6 w-6 text-primary"
																fill="currentColor"
																viewBox="0 0 24 24"
																aria-hidden="true"
															>
																<path
																	fill-rule="evenodd"
																	d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
																	clip-rule="evenodd"
																/>
															</svg>
														{/if}
													</div>
												</div>
											</label>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Extras Section - Tip (PRD 3.8) -->
				{#if config.tip.enabled}
					<div class="mt-8 rounded-xl bg-white p-6 shadow-md">
						<h2 class="text-xl font-semibold text-secondary">Add a Tip</h2>
						<p class="mt-1 text-sm text-text-light">
							Show your appreciation for our bakers with a tip.
						</p>

						<!-- Tip Percentage Buttons -->
						<div class="mt-4 flex flex-wrap gap-2">
							{#each config.tip.percentages as percentage}
								<button
									type="button"
									onclick={() => selectTipPercentage(percentage)}
									class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all {selectedTipPercentage ===
									percentage
										? 'border-primary bg-primary/10 text-primary'
										: 'border-tertiary-medium bg-white text-text-light hover:border-primary/50'}"
								>
									{percentage}%
								</button>
							{/each}
							<button
								type="button"
								onclick={clearTip}
								class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all {tipAmountCents ===
									0 && selectedTipPercentage === null
									? 'border-primary bg-primary/10 text-primary'
									: 'border-tertiary-medium bg-white text-text-light hover:border-primary/50'}"
							>
								No Tip
							</button>
						</div>

						<!-- Custom Tip Input -->
						<div class="mt-4">
							<label for="tipAmount" class="block text-sm font-medium text-secondary">
								Or enter a custom amount
							</label>
							<div class="relative mt-1">
								<span
									class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-light"
								>
									$
								</span>
								<input
									type="text"
									id="tipAmount"
									name="tipAmount"
									value={tipInputValue}
									oninput={handleTipInput}
									placeholder="0.00"
									inputmode="decimal"
									class="block w-full rounded-lg border border-tertiary-medium py-2.5 pr-4 pl-7 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
								/>
							</div>
						</div>

						{#if tipAmountCents > 0}
							<p class="mt-3 text-sm text-text-light">
								Tip amount: <span class="font-medium text-primary"
									>{formatPrice(tipAmountCents)}</span
								>
							</p>
						{/if}
					</div>
				{/if}

				<!-- Extras Section - Gift Box (PRD 3.8) -->
				{#if config.giftBox.enabled}
					<div class="mt-8 rounded-xl bg-white p-6 shadow-md">
						<h2 class="text-xl font-semibold text-secondary">Gift Options</h2>
						<p class="mt-1 text-sm text-text-light">
							Make your order extra special with our gift packaging.
						</p>

						<!-- Gift Box Checkbox -->
						<div class="mt-4">
							<label class="flex cursor-pointer items-start gap-3">
								<input
									type="checkbox"
									bind:checked={includeGiftBox}
									class="mt-0.5 h-5 w-5 rounded border-tertiary-medium text-primary focus:ring-2 focus:ring-primary/20"
								/>
								<div class="flex-1">
									<span class="font-medium text-secondary">
										Add Gift Box
										<span class="ml-2 text-primary">+{formatPrice(config.giftBox.priceCents)}</span>
									</span>
									<p class="mt-0.5 text-sm text-text-light">
										Beautiful presentation box perfect for gifting.
									</p>
								</div>
							</label>
						</div>

						<!-- Gift Message (shown when gift box is checked) -->
						{#if includeGiftBox}
							<div class="mt-4 rounded-lg border border-tertiary-medium bg-tertiary/50 p-4">
								<label for="giftMessage" class="block text-sm font-medium text-secondary">
									Gift Message (optional)
								</label>
								<textarea
									id="giftMessage"
									name="giftMessage"
									rows="3"
									value={giftMessage}
									oninput={handleGiftMessageInput}
									maxlength={GIFT_MESSAGE_MAX_LENGTH}
									placeholder="Write a personal message for the recipient..."
									class="mt-2 block w-full resize-none rounded-lg border border-tertiary-medium px-4 py-2.5 text-secondary shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
								></textarea>
								<div class="mt-2 flex items-center justify-between text-xs">
									<span class="text-text-light">
										{giftMessageLength} / {GIFT_MESSAGE_MAX_LENGTH} characters
									</span>
									{#if giftMessageRemaining <= 20}
										<span
											class="font-medium {giftMessageRemaining <= 0
												? 'text-red-500'
												: 'text-yellow-600'}"
										>
											{giftMessageRemaining} remaining
										</span>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Order Summary (PRD 3.8) -->
				<div class="mt-8 rounded-xl bg-white p-6 shadow-md">
					<h2 class="text-xl font-semibold text-secondary">Order Summary</h2>

					<!-- Summary Line Items -->
					<div class="mt-4 space-y-3">
						<!-- Subtotal -->
						<div class="flex items-center justify-between">
							<span class="text-text-light">Subtotal</span>
							<span class="font-medium text-secondary">{subtotal}</span>
						</div>

						<!-- Tip (if any) -->
						{#if tipAmountCents > 0}
							<div class="flex items-center justify-between">
								<span class="text-text-light">Tip</span>
								<span class="font-medium text-secondary">{formatPrice(tipAmountCents)}</span>
							</div>
						{/if}

						<!-- Gift Box (if selected) -->
						{#if includeGiftBox}
							<div class="flex items-center justify-between">
								<span class="text-text-light">Gift Box</span>
								<span class="font-medium text-secondary"
									>{formatPrice(config.giftBox.priceCents)}</span
								>
							</div>
						{/if}

						<!-- Tax (if enabled) -->
						{#if config.order.taxEnabled && taxCents > 0}
							<div class="flex items-center justify-between">
								<span class="text-text-light">
									Tax ({(config.order.salesTaxRate * 100).toFixed(2)}%)
								</span>
								<span class="font-medium text-secondary">{formatPrice(taxCents)}</span>
							</div>
						{/if}
					</div>

					<!-- Total -->
					<div class="mt-4 flex items-center justify-between border-t border-tertiary-medium pt-4">
						<span class="text-lg font-semibold text-secondary">Total</span>
						<span class="text-2xl font-bold text-primary">{orderTotalFormatted}</span>
					</div>

					<!-- Submit Error Message -->
					{#if submitError}
						<div
							class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
							role="alert"
							aria-live="polite"
						>
							<div class="flex items-start gap-3">
								<svg
									class="h-5 w-5 flex-shrink-0 text-red-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<p class="text-sm text-red-700">{submitError}</p>
							</div>
						</div>
					{/if}

					<!-- Place Order Button (PRD 3.9) -->
					<div class="mt-6">
						<button
							type="button"
							onclick={handleSubmit}
							disabled={isSubmitDisabled}
							class="flex w-full items-center justify-center rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none
								{isSubmitDisabled
								? 'cursor-not-allowed bg-gray-400 text-gray-200'
								: 'bg-primary text-white hover:bg-btn-hover-bg hover:shadow-xl'}"
							aria-busy={isSubmitting}
						>
							{#if isSubmitting}
								<!-- Loading spinner -->
								<svg
									class="mr-3 h-5 w-5 animate-spin"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Processing...
							{:else}
								Place Order
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
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{/if}
						</button>
					</div>

					<!-- Continue Shopping Link -->
					<div class="mt-4 text-center">
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
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- Max Quantity Exceeded Modal (PRD 3.9) -->
{#if showMaxQuantityModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={closeMaxQuantityModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="max-qty-title"
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100"
				>
					<svg
						class="h-6 w-6 text-yellow-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<h3 id="max-qty-title" class="text-lg font-semibold text-secondary">
						Order Quantity Limit
					</h3>
					<p class="mt-2 text-sm text-text-light">
						{maxQuantityMessage}
					</p>
				</div>
			</div>

			<!-- Modal Actions -->
			<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<a
					href="/menu"
					class="inline-flex items-center justify-center rounded-lg border border-tertiary-medium px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-tertiary-light focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
				>
					Edit Cart
				</a>
				{#if config.contact.emailEnabled}
					<a
						href="mailto:{config.contact.email}?subject=Large%20Order%20Inquiry"
						class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-btn-hover-bg focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
					>
						Contact Us
						<svg
							class="ml-2 h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</a>
				{/if}
				<button
					type="button"
					onclick={closeMaxQuantityModal}
					class="inline-flex items-center justify-center rounded-lg border border-tertiary-medium px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-tertiary-light focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none sm:order-first"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
