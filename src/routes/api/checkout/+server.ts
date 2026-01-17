import { json, error, type RequestEvent } from '@sveltejs/kit';
import { inArray } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { getStripe } from '$lib/server/stripe';
import { config, isZipAllowedForDelivery } from '$lib/config';

// ============================================================================
// Types
// ============================================================================

/** A single cart item in the checkout request */
export interface CheckoutCartItem {
	productId: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
	quantity: number;
}

/** Customer information in the checkout request */
export interface CheckoutCustomer {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
}

/** Delivery address (required for delivery fulfillment) */
export interface CheckoutDeliveryAddress {
	street: string;
	apt?: string;
	city: string;
	state: string;
	zip: string;
}

/** Fulfillment information in the checkout request */
export interface CheckoutFulfillment {
	type: 'pickup' | 'delivery';
	slotId: number;
	date: string;
	startTime: string;
	endTime: string;
	address?: CheckoutDeliveryAddress;
}

/** Complete checkout request body */
export interface CheckoutRequest {
	items: CheckoutCartItem[];
	customer: CheckoutCustomer;
	fulfillment: CheckoutFulfillment;
	tipCents: number;
	includeGiftBox: boolean;
	giftMessage?: string;
}

/** Checkout API response */
export interface CheckoutResponse {
	url: string;
}

/** Error response */
export interface CheckoutErrorResponse {
	error: string;
	details?: string[];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates the checkout request body structure.
 * Returns an array of error messages, or empty array if valid.
 */
export function validateCheckoutRequest(body: unknown): string[] {
	const errors: string[] = [];

	if (!body || typeof body !== 'object') {
		return ['Request body must be a valid JSON object'];
	}

	const req = body as Record<string, unknown>;

	// Validate items array
	if (!Array.isArray(req.items)) {
		errors.push('items must be an array');
	} else if (req.items.length === 0) {
		errors.push('Cart cannot be empty');
	} else {
		// Validate each item
		let totalQuantity = 0;
		req.items.forEach((item: unknown, index: number) => {
			const itemErrors = validateCartItem(item, index);
			errors.push(...itemErrors);
			if (item && typeof item === 'object' && 'quantity' in item) {
				totalQuantity += (item as { quantity: number }).quantity;
			}
		});

		// Check max order quantity
		if (totalQuantity > config.order.maxOrderQuantity) {
			errors.push(`Order exceeds maximum quantity of ${config.order.maxOrderQuantity} items`);
		}
	}

	// Validate customer
	if (!req.customer || typeof req.customer !== 'object') {
		errors.push('customer information is required');
	} else {
		const customerErrors = validateCustomer(req.customer as Record<string, unknown>);
		errors.push(...customerErrors);
	}

	// Validate fulfillment
	if (!req.fulfillment || typeof req.fulfillment !== 'object') {
		errors.push('fulfillment information is required');
	} else {
		const fulfillmentErrors = validateFulfillment(req.fulfillment as Record<string, unknown>);
		errors.push(...fulfillmentErrors);
	}

	// Validate tip
	if (typeof req.tipCents !== 'number' || req.tipCents < 0) {
		errors.push('tipCents must be a non-negative number');
	}

	// Validate gift box
	if (typeof req.includeGiftBox !== 'boolean') {
		errors.push('includeGiftBox must be a boolean');
	}

	// Validate gift message if provided
	if (req.giftMessage !== undefined && typeof req.giftMessage !== 'string') {
		errors.push('giftMessage must be a string');
	}

	return errors;
}

/**
 * Validates a single cart item.
 */
function validateCartItem(item: unknown, index: number): string[] {
	const errors: string[] = [];
	const prefix = `items[${index}]`;

	if (!item || typeof item !== 'object') {
		return [`${prefix} must be an object`];
	}

	const i = item as Record<string, unknown>;

	if (typeof i.productId !== 'number' || i.productId <= 0) {
		errors.push(`${prefix}.productId must be a positive number`);
	}

	if (typeof i.slug !== 'string' || i.slug.length === 0) {
		errors.push(`${prefix}.slug must be a non-empty string`);
	}

	if (typeof i.title !== 'string' || i.title.length === 0) {
		errors.push(`${prefix}.title must be a non-empty string`);
	}

	if (typeof i.priceCents !== 'number' || i.priceCents < 0) {
		errors.push(`${prefix}.priceCents must be a non-negative number`);
	}

	if (typeof i.stripePriceId !== 'string' || i.stripePriceId.length === 0) {
		errors.push(`${prefix}.stripePriceId must be a non-empty string`);
	}

	if (typeof i.quantity !== 'number' || i.quantity <= 0 || !Number.isInteger(i.quantity)) {
		errors.push(`${prefix}.quantity must be a positive integer`);
	}

	return errors;
}

/**
 * Validates customer information.
 */
function validateCustomer(customer: Record<string, unknown>): string[] {
	const errors: string[] = [];

	if (typeof customer.firstName !== 'string' || customer.firstName.trim().length === 0) {
		errors.push('customer.firstName is required');
	}

	if (typeof customer.lastName !== 'string' || customer.lastName.trim().length === 0) {
		errors.push('customer.lastName is required');
	}

	if (typeof customer.email !== 'string' || !isValidEmail(customer.email)) {
		errors.push('customer.email must be a valid email address');
	}

	if (typeof customer.phone !== 'string' || customer.phone.trim().length === 0) {
		errors.push('customer.phone is required');
	}

	return errors;
}

/**
 * Validates fulfillment information.
 */
function validateFulfillment(fulfillment: Record<string, unknown>): string[] {
	const errors: string[] = [];

	if (fulfillment.type !== 'pickup' && fulfillment.type !== 'delivery') {
		errors.push('fulfillment.type must be "pickup" or "delivery"');
	}

	if (typeof fulfillment.slotId !== 'number' || fulfillment.slotId <= 0) {
		errors.push('fulfillment.slotId must be a positive number');
	}

	if (typeof fulfillment.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fulfillment.date)) {
		errors.push('fulfillment.date must be in YYYY-MM-DD format');
	}

