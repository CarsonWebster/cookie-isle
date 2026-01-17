import { redirect, isRedirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

/**
 * Admin Layout Server Load Function
 *
 * Protects all admin routes by validating the session cookie.
 * Redirects to /admin/login if:
 * - No session cookie exists
 * - Session is invalid or expired
 * - Database is unavailable
 *
 * Excludes /admin/login from the auth check to prevent redirect loops.
 */
export const load: LayoutServerLoad = async ({ cookies, platform, url }) => {
	// Skip auth check for login page to prevent redirect loops
	if (url.pathname === '/admin/login') {
		return {};
	}

	const sessionId = cookies.get('admin_session');

	// No session cookie - redirect to login
	if (!sessionId) {
		redirect(303, '/admin/login');
	}

	// Database not available - redirect to login
	// We can't validate the session without the database
	if (!platform?.env?.DB) {
		redirect(303, '/admin/login');
	}

	try {
		const db = getDb(platform);
		const { valid } = await validateSession(db, sessionId);

		if (!valid) {
			// Session is invalid or expired - clear the cookie and redirect
			cookies.delete('admin_session', { path: '/admin' });
			redirect(303, '/admin/login');
		}

		// Session is valid - allow access to admin pages
		return {
			authenticated: true
		};
	} catch (e) {
		// Re-throw redirect errors (SvelteKit uses throw for redirects)
		if (isRedirect(e)) {
			throw e;
		}

		// Database error or other issue - redirect to login for safety
		cookies.delete('admin_session', { path: '/admin' });
		redirect(303, '/admin/login');
	}
};
