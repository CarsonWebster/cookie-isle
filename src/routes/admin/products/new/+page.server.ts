import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';

export const actions: Actions = {
	default: async ({ request, platform }) => {
		// Get DB connection
		const db = getDb(platform);
		if (!db) {
			return fail(500, { error: 'Database not available' });
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

		// Check if slug already exists
		try {
			const existing = await db.select().from(products).where(eq(products.slug, slug!)).limit(1);
			if (existing.length > 0) {
				return fail(400, {
					errors: { slug: 'This slug is already in use. Please choose a different one.' }
				});
			}
		} catch (error) {
			console.error('Error checking slug uniqueness:', error);
			return fail(500, { error: 'Failed to check slug uniqueness' });
		}

		// Insert product into database
		try {
			await db.insert(products).values({
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
				sortOrder
			});
		} catch (error) {
			console.error('Error creating product:', error);
			return fail(500, { error: 'Failed to create product' });
		}

		// Redirect to products list
		throw redirect(303, '/admin/products');
	}
} satisfies Actions;
