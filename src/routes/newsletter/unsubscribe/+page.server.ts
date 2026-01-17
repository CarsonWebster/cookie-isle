import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { newsletter } from '$lib/server/db/schema';

/**
 * Unsubscribe Page Server
 *
 * Handles newsletter unsubscribe requests.
 * GET: Validates token and shows confirmation page
 * POST: Actually unsubscribes the user
 */

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw error(400, 'Missing unsubscribe token');
	}

	if (!platform?.env?.DB) {
		throw error(503, 'Service unavailable');
	}

	const db = getDb(platform);

	// Find subscriber by token
	const subscriber = await db
		.select({
			id: newsletter.id,
			email: newsletter.email,
			subscribed: newsletter.subscribed
		})
		.from(newsletter)
		.where(eq(newsletter.unsubscribeToken, token))
		.limit(1);

	if (subscriber.length === 0) {
		throw error(404, 'Invalid unsubscribe link');
	}

	const sub = subscriber[0];

	return {
		token,
		email: maskEmail(sub.email),
		alreadyUnsubscribed: !sub.subscribed
	};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const formData = await request.formData();
		const token = formData.get('token')?.toString();

		if (!token) {
			return { success: false, error: 'Missing token' };
		}

		if (!platform?.env?.DB) {
			return { success: false, error: 'Service unavailable' };
		}

		const db = getDb(platform);

		// Find and update subscriber
		const subscriber = await db
			.select({ id: newsletter.id, subscribed: newsletter.subscribed })
			.from(newsletter)
			.where(eq(newsletter.unsubscribeToken, token))
			.limit(1);

		if (subscriber.length === 0) {
			return { success: false, error: 'Invalid unsubscribe link' };
		}

		if (!subscriber[0].subscribed) {
			// Already unsubscribed
			return { success: true, alreadyUnsubscribed: true };
		}

		// Update to unsubscribed
		await db
			.update(newsletter)
			.set({
				subscribed: false,
				unsubscribedAt: new Date().toISOString()
			})
			.where(eq(newsletter.unsubscribeToken, token));

		return { success: true };
	}
};

/**
 * Mask an email address for privacy.
 * Example: "test@example.com" -> "t***@example.com"
 */
function maskEmail(email: string): string {
	const [local, domain] = email.split('@');
	if (!domain) return email;

	const maskedLocal =
		local.length > 2 ? local[0] + '***' + local[local.length - 1] : local[0] + '***';

	return `${maskedLocal}@${domain}`;
}
