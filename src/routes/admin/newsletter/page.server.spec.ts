import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	load,
	actions,
	formatSubscribedDate,
	generateCSV,
	type NewsletterSubscriber
} from './+page.server';
import type { D1Database } from '@cloudflare/workers-types';

// Mock getDb
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

import { getDb } from '$lib/server/db';

describe('Newsletter Page Server', () => {
	describe('formatSubscribedDate', () => {
		it('should format a valid ISO date string', () => {
			const result = formatSubscribedDate('2026-01-16T10:30:00.000Z');
			expect(result).toMatch(/Jan 16, 2026/);
		});

		it('should handle null input', () => {
			const result = formatSubscribedDate(null);
			expect(result).toBe('Unknown');
		});

		it('should handle invalid date strings', () => {
			const result = formatSubscribedDate('not-a-date');
			expect(result).toBe('Invalid Date');
		});

		it('should include time in the format', () => {
			const result = formatSubscribedDate('2026-01-16T14:30:00.000Z');
			expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
		});
	});

	describe('generateCSV', () => {
		it('should generate CSV with header and rows', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					source: 'website',
					subscribedAt: '2026-01-16T10:00:00.000Z'
				},
				{
					id: 2,
					email: 'user@test.com',
					source: 'coming-soon',
					subscribedAt: '2026-01-15T09:00:00.000Z'
				}
			];

			const csv = generateCSV(subscribers);

			expect(csv).toContain('Email,Source,Subscribed Date');
			expect(csv).toContain('"test@example.com","website","2026-01-16T10:00:00.000Z"');
			expect(csv).toContain('"user@test.com","coming-soon","2026-01-15T09:00:00.000Z"');
		});

		it('should handle empty subscribers array', () => {
			const csv = generateCSV([]);
			expect(csv).toBe('Email,Source,Subscribed Date\n');
		});

		it('should escape quotes in email addresses', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test"quoted"@example.com',
					source: 'website',
					subscribedAt: '2026-01-16T10:00:00.000Z'
				}
			];

			const csv = generateCSV(subscribers);
			expect(csv).toContain('test""quoted""@example.com');
		});

		it('should use "website" as default source when null', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					source: null,
					subscribedAt: '2026-01-16T10:00:00.000Z'
				}
			];

			const csv = generateCSV(subscribers);
			expect(csv).toContain('"test@example.com","website",');
		});

		it('should handle null subscribedAt', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					source: 'website',
					subscribedAt: null
				}
			];

			const csv = generateCSV(subscribers);
			expect(csv).toContain('"test@example.com","website",""');
		});
	});

	describe('load function', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should return empty data when platform is undefined', async () => {
			const result = await load({
				platform: undefined
			} as any);

			expect(result).toEqual({
				subscribers: [],
				totalCount: 0
			});
		});

		it('should return empty data when env is undefined', async () => {
			const result = await load({
				platform: { env: undefined }
			} as any);

			expect(result).toEqual({
				subscribers: [],
				totalCount: 0
			});
		});

		it('should return empty data when DB is undefined', async () => {
			const result = await load({
				platform: { env: { DB: undefined } }
			} as any);

			expect(result).toEqual({
				subscribers: [],
				totalCount: 0
			});
		});

		it('should load subscribers from database', async () => {
			const mockSubscribers = [
				{
					id: 1,
					email: 'test1@example.com',
					source: 'website',
					subscribedAt: '2026-01-16T10:00:00.000Z'
				},
				{
					id: 2,
					email: 'test2@example.com',
					source: 'coming-soon',
					subscribedAt: '2026-01-15T09:00:00.000Z'
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

			const result = await load({
				platform: { env: { DB: {} as D1Database } }
			} as any);

			expect(result).toEqual({
				subscribers: mockSubscribers,
				totalCount: 2
			});
			expect(getDb).toHaveBeenCalledWith({
				env: { DB: {} }
			});
		});

		it('should return empty data when database query fails', async () => {
			const mockDb = {
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockRejectedValue(new Error('Database error'))
					})
				})
			};

			vi.mocked(getDb).mockReturnValue(mockDb as any);

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await load({
				platform: { env: { DB: {} as D1Database } }
			} as any);

			expect(result).toEqual({
				subscribers: [],
				totalCount: 0
			});
			expect(consoleSpy).toHaveBeenCalledWith(
				'Failed to load newsletter subscribers:',
				expect.any(Error)
			);

			consoleSpy.mockRestore();
		});

		it('should order subscribers by subscribedAt DESC', async () => {
			const mockOrderBy = vi.fn().mockResolvedValue([]);
			const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			const mockDb = { select: mockSelect };

			vi.mocked(getDb).mockReturnValue(mockDb as any);

			await load({
				platform: { env: { DB: {} as D1Database } }
			} as any);

			expect(mockOrderBy).toHaveBeenCalled();
		});
	});

	describe('export action', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should throw 503 when platform is undefined', async () => {
			await expect(
				actions.export({
					platform: undefined
				} as any)
			).rejects.toThrow();
		});

		it('should throw 503 when DB is undefined', async () => {
			await expect(
				actions.export({
					platform: { env: { DB: undefined } }
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

			const response = (await actions.export({
				platform: { env: { DB: {} as D1Database } }
			} as any)) as Response;

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

			const response = (await actions.export({
				platform: { env: { DB: {} as D1Database } }
			} as any)) as Response;

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

			const response = (await actions.export({
				platform: { env: { DB: {} as D1Database } }
			} as any)) as Response;

			const text = await response.text();
			expect(text).toContain('Email,Source,Subscribed Date');
			expect(text).toContain('"test@example.com","website","2026-01-16T10:00:00.000Z"');
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

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			await expect(
				actions.export({
					platform: { env: { DB: {} as D1Database } }
				} as any)
			).rejects.toThrow();

			expect(consoleSpy).toHaveBeenCalledWith(
				'Failed to export newsletter subscribers:',
				expect.any(Error)
			);

			consoleSpy.mockRestore();
		});
	});

	describe('Type Exports', () => {
		it('should export NewsletterSubscriber type', () => {
			const subscriber: NewsletterSubscriber = {
				id: 1,
				email: 'test@example.com',
				source: 'website',
				subscribedAt: '2026-01-16T10:00:00.000Z'
			};

			expect(subscriber.id).toBeDefined();
			expect(subscriber.email).toBeDefined();
		});

		it('should allow null values in NewsletterSubscriber', () => {
			const subscriber: NewsletterSubscriber = {
				id: 1,
				email: 'test@example.com',
				source: null,
				subscribedAt: null
			};

			expect(subscriber.source).toBeNull();
			expect(subscriber.subscribedAt).toBeNull();
		});
	});
});
