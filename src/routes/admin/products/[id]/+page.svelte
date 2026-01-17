<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let { data, form }: { data: PageData; form: ActionData | null | undefined } = $props();

	// Delete confirmation state
	let showDeleteModal = $state(false);

	// Get error for a field
	function getError(field: string): string | undefined {
		if (!form || typeof form !== 'object') return undefined;
		if (!('errors' in form) || !form.errors) return undefined;
		const errors = form.errors as Record<string, string>;
		return errors[field];
	}

	// Auto-generate slug from title - initialize from data.product
	let title = $state(data.product.title);
	let slug = $state(data.product.slug);
	let autoSlug = $state(false); // Disabled by default for edit

	// Sync state when data.product changes (e.g., after form submission)
	$effect(() => {
		title = data.product.title;
		slug = data.product.slug;
	});

	// Generate slug from title
	function generateSlug(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
			.replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
			.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
	}

	// Update slug when title changes (if auto mode)
	$effect(() => {
		if (autoSlug && title) {
			slug = generateSlug(title);
		}
	});

	// When user manually edits slug, disable auto mode
	function handleSlugInput(e: Event) {
		autoSlug = false;
		slug = (e.target as HTMLInputElement).value;
	}

	// Convert priceCents to dollars for display - derived from data.product
	const priceInDollars = $derived((data.product.priceCents / 100).toFixed(2));

	// Convert tags array to comma-separated string - derived from data.product
	const tagsString = $derived(data.product.tags ? data.product.tags.join(', ') : '');
</script>

