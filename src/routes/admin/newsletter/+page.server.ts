import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { newsletter } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export interface NewsletterSubscriber {
	id: number;
	email: string;
	source: string | null;
	subscribedAt: string | null;
}

export interface NewsletterPageData {
	subscribers: NewsletterSubscriber[];
	totalCount: number;
}

/**
 * Generate CSV content from subscribers array
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export function _generateCSV(subscribers: NewsletterSubscriber[]): string {
	// CSV header
	const header = 'Email,Source,Subscribed Date\n';

	// CSV rows
	const rows = subscribers
		.map((sub) => {
			const email = sub.email;
			const source = sub.source || 'website';
			const date = sub.subscribedAt || '';

			// Escape quotes in values
			const escapedEmail = email.replace(/"/g, '""');
			const escapedSource = source.replace(/"/g, '""');
			const escapedDate = date.replace(/"/g, '""');

			return `"${escapedEmail}","${escapedSource}","${escapedDate}"`;
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
				subscribedAt: newsletter.subscribedAt
			})
			.from(newsletter)
			.orderBy(desc(newsletter.subscribedAt));

		return {
			subscribers,
			totalCount: subscribers.length
		};
	} catch (e) {
		// Log error but return empty data
		console.error('Failed to load newsletter subscribers:', e);
		return {
			subscribers: [],
			totalCount: 0
		};
	}
};

export const actions: Actions = {
	// Export CSV action
	export: async ({ platform }) => {
		// Handle missing platform/DB
		if (!platform?.env?.DB) {
			throw error(503, 'Database unavailable');
		}

		try {
			const db = getDb(platform);

			// Load all subscribers
			const subscribers = await db
				.select({
					id: newsletter.id,
					email: newsletter.email,
					source: newsletter.source,
					subscribedAt: newsletter.subscribedAt
				})
				.from(newsletter)
				.orderBy(desc(newsletter.subscribedAt));

			// Generate CSV
			const csv = _generateCSV(subscribers);

			// Return CSV response with proper headers
			return new Response(csv, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`
				}
			});
		} catch (e) {
			console.error('Failed to export newsletter subscribers:', e);
			throw error(500, 'Failed to export subscribers');
		}
	}
};
