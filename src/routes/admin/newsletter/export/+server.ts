import { error, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { newsletter } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { _generateCSV } from '../+page.server';

/**
 * GET handler for CSV export of newsletter subscribers
 * Returns a downloadable CSV file
 */
export const GET: RequestHandler = async ({ platform, cookies }) => {
	// Verify admin session (same check as layout.server.ts)
	const sessionId = cookies.get('admin_session');
	if (!sessionId) {
		throw error(401, 'Unauthorized');
	}

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
				firstName: newsletter.firstName,
				source: newsletter.source,
				subscribed: newsletter.subscribed,
				subscribedAt: newsletter.subscribedAt,
				unsubscribedAt: newsletter.unsubscribedAt
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
};
