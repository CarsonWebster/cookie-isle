/**
 * Homepage Server Load Function
 *
 * Loads featured products from the database to display on the homepage.
 *
 * PRD Reference: 2.2.1, 2.2.2
 */

import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	// If no database is available (e.g., during build or without CF bindings),
	// return empty featured products array
	if (!platform?.env?.DB) {
		return {
			featuredProducts: []
		};
	}

	const db = getDb(platform);

	// Query: SELECT * FROM products WHERE featured = 1 AND active = 1 ORDER BY sort_order
	const featuredProducts = await db
		.select()
		.from(products)
		.where(and(eq(products.featured, true), eq(products.active, true)))
		.orderBy(asc(products.sortOrder));

	return {
		featuredProducts
	};
};
