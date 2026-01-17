import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	verifyPassword,
	generateSessionId,
	calculateExpirationDate,
	formatExpirationDate,
	parseExpirationDate,
	isSessionExpired,
	createSession,
	validateSession,
	deleteSession,
	cleanupExpiredSessions,
	getAdminPassword,
	SESSION_DURATION_MS,
	SESSION_DURATION_DAYS
} from './auth';

// Mock the database module
vi.mock('./db', () => ({
	createDb: vi.fn()
}));

describe('Auth Module', () => {
	describe('Constants', () => {
		it('SESSION_DURATION_MS should equal 7 days in milliseconds', () => {
			const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
			expect(SESSION_DURATION_MS).toBe(sevenDaysMs);
		});

		it('SESSION_DURATION_DAYS should equal 7', () => {
			expect(SESSION_DURATION_DAYS).toBe(7);
		});
	});

	describe('verifyPassword', () => {
		it('should return true for matching passwords', () => {
			expect(verifyPassword('secret123', 'secret123')).toBe(true);
		});

		it('should return false for non-matching passwords', () => {
			expect(verifyPassword('wrong', 'secret123')).toBe(false);
		});

		it('should return false for empty password', () => {
			expect(verifyPassword('', 'secret123')).toBe(false);
		});

		it('should return false for undefined password', () => {
			expect(verifyPassword(undefined, 'secret123')).toBe(false);
		});

		it('should return false for undefined admin password', () => {
			expect(verifyPassword('secret123', undefined)).toBe(false);
		});

		it('should return false when both are undefined', () => {
			expect(verifyPassword(undefined, undefined)).toBe(false);
		});

		it('should return false for passwords of different lengths', () => {
			expect(verifyPassword('short', 'muchlongerpassword')).toBe(false);
		});

		it('should handle special characters', () => {
			expect(verifyPassword('p@$$w0rd!#$%', 'p@$$w0rd!#$%')).toBe(true);
		});

		it('should be case-sensitive', () => {
			expect(verifyPassword('Password', 'password')).toBe(false);
		});

		it('should handle unicode characters', () => {
			expect(verifyPassword('пароль', 'пароль')).toBe(true);
			expect(verifyPassword('пароль', 'password')).toBe(false);
		});

		it('should handle empty admin password', () => {
			expect(verifyPassword('test', '')).toBe(false);
		});

		it('should handle whitespace-only passwords correctly', () => {
			expect(verifyPassword('   ', '   ')).toBe(true);
			expect(verifyPassword(' ', '  ')).toBe(false);
		});
	});

	describe('generateSessionId', () => {
		it('should generate a valid UUID format', () => {
			const sessionId = generateSessionId();
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(sessionId).toMatch(uuidRegex);
		});

		it('should generate unique IDs', () => {
			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(generateSessionId());
			}
			expect(ids.size).toBe(100);
		});

		it('should generate lowercase hex characters', () => {
			const sessionId = generateSessionId();
			expect(sessionId).toBe(sessionId.toLowerCase());
		});

		it('should have the correct length (36 characters)', () => {
			const sessionId = generateSessionId();
			expect(sessionId.length).toBe(36);
		});
	});

	describe('calculateExpirationDate', () => {
		it('should calculate expiration 7 days from now by default', () => {
			const now = new Date();
			const expiration = calculateExpirationDate();

			const diff = expiration.getTime() - now.getTime();
			// Allow 1 second tolerance for test execution time
			expect(diff).toBeGreaterThanOrEqual(SESSION_DURATION_MS - 1000);
			expect(diff).toBeLessThanOrEqual(SESSION_DURATION_MS + 1000);
		});

		it('should calculate expiration 7 days from provided date', () => {
			const now = new Date('2026-01-16T10:00:00Z');
			const expiration = calculateExpirationDate(now);

			expect(expiration.toISOString()).toBe('2026-01-23T10:00:00.000Z');
		});

		it('should handle leap year dates', () => {
			const now = new Date('2024-02-22T12:00:00Z');
			const expiration = calculateExpirationDate(now);

			expect(expiration.toISOString()).toBe('2024-02-29T12:00:00.000Z');
		});

		it('should handle year boundaries', () => {
			const now = new Date('2025-12-28T12:00:00Z');
			const expiration = calculateExpirationDate(now);

			expect(expiration.toISOString()).toBe('2026-01-04T12:00:00.000Z');
		});
	});

	describe('formatExpirationDate', () => {
		it('should format date as ISO string', () => {
			const date = new Date('2026-01-23T10:00:00.000Z');
			expect(formatExpirationDate(date)).toBe('2026-01-23T10:00:00.000Z');
		});

		it('should preserve timezone information', () => {
			const date = new Date('2026-01-23T15:30:45.123Z');
			expect(formatExpirationDate(date)).toBe('2026-01-23T15:30:45.123Z');
		});
	});

	describe('parseExpirationDate', () => {
		it('should parse valid ISO string', () => {
			const date = parseExpirationDate('2026-01-23T10:00:00.000Z');
			expect(date).toBeInstanceOf(Date);
			expect(date?.toISOString()).toBe('2026-01-23T10:00:00.000Z');
		});

		it('should return null for null input', () => {
			expect(parseExpirationDate(null)).toBeNull();
		});

		it('should return null for undefined input', () => {
			expect(parseExpirationDate(undefined)).toBeNull();
		});

		it('should return null for empty string', () => {
			expect(parseExpirationDate('')).toBeNull();
		});

		it('should return null for invalid date string', () => {
			expect(parseExpirationDate('not-a-date')).toBeNull();
		});

		it('should handle date-only strings', () => {
			const date = parseExpirationDate('2026-01-23');
			expect(date).toBeInstanceOf(Date);
		});
	});

	describe('isSessionExpired', () => {
		it('should return false for future expiration', () => {
			const now = new Date('2026-01-16T10:00:00Z');
			const expiresAt = new Date('2026-01-23T10:00:00Z');

			expect(isSessionExpired(expiresAt, now)).toBe(false);
		});

		it('should return true for past expiration', () => {
			const now = new Date('2026-01-24T10:00:00Z');
			const expiresAt = new Date('2026-01-23T10:00:00Z');

			expect(isSessionExpired(expiresAt, now)).toBe(true);
		});

		it('should return true for exact expiration time', () => {
			const now = new Date('2026-01-23T10:00:00Z');
			const expiresAt = new Date('2026-01-23T10:00:00Z');

			expect(isSessionExpired(expiresAt, now)).toBe(true);
		});

		it('should use current time if now is not provided', () => {
			const pastExpiration = new Date(Date.now() - 1000);
			expect(isSessionExpired(pastExpiration)).toBe(true);

			const futureExpiration = new Date(Date.now() + 1000000);
			expect(isSessionExpired(futureExpiration)).toBe(false);
		});
	});

	describe('createSession', () => {
		it('should insert session into database', async () => {
			const mockDb = {
				insert: vi.fn().mockReturnThis(),
				values: vi.fn().mockResolvedValue(undefined)
			};

			const now = new Date('2026-01-16T10:00:00Z');
			const result = await createSession(
				mockDb as unknown as Parameters<typeof createSession>[0],
				now
			);

			expect(result.sessionId).toBeDefined();
			expect(result.expiresAt.toISOString()).toBe('2026-01-23T10:00:00.000Z');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					id: result.sessionId,
					expiresAt: '2026-01-23T10:00:00.000Z'
				})
			);
		});

		it('should return a valid UUID session ID', async () => {
			const mockDb = {
				insert: vi.fn().mockReturnThis(),
				values: vi.fn().mockResolvedValue(undefined)
			};

			const result = await createSession(mockDb as unknown as Parameters<typeof createSession>[0]);

			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(result.sessionId).toMatch(uuidRegex);
		});
	});

	describe('validateSession', () => {
		it('should return valid: false for undefined sessionId', async () => {
			const mockDb = {} as Parameters<typeof validateSession>[0];

			const result = await validateSession(mockDb, undefined);

			expect(result.valid).toBe(false);
		});

		it('should return valid: false for non-existent session', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([])
			};

			const result = await validateSession(
				mockDb as unknown as Parameters<typeof validateSession>[0],
				'non-existent-id'
			);

			expect(result.valid).toBe(false);
		});

		it('should return valid: true for valid session', async () => {
			const futureDate = new Date(Date.now() + SESSION_DURATION_MS);
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ id: 'valid-id', expiresAt: futureDate.toISOString() }])
			};

			const result = await validateSession(
				mockDb as unknown as Parameters<typeof validateSession>[0],
				'valid-id'
			);

			expect(result.valid).toBe(true);
			expect(result.sessionId).toBe('valid-id');
			expect(result.expiresAt).toBeInstanceOf(Date);
		});

		it('should return valid: false for expired session and delete it', async () => {
			const pastDate = new Date(Date.now() - 1000);
			const mockDelete = vi.fn().mockReturnThis();
			const mockWhere = vi.fn().mockResolvedValue(undefined);

			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ id: 'expired-id', expiresAt: pastDate.toISOString() }]),
				delete: mockDelete
			};

			// Set up delete chain
			mockDelete.mockReturnValue({ where: mockWhere });

			const result = await validateSession(
				mockDb as unknown as Parameters<typeof validateSession>[0],
				'expired-id'
			);

			expect(result.valid).toBe(false);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should return valid: false for invalid expiresAt format', async () => {
			const mockDb = {
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ id: 'bad-id', expiresAt: 'not-a-date' }])
			};

			const result = await validateSession(
				mockDb as unknown as Parameters<typeof validateSession>[0],
				'bad-id'
			);

			expect(result.valid).toBe(false);
		});
	});

	describe('deleteSession', () => {
		it('should return false for undefined sessionId', async () => {
			const mockDb = {} as Parameters<typeof deleteSession>[0];

			const result = await deleteSession(mockDb, undefined);

			expect(result).toBe(false);
		});

		it('should return true when session is deleted', async () => {
			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([{ id: 'deleted-id' }])
			};

			const result = await deleteSession(
				mockDb as unknown as Parameters<typeof deleteSession>[0],
				'session-to-delete'
			);

			expect(result).toBe(true);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should return false when session does not exist', async () => {
			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([])
			};

			const result = await deleteSession(
				mockDb as unknown as Parameters<typeof deleteSession>[0],
				'non-existent'
			);

			expect(result).toBe(false);
		});
	});

	describe('cleanupExpiredSessions', () => {
		it('should delete expired sessions', async () => {
			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }])
			};

			const result = await cleanupExpiredSessions(
				mockDb as unknown as Parameters<typeof cleanupExpiredSessions>[0]
			);

			expect(result).toBe(3);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should return 0 when no expired sessions', async () => {
			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([])
			};

			const result = await cleanupExpiredSessions(
				mockDb as unknown as Parameters<typeof cleanupExpiredSessions>[0]
			);

			expect(result).toBe(0);
		});

		it('should use provided date for comparison', async () => {
			const now = new Date('2026-01-16T10:00:00Z');
			const mockDb = {
				delete: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				returning: vi.fn().mockResolvedValue([])
			};

			await cleanupExpiredSessions(
				mockDb as unknown as Parameters<typeof cleanupExpiredSessions>[0],
				now
			);

			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('getAdminPassword', () => {
		it('should return password when configured', () => {
			const platform = {
				env: { ADMIN_PASSWORD: 'secret123' }
			} as unknown as App.Platform;

			expect(getAdminPassword(platform)).toBe('secret123');
		});

		it('should throw when platform is undefined', () => {
			expect(() => getAdminPassword(undefined)).toThrow('ADMIN_PASSWORD not configured');
		});

		it('should throw when env is undefined', () => {
			const platform = {} as App.Platform;
			expect(() => getAdminPassword(platform)).toThrow('ADMIN_PASSWORD not configured');
		});

		it('should throw when ADMIN_PASSWORD is undefined', () => {
			const platform = { env: {} } as unknown as App.Platform;
			expect(() => getAdminPassword(platform)).toThrow('ADMIN_PASSWORD not configured');
		});

		it('should throw when ADMIN_PASSWORD is empty string', () => {
			const platform = { env: { ADMIN_PASSWORD: '' } } as unknown as App.Platform;
			expect(() => getAdminPassword(platform)).toThrow('ADMIN_PASSWORD not configured');
		});

		it('should include helpful message in error', () => {
			expect(() => getAdminPassword(undefined)).toThrow('.dev.vars');
			expect(() => getAdminPassword(undefined)).toThrow('Cloudflare Pages');
		});
	});

	describe('Module Exports', () => {
		it('should export SESSION_DURATION_MS', () => {
			expect(typeof SESSION_DURATION_MS).toBe('number');
		});

		it('should export SESSION_DURATION_DAYS', () => {
			expect(typeof SESSION_DURATION_DAYS).toBe('number');
		});

		it('should export verifyPassword', () => {
			expect(typeof verifyPassword).toBe('function');
		});

		it('should export generateSessionId', () => {
			expect(typeof generateSessionId).toBe('function');
		});

		it('should export calculateExpirationDate', () => {
			expect(typeof calculateExpirationDate).toBe('function');
		});

		it('should export formatExpirationDate', () => {
			expect(typeof formatExpirationDate).toBe('function');
		});

		it('should export parseExpirationDate', () => {
			expect(typeof parseExpirationDate).toBe('function');
		});

		it('should export isSessionExpired', () => {
			expect(typeof isSessionExpired).toBe('function');
		});

		it('should export createSession', () => {
			expect(typeof createSession).toBe('function');
		});

		it('should export validateSession', () => {
			expect(typeof validateSession).toBe('function');
		});

		it('should export deleteSession', () => {
			expect(typeof deleteSession).toBe('function');
		});

		it('should export cleanupExpiredSessions', () => {
			expect(typeof cleanupExpiredSessions).toBe('function');
		});

		it('should export getAdminPassword', () => {
			expect(typeof getAdminPassword).toBe('function');
		});
	});
});
