import { json, error, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { newsletter } from '$lib/server/db/schema';
import { config } from '$lib/config';

// ============================================================================
// Types
// ============================================================================

/** Newsletter signup request body */
export interface NewsletterRequest {
	email: string;
	source?: string;
}

/** Newsletter signup response */
export interface NewsletterResponse {
	success: boolean;
	message: string;
	alreadySubscribed?: boolean;
}

/** Error response */
export interface NewsletterErrorResponse {
	success: false;
	error: string;
	details?: string[];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Simple regex for basic email validation.
 * Checks for: something@something.something
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format.
 * @param email - The email to validate
 * @returns true if email format is valid
 */
export function _isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') {
		return false;
	}
	const trimmed = email.trim();
	if (trimmed.length < 5 || trimmed.length > 254) {
		return false;
	}
	return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates the newsletter signup request body.
 * Returns an array of error messages, or empty array if valid.
 */
export function _validateNewsletterRequest(body: unknown): string[] {
	const errors: string[] = [];

	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return ['Request body must be a valid JSON object'];
	}

	const req = body as Record<string, unknown>;

	// Validate email
	if (!req.email) {
		errors.push('Email is required');
	} else if (typeof req.email !== 'string') {
		errors.push('Email must be a string');
	} else if (!_isValidEmail(req.email)) {
		errors.push('Invalid email format');
	}

	// Validate source (optional)
	if (req.source !== undefined && typeof req.source !== 'string') {
		errors.push('Source must be a string');
	}

	return errors;
}

/**
 * Normalizes an email address for storage and comparison.
 * - Trims whitespace
 * - Converts to lowercase
 */
export function _normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST({ request, platform }: RequestEvent): Promise<Response> {
	// Check if newsletter is enabled
	if (!config.newsletter.enabled) {
		throw error(503, 'Newsletter signup is currently disabled');
	}

	// Parse request body
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json(
			{
				success: false,
				error: 'Invalid JSON in request body'
			} satisfies NewsletterErrorResponse,
			{ status: 400 }
		);
	}

	// Validate request
	const validationErrors = _validateNewsletterRequest(body);
	if (validationErrors.length > 0) {
		return json(
			{
				success: false,
				error: 'Validation failed',
				details: validationErrors
			} satisfies NewsletterErrorResponse,
			{ status: 400 }
		);
	}

	const req = body as NewsletterRequest;
	const email = _normalizeEmail(req.email);
	const source = req.source || 'website';

	// Check for database availability
	if (!platform?.env?.DB) {
		console.error('[Newsletter] Database not available');
		return json(
			{
				success: false,
				error: config.newsletter.errorMessage
			} satisfies NewsletterErrorResponse,
			{ status: 503 }
		);
	}

	try {
		const db = getDb(platform);

		// Check if email already exists
		const existing = await db.select().from(newsletter).where(eq(newsletter.email, email)).limit(1);

		if (existing.length > 0) {
			// Already subscribed - still return success (don't reveal if email exists)
			return json({
				success: true,
				message: config.newsletter.successMessage,
				alreadySubscribed: true
			} satisfies NewsletterResponse);
		}

		// Insert new subscriber
		await db.insert(newsletter).values({
			email,
			source
		});

		return json({
			success: true,
			message: config.newsletter.successMessage,
			alreadySubscribed: false
		} satisfies NewsletterResponse);
	} catch (err) {
		console.error('[Newsletter] Database error:', err);
		return json(
			{
				success: false,
				error: config.newsletter.errorMessage
			} satisfies NewsletterErrorResponse,
			{ status: 500 }
		);
	}
}