	if (typeof fulfillment.startTime !== 'string' || !/^\d{2}:\d{2}$/.test(fulfillment.startTime)) {
		errors.push('fulfillment.startTime must be in HH:MM format');
	}

	if (typeof fulfillment.endTime !== 'string' || !/^\d{2}:\d{2}$/.test(fulfillment.endTime)) {
		errors.push('fulfillment.endTime must be in HH:MM format');
	}

	// Validate delivery address if fulfillment type is delivery
	if (fulfillment.type === 'delivery') {
		if (!fulfillment.address || typeof fulfillment.address !== 'object') {
			errors.push('fulfillment.address is required for delivery');
		} else {
			const addressErrors = validateDeliveryAddress(fulfillment.address as Record<string, unknown>);
			errors.push(...addressErrors);
		}
	}

	return errors;
}

/**
 * Validates delivery address.
 */
function validateDeliveryAddress(address: Record<string, unknown>): string[] {
	const errors: string[] = [];

	if (typeof address.street !== 'string' || address.street.trim().length === 0) {
		errors.push('fulfillment.address.street is required');
	}

	if (typeof address.city !== 'string' || address.city.trim().length === 0) {
		errors.push('fulfillment.address.city is required');
	}

	if (typeof address.state !== 'string' || address.state.trim().length === 0) {
		errors.push('fulfillment.address.state is required');
	}

	if (typeof address.zip !== 'string' || !/^\d{5}$/.test(address.zip)) {
		errors.push('fulfillment.address.zip must be a 5-digit ZIP code');
	} else if (!isZipAllowedForDelivery(address.zip)) {
		errors.push(config.fulfillment.deliveryZipError);
	}

	return errors;
}

