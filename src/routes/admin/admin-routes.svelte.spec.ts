/**
 * Admin Routes E2E Tests
 *
 * These tests verify that admin routes load correctly without runtime errors.
 * They catch issues like invalid SvelteKit exports that unit tests miss.
 *
 * PRD Reference: Admin dashboard, products, orders, newsletter, and slots management
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

// Import the admin pages to verify they compile and render
import AdminDashboard from './+page.svelte';

// Mock data for the dashboard
const mockDashboardData = {
	stats: {
		todayOrdersCount: 5,
		todayRevenueCents: 15000,
		todayRevenueFormatted: '$150.00',
		pendingOrdersCount: 3,
		totalProductsCount: 10
	},
	recentOrders: [
		{
			id: 1,
			customerName: 'Test Customer',
			totalCents: 2500,
			totalFormatted: '$25.00',
			status: 'paid',
			createdAt: '2026-01-16T10:00:00.000Z'
		}
	],
	cookiesNeededToday: [{ productName: 'Chocolate Chip', quantity: 12 }]
};

describe('Admin Dashboard Route', () => {
	afterEach(() => {
		cleanup();
	});

	it('should render the admin dashboard without errors', async () => {
		render(AdminDashboard, { data: mockDashboardData });

		// Verify the page title is present
		await expect.element(page.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
	});

	it('should display stats cards', async () => {
		render(AdminDashboard, { data: mockDashboardData });

		// Verify stats are displayed
		await expect.element(page.getByText("Today's Orders")).toBeInTheDocument();
		await expect.element(page.getByText("Today's Revenue")).toBeInTheDocument();
		await expect.element(page.getByText('Pending Orders')).toBeInTheDocument();
		await expect.element(page.getByText('Total Products')).toBeInTheDocument();
	});

	it('should display recent orders table', async () => {
		render(AdminDashboard, { data: mockDashboardData });

		// Verify recent orders section
		await expect.element(page.getByText('Recent Orders')).toBeInTheDocument();
		await expect.element(page.getByText('Test Customer')).toBeInTheDocument();
	});

	it('should display cookies needed section', async () => {
		render(AdminDashboard, { data: mockDashboardData });

		// Verify cookies needed section
		await expect.element(page.getByText('Cookies Needed Today')).toBeInTheDocument();
		await expect.element(page.getByText('Chocolate Chip')).toBeInTheDocument();
	});

	it('should display quick links', async () => {
		render(AdminDashboard, { data: mockDashboardData });

		// Verify quick links are present
		await expect.element(page.getByText('View All Orders')).toBeInTheDocument();
		await expect.element(page.getByText('Manage Products')).toBeInTheDocument();
		await expect.element(page.getByText('Fulfillment Slots')).toBeInTheDocument();
		await expect.element(page.getByText('Newsletter')).toBeInTheDocument();
	});

	it('should handle empty data gracefully', async () => {
		const emptyData = {
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

		render(AdminDashboard, { data: emptyData });

		// Should still render without errors
		await expect.element(page.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
		await expect.element(page.getByText('No orders yet.')).toBeInTheDocument();
	});
});
