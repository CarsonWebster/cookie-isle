/**
 * Cookie Detail Page Server Load Function
 *
 * Loads a single product by slug from the database.
 * Throws 404 if the product is not found or is inactive.
 *
 * PRD Reference: 2.5.1, 2.5.2
 */

import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { slug } = params;

	// If no database is available (e.g., during build or without CF bindings),
	// throw a 404 error since we can't load the product
	if (!platform?.env?.DB) {
		throw error(404, {
			message: 'Product not found'
		});
	}

	const db = getDb(platform);

	// Query: SELECT * FROM products WHERE slug = ? AND active = 1 LIMIT 1
	const [product] = await db
		.select()
		.from(products)
		.where(and(eq(products.slug, slug), eq(products.active, true)))
		.limit(1);

	// Throw 404 if product not found or inactive
	if (!product) {
		throw error(404, {
			message: 'Product not found'
		});
	}

	return {
		product
	};
};