/**
 * Simple email validation.
 */
function isValidEmail(email: string): boolean {
	return email.includes('@') && email.includes('.') && email.length >= 5;
}

// ============================================================================
// Database Validation
// ============================================================================

/**
 * Validates cart items against the database.
 * Checks that products exist, are active, and prices match.
 * Returns an array of errors, or empty if all valid.
 */
export async function validateCartItemsAgainstDb(
	db: ReturnType<typeof getDb>,
	items: CheckoutCartItem[]
): Promise<string[]> {
	const errors: string[] = [];

	// Get all product IDs from cart
	const productIds = items.map((item) => item.productId);

	// Query all products in one go
	const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));

	// Create a map for quick lookup
	const productMap = new Map(dbProducts.map((p) => [p.id, p]));

	// Validate each cart item
	for (const item of items) {
		const dbProduct = productMap.get(item.productId);

		if (!dbProduct) {
			errors.push(`Product "${item.title}" (ID: ${item.productId}) not found`);
			continue;
		}

		if (!dbProduct.active) {
			errors.push(`Product "${item.title}" is no longer available`);
			continue;
		}

		// Verify price matches (prevent price manipulation)
		if (dbProduct.priceCents !== item.priceCents) {
			errors.push(`Price for "${item.title}" has changed. Please refresh and try again.`);
		}

		// Verify stripe price ID matches
		if (dbProduct.stripePriceId !== item.stripePriceId) {
			errors.push(`Product "${item.title}" has been updated. Please refresh and try again.`);
		}
	}

	return errors;
}

// ============================================================================
// Stripe Session Creation
// ============================================================================

/**
 * Builds Stripe line items from cart items, tip, and gift box.
 */
export function buildStripeLineItems(
	items: CheckoutCartItem[],
	tipCents: number,
	includeGiftBox: boolean
): Array<
	| { price: string; quantity: number }
	| {
			price_data: { currency: string; product_data: { name: string }; unit_amount: number };
			quantity: number;
	  }
> {
	const lineItems: Array<
		| { price: string; quantity: number }
		| {
				price_data: { currency: string; product_data: { name: string }; unit_amount: number };
				quantity: number;
		  }
	> = [];

	// Add cart items
	for (const item of items) {
		lineItems.push({
			price: item.stripePriceId,
			quantity: item.quantity
		});
	}

	// Add tip as a custom line item if present
	if (tipCents > 0) {
		lineItems.push({
			price_data: {
				currency: 'usd',
				product_data: {
					name: 'Tip'
				},
				unit_amount: tipCents
			},
			quantity: 1
		});
	}

	// Add gift box if selected
	if (includeGiftBox && config.giftBox.enabled) {
		lineItems.push({
			price: config.giftBox.stripePriceId,
			quantity: 1
		});
	}

	return lineItems;
}

/**
 * Builds order metadata for the Stripe session.
 */
export function buildOrderMetadata(req: CheckoutRequest): Record<string, string> {
	const metadata: Record<string, string> = {
		// Customer info
		customer_firstName: req.customer.firstName,
		customer_lastName: req.customer.lastName,
		customer_email: req.customer.email,
		customer_phone: req.customer.phone,

		// Fulfillment info
		fulfillment_type: req.fulfillment.type,
		fulfillment_slotId: String(req.fulfillment.slotId),
		fulfillment_date: req.fulfillment.date,
		fulfillment_startTime: req.fulfillment.startTime,
		fulfillment_endTime: req.fulfillment.endTime,

		// Extras
		tip_cents: String(req.tipCents),
		include_gift_box: String(req.includeGiftBox),

		// Order items as JSON (Stripe metadata is limited to 500 chars per value)
		items_json: JSON.stringify(
			req.items.map((item) => ({
				productId: item.productId,
				slug: item.slug,
				title: item.title,
				priceCents: item.priceCents,
				quantity: item.quantity
			}))
		)
	};

	// Add gift message if provided
	if (req.giftMessage) {
		metadata.gift_message = req.giftMessage.slice(0, 500); // Stripe limit
	}

	// Add delivery address if delivery
	if (req.fulfillment.type === 'delivery' && req.fulfillment.address) {
		metadata.delivery_address = JSON.stringify(req.fulfillment.address);
	}

	return metadata;
}

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * List of allowed origins for CORS requests.
 * Includes production, preview, and development environments.
 */
