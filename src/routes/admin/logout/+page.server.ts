import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { deleteSession } from '$lib/server/auth';

/**
 * Admin logout handler
 * Deletes the session from database and clears the cookie
 */
export const actions: Actions = {
	default: async ({ cookies, platform }) => {
		const sessionId = cookies.get('admin_session');

		// Delete session from database if it exists
		if (sessionId && platform?.env?.DB) {
			try {
				const db = getDb(platform);
				await deleteSession(db, sessionId);
			} catch (error) {
				// Log error but continue with logout
				console.error('Error deleting session:', error);
			}
		}

		// Clear the session cookie
		cookies.delete('admin_session', { path: '/admin' });

		// Redirect to login page
		redirect(303, '/admin/login');
	}
};
