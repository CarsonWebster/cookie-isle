<script lang="ts">
	/**
	 * ImagePickerModal Component
	 *
	 * A modal for selecting images from the gallery.
	 * Fetches images from /admin/api/images and allows selection.
	 * Includes search/filter functionality and upload option.
	 */

	interface GalleryImage {
		id: number;
		filename: string;
		originalName: string;
		url: string;
		mimeType: string;
		sizeBytes: number;
		cardFocalX: number | null;
		cardFocalY: number | null;
		heroFocalX: number | null;
		heroFocalY: number | null;
		createdAt: string | null;
	}

	interface Props {
		/** Whether the modal is open */
		open: boolean;
		/** Callback when an image is selected */
		onSelect: (image: GalleryImage) => void;
		/** Callback when the modal is closed */
		onClose: () => void;
		/** Optional title for the modal */
		title?: string;
	}

	let { open, onSelect, onClose, title = 'Select Image' }: Props = $props();

	// State
	let images = $state<GalleryImage[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Upload state
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	// Filtered images based on search
	let filteredImages = $derived(
		searchQuery.trim()
			? images.filter((img) => img.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
			: images
	);

	// Fetch images when modal opens
	$effect(() => {
		if (open && images.length === 0) {
			fetchImages();
		}
	});

	// Handle escape key
	$effect(() => {
		if (!open) return;

		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	async function fetchImages() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch('/admin/api/images');
			if (!response.ok) {
				throw new Error('Failed to fetch images');
			}
			const data = (await response.json()) as { images?: GalleryImage[] };
			images = data.images || [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load images';
		} finally {
			isLoading = false;
		}
	}

	async function handleUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isUploading = true;
		uploadError = null;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/admin/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const data = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
					message?: string;
				};
				throw new Error(data.message || 'Upload failed');
			}

			// Refresh the image list
			await fetchImages();

			// Clear file input
			if (fileInput) fileInput.value = '';
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Failed to upload image';
		} finally {
			isUploading = false;
		}
	}

	function handleSelect(image: GalleryImage) {
		onSelect(image);
		onClose();
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="picker-title"
		tabindex="-1"
	>
		<div
			class="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 id="picker-title" class="text-lg font-semibold text-gray-900">{title}</h2>
				<button
					type="button"
					onclick={onClose}
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

			<!-- Search and Upload Row -->
			<div class="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row">
				<!-- Search Input -->
				<div class="relative flex-1">
					<svg
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search images..."
						class="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
					/>
				</div>

				<!-- Upload Button -->
				<div>
					<input
						bind:this={fileInput}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						class="hidden"
						onchange={handleUpload}
					/>
					<button
						type="button"
						onclick={() => fileInput?.click()}
						disabled={isUploading}
						class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isUploading}
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
							Uploading...
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Upload New
						{/if}
					</button>
				</div>
			</div>

			<!-- Error Messages -->
			{#if error || uploadError}
				<div class="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
					{error || uploadError}
				</div>
			{/if}

			<!-- Modal Content -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if isLoading}
					<div class="flex items-center justify-center py-12">
						<svg class="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
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
					</div>
				{:else if filteredImages.length === 0}
					<div class="py-12 text-center">
						{#if searchQuery}
							<p class="text-gray-500">No images match "{searchQuery}"</p>
							<button
								type="button"
								onclick={() => (searchQuery = '')}
								class="mt-2 text-sm text-primary hover:underline"
							>
								Clear search
							</button>
						{:else}
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
							<p class="mt-4 text-gray-500">No images uploaded yet</p>
							<p class="mt-1 text-sm text-gray-400">Upload your first image to get started.</p>
						{/if}
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
						{#each filteredImages as image (image.id)}
							<button
								type="button"
								onclick={() => handleSelect(image)}
								class="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-all hover:border-primary hover:shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
							>
								<div class="aspect-square">
									<img
										src={image.url}
										alt={image.originalName}
										class="h-full w-full object-cover"
										loading="lazy"
									/>
								</div>

								<!-- Hover Overlay -->
								<div
									class="absolute inset-0 flex items-center justify-center bg-primary/80 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<span class="rounded-full bg-white px-3 py-1 text-sm font-medium text-primary">
										Select
									</span>
								</div>

								<!-- Image Info -->
								<div
									class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2"
								>
									<p class="truncate text-xs font-medium text-white" title={image.originalName}>
										{image.originalName}
									</p>
									<p class="text-xs text-white/70">
										{formatFileSize(image.sizeBytes)}
									</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
				<div class="flex items-center justify-between">
					<p class="text-sm text-gray-500">
						{filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
						{searchQuery ? ` matching "${searchQuery}"` : ''}
					</p>
					<button
						type="button"
						onclick={onClose}
						class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
