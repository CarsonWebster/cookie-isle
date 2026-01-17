import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { verifyPassword, createSession, getAdminPassword, validateSession } from '$lib/server/auth';

/**
 * Admin Login Page Server Load Function
 *
 * Checks if user is already logged in - redirects to admin dashboard if so.
 */
export const load: PageServerLoad = async ({ cookies, platform }) => {
	const sessionId = cookies.get('admin_session');

	// If user has a session cookie, check if it's valid
	if (sessionId && platform?.env?.DB) {
		try {
			const db = getDb(platform);
			const { valid } = await validateSession(db, sessionId);

			if (valid) {
				// Already logged in, redirect to admin dashboard
				redirect(303, '/admin');
			}
		} catch (e) {
			// Re-throw redirect errors (SvelteKit uses throw for redirects)
			if (isRedirect(e)) {
				throw e;
			}
			// Session validation failed, continue to login page
		}
	}

	return {};
};

/**
 * Form action result type
 */
export interface LoginActionResult {
	error?: string;
}

/**
 * Admin Login Form Actions
 */
export const actions: Actions = {
	default: async ({ request, cookies, platform }) => {
		const formData = await request.formData();
		const password = formData.get('password');

		// Validate password field is present
		if (!password || typeof password !== 'string') {
			return fail(400, { error: 'Password is required' } satisfies LoginActionResult);
		}

		// Validate password is not empty
		if (password.trim().length === 0) {
			return fail(400, { error: 'Password is required' } satisfies LoginActionResult);
		}

		// Check if platform and env are available
		if (!platform?.env) {
			return fail(503, {
				error: 'Server configuration error. Please try again later.'
			} satisfies LoginActionResult);
		}

		// Get the admin password from environment
		let adminPassword: string;
		try {
			adminPassword = getAdminPassword(platform);
		} catch {
			return fail(503, {
				error: 'Server configuration error. Please try again later.'
			} satisfies LoginActionResult);
		}

		// Verify the password
		if (!verifyPassword(password, adminPassword)) {
			return fail(401, { error: 'Invalid password' } satisfies LoginActionResult);
		}

		// Check if database is available
		if (!platform.env.DB) {
			return fail(503, {
				error: 'Database unavailable. Please try again later.'
			} satisfies LoginActionResult);
		}

		// Create a new session
		try {
			const db = getDb(platform);
			const { sessionId, expiresAt } = await createSession(db);

			// Set the session cookie
			cookies.set('admin_session', sessionId, {
				path: '/admin',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				expires: expiresAt
			});

			// Redirect to admin dashboard
			redirect(303, '/admin');
		} catch (e) {
			// Re-throw redirect errors (SvelteKit uses throw for redirects)
			if (isRedirect(e)) {
				throw e;
			}
			return fail(500, {
				error: 'Failed to create session. Please try again.'
			} satisfies LoginActionResult);
		}
	}
};