<svelte:head>
	<title>Edit {data.product.title} | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="border-b border-gray-200 pb-5">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Edit Product</h1>
				<p class="mt-2 text-sm text-gray-600">Update product details for {data.product.title}</p>
			</div>
			<a
				href="/admin/products"
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
			>
				Cancel
			</a>
		</div>
	</div>

	<!-- Form -->
	<form method="POST" action="?/update" use:enhance class="space-y-8">
		<!-- Basic Information -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
			<div class="space-y-4">
				<!-- Title -->
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700">
						Product Name <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="title"
						name="title"
						bind:value={title}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
						placeholder="Chocolate Chip Cookie"
					/>
					{#if getError('title')}
						<p class="mt-1 text-sm text-red-600">{getError('title')}</p>
					{/if}
				</div>

				<!-- Slug -->
				<div>
					<label for="slug" class="block text-sm font-medium text-gray-700">
						URL Slug <span class="text-red-500">*</span>
					</label>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-sm text-gray-500">/menu/</span>
						<input
							type="text"
							id="slug"
							name="slug"
							value={slug}
							oninput={handleSlugInput}
							required
							class="block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
							placeholder="chocolate-chip-cookie"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						Changing the slug will break existing links to this product.
					</p>
					{#if getError('slug')}
						<p class="mt-1 text-sm text-red-600">{getError('slug')}</p>
					{/if}
				</div>

				<!-- Description -->
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700">
						Description
					</label>
					<textarea
						id="description"
						name="description"
						rows="3"
						value={data.product.description || ''}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
						placeholder="A delicious chocolate chip cookie with..."
					></textarea>
					<p class="mt-1 text-xs text-gray-500">Brief description shown on product cards.</p>
					{#if getError('description')}
						<p class="mt-1 text-sm text-red-600">{getError('description')}</p>
					{/if}
				</div>

				<!-- Ingredients -->
				<div>
					<label for="ingredients" class="block text-sm font-medium text-gray-700">
						Ingredients
					</label>
					<textarea
						id="ingredients"
						name="ingredients"
						rows="3"
						value={data.product.ingredients || ''}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
						placeholder="Flour, sugar, butter, chocolate chips..."
					></textarea>
					<p class="mt-1 text-xs text-gray-500">
						List of ingredients shown on product detail page.
					</p>
					{#if getError('ingredients')}
						<p class="mt-1 text-sm text-red-600">{getError('ingredients')}</p>
					{/if}
				</div>

				<!-- Tags -->
				<div>
					<label for="tags" class="block text-sm font-medium text-gray-700"> Tags </label>
					<input
						type="text"
						id="tags"
						name="tags"
						value={tagsString}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
						placeholder="chocolate, classic, bestseller"
					/>
					<p class="mt-1 text-xs text-gray-500">Comma-separated tags for filtering and display.</p>
					{#if getError('tags')}
						<p class="mt-1 text-sm text-red-600">{getError('tags')}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Pricing -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Pricing</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<!-- Price -->
				<div>
					<label for="price" class="block text-sm font-medium text-gray-700">
						Price (USD) <span class="text-red-500">*</span>
					</label>
					<div class="mt-1 flex items-center">
						<span
							class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
						>
							$
						</span>
						<input
							type="number"
							id="price"
							name="price"
							step="0.01"
							min="0"
							value={priceInDollars}
							required
							class="block w-full rounded-r-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
							placeholder="3.50"
						/>
					</div>
					{#if getError('price')}
						<p class="mt-1 text-sm text-red-600">{getError('price')}</p>
					{/if}
				</div>

				<!-- Stripe Price ID -->
				<div>
					<label for="stripePriceId" class="block text-sm font-medium text-gray-700">
						Stripe Price ID <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="stripePriceId"
						name="stripePriceId"
						value={data.product.stripePriceId}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
						placeholder="price_1..."
					/>
					<p class="mt-1 text-xs text-gray-500">
						The Stripe price ID from your <a
							href="https://dashboard.stripe.com/products"
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:underline">Stripe Dashboard</a
						>.
					</p>
					{#if getError('stripePriceId')}
						<p class="mt-1 text-sm text-red-600">{getError('stripePriceId')}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Images -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Images</h2>
			<div class="grid gap-6 sm:grid-cols-2">
				<!-- Card Image (used in product cards and listings) -->
				<ImageUpload
					label="Card Image"
					name="imageUrl"
					currentImageUrl={data.product.imageUrl}
					helpText="Used in product cards and menu listings (square aspect ratio recommended)"
				/>

				<!-- Hero Image (used on product detail page) -->
				<ImageUpload
					label="Hero Image"
					name="heroImageUrl"
					currentImageUrl={data.product.heroImageUrl}
					helpText="Used on product detail page (wide aspect ratio recommended)"
				/>
			</div>
		</div>

		<!-- Display Settings -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Display Settings</h2>
			<div class="space-y-4">
				<!-- Sort Order -->
				<div>
					<label for="sortOrder" class="block text-sm font-medium text-gray-700">
						Sort Order
					</label>
					<input
						type="number"
						id="sortOrder"
						name="sortOrder"
						value={data.product.sortOrder}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-primary focus:ring-primary focus:outline-none sm:max-w-xs sm:text-sm"
						placeholder="0"
					/>
					<p class="mt-1 text-xs text-gray-500">
						Products with lower numbers appear first. Default is 0.
					</p>
					{#if getError('sortOrder')}
						<p class="mt-1 text-sm text-red-600">{getError('sortOrder')}</p>
					{/if}
				</div>

				<!-- Checkboxes -->
				<div class="space-y-3">
					<!-- Featured -->
					<div class="flex items-start">
						<div class="flex h-5 items-center">
							<input
								type="checkbox"
								id="featured"
								name="featured"
								checked={data.product.featured}
								class="h-4 w-4 rounded border-gray-300 text-primary transition-colors focus:ring-primary"
							/>
						</div>
						<div class="ml-3">
							<label for="featured" class="text-sm font-medium text-gray-700">Featured</label>
							<p class="text-xs text-gray-500">Show this product on the homepage</p>
						</div>
					</div>

					<!-- Active -->
					<div class="flex items-start">
						<div class="flex h-5 items-center">
							<input
								type="checkbox"
								id="active"
								name="active"
								checked={data.product.active}
								class="h-4 w-4 rounded border-gray-300 text-primary transition-colors focus:ring-primary"
							/>
						</div>
						<div class="ml-3">
							<label for="active" class="text-sm font-medium text-gray-700">Active</label>
							<p class="text-xs text-gray-500">Make this product visible to customers</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Form Error -->
		{#if form && 'error' in form && form.error}
			<div class="rounded-md bg-red-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg
							class="h-5 w-5 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
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

		<!-- Action Buttons -->
		<div class="flex items-center justify-between border-t border-gray-200 pt-5">
			<!-- Delete Button (left side) -->
			<button
				type="button"
				onclick={() => (showDeleteModal = true)}
				class="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
			>
				Delete Product
			</button>

			<!-- Save/Cancel Buttons (right side) -->
			<div class="flex items-center gap-3">
				<a
					href="/admin/products"
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
				>
					Cancel
				</a>
				<button
					type="submit"
					class="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-btn-hover-bg focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
				>
					Save Changes
				</button>
			</div>
		</div>
	</form>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<!-- Background overlay -->
		<div
			class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
		>
			<!-- Backdrop -->
			<div
				class="bg-opacity-75 fixed inset-0 bg-gray-500 transition-opacity"
				aria-hidden="true"
				onclick={() => (showDeleteModal = false)}
			></div>

			<!-- Center modal -->
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
				>&#8203;</span
			>

			<!-- Modal panel -->
			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
			>
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<!-- Warning icon -->
						<div
							class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
						>
							<svg
								class="h-6 w-6 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
								/>
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 class="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
								Delete Product
							</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to delete "<strong>{data.product.title}</strong>"? This
									action cannot be undone. Any existing orders with this product will not be
									affected.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
					<form method="POST" action="?/delete" use:enhance>
						<button
							type="submit"
							class="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto"
						>
							Delete
						</button>
					</form>
					<button
						type="button"
						onclick={() => (showDeleteModal = false)}
						class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 transition-colors ring-inset hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
