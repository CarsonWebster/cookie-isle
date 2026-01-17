<script lang="ts">
	/**
	 * ImageCropPreview Component
	 *
	 * Shows how an image will appear in both card (square) and hero (wide) formats.
	 * Allows setting focal points for each crop type by clicking on the image.
	 * Uses CSS object-fit and object-position for visual preview (no actual image manipulation).
	 */

	interface Props {
		/** The image URL to preview */
		imageUrl: string;
		/** Initial focal point X for card crop (0-100) */
		cardFocalX?: number;
		/** Initial focal point Y for card crop (0-100) */
		cardFocalY?: number;
		/** Initial focal point X for hero crop (0-100) */
		heroFocalX?: number;
		/** Initial focal point Y for hero crop (0-100) */
		heroFocalY?: number;
		/** Callback when card focal point changes */
		onCardFocalChange?: (x: number, y: number) => void;
		/** Callback when hero focal point changes */
		onHeroFocalChange?: (x: number, y: number) => void;
	}

	let {
		imageUrl,
		cardFocalX = 50,
		cardFocalY = 50,
		heroFocalX = 50,
		heroFocalY = 50,
		onCardFocalChange,
		onHeroFocalChange
	}: Props = $props();

	// Active tab state
	let activeTab = $state<'card' | 'hero'>('card');

	// Get current focal points based on active tab
	let currentFocalX = $derived(activeTab === 'card' ? cardFocalX : heroFocalX);
	let currentFocalY = $derived(activeTab === 'card' ? cardFocalY : heroFocalY);

	// Handle click on the image to set focal point
	function handleImageClick(event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		// Calculate percentage position within the element
		const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
		const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

		// Clamp values to 0-100
		const clampedX = Math.max(0, Math.min(100, x));
		const clampedY = Math.max(0, Math.min(100, y));

		// Update the appropriate focal point
		if (activeTab === 'card') {
			onCardFocalChange?.(clampedX, clampedY);
		} else {
			onHeroFocalChange?.(clampedX, clampedY);
		}
	}
</script>

<div class="space-y-4">
	<!-- Tab Buttons -->
	<div class="flex gap-2">
		<button
			type="button"
			onclick={() => (activeTab = 'card')}
			class="rounded-lg px-4 py-2 text-sm font-medium transition-colors
				{activeTab === 'card' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
		>
			Card Preview (Square)
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'hero')}
			class="rounded-lg px-4 py-2 text-sm font-medium transition-colors
				{activeTab === 'hero' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
		>
			Hero Preview (Wide)
		</button>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Source Image with Focal Point Selector -->
		<div class="space-y-2">
			<h4 class="text-sm font-medium text-gray-700">
				Click to set {activeTab === 'card' ? 'card' : 'hero'} focal point
			</h4>
			<div class="relative overflow-hidden rounded-lg border border-gray-300 bg-gray-100">
				<!-- Source Image -->
				<button
					type="button"
					class="relative block w-full cursor-crosshair"
					onclick={handleImageClick}
				>
					<img src={imageUrl} alt="Source" class="h-auto w-full" />

					<!-- Focal Point Indicator -->
					<div
						class="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform"
						style="left: {currentFocalX}%; top: {currentFocalY}%;"
					>
						<!-- Crosshair -->
						<div
							class="absolute inset-0 flex items-center justify-center rounded-full border-2 border-white bg-primary/80 shadow-lg"
						>
							<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</div>
					</div>

					<!-- Grid Overlay (optional, for guidance) -->
					<div
						class="pointer-events-none absolute inset-0 opacity-20"
						style="background-image: linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px); background-size: 33.333% 33.333%;"
					></div>
				</button>
			</div>
			<p class="text-xs text-gray-500">
				Focal point: {currentFocalX}%, {currentFocalY}%
			</p>
		</div>

		<!-- Preview -->
		<div class="space-y-2">
			<h4 class="text-sm font-medium text-gray-700">
				{activeTab === 'card' ? 'Card Preview (1:1)' : 'Hero Preview (16:9)'}
			</h4>
			<div
				class="overflow-hidden rounded-lg border border-gray-300 bg-gray-100
					{activeTab === 'card' ? 'aspect-square' : 'aspect-video'}"
			>
				<img
					src={imageUrl}
					alt="Preview"
					class="h-full w-full object-cover"
					style="object-position: {currentFocalX}% {currentFocalY}%;"
				/>
			</div>
			<p class="text-xs text-gray-500">
				{activeTab === 'card'
					? 'Used in product cards and menu listings'
					: 'Used on product detail page'}
			</p>
		</div>
	</div>

	<!-- Both Previews Side by Side (Compact View) -->
	<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
		<h4 class="mb-3 text-sm font-medium text-gray-700">Both Crops Preview</h4>
		<div class="grid grid-cols-2 gap-4">
			<!-- Card Preview -->
			<div class="space-y-1">
				<div class="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
					<img
						src={imageUrl}
						alt="Card preview"
						class="h-full w-full object-cover"
						style="object-position: {cardFocalX}% {cardFocalY}%;"
					/>
				</div>
				<p class="text-center text-xs text-gray-500">Card (Square)</p>
			</div>

			<!-- Hero Preview -->
			<div class="space-y-1">
				<div class="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-white">
					<img
						src={imageUrl}
						alt="Hero preview"
						class="h-full w-full object-cover"
						style="object-position: {heroFocalX}% {heroFocalY}%;"
					/>
				</div>
				<p class="text-center text-xs text-gray-500">Hero (Wide)</p>
			</div>
		</div>
	</div>
</div>