const ALLOWED_ORIGINS = [
	'https://thecookieisle.com',
	'https://www.thecookieisle.com',
	'https://preview.cookie-isle.pages.dev',
	'http://localhost:5173',
	'http://127.0.0.1:5173'
];

/**
 * Gets the CORS headers for the response.
 * If the origin is allowed, returns appropriate CORS headers.
 * Otherwise, returns an empty object.
 */
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
	// If no origin header, it's a same-origin request - no CORS needed
	if (!requestOrigin) {
		return {};
	}

	// Check if origin is allowed
	const isAllowed = ALLOWED_ORIGINS.includes(requestOrigin);

	if (isAllowed) {
		return {
			'Access-Control-Allow-Origin': requestOrigin,
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400' // 24 hours
		};
	}

	return {};
}

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * Handles preflight OPTIONS requests for CORS.
 */
export const OPTIONS = async ({ request }: RequestEvent) => {
	const origin = request.headers.get('Origin');
	const corsHeaders = getCorsHeaders(origin);

	return new Response(null, {
		status: 204,
		headers: corsHeaders
	});
};

/**
 * Handles POST requests to create a Stripe checkout session.
 */
export const POST = async ({ request, platform, url }: RequestEvent) => {
	const origin = request.headers.get('Origin');
	const corsHeaders = getCorsHeaders(origin);

	// Parse request body
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON in request body');
	}

	// Validate request structure
	const validationErrors = validateCheckoutRequest(body);
	if (validationErrors.length > 0) {
		return json(
			{ error: 'Validation failed', details: validationErrors } satisfies CheckoutErrorResponse,
			{ status: 400, headers: corsHeaders }
		);
	}

	const checkoutRequest = body as CheckoutRequest;

	// Get database connection
	let db: ReturnType<typeof getDb>;
	try {
		db = getDb(platform);
	} catch {
		throw error(500, 'Database connection failed');
	}

	// Validate cart items against database
	const dbValidationErrors = await validateCartItemsAgainstDb(db, checkoutRequest.items);
	if (dbValidationErrors.length > 0) {
		return json(
			{
				error: 'Cart validation failed',
				details: dbValidationErrors
			} satisfies CheckoutErrorResponse,
			{ status: 400, headers: corsHeaders }
		);
	}

	// Get Stripe client
	let stripe: ReturnType<typeof getStripe>;
	try {
		stripe = getStripe(platform);
	} catch (e) {
		console.error('Stripe initialization failed:', e);
		throw error(500, 'Payment service unavailable');
	}

	// Build line items
	const lineItems = buildStripeLineItems(
		checkoutRequest.items,
		checkoutRequest.tipCents,
		checkoutRequest.includeGiftBox
	);

	// Build metadata
	const metadata = buildOrderMetadata(checkoutRequest);

	// Create Stripe checkout session
	try {
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items: lineItems,
			customer_email: checkoutRequest.customer.email,
			metadata,
			success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/checkout`,
			// Enable automatic tax calculation if configured
			...(config.order.taxEnabled && {
				automatic_tax: { enabled: true }
			})
		});

		if (!session.url) {
			throw new Error('Stripe session created but no URL returned');
		}

		return json({ url: session.url } satisfies CheckoutResponse, { headers: corsHeaders });
	} catch (e) {
		console.error('Stripe checkout session creation failed:', e);
		throw error(500, 'Failed to create checkout session');
	}
};
