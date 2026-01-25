import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, _generateCSV, type NewsletterSubscriber } from './+page.server';
import { formatSubscribedDate } from '$lib/format';
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

	describe('_generateCSV', () => {
		it('should generate CSV with header and rows', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					firstName: null,
					source: 'website',
					subscribed: true,
					subscribedAt: '2026-01-16T10:00:00.000Z',
					unsubscribedAt: null
				},
				{
					id: 2,
					email: 'user@test.com',
					firstName: null,
					source: 'coming-soon',
					subscribed: true,
					subscribedAt: '2026-01-15T09:00:00.000Z',
					unsubscribedAt: null
				}
			];

			const csv = _generateCSV(subscribers);

			expect(csv).toContain('First Name,Email,Source,Subscribed,Subscribed Date,Unsubscribed Date');
			expect(csv).toContain('","test@example.com","website","Yes","2026-01-16T10:00:00.000Z",""');
			expect(csv).toContain('","user@test.com","coming-soon","Yes","2026-01-15T09:00:00.000Z",""');
		});

		it('should handle empty subscribers array', () => {
			const csv = _generateCSV([]);
			expect(csv).toBe('First Name,Email,Source,Subscribed,Subscribed Date,Unsubscribed Date\n');
		});

		it('should escape quotes in email addresses', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test"quoted"@example.com',
					firstName: null,
					source: 'website',
					subscribed: true,
					subscribedAt: '2026-01-16T10:00:00.000Z',
					unsubscribedAt: null
				}
			];

			const csv = _generateCSV(subscribers);
			expect(csv).toContain('test""quoted""@example.com');
		});

		it('should use "website" as default source when null', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					firstName: null,
					source: null,
					subscribed: true,
					subscribedAt: '2026-01-16T10:00:00.000Z',
					unsubscribedAt: null
				}
			];

			const csv = _generateCSV(subscribers);
			expect(csv).toContain('","test@example.com","website",');
		});

		it('should handle null subscribedAt', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					firstName: null,
					source: 'website',
					subscribed: true,
					subscribedAt: null,
					unsubscribedAt: null
				}
			];

			const csv = _generateCSV(subscribers);
			expect(csv).toContain('","test@example.com","website","Yes","",""');
		});

		it('should show unsubscribed status correctly', () => {
			const subscribers: NewsletterSubscriber[] = [
				{
					id: 1,
					email: 'test@example.com',
					firstName: null,
					source: 'website',
					subscribed: false,
					subscribedAt: '2026-01-16T10:00:00.000Z',
					unsubscribedAt: '2026-01-17T10:00:00.000Z'
				}
			];

			const csv = _generateCSV(subscribers);
			expect(csv).toContain(
				'","test@example.com","website","No","2026-01-16T10:00:00.000Z","2026-01-17T10:00:00.000Z"'
			);
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
					subscribed: true,
					subscribedAt: '2026-01-16T10:00:00.000Z',
					unsubscribedAt: null
				},
				{
					id: 2,
					email: 'test2@example.com',
					source: 'coming-soon',
					subscribed: true,
					subscribedAt: '2026-01-15T09:00:00.000Z',
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

			const result = await load({
				platform: { env: { DB: {} as D1Database } }
			} as any);

			expect(result).toEqual({
				subscribers: mockSubscribers,
				totalCount: 2,
				activeCount: 2
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
				totalCount: 0,
				activeCount: 0
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

	describe('Type Exports', () => {
		it('should export NewsletterSubscriber type', () => {
			const subscriber: NewsletterSubscriber = {
				id: 1,
				email: 'test@example.com',
					firstName: null,
				source: 'website',
				subscribed: true,
				subscribedAt: '2026-01-16T10:00:00.000Z',
				unsubscribedAt: null
			};

			expect(subscriber.id).toBeDefined();
			expect(subscriber.email).toBeDefined();
			expect(subscriber.subscribed).toBe(true);
		});

		it('should allow null values in NewsletterSubscriber', () => {
			const subscriber: NewsletterSubscriber = {
				id: 1,
				email: 'test@example.com',
					firstName: null,
				source: null,
				subscribed: null,
				subscribedAt: null,
				unsubscribedAt: null
			};

			expect(subscriber.source).toBeNull();
			expect(subscriber.subscribedAt).toBeNull();
			expect(subscriber.subscribed).toBeNull();
		});
	});
});
