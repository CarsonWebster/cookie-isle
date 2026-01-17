import { json, type RequestEvent } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { getDb } from '$lib/server/db';
import { orders, dailyCapacity, type OrderItem, type DeliveryAddress } from '$lib/server/db/schema';
import { verifyWebhookSignature } from '$lib/server/stripe';
import { calculateTax } from '$lib/config';

// ============================================================================
// Types
// ============================================================================

/** Metadata structure from Stripe checkout session */
export interface WebhookMetadata {
	customer_firstName: string;
	customer_lastName: string;
	customer_email: string;
	customer_phone: string;
	fulfillment_type: 'pickup' | 'delivery';
	fulfillment_slotId: string;
	fulfillment_date: string;
	fulfillment_startTime: string;
	fulfillment_endTime: string;
	tip_cents: string;
	include_gift_box: string;
	gift_message?: string;
	items_json: string;
	delivery_address?: string;
}

/** Parsed item from items_json metadata */
interface ParsedOrderItem {
	productId: number;
	slug: string;
	title: string;
	priceCents: number;
	quantity: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses and validates the metadata from a Stripe checkout session.
 * Returns null if required fields are missing.
 */
export function parseWebhookMetadata(metadata: Stripe.Metadata | null): WebhookMetadata | null {
	if (!metadata) return null;

	// Check required fields
	const required = [
		'customer_firstName',
		'customer_lastName',
		'customer_email',
		'customer_phone',
		'fulfillment_type',
		'fulfillment_slotId',
		'fulfillment_date',
		'fulfillment_startTime',
		'fulfillment_endTime',
		'tip_cents',
		'include_gift_box',
		'items_json'
	];

	for (const field of required) {
		if (!metadata[field]) {
			console.error(`Missing required metadata field: ${field}`);
			return null;
		}
	}

	return metadata as unknown as WebhookMetadata;
}

/**
 * Parses items from the items_json metadata field.
 * Returns empty array if parsing fails.
 */
export function parseOrderItems(itemsJson: string): OrderItem[] {
	try {
		const parsed: ParsedOrderItem[] = JSON.parse(itemsJson);
		if (!Array.isArray(parsed)) return [];

		return parsed.map((item) => ({
			productId: item.productId,
			slug: item.slug,
			title: item.title,
			priceCents: item.priceCents,
			quantity: item.quantity
		}));
	} catch (e) {
		console.error('Failed to parse items_json:', e);
		return [];
	}
}

/**
 * Parses delivery address from metadata.
 * Returns null if not present or parsing fails.
 */
export function parseDeliveryAddress(addressJson: string | undefined): DeliveryAddress | null {
	if (!addressJson) return null;

	try {
		const parsed = JSON.parse(addressJson);
		if (typeof parsed !== 'object' || !parsed.street) return null;

		return {
			street: parsed.street,
			apt: parsed.apt,
			city: parsed.city,
			state: parsed.state,
			zip: parsed.zip
		};
	} catch (e) {
		console.error('Failed to parse delivery_address:', e);
		return null;
	}
}

/**
 * Calculates the subtotal from order items.
 */
export function calculateSubtotal(items: OrderItem[]): number {
	return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}

/**
 * Calculates the total quantity of cookies in an order.
 */
export function calculateTotalQuantity(items: OrderItem[]): number {
	return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Inserts a new order into the database.
 * Returns the inserted order ID.
 */
export async function insertOrder(
	db: ReturnType<typeof getDb>,
	sessionId: string,
	metadata: WebhookMetadata,
	amountTotal: number
): Promise<number> {
	const items = parseOrderItems(metadata.items_json);
	const subtotalCents = calculateSubtotal(items);
	const tipCents = parseInt(metadata.tip_cents, 10) || 0;
	const includeGiftBox = metadata.include_gift_box === 'true';
	const deliveryAddress = parseDeliveryAddress(metadata.delivery_address);

	// Calculate tax (if enabled)
	const taxCents = calculateTax(subtotalCents);

	// Use Stripe's amount_total as the source of truth for totalCents
	// (Stripe handles automatic tax if configured)
	const totalCents = amountTotal;

	const result = await db
		.insert(orders)
		.values({
			stripeSessionId: sessionId,
			status: 'paid',
			customerName: `${metadata.customer_firstName} ${metadata.customer_lastName}`,
			customerEmail: metadata.customer_email,
			customerPhone: metadata.customer_phone,
			fulfillmentType: metadata.fulfillment_type,
			fulfillmentDate: metadata.fulfillment_date,
			fulfillmentTime: `${metadata.fulfillment_startTime}-${metadata.fulfillment_endTime}`,
			deliveryAddress,
			items,
			subtotalCents,
			tipCents,
			giftBox: includeGiftBox,
			giftMessage: metadata.gift_message || null,
			taxCents,
			totalCents
		})
		.returning({ id: orders.id });

	return result[0].id;
}

/**
 * Updates the daily capacity for a fulfillment date.
 * Increments cookies_ordered by the given quantity.
 */
export async function updateDailyCapacity(
	db: ReturnType<typeof getDb>,
	date: string,
	quantityToAdd: number
): Promise<void> {
	// Use upsert pattern: INSERT OR UPDATE
	await db
		.insert(dailyCapacity)
		.values({
			date,
			cookiesOrdered: quantityToAdd,
			updatedAt: sql`(datetime('now'))`
		})
		.onConflictDoUpdate({
			target: dailyCapacity.date,
			set: {
				cookiesOrdered: sql`${dailyCapacity.cookiesOrdered} + ${quantityToAdd}`,
				updatedAt: sql`(datetime('now'))`
			}
		});
}

/**
 * Checks if an order already exists for the given Stripe session ID.
 * Used to handle idempotency (webhook retries).
 */
export async function orderExistsForSession(
	db: ReturnType<typeof getDb>,
	sessionId: string
): Promise<boolean> {
	const existing = await db
		.select({ id: orders.id })
		.from(orders)
		.where(eq(orders.stripeSessionId, sessionId))
		.limit(1);

	return existing.length > 0;
}

// ============================================================================
// Webhook Handler
// ============================================================================

export const POST = async ({ request, platform }: RequestEvent) => {
	// Get raw body for signature verification
	const payload = await request.text();

	// Get Stripe signature header
	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		console.error('Missing stripe-signature header');
		return json({ error: 'Missing signature' }, { status: 400 });
	}

	// Get webhook secret from environment
	const webhookSecret = platform?.env?.STRIPE_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error('STRIPE_WEBHOOK_SECRET not configured');
		return json({ error: 'Webhook not configured' }, { status: 500 });
	}

