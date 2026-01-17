import { error, fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { formatPrice } from '$lib/config';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import type { OrderItem, DeliveryAddress } from '$lib/server/db/schema';

/**
 * Represents a complete order with all details
 */
export interface OrderDetail {
	id: number;
	stripeSessionId: string | null;
	status: string | null;
	customerName: string | null;
	customerEmail: string | null;
	customerPhone: string | null;
	fulfillmentType: string | null;
	fulfillmentDate: string | null;
	fulfillmentTime: string | null;
	deliveryAddress: DeliveryAddress | null;
	items: OrderItem[];
	subtotalCents: number | null;
	tipCents: number | null;
	giftBox: boolean | null;
	giftMessage: string | null;
	taxCents: number | null;
	totalCents: number | null;
	createdAt: string | null;
	// Formatted values
	subtotalFormatted: string;
	tipFormatted: string;
	taxFormatted: string;
	totalFormatted: string;
	createdAtFormatted: string;
	fulfillmentDateFormatted: string;
}

/**
 * Format ISO datetime string to readable format
 * Example: "Jan 16, 2026 at 3:30 PM"
 */
export function formatDateTime(isoString: string | null): string {
	if (!isoString) return 'N/A';

	try {
		const date = new Date(isoString);
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	} catch {
		return 'Invalid Date';
	}
}

/**
 * Format date string (YYYY-MM-DD) to readable format
 * Example: "Friday, Jan 16, 2026"
 */
export function formatFulfillmentDate(dateString: string | null): string {
	if (!dateString) return 'N/A';

	try {
		const date = new Date(dateString + 'T00:00:00');
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return dateString;
		}
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	} catch {
		return dateString;
	}
}

/**
 * Format time string (HH:MM) to readable format
 * Example: "3:30 PM"
 */
export function formatTime(timeString: string | null): string {
	if (!timeString) return '';

	try {
		const parts = timeString.split(':');
		if (parts.length !== 2) {
			return timeString;
		}

		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);

		// Check if valid time values
		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			return timeString;
		}

		const date = new Date(2000, 0, 1, hours, minutes);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	} catch {
		return timeString;
	}
}

/**
 * Query order by ID from database
 */
export async function queryOrderById(
	db: ReturnType<typeof getDb>,
	id: number
): Promise<OrderDetail | null> {
	const result = await db.select().from(orders).where(eq(orders.id, id)).get();

	if (!result) {
		return null;
	}

	return {
		id: result.id,
		stripeSessionId: result.stripeSessionId,
		status: result.status,
		customerName: result.customerName,
		customerEmail: result.customerEmail,
		customerPhone: result.customerPhone,
		fulfillmentType: result.fulfillmentType,
		fulfillmentDate: result.fulfillmentDate,
		fulfillmentTime: result.fulfillmentTime,
		deliveryAddress: result.deliveryAddress,
		items: result.items,
		subtotalCents: result.subtotalCents,
		tipCents: result.tipCents,
		giftBox: result.giftBox,
		giftMessage: result.giftMessage,
		taxCents: result.taxCents,
		totalCents: result.totalCents,
		createdAt: result.createdAt,
		// Formatted values
		subtotalFormatted: formatPrice(result.subtotalCents || 0),
		tipFormatted: formatPrice(result.tipCents || 0),
		taxFormatted: formatPrice(result.taxCents || 0),
		totalFormatted: formatPrice(result.totalCents || 0),
		createdAtFormatted: formatDateTime(result.createdAt),
		fulfillmentDateFormatted: formatFulfillmentDate(result.fulfillmentDate)
	};
}

/**
 * Update order status to fulfilled
 */
export async function updateOrderStatus(
	db: ReturnType<typeof getDb>,
	id: number,
	status: string
): Promise<boolean> {
	try {
		await db.update(orders).set({ status }).where(eq(orders.id, id)).run();
		return true;
	} catch {
		return false;
	}
}

export const load: PageServerLoad = async ({ platform, params }) => {
	// Parse order ID from URL params
	const orderId = parseInt(params.id, 10);

	if (isNaN(orderId)) {
		throw error(404, 'Order not found');
	}

	// Check platform availability
	if (!platform?.env?.DB) {
		throw error(503, 'Database unavailable');
	}

	try {
		const db = getDb(platform);
		const order = await queryOrderById(db, orderId);

		if (!order) {
			throw error(404, 'Order not found');
		}

		return { order };
	} catch (err) {
		// If it's already an error response, re-throw it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		// Otherwise throw a generic error
		console.error('Failed to load order:', err);
		throw error(500, 'Failed to load order');
	}
};

export const actions: Actions = {
	/**
	 * Mark order as fulfilled
	 */
	markFulfilled: async ({ platform, params }) => {
		const orderId = parseInt(params.id, 10);

		if (isNaN(orderId)) {
			return fail(400, { error: 'Invalid order ID' });
		}

		if (!platform?.env?.DB) {
			return fail(503, { error: 'Database unavailable' });
		}

		try {
			const db = getDb(platform);
			const success = await updateOrderStatus(db, orderId, 'fulfilled');

			if (!success) {
				return fail(500, { error: 'Failed to update order status' });
			}

			return { success: true };
		} catch (err) {
			console.error('Failed to update order status:', err);
			return fail(500, { error: 'Failed to update order status' });
		}
	}
};
