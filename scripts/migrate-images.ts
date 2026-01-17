#!/usr/bin/env bun
/**
 * migrate-images.ts - Migrate legacy images from _legacy/static/ to R2
 *
 * This script:
 * 1. Scans _legacy/static/ for product images
 * 2. Uploads each image to R2 bucket
 * 3. Creates a mapping of product slug to R2 URLs
 * 4. Updates product records in D1 with new image URLs
 *
 * Usage:
 *   bun scripts/migrate-images.ts [--dry-run]
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { products } from '../src/lib/server/db/schema.js';

// Type imports for Cloudflare bindings
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;

// Image mapping: legacy filename -> product data
// Based on legacy Hugo content and seed data
const IMAGE_MAPPING: Record<
	string,
	{
		slug: string;
		imageUrl?: string; // Standard product image
		heroImageUrl?: string; // Hero/detail page image
	}
> = {
	// Chocolate Chip - Multiple images available
	'Cholocatechipsingle.png': {
		slug: 'chocolate-chip',
		imageUrl: 'Cholocatechipsingle.png'
	},
	'Cholocatechipmultiple.png': {
		slug: 'chocolate-chip',
		heroImageUrl: 'Cholocatechipmultiple.png'
	},
	'ChocChipBowl.jpg': {
		slug: 'chocolate-chip'
		// Additional reference image, not used in mapping
	},
	'ChocChipRack.jpg': {
		slug: 'chocolate-chip'
		// Additional reference image, not used in mapping
	},

	// Brownie
	'Brownie.jpg': {
		slug: 'brownie',
		imageUrl: 'Brownie.jpg',
		heroImageUrl: 'Brownie.jpg' // Use same image for both
	},

	// Salted Caramel
	'Saltedcaramelsingle.png': {
		slug: 'salted-caramel',
		imageUrl: 'Saltedcaramelsingle.png'
	},
	'Saltedcaramelmultiple.png': {
		slug: 'salted-caramel',
		heroImageUrl: 'Saltedcaramelmultiple.png'
	}

	// Note: No images for oatmeal-raisin in legacy
};

// MIME type detection
const MIME_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif'
};

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
	const ext = extname(filename).toLowerCase();
	return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Generate unique R2 filename (same logic as upload API)
 */
function generateR2Filename(originalFilename: string): string {
	const timestamp = Date.now();
	const randomId = crypto.randomUUID().split('-')[0];
	const ext = extname(originalFilename);
	const baseName = basename(originalFilename, ext)
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '-');

	return `${baseName}-${timestamp}-${randomId}${ext}`;
}

/**
 * Get public URL for R2 image (via our serving endpoint)
 */
function getPublicImageUrl(filename: string): string {
	// Use relative path - will work in both dev and production
	return `/images/${filename}`;
}

/**
 * Upload image file to R2 bucket
 */
async function uploadImageToR2(
	bucket: R2Bucket,
	filename: string,
	fileData: ArrayBuffer,
	mimeType: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await bucket.put(filename, fileData, {
			httpMetadata: {
				contentType: mimeType
			}
		});

		return { success: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return { success: false, error: message };
	}
}

/**
 * Scan legacy static directory for product images
 */
async function findLegacyImages(): Promise<string[]> {
	const legacyDir = join(process.cwd(), '_legacy', 'static');
	const allFiles = await readdir(legacyDir);

	// Filter to only mapped images (ignore favicon, logo, etc.)
	const imageFiles = allFiles.filter((file) => file in IMAGE_MAPPING);

	return imageFiles;
}

/**
 * Process and upload a single image
 */
async function processImage(
	bucket: R2Bucket,
	filename: string,
	dryRun: boolean
): Promise<{
	success: boolean;
	originalFilename: string;
	r2Filename?: string;
	publicUrl?: string;
	error?: string;
}> {
	const legacyPath = join(process.cwd(), '_legacy', 'static', filename);
	const mimeType = getMimeType(filename);
	const r2Filename = generateR2Filename(filename);

	console.log(`  Processing: ${filename}`);
	console.log(`    Legacy path: ${legacyPath}`);
	console.log(`    R2 filename: ${r2Filename}`);
	console.log(`    MIME type: ${mimeType}`);

	if (dryRun) {
		console.log('    [DRY RUN] Skipping upload');
		return {
			success: true,
			originalFilename: filename,
			r2Filename,
			publicUrl: getPublicImageUrl(r2Filename)
		};
	}

	// Read file
	let fileData: ArrayBuffer;
	try {
		const buffer = await readFile(legacyPath);
		fileData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			originalFilename: filename,
			error: `Failed to read file: ${message}`
		};
	}

	// Upload to R2
	const result = await uploadImageToR2(bucket, r2Filename, fileData, mimeType);

	if (!result.success) {
		return {
			success: false,
			originalFilename: filename,
			error: result.error
		};
	}

	const publicUrl = getPublicImageUrl(r2Filename);
	console.log(`    ✓ Uploaded to R2: ${publicUrl}`);

	return {
		success: true,
		originalFilename: filename,
		r2Filename,
		publicUrl
	};
}

