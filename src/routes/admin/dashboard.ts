import { count, eq, sql, desc } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { orders, products } from '$lib/server/db/schema';
import { formatPrice } from '$lib/config';

export interface DashboardStats {
	todayOrdersCount: number;
	todayRevenueCents: number;
	todayRevenueFormatted: string;
	pendingOrdersCount: number;
	totalProductsCount: number;
}

export interface RecentOrder {
	id: number;
	customerName: string | null;
	totalCents: number | null;
	totalFormatted: string;
	status: string | null;
	createdAt: string | null;
}

export interface CookieNeeded {
	productName: string;
	quantity: number;
}

export interface DashboardData {
	stats: DashboardStats;
	recentOrders: RecentOrder[];
	cookiesNeededToday: CookieNeeded[];
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
export function getTodayDate(now: Date = new Date()): string {
	return now.toISOString().split('T')[0];
}

/**
 * Query today's orders count and total revenue
 */
export async function queryTodayStats(db: ReturnType<typeof getDb>): Promise<{
	ordersCount: number;
	revenueCents: number;
}> {
	const today = getTodayDate();

	// Get today's orders (created_at starts with today's date)
	const todayOrders = await db
		.select({
			id: orders.id,
			totalCents: orders.totalCents,
			status: orders.status
		})
		.from(orders)
		.where(sql`date(${orders.createdAt}) = ${today} AND ${orders.status} IN ('paid', 'fulfilled')`);

	const ordersCount = todayOrders.length;
	const revenueCents = todayOrders.reduce((sum, order) => sum + (order.totalCents || 0), 0);

	return { ordersCount, revenueCents };
}

/**
 * Query pending orders count
 */
export async function queryPendingOrdersCount(db: ReturnType<typeof getDb>): Promise<number> {
	const result = await db
		.select({ count: count() })
		.from(orders)
		.where(eq(orders.status, 'pending'));

	return result[0]?.count || 0;
}

/**
 * Query total products count
 */
export async function queryTotalProductsCount(db: ReturnType<typeof getDb>): Promise<number> {
	const result = await db.select({ count: count() }).from(products);
	return result[0]?.count || 0;
}

/**
 * Query 5 most recent orders
 */
export async function queryRecentOrders(db: ReturnType<typeof getDb>): Promise<RecentOrder[]> {
	const results = await db
		.select({
			id: orders.id,
			customerName: orders.customerName,
			totalCents: orders.totalCents,
			status: orders.status,
			createdAt: orders.createdAt
		})
		.from(orders)
		.orderBy(desc(orders.createdAt))
		.limit(5);

	return results.map((order) => ({
		id: order.id,
		customerName: order.customerName,
		totalCents: order.totalCents,
		totalFormatted: formatPrice(order.totalCents || 0),
		status: order.status,
		createdAt: order.createdAt
	}));
}

/**
 * Query cookies needed for today's fulfillment slots
 * Groups by product and sums quantities
 */
export async function queryCookiesNeededToday(
	db: ReturnType<typeof getDb>
): Promise<CookieNeeded[]> {
	const today = getTodayDate();

	// Get today's orders that need fulfillment (paid or fulfilled status)
	const todayOrders = await db
		.select({
			items: orders.items,
			status: orders.status,
			fulfillmentDate: orders.fulfillmentDate
		})
		.from(orders)
		.where(sql`${orders.fulfillmentDate} = ${today} AND ${orders.status} IN ('paid', 'fulfilled')`);

	// Aggregate items by product name
	const cookiesByProduct = new Map<string, number>();

	for (const order of todayOrders) {
		if (order.items && Array.isArray(order.items)) {
			for (const item of order.items) {
				const existingQty = cookiesByProduct.get(item.title) || 0;
				cookiesByProduct.set(item.title, existingQty + item.quantity);
			}
		}
	}

	// Convert map to array and sort by quantity descending
	const result: CookieNeeded[] = Array.from(cookiesByProduct.entries())
		.map(([productName, quantity]) => ({ productName, quantity }))
		.sort((a, b) => b.quantity - a.quantity);

	return result;
}
