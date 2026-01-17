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
		let db;
		try {
			db = getDb(platform);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			return fail(500, {
				error: `Database not available: ${errorMessage}`,
				debugInfo: {
					hasPlatform: !!platform,
					hasEnv: !!platform?.env,
					hasDB: !!platform?.env?.DB
				}
			});
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
		const imageUrl = formData.get('imageUrl')?.toString().trim() || null;
		const heroImageUrl = formData.get('heroImageUrl')?.toString().trim() || null;
		const sortOrderStr = formData.get('sortOrder')?.toString();
		const featured = formData.get('featured') === 'on';
		const active = formData.get('active') === 'on';

		// Debug log the parsed values
		console.log('Parsed form data:', {
			title,
			slug,
			imageUrl,
			heroImageUrl,
			description: description?.substring(0, 50),
			featured,
			active
		});

		// Parse focal point values
		const cardFocalXStr = formData.get('cardFocalX')?.toString();
		const cardFocalYStr = formData.get('cardFocalY')?.toString();
		const heroFocalXStr = formData.get('heroFocalX')?.toString();
		const heroFocalYStr = formData.get('heroFocalY')?.toString();

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

		// Parse focal points (default to 50 if not provided or invalid)
		const cardFocalX = cardFocalXStr ? parseInt(cardFocalXStr) || 50 : 50;
		const cardFocalY = cardFocalYStr ? parseInt(cardFocalYStr) || 50 : 50;
		const heroFocalX = heroFocalXStr ? parseInt(heroFocalXStr) || 50 : 50;
		const heroFocalY = heroFocalYStr ? parseInt(heroFocalYStr) || 50 : 50;

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

		// Verify product exists
		try {
			const currentProduct = await db.select().from(products).where(eq(products.id, id)).limit(1);

			if (currentProduct.length === 0) {
				return fail(404, {
					error: `Product with ID ${id} not found in database`,
					debugInfo: { productId: id }
				});
			}
		} catch (err) {
			console.error('Error checking product existence:', err);
			return fail(500, {
				error: `Failed to verify product exists: ${err instanceof Error ? err.message : 'Unknown error'}`
			});
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
					imageUrl,
					heroImageUrl,
					cardFocalX,
					cardFocalY,
					heroFocalX,
					heroFocalY,
					tags,
					featured,
					active,
					sortOrder,
					updatedAt: new Date().toISOString()
				})
				.where(eq(products.id, id));
		} catch (err) {
			console.error('Error updating product:', err);
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			// Get full error details
			const errorStack = err instanceof Error ? err.stack : undefined;
			const errorCause = err instanceof Error && 'cause' in err ? String(err.cause) : undefined;

			return fail(500, {
				error: `Failed to update product: ${errorMessage}`,
				debugInfo: {
					errorType: err instanceof Error ? err.constructor.name : typeof err,
					errorStack: errorStack?.split('\n').slice(0, 3).join('\n'),
					errorCause,
					hasDB: !!db,
					productId: id,
					valuesAttempted: {
						title,
						slug,
						priceCents,
						imageUrl,
						heroImageUrl,
						tagsType: typeof tags,
						tagsValue: tags
					}
				}
			});
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
