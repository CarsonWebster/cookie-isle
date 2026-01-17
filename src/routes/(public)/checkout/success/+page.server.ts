/**
 * Checkout Success Page Server Load Function
 *
 * Loads order details from the database after successful Stripe checkout.
 * Verifies the session_id from URL params and fetches the corresponding order.
 *
 * PRD Reference: 4.4.1 - 4.4.5
 */

import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { orders, type OrderItem, type DeliveryAddress } from '$lib/server/db/schema';
import { getStripe } from '$lib/server/stripe';
import type { PageServerLoad } from './$types';

/**
 * Order data returned to the page
 */
export interface OrderData {
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
}

/**
 * Formats a date string (YYYY-MM-DD) to a human-readable format
 */
export function formatFulfillmentDate(dateStr: string | null): string {
	if (!dateStr) return '';
	const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Formats a time range string (e.g., "10:00-12:00") to human-readable format
 */
export function formatFulfillmentTime(timeStr: string | null): string {
	if (!timeStr) return '';

	const [start, end] = timeStr.split('-');
	if (!start || !end) return timeStr;

	const formatTime = (time: string): string => {
		const [hours, minutes] = time.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	};

	return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Formats a fulfillment type for display
 */
export function formatFulfillmentType(type: string | null): string {
	if (!type) return '';
	return type.charAt(0).toUpperCase() + type.slice(1);
}

export const load: PageServerLoad = async ({ url, platform }) => {
	// Get session_id from URL query params
	const sessionId = url.searchParams.get('session_id');

	if (!sessionId) {
		throw error(404, 'Order not found - missing session ID');
	}

	// Check if database is available
	if (!platform?.env?.DB) {
		throw error(500, 'Database not available');
	}

	// Verify the Stripe session is valid (optional but recommended)
	// This ensures the user actually completed checkout and didn't just guess the URL
	try {
		const stripe = getStripe(platform);
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		// Only show success page for completed sessions
		if (session.payment_status !== 'paid') {
			throw error(404, 'Order not found - payment not completed');
		}
	} catch (e) {
		// Re-throw HttpError (from SvelteKit's error() function)
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		// If Stripe verification fails for other reasons, still try to find the order in our DB
		// This handles cases where Stripe might be unreachable
		console.error('Stripe session verification failed:', e);
	}

	// Get database connection
	const db = getDb(platform);

	// Query order by Stripe session ID
	const orderResults = await db
		.select()
		.from(orders)
		.where(eq(orders.stripeSessionId, sessionId))
		.limit(1);

	if (orderResults.length === 0) {
		throw error(404, 'Order not found');
	}

	const order = orderResults[0];

	// Transform to OrderData type
	const orderData: OrderData = {
		id: order.id,
		stripeSessionId: order.stripeSessionId,
		status: order.status,
		customerName: order.customerName,
		customerEmail: order.customerEmail,
		customerPhone: order.customerPhone,
		fulfillmentType: order.fulfillmentType,
		fulfillmentDate: order.fulfillmentDate,
		fulfillmentTime: order.fulfillmentTime,
		deliveryAddress: order.deliveryAddress,
		items: order.items,
		subtotalCents: order.subtotalCents,
		tipCents: order.tipCents,
		giftBox: order.giftBox,
		giftMessage: order.giftMessage,
		taxCents: order.taxCents,
		totalCents: order.totalCents,
		createdAt: order.createdAt
	};

	return {
		order: orderData
	};
};
