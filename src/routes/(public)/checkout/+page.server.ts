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
import type { FulfillmentSlotWithCapacity, SlotsByDate } from './checkout-utils';

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

	// Get unique dates from slots (used implicitly by capacityByDate lookup)

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
