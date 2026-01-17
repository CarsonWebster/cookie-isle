import { error, fail, type Actions } from '@sveltejs/kit';
import { eq, gte } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { dailyCapacity, fulfillmentSlots } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.DB) {
		throw error(500, 'Database not configured');
	}

	const db = getDb(platform);

	// Get today's date in YYYY-MM-DD format
	const today = new Date().toISOString().split('T')[0];

	// Load all future slots ordered by date and start time
	const slots = await db
		.select()
		.from(fulfillmentSlots)
		.where(gte(fulfillmentSlots.date, today))
		.orderBy(fulfillmentSlots.date, fulfillmentSlots.startTime)
		.all();

	// Load daily capacity data for future dates
	const capacityData = await db
		.select()
		.from(dailyCapacity)
		.where(gte(dailyCapacity.date, today))
		.all();

	// Create a map of date -> capacity data for easy lookup
	const capacityMap = new Map(capacityData.map((c) => [c.date, c]));

	return {
		slots,
		capacityMap: Object.fromEntries(capacityMap)
	};
};

export const actions = {
	createSlot: async ({ request, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform);
		const formData = await request.formData();

		const date = formData.get('date')?.toString();
		const startTime = formData.get('startTime')?.toString();
		const endTime = formData.get('endTime')?.toString();
		const slotType = formData.get('slotType')?.toString();
		const maxCookies = formData.get('maxCookies')?.toString();

		// Validation
		if (!date || !startTime || !endTime || !slotType) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Validate date format (YYYY-MM-DD)
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return fail(400, { error: 'Invalid date format' });
		}

		// Validate time format (HH:MM)
		if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
			return fail(400, { error: 'Invalid time format' });
		}

		// Validate slot type
		if (!['pickup', 'delivery', 'both'].includes(slotType)) {
			return fail(400, { error: 'Invalid slot type' });
		}

		// Validate max cookies
		const maxCookiesNum = parseInt(maxCookies || '200', 10);
		if (isNaN(maxCookiesNum) || maxCookiesNum < 1) {
			return fail(400, { error: 'Invalid max cookies value' });
		}

		// Validate that end time is after start time
		if (startTime >= endTime) {
			return fail(400, { error: 'End time must be after start time' });
		}

		// Insert slot
		await db.insert(fulfillmentSlots).values({
			date,
			startTime,
			endTime,
			slotType,
			maxCookies: maxCookiesNum,
			active: true
		});

		return { success: 'created' as const };
	},

	toggleActive: async ({ request, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform);
		const formData = await request.formData();
		const slotId = formData.get('slotId')?.toString();
		const active = formData.get('active') === 'true';

		if (!slotId) {
			return fail(400, { error: 'Missing slot ID' });
		}

		const slotIdNum = parseInt(slotId, 10);
		if (isNaN(slotIdNum)) {
			return fail(400, { error: 'Invalid slot ID' });
		}

		await db
			.update(fulfillmentSlots)
			.set({ active: !active })
			.where(eq(fulfillmentSlots.id, slotIdNum));

		return { success: 'updated' as const };
	},

	deleteSlot: async ({ request, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { error: 'Database not configured' });
		}

		const db = getDb(platform);
		const formData = await request.formData();
		const slotId = formData.get('slotId')?.toString();

		if (!slotId) {
			return fail(400, { error: 'Missing slot ID' });
		}

		const slotIdNum = parseInt(slotId, 10);
		if (isNaN(slotIdNum)) {
			return fail(400, { error: 'Invalid slot ID' });
		}

		await db.delete(fulfillmentSlots).where(eq(fulfillmentSlots.id, slotIdNum));

		return { success: 'deleted' as const };
	}
} satisfies Actions;
