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
	subscribedAt: text('subscribed_at').default(sql`(datetime('now'))`)
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
