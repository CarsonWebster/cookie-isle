import { error, type RequestHandler } from '@sveltejs/kit';

/**
 * GET /images/[...path]
 *
 * Serves images from Cloudflare R2 bucket.
 * Images are cached for 1 year (immutable files with timestamp in name).
 *
 * @example
 * GET /images/1234567890-abc123.jpg
 * GET /images/products/cookie.png
 */
export const GET: RequestHandler = async ({ params, platform }) => {
	// Check if platform is available (required for R2 access)
	if (!platform?.env.IMAGES) {
		throw error(503, 'Image storage not available');
	}

	// Rest parameter is available as 'path' from [...path] directory name
	// Type assertion needed since SvelteKit infers params from all routes
	const path = (params as { path: string }).path;

	// Validate path exists
	if (!path) {
		throw error(400, 'Image path is required');
	}

	// Fetch image from R2
	const object = await platform.env.IMAGES.get(path);

	// Return 404 if image not found
	if (!object) {
		throw error(404, 'Image not found');
	}

	// Get image body as ArrayBuffer
	const body = await object.arrayBuffer();

	// Determine Content-Type from R2 metadata or file extension
	const contentType = object.httpMetadata?.contentType || getContentType(path);

	// Return image with caching headers
	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': contentType,
			// Cache for 1 year (images have timestamps, so they're immutable)
			'Cache-Control': 'public, max-age=31536000, immutable',
			// Add Content-Length for better performance
			'Content-Length': body.byteLength.toString(),
			// Set ETag from R2 object (if available)
			...(object.httpEtag && { ETag: object.httpEtag })
		}
	});
};

/**
 * Determine Content-Type from file extension
 */
function getContentType(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase();

	switch (ext) {
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'webp':
			return 'image/webp';
		case 'gif':
			return 'image/gif';
		case 'svg':
			return 'image/svg+xml';
		case 'avif':
			return 'image/avif';
		default:
			return 'application/octet-stream';
	}
}
