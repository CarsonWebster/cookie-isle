import { eq, lt } from 'drizzle-orm';
import type { Database } from './db';
import { adminSessions } from './db/schema';

/**
 * Session duration in milliseconds (7 days)
 */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Session duration in days (for documentation)
 */
export const SESSION_DURATION_DAYS = 7;

/**
 * Result of a session validation check
 */
export interface SessionValidationResult {
	valid: boolean;
	sessionId?: string;
	expiresAt?: Date;
}

/**
 * Verifies a password against the ADMIN_PASSWORD environment variable.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param password - The password to verify
 * @param adminPassword - The ADMIN_PASSWORD from environment
 * @returns true if password matches, false otherwise
 */
export function verifyPassword(
	password: string | undefined,
	adminPassword: string | undefined
): boolean {
	if (!password || !adminPassword) {
		return false;
	}

	// Both must be strings and have the same length for constant-time compare
	if (typeof password !== 'string' || typeof adminPassword !== 'string') {
		return false;
	}

	// Constant-time comparison to prevent timing attacks
	// If lengths differ, we still iterate to maintain constant time
	const passwordBytes = new TextEncoder().encode(password);
	const adminPasswordBytes = new TextEncoder().encode(adminPassword);

	// Use the longer length to ensure constant time
	const maxLength = Math.max(passwordBytes.length, adminPasswordBytes.length);

	let result = passwordBytes.length === adminPasswordBytes.length ? 0 : 1;

	for (let i = 0; i < maxLength; i++) {
		const a = passwordBytes[i] ?? 0;
		const b = adminPasswordBytes[i] ?? 0;
		result |= a ^ b;
	}

	return result === 0;
}

/**
 * Generates a cryptographically secure random session ID.
 * Uses Web Crypto API which is available in Cloudflare Workers.
 *
 * @returns A random UUID-like string
 */
export function generateSessionId(): string {
	// Use crypto.randomUUID() if available (modern browsers and Node 19+)
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	// Fallback for environments without randomUUID
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// Format as UUID v4
	bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1

	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Calculates the expiration date for a new session.
 *
 * @param now - The current date (optional, defaults to new Date())
 * @returns The expiration date (7 days from now)
 */
export function calculateExpirationDate(now?: Date): Date {
	const currentDate = now ?? new Date();
	return new Date(currentDate.getTime() + SESSION_DURATION_MS);
}

/**
 * Formats a date as an ISO datetime string for storage.
 *
 * @param date - The date to format
 * @returns ISO 8601 datetime string
 */
export function formatExpirationDate(date: Date): string {
	return date.toISOString();
}

/**
 * Parses an ISO datetime string back to a Date object.
 *
 * @param isoString - The ISO datetime string
 * @returns The parsed Date, or null if invalid
 */
export function parseExpirationDate(isoString: string | null | undefined): Date | null {
	if (!isoString) {
		return null;
	}

	const date = new Date(isoString);
	if (isNaN(date.getTime())) {
		return null;
	}

	return date;
}

/**
 * Checks if a session has expired.
 *
 * @param expiresAt - The expiration date
 * @param now - The current date (optional, defaults to new Date())
 * @returns true if expired, false otherwise
 */
export function isSessionExpired(expiresAt: Date, now?: Date): boolean {
	const currentDate = now ?? new Date();
	return expiresAt.getTime() <= currentDate.getTime();
}

/**
 * Creates a new admin session in the database.
 *
 * @param db - The database instance
 * @param now - The current date (optional, for testing)
 * @returns The created session ID and expiration date
 */
export async function createSession(
	db: Database,
	now?: Date
): Promise<{ sessionId: string; expiresAt: Date }> {
	const sessionId = generateSessionId();
	const expiresAt = calculateExpirationDate(now);
	const expiresAtString = formatExpirationDate(expiresAt);

	await db.insert(adminSessions).values({
		id: sessionId,
		expiresAt: expiresAtString
	});

	return { sessionId, expiresAt };
}

/**
 * Validates a session ID against the database.
 * Returns session info if valid and not expired.
 *
 * @param db - The database instance
 * @param sessionId - The session ID to validate
 * @param now - The current date (optional, for testing)
 * @returns Validation result with session info if valid
 */
export async function validateSession(
	db: Database,
	sessionId: string | undefined,
	now?: Date
): Promise<SessionValidationResult> {
	if (!sessionId) {
		return { valid: false };
	}

	const session = await db
		.select()
		.from(adminSessions)
		.where(eq(adminSessions.id, sessionId))
		.limit(1);

	if (session.length === 0) {
		return { valid: false };
	}

	const expiresAt = parseExpirationDate(session[0].expiresAt);
	if (!expiresAt) {
		return { valid: false };
	}

	if (isSessionExpired(expiresAt, now)) {
		// Optionally clean up expired session
		await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
		return { valid: false };
	}

	return {
		valid: true,
		sessionId,
		expiresAt
	};
}

/**
 * Deletes a session from the database (logout).
 *
 * @param db - The database instance
 * @param sessionId - The session ID to delete
 * @returns true if a session was deleted, false otherwise
 */
export async function deleteSession(db: Database, sessionId: string | undefined): Promise<boolean> {
	if (!sessionId) {
		return false;
	}

	const result = await db.delete(adminSessions).where(eq(adminSessions.id, sessionId)).returning();

	return result.length > 0;
}

/**
 * Cleans up expired sessions from the database.
 * Call this periodically to prevent table bloat.
 *
 * @param db - The database instance
 * @param now - The current date (optional, for testing)
 * @returns The number of expired sessions deleted
 */
export async function cleanupExpiredSessions(db: Database, now?: Date): Promise<number> {
	const currentDate = now ?? new Date();
	const currentDateString = formatExpirationDate(currentDate);

	const result = await db
		.delete(adminSessions)
		.where(lt(adminSessions.expiresAt, currentDateString))
		.returning();

	return result.length;
}

/**
 * Gets the admin password from the platform environment.
 * Throws if ADMIN_PASSWORD is not configured.
 *
 * @param platform - The SvelteKit platform object
 * @returns The ADMIN_PASSWORD value
 * @throws Error if ADMIN_PASSWORD is not set
 */
export function getAdminPassword(platform: App.Platform | undefined): string {
	if (!platform?.env?.ADMIN_PASSWORD) {
		throw new Error(
			'ADMIN_PASSWORD not configured. Set it in .dev.vars for local development or Cloudflare Pages environment variables for production.'
		);
	}
	return platform.env.ADMIN_PASSWORD;
}
