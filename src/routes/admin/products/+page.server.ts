import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { formatPrice } from '$lib/config';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

/**
 * Represents a product for the admin products list
 */
export interface AdminProduct {
	id: number;
	slug: string;
	title: string;
	priceCents: number;
	priceFormatted: string;
	stripePriceId: string;
	description: string | null;
	imageUrl: string | null;
	featured: boolean | null;
	active: boolean | null;
	sortOrder: number | null;
}

/**
 * Query all products from database ordered by sort_order
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export async function _queryProducts(db: ReturnType<typeof getDb>): Promise<AdminProduct[]> {
	const result = await db
		.select()
		.from(products)
		.orderBy(asc(products.sortOrder), asc(products.title))
		.all();

	// Format products for display
	return result.map((product) => ({
		id: product.id,
		slug: product.slug,
		title: product.title,
		priceCents: product.priceCents,
		priceFormatted: formatPrice(product.priceCents),
		stripePriceId: product.stripePriceId,
		description: product.description,
		imageUrl: product.imageUrl,
		featured: product.featured,
		active: product.active,
		sortOrder: product.sortOrder
	}));
}

/**
 * Toggle product active status
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export async function _toggleProductActive(
	db: ReturnType<typeof getDb>,
	productId: number,
	active: boolean
): Promise<boolean> {
	try {
		await db.update(products).set({ active }).where(eq(products.id, productId)).run();
		return true;
	} catch {
		return false;
	}
}

export interface ProductsPageData {
	products: AdminProduct[];
}

export const load: PageServerLoad = async ({ platform }): Promise<ProductsPageData> => {
	// Check platform availability
	if (!platform?.env?.DB) {
		return {
			products: []
		};
	}

	try {
		const db = getDb(platform);
		const productsList = await _queryProducts(db);

		return {
			products: productsList
		};
	} catch (error) {
		console.error('Failed to load products:', error);
		return {
			products: []
		};
	}
};

export const actions: Actions = {
	/**
	 * Toggle product active status
	 */
	toggleActive: async ({ platform, request }) => {
		if (!platform?.env?.DB) {
			return fail(503, { error: 'Database unavailable' });
		}

		try {
			const formData = await request.formData();
			const productId = parseInt(formData.get('productId') as string, 10);
			const active = formData.get('active') === 'true';

			if (isNaN(productId)) {
				return fail(400, { error: 'Invalid product ID' });
			}

			const db = getDb(platform);
			const success = await _toggleProductActive(db, productId, active);

			if (!success) {
				return fail(500, { error: 'Failed to update product status' });
			}

			return { success: true };
		} catch (err) {
			console.error('Failed to toggle product active status:', err);
			return fail(500, { error: 'Failed to update product status' });
		}
	}
};