/**
 * Update product records with new image URLs
 */
async function updateProductRecords(
	db: ReturnType<typeof drizzle>,
	uploadResults: Array<{
		success: boolean;
		originalFilename: string;
		publicUrl?: string;
	}>,
	dryRun: boolean
): Promise<void> {
	console.log('\n=== Updating Product Records ===\n');

	// Group uploads by product slug
	const productUpdates: Record<string, { imageUrl?: string; heroImageUrl?: string }> = {};

	for (const result of uploadResults) {
		if (!result.success || !result.publicUrl) continue;

		const mapping = IMAGE_MAPPING[result.originalFilename];
		if (!mapping) continue;

		const { slug, imageUrl, heroImageUrl } = mapping;

		if (!productUpdates[slug]) {
			productUpdates[slug] = {};
		}

		// Assign URL based on mapping type
		if (imageUrl && result.originalFilename === imageUrl) {
			productUpdates[slug].imageUrl = result.publicUrl;
		}
		if (heroImageUrl && result.originalFilename === heroImageUrl) {
			productUpdates[slug].heroImageUrl = result.publicUrl;
		}
	}

	// Update each product
	for (const [slug, urls] of Object.entries(productUpdates)) {
		console.log(`Product: ${slug}`);
		if (urls.imageUrl) {
			console.log(`  image_url: ${urls.imageUrl}`);
		}
		if (urls.heroImageUrl) {
			console.log(`  hero_image_url: ${urls.heroImageUrl}`);
		}

		if (dryRun) {
			console.log('  [DRY RUN] Skipping database update');
			continue;
		}

		try {
			await db
				.update(products)
				.set({
					imageUrl: urls.imageUrl || null,
					heroImageUrl: urls.heroImageUrl || null
				})
				.where(eq(products.slug, slug));

			console.log('  ✓ Updated in database');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`  ✗ Failed to update: ${message}`);
		}
	}
}

/**
 * Main migration function
 */
async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');

	console.log('=== Cookie Isle Image Migration ===\n');

	if (dryRun) {
		console.log('[DRY RUN MODE] No changes will be made\n');
	}

	// Get platform from Bun
	// Note: This script should be run with wrangler or in a context where platform is available
	// For development, we'll use the local D1 database
	const platform = (globalThis as any).platform;

	if (!platform?.env) {
		console.error('Error: Platform environment not available');
		console.error(
			'This script must be run with: bunx wrangler pages dev --script=scripts/migrate-images.ts'
		);
		process.exit(1);
	}

	const { DB, IMAGES } = platform.env;

	if (!DB) {
		console.error('Error: D1 database binding not found');
		process.exit(1);
	}

	if (!IMAGES) {
		console.error('Error: R2 bucket binding not found');
		process.exit(1);
	}

	const db = drizzle(DB);

	// Find legacy images
	console.log('=== Scanning Legacy Images ===\n');
	const imageFiles = await findLegacyImages();

	console.log(`Found ${imageFiles.length} product images to migrate:\n`);
	imageFiles.forEach((file) => {
		const mapping = IMAGE_MAPPING[file];
		console.log(`  - ${file} → ${mapping.slug}`);
	});

	if (imageFiles.length === 0) {
		console.log('\nNo images to migrate. Exiting.');
		return;
	}

	// Upload images
	console.log('\n=== Uploading Images to R2 ===\n');
	const uploadResults: Array<{
		success: boolean;
		originalFilename: string;
		r2Filename?: string;
		publicUrl?: string;
		error?: string;
	}> = [];

	for (const filename of imageFiles) {
		const result = await processImage(IMAGES, filename, dryRun);
		uploadResults.push(result);

		if (!result.success) {
			console.error(`  ✗ Failed: ${result.error}`);
		}
	}

	// Summary
	const successful = uploadResults.filter((r) => r.success).length;
	const failed = uploadResults.filter((r) => !r.success).length;

	console.log('\n=== Upload Summary ===\n');
	console.log(`  Successful: ${successful}`);
	console.log(`  Failed: ${failed}`);

	if (failed > 0) {
		console.error('\nSome uploads failed. Fix errors and re-run.');
		process.exit(1);
	}

	// Update database
	await updateProductRecords(db, uploadResults, dryRun);

	console.log('\n=== Migration Complete ===\n');

	if (dryRun) {
		console.log('Run without --dry-run to apply changes.');
	} else {
		console.log('All images migrated successfully!');
	}
}

// Run if called directly
if (import.meta.main) {
	main().catch((error) => {
		console.error('Migration failed:', error);
		process.exit(1);
	});
}

// Export for testing
export {
	IMAGE_MAPPING,
	getMimeType,
	generateR2Filename,
	getPublicImageUrl,
	uploadImageToR2,
	findLegacyImages,
	processImage,
	updateProductRecords
};
