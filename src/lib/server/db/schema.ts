import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
