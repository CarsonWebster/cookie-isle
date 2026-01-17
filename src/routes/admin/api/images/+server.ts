import { json, error, type RequestHandler } from '@sveltejs/kit';
import { desc, eq, or } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { images, products } from '$lib/server/db/schema';

/**
 * Image with usage information
 */
export interface ImageWithUsage {
	id: number;
	filename: string;
	originalName: string;
	url: string;
	mimeType: string;
	sizeBytes: number;
	cardFocalX: number | null;
	cardFocalY: number | null;
	heroFocalX: number | null;
	heroFocalY: number | null;
	createdAt: string | null;
	usedByProducts: { id: number; title: string; usageType: 'card' | 'hero' }[];
}

/**
 * GET /admin/api/images - Fetch all images with usage information
 * Requires admin authentication via session cookie
 */
export const GET: RequestHandler = async ({ cookies, platform }) => {
	// Check platform availability
	if (!platform?.env) {
		throw error(503, 'Server configuration error');
	}

	// Validate admin session
	const sessionId = cookies.get('admin_session');

	if (!sessionId) {
		throw error(401, 'Authentication required');
	}

	// Validate session with database
	const db = getDb(platform);
	try {
		const { valid } = await validateSession(db, sessionId);

		if (!valid) {
			throw error(401, 'Invalid or expired session');
		}
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to validate session');
	}

	// Fetch all images ordered by creation date (newest first)
	const allImages = await db.select().from(images).orderBy(desc(images.createdAt));

	// Fetch all products to check which images are in use
	const allProducts = await db
		.select({
			id: products.id,
			title: products.title,
			imageUrl: products.imageUrl,
			heroImageUrl: products.heroImageUrl
		})
		.from(products);

	// Build image list with usage information
	const imagesWithUsage: ImageWithUsage[] = allImages.map((image) => {
		const usedByProducts: ImageWithUsage['usedByProducts'] = [];

		for (const product of allProducts) {
			if (product.imageUrl === image.url) {
				usedByProducts.push({ id: product.id, title: product.title, usageType: 'card' });
			}
			if (product.heroImageUrl === image.url) {
				usedByProducts.push({ id: product.id, title: product.title, usageType: 'hero' });
			}
		}

		return {
			id: image.id,
			filename: image.filename,
			originalName: image.originalName,
			url: image.url,
			mimeType: image.mimeType,
			sizeBytes: image.sizeBytes,
			cardFocalX: image.cardFocalX,
			cardFocalY: image.cardFocalY,
			heroFocalX: image.heroFocalX,
			heroFocalY: image.heroFocalY,
			createdAt: image.createdAt,
			usedByProducts
		};
	});

	return json({
		success: true,
		images: imagesWithUsage
	});
};

/**
 * DELETE /admin/api/images - Delete an image from R2 and database
 * Requires admin authentication via session cookie
 * Request body: { id: number }
 */
export const DELETE: RequestHandler = async ({ request, cookies, platform }) => {
	// Check platform availability
	if (!platform?.env) {
		throw error(503, 'Server configuration error');
	}

	// Validate admin session
	const sessionId = cookies.get('admin_session');

	if (!sessionId) {
		throw error(401, 'Authentication required');
	}

	// Validate session with database
	const db = getDb(platform);
	try {
		const { valid } = await validateSession(db, sessionId);

		if (!valid) {
			throw error(401, 'Invalid or expired session');
		}
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to validate session');
	}

	// Parse request body
	let body: { id: number };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	if (!body.id || typeof body.id !== 'number') {
		throw error(400, 'Image ID is required');
	}

	// Find the image in database
	const [image] = await db.select().from(images).where(eq(images.id, body.id));

	if (!image) {
		throw error(404, 'Image not found');
	}

	// Check if image is used by any products
	const productsUsingImage = await db
		.select({ id: products.id, title: products.title })
		.from(products)
		.where(or(eq(products.imageUrl, image.url), eq(products.heroImageUrl, image.url)));

	// Delete from R2
	if (platform.env.IMAGES) {
		try {
			await platform.env.IMAGES.delete(image.filename);
		} catch (e) {
			console.error('Failed to delete image from R2:', e);
			// Continue with database deletion even if R2 deletion fails
		}
	}

	// Delete from database
	await db.delete(images).where(eq(images.id, body.id));

	return json({
		success: true,
		deletedId: body.id,
		wasInUse: productsUsingImage.length > 0,
		productsAffected: productsUsingImage
	});
};

/**
 * PATCH /admin/api/images - Update image focal points
 * Requires admin authentication via session cookie
 * Request body: { id: number, cardFocalX?: number, cardFocalY?: number, heroFocalX?: number, heroFocalY?: number }
 */
export const PATCH: RequestHandler = async ({ request, cookies, platform }) => {
	// Check platform availability
	if (!platform?.env) {
		throw error(503, 'Server configuration error');
	}

	// Validate admin session
	const sessionId = cookies.get('admin_session');

	if (!sessionId) {
		throw error(401, 'Authentication required');
	}

	// Validate session with database
	const db = getDb(platform);
	try {
		const { valid } = await validateSession(db, sessionId);

		if (!valid) {
			throw error(401, 'Invalid or expired session');
		}
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to validate session');
	}

	// Parse request body
	let body: {
		id: number;
		cardFocalX?: number;
		cardFocalY?: number;
		heroFocalX?: number;
		heroFocalY?: number;
	};
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	if (!body.id || typeof body.id !== 'number') {
		throw error(400, 'Image ID is required');
	}

	// Validate focal point values are within 0-100 range
	const focalPoints = ['cardFocalX', 'cardFocalY', 'heroFocalX', 'heroFocalY'] as const;
	for (const key of focalPoints) {
		if (body[key] !== undefined) {
			if (typeof body[key] !== 'number' || body[key]! < 0 || body[key]! > 100) {
				throw error(400, `${key} must be a number between 0 and 100`);
			}
		}
	}

	// Find the image in database
	const [image] = await db.select().from(images).where(eq(images.id, body.id));

	if (!image) {
		throw error(404, 'Image not found');
	}

	// Build update object with only provided values
	const updateData: Partial<{
		cardFocalX: number;
		cardFocalY: number;
		heroFocalX: number;
		heroFocalY: number;
	}> = {};

	if (body.cardFocalX !== undefined) updateData.cardFocalX = body.cardFocalX;
	if (body.cardFocalY !== undefined) updateData.cardFocalY = body.cardFocalY;
	if (body.heroFocalX !== undefined) updateData.heroFocalX = body.heroFocalX;
	if (body.heroFocalY !== undefined) updateData.heroFocalY = body.heroFocalY;

	if (Object.keys(updateData).length === 0) {
		throw error(400, 'No focal point values provided');
	}

	// Update the image
	const [updated] = await db
		.update(images)
		.set(updateData)
		.where(eq(images.id, body.id))
		.returning();

	return json({
		success: true,
		image: updated
	});
};
