import { json, error, type RequestHandler } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';

// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Max file size: 5MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// File extension mapping
const MIME_TO_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

/**
 * Validates file type against allowed MIME types
 */
export function validateFileType(mimeType: string): boolean {
	return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validates file size against maximum allowed size
 */
export function validateFileSize(size: number): boolean {
	return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Gets file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string | null {
	return MIME_TO_EXT[mimeType] || null;
}

/**
 * Generates unique filename: {timestamp}-{random}.{ext}
 * Example: 1705445678901-a3f9d2e1.jpg
 */
export function generateUniqueFilename(mimeType: string): string {
	const timestamp = Date.now();
	const randomId = crypto.randomUUID().split('-')[0]; // Use first segment of UUID
	const ext = getExtensionFromMimeType(mimeType);

	if (!ext) {
		throw new Error('Invalid MIME type for filename generation');
	}

	return `${timestamp}-${randomId}.${ext}`;
}

/**
 * Parses multipart form data and extracts the file
 */
export async function parseMultipartFormData(
	request: Request
): Promise<{ file: File | null; error: string | null }> {
	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file) {
			return { file: null, error: 'No file provided' };
		}

		if (!(file instanceof File)) {
			return { file: null, error: 'Invalid file data' };
		}

		return { file, error: null };
	} catch (e) {
		return { file: null, error: 'Failed to parse form data' };
	}
}

/**
 * Uploads file to R2 bucket
 */
export async function uploadToR2(
	bucket: R2Bucket,
	filename: string,
	file: File
): Promise<{ success: boolean; error: string | null }> {
	try {
		const arrayBuffer = await file.arrayBuffer();

		await bucket.put(filename, arrayBuffer, {
			httpMetadata: {
				contentType: file.type
			}
		});

		return { success: true, error: null };
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		return { success: false, error: `R2 upload failed: ${errorMessage}` };
	}
}

/**
 * Constructs public URL for uploaded image
 * Uses the /images/[...path] endpoint to serve images from R2
 */
export function getPublicImageUrl(filename: string): string {
	return `/images/${filename}`;
}

/**
 * POST /api/upload - Upload image to R2
 * Requires admin authentication via session cookie
 */
export const POST: RequestHandler = async ({ request, cookies, platform }) => {
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
	try {
		const db = getDb(platform);
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

	// Check R2 bucket availability
	if (!platform.env.IMAGES) {
		throw error(503, 'Image storage not configured');
	}

	// Parse multipart form data
	const { file, error: parseError } = await parseMultipartFormData(request);

	if (parseError || !file) {
		throw error(400, parseError || 'No file provided');
	}

	// Validate file type
	if (!validateFileType(file.type)) {
		throw error(400, `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
	}

	// Validate file size
	if (!validateFileSize(file.size)) {
		throw error(400, `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
	}

	// Generate unique filename
	const filename = generateUniqueFilename(file.type);

	// Upload to R2
	const { success, error: uploadError } = await uploadToR2(platform.env.IMAGES, filename, file);

	if (!success) {
		throw error(500, uploadError || 'Failed to upload image');
	}

	// Return public URL
	const url = getPublicImageUrl(filename);

	return json({
		success: true,
		url,
		filename
	});
};
