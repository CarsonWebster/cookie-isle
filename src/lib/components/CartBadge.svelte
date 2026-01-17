<script lang="ts">
	import { getCartCount } from '$lib/stores/cart.svelte';

	/**
	 * CartBadge Component
	 *
	 * Displays the current cart item count as a circular badge.
	 * Features:
	 * - Hidden when cart is empty (count = 0)
	 * - Pop animation when count changes
	 * - Absolute positioning for overlay on cart icon
	 * - Primary color background with white text
	 */

	// Track previous count for animation trigger
	let previousCount = $state(0);
	let animating = $state(false);

	// Current cart count - reactive via getter
	const count = $derived(getCartCount());

	// Trigger pop animation when count changes
	$effect(() => {
		if (count !== previousCount && count > 0) {
			animating = true;
			// Reset animation state after animation completes
			const timer = setTimeout(() => {
				animating = false;
			}, 300);
			previousCount = count;
			return () => clearTimeout(timer);
		}
		previousCount = count;
	});
</script>

{#if count > 0}
	<span
		class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white transition-transform {animating
			? 'animate-badge-pop'
			: ''}"
		aria-label="{count} {count === 1 ? 'item' : 'items'} in cart"
	>
		{count > 99 ? '99+' : count}
	</span>
{/if}

<style>
	@keyframes badge-pop {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.3);
		}
		100% {
			transform: scale(1);
		}
	}

	.animate-badge-pop {
		animation: badge-pop 0.3s ease-out;
	}
</style>
