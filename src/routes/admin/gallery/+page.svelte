<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { GalleryImage } from './+page.server';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Upload state
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	// Delete confirmation state
	let deleteConfirmImage = $state<GalleryImage | null>(null);
	let isDeleting = $state(false);

	// Detail modal state
	let selectedImage = $state<GalleryImage | null>(null);

	// Format file size for display
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// Format date for display
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'Unknown';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Copy URL to clipboard
	async function copyUrl(url: string) {
		try {
			await navigator.clipboard.writeText(window.location.origin + url);
			// Could add a toast notification here
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	// Handle file selection
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			// Submit the form programmatically
			const form = target.closest('form');
			if (form) {
				isUploading = true;
				uploadError = null;
				form.requestSubmit();
			}
		}
	}

	// Handle escape key to close modals
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (deleteConfirmImage) {
				deleteConfirmImage = null;
			} else if (selectedImage) {
				selectedImage = null;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Image Gallery</h1>
			<p class="mt-1 text-sm text-gray-600">
				{data.images.length} image{data.images.length !== 1 ? 's' : ''} uploaded
			</p>
		</div>

		<!-- Upload Button -->
		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			use:enhance={() => {
				isUploading = true;
				uploadError = null;
				return async ({ result, update }) => {
					isUploading = false;
					if (result.type === 'failure') {
						uploadError = (result.data as { error?: string })?.error || 'Upload failed';
					} else {
						if (fileInput) fileInput.value = '';
					}
					await update();
				};
			}}
		>
			<input
				bind:this={fileInput}
				type="file"
				name="file"
				accept="image/jpeg,image/png,image/webp"
				class="hidden"
				onchange={handleFileSelect}
			/>
			<button
				type="button"
				onclick={() => fileInput?.click()}
				disabled={isUploading}
				class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isUploading}
					<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Uploading...
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Upload Image
				{/if}
			</button>
		</form>
	</div>

	<!-- Upload Error -->
	{#if uploadError}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
			{uploadError}
		</div>
	{/if}

	<!-- Form Error -->
	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<!-- Empty State -->
	{#if data.images.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
			<h3 class="mt-4 text-lg font-medium text-gray-900">No images yet</h3>
			<p class="mt-2 text-sm text-gray-500">Upload your first image to get started.</p>
		</div>
	{:else}
		<!-- Image Grid -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each data.images as image (image.id)}
				<div class="group relative">
					<button
						type="button"
						onclick={() => (selectedImage = image)}
						class="block w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-shadow hover:shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
					>
						<div class="aspect-square">
							<img
								src={image.url}
								alt={image.originalName}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>
					</button>

					<!-- Usage Badge -->
					{#if image.usedByProducts.length > 0}
						<div
							class="absolute top-2 left-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white"
							title="Used by {image.usedByProducts.length} product(s)"
						>
							In use
						</div>
					{/if}

					<!-- Delete Button -->
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							deleteConfirmImage = image;
						}}
						class="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700"
						aria-label="Delete image"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>

					<!-- Image Info -->
					<div class="mt-2 px-1">
						<p class="truncate text-sm font-medium text-gray-900" title={image.originalName}>
							{image.originalName}
						</p>
						<p class="text-xs text-gray-500">
							{formatFileSize(image.sizeBytes)}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Image Detail Modal -->
{#if selectedImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (selectedImage = null)}
		onkeydown={(e) => e.key === 'Escape' && (selectedImage = null)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="image-detail-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 id="image-detail-title" class="text-lg font-semibold text-gray-900">Image Details</h2>
				<button
					type="button"
					onclick={() => (selectedImage = null)}
					class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					aria-label="Close"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Modal Content -->
			<div class="p-6">
				<!-- Image Preview -->
				<div class="mb-6 overflow-hidden rounded-lg bg-gray-100">
					<img
						src={selectedImage.url}
						alt={selectedImage.originalName}
						class="h-auto max-h-80 w-full object-contain"
					/>
				</div>

				<!-- Image Info -->
				<dl class="space-y-3">
					<div class="flex justify-between">
						<dt class="text-sm font-medium text-gray-500">Original Name</dt>
						<dd class="text-sm text-gray-900">{selectedImage.originalName}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-sm font-medium text-gray-500">File Size</dt>
						<dd class="text-sm text-gray-900">{formatFileSize(selectedImage.sizeBytes)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-sm font-medium text-gray-500">Type</dt>
						<dd class="text-sm text-gray-900">{selectedImage.mimeType}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-sm font-medium text-gray-500">Uploaded</dt>
						<dd class="text-sm text-gray-900">{formatDate(selectedImage.createdAt)}</dd>
					</div>
					<div class="flex items-start justify-between">
						<dt class="text-sm font-medium text-gray-500">URL</dt>
						<dd class="flex items-center gap-2">
							<code class="max-w-xs truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
								{selectedImage.url}
							</code>
							<button
								type="button"
								onclick={() => copyUrl(selectedImage!.url)}
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
								title="Copy URL"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</button>
						</dd>
					</div>
				</dl>

				<!-- Products Using This Image -->
				{#if selectedImage.usedByProducts.length > 0}
					<div class="mt-6">
						<h3 class="text-sm font-medium text-gray-900">Used by Products</h3>
						<ul class="mt-2 space-y-2">
							{#each selectedImage.usedByProducts as usage}
								<li class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
									<a
										href="/admin/products/{usage.id}"
										class="text-sm font-medium text-primary hover:underline"
									>
										{usage.title}
									</a>
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {usage.usageType === 'card'
											? 'bg-blue-100 text-blue-700'
											: 'bg-purple-100 text-purple-700'}"
									>
										{usage.usageType === 'card' ? 'Card Image' : 'Hero Image'}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<!-- Modal Actions -->
			<div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
				<button
					type="button"
					onclick={() => {
						deleteConfirmImage = selectedImage;
						selectedImage = null;
					}}
					class="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					Delete
				</button>
				<button
					type="button"
					onclick={() => (selectedImage = null)}
					class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteConfirmImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (deleteConfirmImage = null)}
		onkeydown={(e) => e.key === 'Escape' && (deleteConfirmImage = null)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-confirm-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-full max-w-md rounded-xl bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="p-6">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>

				<h3 id="delete-confirm-title" class="mt-4 text-center text-lg font-semibold text-gray-900">
					Delete Image?
				</h3>

				<p class="mt-2 text-center text-sm text-gray-500">
					Are you sure you want to delete "{deleteConfirmImage.originalName}"? This action cannot be
					undone.
				</p>

				{#if deleteConfirmImage.usedByProducts.length > 0}
					<div class="mt-4 rounded-lg bg-amber-50 p-3">
						<div class="flex items-start gap-2">
							<svg
								class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<div>
								<p class="text-sm font-medium text-amber-800">Warning: This image is in use</p>
								<p class="mt-1 text-xs text-amber-700">
									Used by {deleteConfirmImage.usedByProducts.length} product(s):
									{deleteConfirmImage.usedByProducts.map((p) => p.title).join(', ')}
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
				<button
					type="button"
					onclick={() => (deleteConfirmImage = null)}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/delete"
					class="flex-1"
					use:enhance={() => {
						isDeleting = true;
						return async ({ update }) => {
							isDeleting = false;
							deleteConfirmImage = null;
							await update();
						};
					}}
				>
					<input type="hidden" name="imageId" value={deleteConfirmImage.id} />
					<button
						type="submit"
						disabled={isDeleting}
						class="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isDeleting}
							Deleting...
						{:else}
							Delete
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
