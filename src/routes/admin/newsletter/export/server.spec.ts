import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import type { D1Database } from '@cloudflare/workers-types';

// Mock getDb
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

import { getDb } from '$lib/server/db';

describe('Newsletter Export Endpoint', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should throw 401 when no session cookie', async () => {
		const mockCookies = {
			get: vi.fn().mockReturnValue(undefined)
		};

		await expect(
			GET({
				platform: { env: { DB: {} as D1Database } },
				cookies: mockCookies
			} as any)
		).rejects.toThrow();
	});

	it('should throw 503 when platform is undefined', async () => {
		const mockCookies = {
			get: vi.fn().mockReturnValue('valid-session')
		};

		await expect(
			GET({
				platform: undefined,
				cookies: mockCookies
			} as any)
		).rejects.toThrow();
	});

	it('should throw 503 when DB is undefined', async () => {
		const mockCookies = {
			get: vi.fn().mockReturnValue('valid-session')
		};

		await expect(
			GET({
				platform: { env: { DB: undefined } },
				cookies: mockCookies
			} as any)
		).rejects.toThrow();
	});

	it('should return CSV response with proper headers', async () => {
		const mockSubscribers = [
			{
				id: 1,
				email: 'test@example.com',
				source: 'website',
				subscribedAt: '2026-01-16T10:00:00.000Z'
			}
		];

		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockResolvedValue(mockSubscribers)
				})
			})
		};

		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const mockCookies = {
			get: vi.fn().mockReturnValue('valid-session')
		};

		const response = await GET({
			platform: { env: { DB: {} as D1Database } },
			cookies: mockCookies
		} as any);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('text/csv');
		expect(response.headers.get('Content-Disposition')).toContain('attachment');
		expect(response.headers.get('Content-Disposition')).toContain('newsletter-subscribers-');
		expect(response.headers.get('Content-Disposition')).toContain('.csv');
	});

	it('should include current date in filename', async () => {
		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockResolvedValue([])
				})
			})
		};

		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const mockCookies = {
			get: vi.fn().mockReturnValue('valid-session')
		};

		const response = await GET({
			platform: { env: { DB: {} as D1Database } },
			cookies: mockCookies
		} as any);

		const contentDisposition = response.headers.get('Content-Disposition');
		const today = new Date().toISOString().split('T')[0];
		expect(contentDisposition).toContain(today);
	});

	it('should generate CSV content from subscribers', async () => {
		const mockSubscribers = [
			{
				id: 1,
				email: 'test@example.com',
				source: 'website',
				subscribed: true,
				subscribedAt: '2026-01-16T10:00:00.000Z',
				unsubscribedAt: null
			}
		];

		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockResolvedValue(mockSubscribers)
				})
			})
		};

		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const mockCookies = {
			get: vi.fn().mockReturnValue('valid-session')
		};

		const response = await GET({
			platform: { env: { DB: {} as D1Database } },
			cookies: mockCookies
		} as any);

		const text = await response.text();
		expect(text).toContain('Email,Source,Subscribed,Subscribed Date,Unsubscribed Date');
		expect(text).toContain('"test@example.com","website","Yes","2026-01-16T10:00:00.000Z",""');
	});

	it('should throw 500 when database query fails', async () => {
		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockRejectedValue(new Error('Database error'))
				})
			})
		};

		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const mockCookies = {
			get: vi.fn().mockReturnValue('valid-session')
		};

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(
			GET({
				platform: { env: { DB: {} as D1Database } },
				cookies: mockCookies
			} as any)
		).rejects.toThrow();

		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to export newsletter subscribers:',
			expect.any(Error)
		);

		consoleSpy.mockRestore();
	});
});
