import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { formatPrice } from '$lib/config';
import {
	queryTodayStats,
	queryPendingOrdersCount,
	queryTotalProductsCount,
	queryRecentOrders,
	queryCookiesNeededToday
} from './dashboard';

export const load = async ({ platform }: RequestEvent) => {
	// Return empty data if platform unavailable
	if (!platform?.env?.DB) {
		return {
			stats: {
				todayOrdersCount: 0,
				todayRevenueCents: 0,
				todayRevenueFormatted: '$0.00',
				pendingOrdersCount: 0,
				totalProductsCount: 0
			},
			recentOrders: [],
			cookiesNeededToday: []
		};
	}

	try {
		const db = getDb(platform);

		// Query all stats in parallel
		const [todayStats, pendingCount, productsCount, recentOrders, cookiesNeeded] =
			await Promise.all([
				queryTodayStats(db),
				queryPendingOrdersCount(db),
				queryTotalProductsCount(db),
				queryRecentOrders(db),
				queryCookiesNeededToday(db)
			]);

		return {
			stats: {
				todayOrdersCount: todayStats.ordersCount,
				todayRevenueCents: todayStats.revenueCents,
				todayRevenueFormatted: formatPrice(todayStats.revenueCents),
				pendingOrdersCount: pendingCount,
				totalProductsCount: productsCount
			},
			recentOrders,
			cookiesNeededToday: cookiesNeeded
		};
	} catch (error) {
		console.error('Admin dashboard load error:', error);
		// Return empty data on error
		return {
			stats: {
				todayOrdersCount: 0,
				todayRevenueCents: 0,
				todayRevenueFormatted: '$0.00',
				pendingOrdersCount: 0,
				totalProductsCount: 0
			},
			recentOrders: [],
			cookiesNeededToday: []
		};
	}
};
