import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { newsletter } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export interface NewsletterSubscriber {
	id: number;
	email: string;
	source: string | null;
	subscribed: boolean | null;
	subscribedAt: string | null;
	unsubscribedAt: string | null;
}

export interface NewsletterPageData {
	subscribers: NewsletterSubscriber[];
	totalCount: number;
	activeCount: number;
}

/**
 * Generate CSV content from subscribers array
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export function _generateCSV(subscribers: NewsletterSubscriber[]): string {
	// CSV header
	const header = 'Email,Source,Subscribed,Subscribed Date,Unsubscribed Date\n';

	// CSV rows
	const rows = subscribers
		.map((sub) => {
			const email = sub.email;
			const source = sub.source || 'website';
			const subscribed = sub.subscribed !== false ? 'Yes' : 'No';
			const subscribedDate = sub.subscribedAt || '';
			const unsubscribedDate = sub.unsubscribedAt || '';

			// Escape quotes in values
			const escapedEmail = email.replace(/"/g, '""');
			const escapedSource = source.replace(/"/g, '""');
			const escapedSubscribedDate = subscribedDate.replace(/"/g, '""');
			const escapedUnsubscribedDate = unsubscribedDate.replace(/"/g, '""');

			return `"${escapedEmail}","${escapedSource}","${subscribed}","${escapedSubscribedDate}","${escapedUnsubscribedDate}"`;
		})
		.join('\n');

	return header + rows;
}

export const load: PageServerLoad = async ({ platform }) => {
	// Handle missing platform/DB
	if (!platform?.env?.DB) {
		return {
			subscribers: [],
			totalCount: 0
		};
	}

	try {
		const db = getDb(platform);

		// Load all subscribers ordered by subscribed_at DESC (most recent first)
		const subscribers = await db
			.select({
				id: newsletter.id,
				email: newsletter.email,
				source: newsletter.source,
				subscribed: newsletter.subscribed,
				subscribedAt: newsletter.subscribedAt,
				unsubscribedAt: newsletter.unsubscribedAt
			})
			.from(newsletter)
			.orderBy(desc(newsletter.subscribedAt));

		// Count active (subscribed) subscribers
		const activeCount = subscribers.filter((s) => s.subscribed !== false).length;

		return {
			subscribers,
			totalCount: subscribers.length,
			activeCount
		};
	} catch (e) {
		// Log error but return empty data
		console.error('Failed to load newsletter subscribers:', e);
		return {
			subscribers: [],
			totalCount: 0,
			activeCount: 0
		};
	}
};
