/**
 * Checkout Page Server Load Function
 *
 * Loads available fulfillment slots from the database for the checkout page.
 * Slots are filtered to only show active slots for future dates, and capacity
 * information is included to determine if slots are sold out.
 *
 * PRD Reference: 3.7.1, 3.7.2, 3.7.3
 */

import { getDb } from '$lib/server/db';
import { fulfillmentSlots, dailyCapacity } from '$lib/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

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
 * Formats a date string (YYYY-MM-DD) to a human-readable format
 */
function formatDateHeading(dateStr: string): string {
	const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
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

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
	const now = new Date();
	return now.toISOString().split('T')[0];
}

export const load: PageServerLoad = async ({ platform }) => {
	// If no database is available (e.g., during build or without CF bindings),
	// return empty slots array
	if (!platform?.env?.DB) {
		return {
			slots: [] as FulfillmentSlotWithCapacity[],
			slotsByDate: [] as SlotsByDate[]
		};
	}

	const db = getDb(platform);
	const today = getTodayDateString();

	// Query: SELECT * FROM fulfillment_slots WHERE active = 1 AND date >= today
	const availableSlots = await db
		.select()
		.from(fulfillmentSlots)
		.where(and(eq(fulfillmentSlots.active, true), gte(fulfillmentSlots.date, today)));

	// Get unique dates from slots
	const uniqueDates = [...new Set(availableSlots.map((slot) => slot.date))];

	// Query daily capacity for these dates
	// Since dailyCapacity uses date as primary key, we query for all dates
	const capacityRecords = await db.select().from(dailyCapacity);

	// Create a map of date -> cookiesOrdered for quick lookup
	const capacityByDate = new Map<string, number>();
	for (const record of capacityRecords) {
		capacityByDate.set(record.date, record.cookiesOrdered ?? 0);
	}

	// Enhance slots with capacity information
	const slotsWithCapacity: FulfillmentSlotWithCapacity[] = availableSlots.map((slot) => {
		const cookiesOrdered = capacityByDate.get(slot.date) ?? 0;
		const maxCookies = slot.maxCookies ?? 200; // Default to 200 if not set
		const remainingCapacity = maxCookies - cookiesOrdered;

		return {
			id: slot.id,
			date: slot.date,
			startTime: slot.startTime,
			endTime: slot.endTime,
			slotType: slot.slotType,
			maxCookies: slot.maxCookies,
			cookiesOrdered,
			remainingCapacity,
			isSoldOut: remainingCapacity <= 0
		};
	});

	// Sort slots by date, then by start time
	slotsWithCapacity.sort((a, b) => {
		if (a.date !== b.date) {
			return a.date.localeCompare(b.date);
		}
		return a.startTime.localeCompare(b.startTime);
	});

	// Group slots by date
	const slotsByDateMap = new Map<string, FulfillmentSlotWithCapacity[]>();
	for (const slot of slotsWithCapacity) {
		const existing = slotsByDateMap.get(slot.date) ?? [];
		existing.push(slot);
		slotsByDateMap.set(slot.date, existing);
	}

	// Convert to array format with formatted date headers
	const slotsByDate: SlotsByDate[] = Array.from(slotsByDateMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, slots]) => ({
			date,
			formattedDate: formatDateHeading(date),
			slots
		}));

	return {
		slots: slotsWithCapacity,
		slotsByDate
	};
};
