import { desc, eq, or } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getDb } from '$lib/server/db';
import { images, products } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';

/**
 * Image with usage information for the gallery page
 */
export interface GalleryImage {
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

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return { images: [] };
	}

	const db = getDb(platform);

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
	const galleryImages: GalleryImage[] = allImages.map((image) => {
		const usedByProducts: GalleryImage['usedByProducts'] = [];

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

	return { images: galleryImages };
};

export const actions: Actions = {
	delete: async ({ request, platform }) => {
		if (!platform?.env?.DB) {
			return fail(503, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const imageId = formData.get('imageId');

		if (!imageId || typeof imageId !== 'string') {
			return fail(400, { error: 'Image ID is required' });
		}

		const id = parseInt(imageId, 10);
		if (isNaN(id)) {
			return fail(400, { error: 'Invalid image ID' });
		}

		const db = getDb(platform);

		// Find the image
		const [image] = await db.select().from(images).where(eq(images.id, id));

		if (!image) {
			return fail(404, { error: 'Image not found' });
		}

		// Delete from R2
		if (platform.env.IMAGES) {
			try {
				await platform.env.IMAGES.delete(image.filename);
			} catch (e) {
				console.error('Failed to delete from R2:', e);
				// Continue with DB deletion
			}
		}

		// Delete from database
		await db.delete(images).where(eq(images.id, id));

		return { success: true, deletedId: id };
	},

	upload: async ({ request, platform }) => {
		if (!platform?.env?.DB || !platform?.env?.IMAGES) {
			return fail(503, { error: 'Server configuration error' });
		}

		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || !(file instanceof File)) {
			return fail(400, { error: 'No file provided' });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return fail(400, { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' });
		}

		// Validate file size (20MB max)
		const maxSize = 20 * 1024 * 1024;
		if (file.size > maxSize) {
			return fail(400, { error: 'File too large. Maximum size is 20MB.' });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomId = crypto.randomUUID().split('-')[0];
		const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
		const filename = `${timestamp}-${randomId}.${ext}`;
		const url = `/images/${filename}`;

		// Upload to R2
		try {
			const arrayBuffer = await file.arrayBuffer();
			await platform.env.IMAGES.put(filename, arrayBuffer, {
				httpMetadata: { contentType: file.type }
			});
		} catch (e) {
			console.error('R2 upload failed:', e);
			return fail(500, { error: 'Failed to upload image' });
		}

		// Insert into database
		const db = getDb(platform);
		try {
			const [inserted] = await db
				.insert(images)
				.values({
					filename,
					originalName: file.name,
					url,
					mimeType: file.type,
					sizeBytes: file.size
				})
				.returning();

			return { success: true, image: inserted };
		} catch (e) {
			console.error('Database insert failed:', e);
			// Try to clean up R2
			try {
				await platform.env.IMAGES.delete(filename);
			} catch {
				// Ignore cleanup errors
			}
			return fail(500, { error: 'Failed to save image record' });
		}
	}
};
