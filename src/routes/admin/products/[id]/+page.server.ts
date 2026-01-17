import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params, platform }) => {
	// Get DB connection
	const db = getDb(platform);
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Parse product ID
	const id = parseInt(params.id);
	if (isNaN(id)) {
		throw error(404, 'Product not found');
	}

	// Load product
	const result = await db.select().from(products).where(eq(products.id, id)).limit(1);

	if (result.length === 0) {
		throw error(404, 'Product not found');
	}

	return {
		product: result[0]
	};
};

export const actions: Actions = {
	update: async ({ request, params, platform }) => {
		// Get DB connection
		const db = getDb(platform);
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Parse product ID
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return fail(404, { error: 'Product not found' });
		}

		// Parse form data
		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const slug = formData.get('slug')?.toString().trim();
		const priceStr = formData.get('price')?.toString();
		const stripePriceId = formData.get('stripePriceId')?.toString().trim();
		const description = formData.get('description')?.toString().trim() || null;
		const ingredients = formData.get('ingredients')?.toString().trim() || null;
		const tagsStr = formData.get('tags')?.toString().trim();
		const sortOrderStr = formData.get('sortOrder')?.toString();
		const featured = formData.get('featured') === 'on';
		const active = formData.get('active') === 'on';

		// Validation errors object
		const errors: Record<string, string> = {};

		// Validate required fields
		if (!title) {
			errors.title = 'Product name is required';
		}
		if (!slug) {
			errors.slug = 'URL slug is required';
		} else if (!/^[a-z0-9-]+$/.test(slug)) {
			errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
		}
		if (!priceStr) {
			errors.price = 'Price is required';
		}
		if (!stripePriceId) {
			errors.stripePriceId = 'Stripe Price ID is required';
		}

		// Parse price to cents
		let priceCents: number | null = null;
		if (priceStr) {
			const price = parseFloat(priceStr);
			if (isNaN(price) || price < 0) {
				errors.price = 'Price must be a valid positive number';
			} else {
				priceCents = Math.round(price * 100);
			}
		}

		// Parse sort order
		let sortOrder = 0;
		if (sortOrderStr) {
			const parsed = parseInt(sortOrderStr);
			if (!isNaN(parsed)) {
				sortOrder = parsed;
			}
		}

		// Parse tags (comma-separated to array)
		let tags: string[] | null = null;
		if (tagsStr) {
			tags = tagsStr
				.split(',')
				.map((t: string) => t.trim())
				.filter((t: string) => t.length > 0);
			if (tags && tags.length === 0) {
				tags = null;
			}
		}

		// Return validation errors if any
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		// Check if slug already exists (excluding current product)
		try {
			const existing = await db.select().from(products).where(eq(products.slug, slug!)).limit(1);
			if (existing.length > 0 && existing[0].id !== id) {
				return fail(400, {
					errors: { slug: 'This slug is already in use. Please choose a different one.' }
				});
			}
		} catch (err) {
			console.error('Error checking slug uniqueness:', err);
			return fail(500, { error: 'Failed to check slug uniqueness' });
		}

		// Update product in database
		try {
			await db
				.update(products)
				.set({
					title: title!,
					slug: slug!,
					priceCents: priceCents!,
					stripePriceId: stripePriceId!,
					description,
					ingredients,
					tags,
					featured,
					active,
					sortOrder
				})
				.where(eq(products.id, id));
		} catch (err) {
			console.error('Error updating product:', err);
			return fail(500, { error: 'Failed to update product' });
		}

		// Redirect to products list
		throw redirect(303, '/admin/products');
	},

	delete: async ({ params, platform }) => {
		// Get DB connection
		const db = getDb(platform);
		if (!db) {
			return fail(500, { error: 'Database not available' });
		}

		// Parse product ID
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return fail(404, { error: 'Product not found' });
		}

		// Delete product from database
		try {
			await db.delete(products).where(eq(products.id, id));
		} catch (err) {
			console.error('Error deleting product:', err);
			return fail(500, { error: 'Failed to delete product' });
		}

		// Redirect to products list
		throw redirect(303, '/admin/products');
	}
} satisfies Actions;
