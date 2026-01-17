/**
 * Checkout Utilities
 *
 * Shared types and helper functions for the checkout page.
 * These are extracted to a separate file so they can be safely imported
 * by both server (+page.server.ts) and client (+page.svelte) code.
 *
 * Note: SvelteKit's +page.server.ts files can only export specific names
 * (load, actions, prerender, etc.), so shared utilities must be in a
 * separate module.
 */

/**
 * Represents a fulfillment slot with capacity information
 */
export interface FulfillmentSlotWithCapacity {
	id: number;
	date: string; // YYYY-MM-DD format
	startTime: string; // HH:MM format
	endTime: string; // HH:MM format
	slotType: string | null; // 'pickup', 'delivery', or 'both'
	maxCookies: number | null;
	cookiesOrdered: number; // From daily_capacity table, 0 if no record
	remainingCapacity: number; // maxCookies - cookiesOrdered
	isSoldOut: boolean; // remainingCapacity <= 0
}

/**
 * Groups slots by date for easier rendering
 */
export interface SlotsByDate {
	date: string;
	formattedDate: string; // e.g., "Saturday, January 18"
	slots: FulfillmentSlotWithCapacity[];
}

/**
 * Formats a time string (HH:MM) to a human-readable format (e.g., "10:00 AM")
 */
export function formatTimeDisplay(timeStr: string): string {
	const [hours, minutes] = timeStr.split(':').map(Number);
	const period = hours >= 12 ? 'PM' : 'AM';
	const displayHours = hours % 12 || 12;
	return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
