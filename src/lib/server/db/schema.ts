import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Type definitions for JSON columns
export interface OrderItem {
	productId: number;
	slug: string;
	title: string;
	priceCents: number;
	quantity: number;
}

export interface DeliveryAddress {
	street: string;
	apt?: string;
	city: string;
	state: string;
	zip: string;
}

// Products table
export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	priceCents: integer('price_cents').notNull(),
	stripePriceId: text('stripe_price_id').notNull(),
	description: text('description'),
	ingredients: text('ingredients'),
	imageUrl: text('image_url'),
	heroImageUrl: text('hero_image_url'),
	// Focal points for image cropping (stored as percentages 0-100)
	cardFocalX: integer('card_focal_x').default(50), // X position for card (square) crop
	cardFocalY: integer('card_focal_y').default(50), // Y position for card (square) crop
	heroFocalX: integer('hero_focal_x').default(50), // X position for detail page (3:2) crop
	heroFocalY: integer('hero_focal_y').default(50), // Y position for detail page (3:2) crop
	tags: text('tags', { mode: 'json' }).$type<string[]>(),
	featured: integer('featured', { mode: 'boolean' }).default(false),
	active: integer('active', { mode: 'boolean' }).default(true),
	sortOrder: integer('sort_order').default(0),
	createdAt: text('created_at').default(sql`(datetime('now'))`),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`)
});

// Orders table
export const orders = sqliteTable('orders', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	stripeSessionId: text('stripe_session_id').unique(),
	status: text('status').default('pending'), // pending, paid, fulfilled, cancelled
	customerName: text('customer_name'),
	customerEmail: text('customer_email'),
	customerPhone: text('customer_phone'),
	fulfillmentType: text('fulfillment_type'), // pickup, delivery
	fulfillmentDate: text('fulfillment_date'),
	fulfillmentTime: text('fulfillment_time'),
	deliveryAddress: text('delivery_address', { mode: 'json' }).$type<DeliveryAddress | null>(),
	items: text('items', { mode: 'json' }).notNull().$type<OrderItem[]>(),
	subtotalCents: integer('subtotal_cents'),
	tipCents: integer('tip_cents').default(0),
	giftBox: integer('gift_box', { mode: 'boolean' }).default(false),
	giftMessage: text('gift_message'),
	taxCents: integer('tax_cents').default(0),
	totalCents: integer('total_cents'),
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});

// Newsletter subscribers table
export const newsletter = sqliteTable('newsletter', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	source: text('source').default('website'),
	subscribed: integer('subscribed', { mode: 'boolean' }).default(true),
	unsubscribeToken: text('unsubscribe_token').notNull().unique(),
	subscribedAt: text('subscribed_at').default(sql`(datetime('now'))`),
	unsubscribedAt: text('unsubscribed_at')
});

// Fulfillment slots table
export const fulfillmentSlots = sqliteTable('fulfillment_slots', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull(), // YYYY-MM-DD format
	startTime: text('start_time').notNull(), // HH:MM format
	endTime: text('end_time').notNull(), // HH:MM format
	slotType: text('slot_type').default('both'), // pickup, delivery, both
	maxCookies: integer('max_cookies').default(200),
	active: integer('active', { mode: 'boolean' }).default(true)
});

// Daily capacity tracking table
export const dailyCapacity = sqliteTable('daily_capacity', {
	date: text('date').primaryKey(), // YYYY-MM-DD format
	cookiesOrdered: integer('cookies_ordered').default(0),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`)
});

// Admin sessions table
export const adminSessions = sqliteTable('admin_sessions', {
	id: text('id').primaryKey(), // Random UUID
	expiresAt: text('expires_at').notNull(), // ISO datetime
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});

// Images table - tracks uploaded images in R2
export const images = sqliteTable('images', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	filename: text('filename').notNull().unique(), // R2 filename (e.g., 1705445678901-a3f9d2e1.jpg)
	originalName: text('original_name').notNull(), // Original filename uploaded by user
	url: text('url').notNull(), // Full URL path (/images/{filename})
	mimeType: text('mime_type').notNull(), // image/jpeg, image/png, image/webp
	sizeBytes: integer('size_bytes').notNull(), // File size in bytes
	// Focal points for cropping preview (stored as percentages 0-100)
	cardFocalX: integer('card_focal_x').default(50), // X position for card (square) crop
	cardFocalY: integer('card_focal_y').default(50), // Y position for card (square) crop
	heroFocalX: integer('hero_focal_x').default(50), // X position for hero (wide) crop
	heroFocalY: integer('hero_focal_y').default(50), // Y position for hero (wide) crop
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});
