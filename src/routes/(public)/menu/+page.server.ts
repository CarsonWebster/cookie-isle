/**
 * Menu Page Server Load Function
 *
 * Loads all active products from the database to display on the menu page.
 *
 * PRD Reference: 2.4.1, 2.4.2
 */

import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	// If no database is available (e.g., during build or without CF bindings),
	// return empty products array
	if (!platform?.env?.DB) {
		return {
			products: []
		};
	}

	const db = getDb(platform);

	// Query: SELECT * FROM products WHERE active = 1 ORDER BY sort_order
	const allProducts = await db
		.select()
		.from(products)
		.where(eq(products.active, true))
		.orderBy(asc(products.sortOrder));

	return {
		products: allProducts
	};
};
