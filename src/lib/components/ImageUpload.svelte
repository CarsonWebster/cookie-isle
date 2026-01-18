<script lang="ts">
	/**
	 * ImageUpload Component
	 * Reusable component for uploading images to R2 via /admin/api/upload
	 * Supports:
	 * - File input with drag-and-drop
	 * - Image preview
	 * - Upload progress and error handling
	 * - Validates file type (JPEG, PNG, WebP) and size (max 20MB)
	 * - Gallery picker for selecting existing images
	 */

	import ImagePickerModal from './ImagePickerModal.svelte';

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
		/** Label for the upload field */
		label: string;
		/** Help text shown below the input */
		helpText?: string;
		/** Current image URL (for edit mode) */
		currentImageUrl?: string | null;
		/** Name attribute for the hidden input field */
		name: string;
		/** Callback when upload completes with the new image URL */
		onUploadComplete?: (url: string) => void;
		/** Whether to show the "Choose from Gallery" button */
		showGalleryPicker?: boolean;
	}

	let {
		label,
		helpText,
		currentImageUrl = null,
		name,
		onUploadComplete,
		showGalleryPicker = true
	}: Props = $props();

	// Component state
	let isDragging = $state(false);
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);
	let uploadedUrl = $state<string | null>(null);

	// Sync with prop changes
	$effect(() => {
		previewUrl = currentImageUrl;
		uploadedUrl = currentImageUrl;
	});

	// Gallery picker state
	let showGalleryModal = $state(false);

	// File input reference
	// svelte-ignore non_reactive_update - DOM ref via bind:this
	let fileInput: HTMLInputElement;

	/**
	 * Validates file before upload
	 */
	function validateFile(file: File): string | null {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return 'Invalid file type. Please upload a JPEG, PNG, or WebP image.';
		}

		const maxSize = 20 * 1024 * 1024; // 20MB
		if (file.size > maxSize) {
			return 'File too large. Maximum size is 20MB.';
		}

		return null;
	}

	/**
	 * Uploads file to /admin/api/upload endpoint
	 */
	async function uploadFile(file: File) {
		isUploading = true;
		uploadError = null;

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			previewUrl = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/admin/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({
					message: 'Upload failed'
				}))) as { message?: string };
				throw new Error(errorData.message || `Upload failed with status ${response.status}`);
			}

			const data = (await response.json()) as {
				success: boolean;
				url?: string;
				filename?: string;
			};

			if (data.success && data.url) {
				// Convert absolute URL to relative if needed
				const url = data.url.startsWith('http') ? `/images/${data.filename}` : data.url;

				uploadedUrl = url;
				previewUrl = url;

				// Call callback if provided
				if (onUploadComplete) {
					onUploadComplete(url);
				}
			} else {
				throw new Error('Upload response missing URL');
			}
		} catch (error) {
			console.error('Upload error:', error);
			uploadError = error instanceof Error ? error.message : 'Failed to upload image';
			previewUrl = null;
		} finally {
			isUploading = false;
		}
	}

	/**
	 * Handles file selection from input
	 */
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			const error = validateFile(file);
			if (error) {
				uploadError = error;
				return;
			}

			uploadFile(file);
		}
	}

	/**
	 * Handles drag and drop
	 */
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const file = event.dataTransfer?.files[0];
		if (file) {
			const error = validateFile(file);
			if (error) {
				uploadError = error;
				return;
			}

			uploadFile(file);
		}
	}

	/**
	 * Handles drag over
	 */
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	/**
	 * Handles drag leave
	 */
	function handleDragLeave() {
		isDragging = false;
	}

	/**
	 * Opens file picker
	 */
	function openFilePicker() {
		fileInput?.click();
	}

	/**
	 * Removes uploaded image
	 */
	function removeImage() {
		previewUrl = null;
		uploadedUrl = null;
		uploadError = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	/**
	 * Handles image selection from gallery
	 */
	function handleGallerySelect(image: GalleryImage) {
		uploadedUrl = image.url;
		previewUrl = image.url;
		uploadError = null;

		if (onUploadComplete) {
			onUploadComplete(image.url);
		}
	}

	// Sync previewUrl and uploadedUrl when currentImageUrl prop changes
	$effect(() => {
		if (currentImageUrl) {
			previewUrl = currentImageUrl;
			uploadedUrl = currentImageUrl;
		}
	});
</script>

<div class="space-y-2">
	<!-- Label -->
	<label for={name} class="block text-sm font-medium text-gray-700">
		{label}
	</label>

	<!-- Upload Area -->
	<div
		class="relative"
		role="button"
		tabindex="0"
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
	>
		<!-- File Input (hidden) -->
		<input
			bind:this={fileInput}
			type="file"
			accept="image/jpeg,image/png,image/webp"
			onchange={handleFileSelect}
			class="hidden"
		/>

		<!-- Hidden input for form submission -->
		<input type="hidden" {name} value={uploadedUrl || ''} />

		{#if previewUrl}
			<!-- Image Preview -->
			<div class="relative">
				<img
					src={previewUrl}
					alt="Preview"
					class="h-48 w-full rounded-lg border border-gray-300 object-cover"
				/>

				<!-- Remove Button -->
				{#if !isUploading}
					<button
						type="button"
						onclick={removeImage}
						aria-label="Remove image"
						class="absolute top-2 right-2 rounded-full bg-red-600 p-2 text-white shadow-lg transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
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
				{/if}

				<!-- Upload Progress Overlay -->
				{#if isUploading}
					<div
						class="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-lg bg-black"
					>
						<div class="text-center text-white">
							<svg
								class="mx-auto h-8 w-8 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
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
							<p class="mt-2 text-sm">Uploading...</p>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Drop Zone -->
			<button
				type="button"
				onclick={openFilePicker}
				class="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
					{isDragging
					? 'border-primary bg-primary/5'
					: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}"
			>
				<!-- Upload Icon -->
				<svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>

				<!-- Instructions -->
				<div class="mt-4 text-center">
					<p class="text-sm font-medium text-gray-900">
						{#if isUploading}
							Uploading...
						{:else}
							Click to upload or drag and drop
						{/if}
					</p>
					<p class="mt-1 text-xs text-gray-500">JPEG, PNG, or WebP (max 20MB)</p>
				</div>
			</button>

			<!-- Gallery Picker Button -->
			{#if showGalleryPicker}
				<button
					type="button"
					onclick={() => (showGalleryModal = true)}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					Choose from Gallery
				</button>
			{/if}
		{/if}
	</div>

	<!-- Help Text -->
	{#if helpText}
		<p class="text-xs text-gray-500">{helpText}</p>
	{/if}

	<!-- Error Message -->
	{#if uploadError}
		<p class="text-sm text-red-600">{uploadError}</p>
	{/if}
</div>

<!-- Gallery Picker Modal -->
<ImagePickerModal
	open={showGalleryModal}
	onSelect={handleGallerySelect}
	onClose={() => (showGalleryModal = false)}
	title="Select {label}"
/>
