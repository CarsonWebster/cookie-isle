import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getTodayDate,
	queryTodayStats,
	queryPendingOrdersCount,
	queryTotalProductsCount,
	queryRecentOrders,
	load
} from './+page.server';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

describe('Admin Dashboard Server Functions', () => {
	describe('getTodayDate', () => {
		it('should return today date in YYYY-MM-DD format', () => {
			const now = new Date('2026-01-16T15:30:00Z');
			const result = getTodayDate(now);
			expect(result).toBe('2026-01-16');
		});

		it('should handle month/day with leading zeros', () => {
			const now = new Date('2026-03-05T10:00:00Z');
			const result = getTodayDate(now);
			expect(result).toBe('2026-03-05');
		});

		it('should use current date when no parameter provided', () => {
			const result = getTodayDate();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe('queryTodayStats', () => {
		it('should calculate today orders count and revenue', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([
					{ id: 1, totalCents: 1500, status: 'paid' },
					{ id: 2, totalCents: 2000, status: 'fulfilled' },
					{ id: 3, totalCents: 500, status: 'paid' }
				])
			};

			const result = await queryTodayStats(mockDb as any);

			expect(result.ordersCount).toBe(3);
			expect(result.revenueCents).toBe(4000);
		});

		it('should handle null totalCents', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([
					{ id: 1, totalCents: null, status: 'paid' },
					{ id: 2, totalCents: 1000, status: 'paid' }
				])
			};

			const result = await queryTodayStats(mockDb as any);

			expect(result.ordersCount).toBe(2);
			expect(result.revenueCents).toBe(1000);
		});

		it('should return zero for empty results', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([])
			};

			const result = await queryTodayStats(mockDb as any);

			expect(result.ordersCount).toBe(0);
			expect(result.revenueCents).toBe(0);
		});
	});

	describe('queryPendingOrdersCount', () => {
		it('should return count of pending orders', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ count: 5 }])
			};

			const result = await queryPendingOrdersCount(mockDb as any);
			expect(result).toBe(5);
		});

		it('should return 0 when no results', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([])
			};

			const result = await queryPendingOrdersCount(mockDb as any);
			expect(result).toBe(0);
		});
	});

	describe('queryTotalProductsCount', () => {
		it('should return count of products', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockResolvedValue([{ count: 12 }])
			};

			const result = await queryTotalProductsCount(mockDb as any);
			expect(result).toBe(12);
		});

		it('should return 0 when no results', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockResolvedValue([])
			};

			const result = await queryTotalProductsCount(mockDb as any);
			expect(result).toBe(0);
		});
	});

	describe('queryRecentOrders', () => {
		it('should return formatted recent orders', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([
					{
						id: 1,
						customerName: 'John Doe',
						totalCents: 1500,
						status: 'paid',
						createdAt: '2026-01-16T10:00:00'
					},
					{
						id: 2,
						customerName: 'Jane Smith',
						totalCents: 2000,
						status: 'fulfilled',
						createdAt: '2026-01-15T14:30:00'
					}
				])
			};

			const result = await queryRecentOrders(mockDb as any);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				id: 1,
				customerName: 'John Doe',
				totalCents: 1500,
				totalFormatted: '$15.00',
				status: 'paid',
				createdAt: '2026-01-16T10:00:00'
			});
		});

		it('should handle null values', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([
					{
						id: 1,
						customerName: null,
						totalCents: null,
						status: null,
						createdAt: null
					}
				])
			};

			const result = await queryRecentOrders(mockDb as any);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: 1,
				customerName: null,
				totalCents: null,
				totalFormatted: '$0.00',
				status: null,
				createdAt: null
			});
		});

		it('should return empty array when no orders', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([])
			};

			const result = await queryRecentOrders(mockDb as any);
			expect(result).toEqual([]);
		});
	});

	describe('load function', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should return empty data when platform unavailable', async () => {
			const result = await load({ platform: undefined } as any);

			expect(result).toEqual({
				stats: {
					todayOrdersCount: 0,
					todayRevenueCents: 0,
					todayRevenueFormatted: '$0.00',
					pendingOrdersCount: 0,
					totalProductsCount: 0
				},
				recentOrders: []
			});
		});

		it('should return empty data when DB binding missing', async () => {
			const result = await load({ platform: { env: {} } } as any);

			expect(result).toEqual({
				stats: {
					todayOrdersCount: 0,
					todayRevenueCents: 0,
					todayRevenueFormatted: '$0.00',
					pendingOrdersCount: 0,
					totalProductsCount: 0
				},
				recentOrders: []
			});
		});

		it('should load all dashboard data successfully', async () => {
			const { getDb } = await import('$lib/server/db');

			// Create separate chainable mocks for each query
			const todayStatsQuery = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([
					{ id: 1, totalCents: 1500, status: 'paid' },
					{ id: 2, totalCents: 1000, status: 'paid' }
				])
			};

			const pendingCountQuery = {
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ count: 3 }])
			};

			const productsCountQuery = {
				from: vi.fn().mockResolvedValue([{ count: 8 }])
			};

			const recentOrdersQuery = {
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([
					{
						id: 1,
						customerName: 'Test User',
						totalCents: 1500,
						status: 'paid',
						createdAt: '2026-01-16T10:00:00'
					}
				])
			};

			// Mock db.select() to return different query chains
			let selectCallCount = 0;
			const mockDb = {
				select: vi.fn().mockImplementation(() => {
					selectCallCount++;
					if (selectCallCount === 1) return todayStatsQuery;
					if (selectCallCount === 2) return pendingCountQuery;
					if (selectCallCount === 3) return productsCountQuery;
					if (selectCallCount === 4) return recentOrdersQuery;
					return todayStatsQuery;
				})
			};

			vi.mocked(getDb).mockReturnValue(mockDb as any);

			const result = await load({
				platform: { env: { DB: {} } }
			} as any);

			expect(result.stats).toMatchObject({
				todayOrdersCount: 2,
				todayRevenueCents: 2500,
				todayRevenueFormatted: '$25.00',
				pendingOrdersCount: 3,
				totalProductsCount: 8
			});
			expect(result.recentOrders).toHaveLength(1);
		});

		it('should return empty data on database error', async () => {
			const { getDb } = await import('$lib/server/db');
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			vi.mocked(getDb).mockImplementation(() => {
				throw new Error('Database connection failed');
			});

			const result = await load({
				platform: { env: { DB: {} } }
			} as any);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Admin dashboard load error:',
				expect.any(Error)
			);
			expect(result).toEqual({
				stats: {
					todayOrdersCount: 0,
					todayRevenueCents: 0,
					todayRevenueFormatted: '$0.00',
					pendingOrdersCount: 0,
					totalProductsCount: 0
				},
				recentOrders: []
			});

			consoleErrorSpy.mockRestore();
		});
	});

	describe('Type exports', () => {
		it('should export DashboardStats interface', () => {
			const stats: import('./+page.server').DashboardStats = {
				todayOrdersCount: 5,
				todayRevenueCents: 5000,
				todayRevenueFormatted: '$50.00',
				pendingOrdersCount: 2,
				totalProductsCount: 10
			};
			expect(stats.todayOrdersCount).toBe(5);
		});

		it('should export RecentOrder interface', () => {
			const order: import('./+page.server').RecentOrder = {
				id: 1,
				customerName: 'Test',
				totalCents: 1000,
				totalFormatted: '$10.00',
				status: 'paid',
				createdAt: '2026-01-16'
			};
			expect(order.id).toBe(1);
		});

		it('should export DashboardData interface', () => {
			const data: import('./+page.server').DashboardData = {
				stats: {
					todayOrdersCount: 0,
					todayRevenueCents: 0,
					todayRevenueFormatted: '$0.00',
					pendingOrdersCount: 0,
					totalProductsCount: 0
				},
				recentOrders: []
			};
			expect(data.stats).toBeDefined();
		});
	});
});