	// Verify webhook signature
	let event: Stripe.Event;
	try {
		event = await verifyWebhookSignature(payload, signature, webhookSecret);
	} catch (e) {
		console.error('Webhook signature verification failed:', e);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	// Handle the event
	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session;

		// Verify payment was successful
		if (session.payment_status !== 'paid') {
			console.log(`Session ${session.id} not paid yet, skipping`);
			return json({ received: true });
		}

		// Get database connection
		let db: ReturnType<typeof getDb>;
		try {
			db = getDb(platform);
		} catch (e) {
			console.error('Database connection failed:', e);
			// Return 200 to prevent retries - we'll handle this manually
			return json({ received: true, warning: 'Database unavailable' });
		}

		// Check for duplicate (idempotency)
		const alreadyProcessed = await orderExistsForSession(db, session.id);
		if (alreadyProcessed) {
			console.log(`Order for session ${session.id} already exists, skipping`);
			return json({ received: true, duplicate: true });
		}

		// Parse metadata
		const metadata = parseWebhookMetadata(session.metadata);
		if (!metadata) {
			console.error(`Invalid metadata for session ${session.id}`);
			// Return 200 to prevent infinite retries - log for manual review
			return json({ received: true, error: 'Invalid metadata' });
		}

		try {
			// Insert the order
			const orderId = await insertOrder(db, session.id, metadata, session.amount_total || 0);
			console.log(`Order ${orderId} created for session ${session.id}`);

			// Update daily capacity
			const items = parseOrderItems(metadata.items_json);
			const totalQuantity = calculateTotalQuantity(items);
			await updateDailyCapacity(db, metadata.fulfillment_date, totalQuantity);
			console.log(`Updated capacity for ${metadata.fulfillment_date}: +${totalQuantity} cookies`);

			return json({ received: true, orderId });
		} catch (e) {
			console.error(`Failed to process order for session ${session.id}:`, e);
			// Return 500 to trigger retry
			return json({ error: 'Failed to process order' }, { status: 500 });
		}
	}

	// For other event types, just acknowledge receipt
	console.log(`Unhandled event type: ${event.type}`);
	return json({ received: true });
};
