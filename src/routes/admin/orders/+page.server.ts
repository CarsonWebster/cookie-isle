import { getDb } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { formatPrice } from '$lib/config';
import { desc, eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { OrderItem } from '$lib/server/db/schema';

/**
 * Represents a formatted order for the admin orders list
 */
export interface AdminOrder {
	id: number;
	customerName: string | null;
	customerEmail: string | null;
	itemsSummary: string;
	totalCents: number | null;
	totalFormatted: string;
	status: string | null;
	fulfillmentDate: string | null;
	fulfillmentType: string | null;
	createdAt: string | null;
	createdAtFormatted: string;
}

/**
 * Get today's date in YYYY-MM-DD format
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export function _getTodayDate(now: Date = new Date()): string {
	return now.toISOString().split('T')[0];
}

/**
 * Format order items into a short summary string
 * Example: "2x Chocolate Chip, 1x Brownie" or "3 items"
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export function _formatItemsSummary(items: OrderItem[]): string {
	if (!items || items.length === 0) {
		return 'No items';
	}

	// If 2 or fewer items, show full details
	if (items.length <= 2) {
		return items.map((item) => `${item.quantity}x ${item.title}`).join(', ');
	}

	// Otherwise just show total count
	const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
	return `${totalCount} items`;
}

/**
 * Format ISO datetime string to readable format
 * Example: "Jan 16, 3:30 PM"
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export function _formatDateTime(isoString: string | null): string {
	if (!isoString) return 'N/A';

	try {
		const date = new Date(isoString);
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	} catch {
		return 'Invalid Date';
	}
}

/**
 * Query orders from database with optional filters
 * Prefixed with _ to allow export from +page.server.ts for testing
 */
export async function _queryOrders(
	db: ReturnType<typeof getDb>,
	dateFilter?: string,
	statusFilter?: string
): Promise<AdminOrder[]> {
	// Build WHERE conditions
	const conditions = [];

	if (dateFilter && dateFilter !== 'all') {
		// Filter by fulfillment date
		conditions.push(eq(orders.fulfillmentDate, dateFilter));
	}

	if (statusFilter && statusFilter !== 'all') {
		conditions.push(eq(orders.status, statusFilter));
	}

	// Query orders
	const result = await db
		.select()
		.from(orders)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(orders.createdAt))
		.all();

	// Format orders for display
	return result.map((order) => ({
		id: order.id,
		customerName: order.customerName,
		customerEmail: order.customerEmail,
		itemsSummary: _formatItemsSummary(order.items),
		totalCents: order.totalCents,
		totalFormatted: formatPrice(order.totalCents || 0),
		status: order.status,
		fulfillmentDate: order.fulfillmentDate,
		fulfillmentType: order.fulfillmentType,
		createdAt: order.createdAt,
		createdAtFormatted: _formatDateTime(order.createdAt)
	}));
}

export interface OrdersPageData {
	orders: AdminOrder[];
	dateFilter: string;
	statusFilter: string;
	availableDates: string[];
	todayDate: string;
}

export const load: PageServerLoad = async ({ platform, url }): Promise<OrdersPageData> => {
	// Get query params
	const dateFilter = url.searchParams.get('date') || 'all';
	const statusFilter = url.searchParams.get('status') || 'all';

	// Check platform availability
	if (!platform?.env?.DB) {
		return {
			orders: [],
			dateFilter,
			statusFilter,
			availableDates: [],
			todayDate: _getTodayDate()
		};
	}

	try {
		const db = getDb(platform);

		// Query orders
		const ordersList = await _queryOrders(db, dateFilter, statusFilter);

		// Get distinct fulfillment dates for date filter dropdown
		const datesResult = await db
			.select({ date: orders.fulfillmentDate })
			.from(orders)
			.groupBy(orders.fulfillmentDate)
			.orderBy(desc(orders.fulfillmentDate))
			.all();

		const availableDates = datesResult
			.map((row) => row.date)
			.filter((date): date is string => date !== null);

		return {
			orders: ordersList,
			dateFilter,
			statusFilter,
			availableDates,
			todayDate: _getTodayDate()
		};
	} catch (error) {
		console.error('Failed to load orders:', error);
		return {
			orders: [],
			dateFilter,
			statusFilter,
			availableDates: [],
			todayDate: _getTodayDate()
		};
	}
};
