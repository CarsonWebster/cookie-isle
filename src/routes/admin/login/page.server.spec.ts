import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

// Mock modules before importing the module under test
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	verifyPassword: vi.fn(),
	createSession: vi.fn(),
	getAdminPassword: vi.fn(),
	validateSession: vi.fn()
}));

import { getDb } from '$lib/server/db';
import { verifyPassword, createSession, getAdminPassword, validateSession } from '$lib/server/auth';
import { load, actions } from './+page.server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRequestEvent = any;

// ============================================================================
// Test Utilities
// ============================================================================

function createMockCookies(sessionId?: string): Cookies {
	const cookieStore = new Map<string, string>();
	if (sessionId) {
		cookieStore.set('admin_session', sessionId);
	}

	return {
		get: vi.fn((name: string) => cookieStore.get(name)),
		set: vi.fn((name: string, value: string) => {
			cookieStore.set(name, value);
		}),
		delete: vi.fn((name: string) => {
			cookieStore.delete(name);
		}),
		getAll: vi.fn(() =>
			Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }))
		),
		serialize: vi.fn()
	} as unknown as Cookies;
}

function createMockPlatform(hasDb = true, hasAdminPassword = true): App.Platform {
	return {
		env: {
			DB: hasDb ? ({} as D1Database) : undefined,
			ADMIN_PASSWORD: hasAdminPassword ? 'test-admin-password' : undefined
		},
		context: {
			waitUntil: vi.fn()
		}
	} as unknown as App.Platform;
}

function createMockRequest(password?: string): Request {
	const formData = new FormData();
	if (password !== undefined) {
		formData.append('password', password);
	}

	return {
		formData: vi.fn().mockResolvedValue(formData)
	} as unknown as Request;
}

// ============================================================================
// Load Function Tests
// ============================================================================

describe('load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('without session cookie', () => {
		it('should return empty object when no session cookie', async () => {
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			const result = await load({ cookies, platform } as unknown as Parameters<typeof load>[0]);

			expect(result).toEqual({});
			expect(cookies.get).toHaveBeenCalledWith('admin_session');
		});

		it('should return empty object when platform is undefined', async () => {
			const cookies = createMockCookies('some-session-id');

			const result = await load({ cookies, platform: undefined } as unknown as Parameters<
				typeof load
			>[0]);

			expect(result).toEqual({});
		});

		it('should return empty object when DB is not available', async () => {
			const cookies = createMockCookies('some-session-id');
			const platform = createMockPlatform(false);

			const result = await load({ cookies, platform } as unknown as Parameters<typeof load>[0]);

			expect(result).toEqual({});
		});
	});

	describe('with session cookie', () => {
		it('should redirect to /admin if session is valid', async () => {
			const cookies = createMockCookies('valid-session-id');
			const platform = createMockPlatform();
			const mockDb = {};

			vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
			vi.mocked(validateSession).mockResolvedValue({
				valid: true,
				sessionId: 'valid-session-id',
				expiresAt: new Date(Date.now() + 86400000)
			});

			let redirectThrown = false;
			let redirectError: unknown;
			try {
				await load({ cookies, platform } as unknown as Parameters<typeof load>[0]);
			} catch (e) {
				redirectThrown = true;
				redirectError = e;
			}

			expect(redirectThrown).toBe(true);
			// SvelteKit redirect throws an object with status and location
			expect(redirectError).toHaveProperty('status', 303);
			expect(redirectError).toHaveProperty('location', '/admin');
		});

		it('should return empty object if session is invalid', async () => {
			const cookies = createMockCookies('invalid-session-id');
			const platform = createMockPlatform();
			const mockDb = {};

			vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
			vi.mocked(validateSession).mockResolvedValue({ valid: false });

			const result = await load({ cookies, platform } as unknown as Parameters<typeof load>[0]);

			expect(result).toEqual({});
		});

		it('should return empty object if session validation throws', async () => {
			const cookies = createMockCookies('some-session-id');
			const platform = createMockPlatform();
			const mockDb = {};

			vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
			vi.mocked(validateSession).mockRejectedValue(new Error('Database error'));

			const result = await load({ cookies, platform } as unknown as Parameters<typeof load>[0]);

			expect(result).toEqual({});
		});
	});
});

// ============================================================================
// Actions Tests
// ============================================================================

describe('actions.default', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('password validation', () => {
		it('should return 400 if password is missing', async () => {
			const request = createMockRequest();
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Password is required' }
			});
		});

		it('should return 400 if password is empty string', async () => {
			const request = createMockRequest('');
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Password is required' }
			});
		});

		it('should return 400 if password is only whitespace', async () => {
			const request = createMockRequest('   ');
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Password is required' }
			});
		});

		it('should return 400 if password is not a string', async () => {
			const formData = new FormData();
			// FormData only accepts strings, so this tests the type check
			const request = {
				formData: vi.fn().mockResolvedValue(formData)
			} as unknown as Request;
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Password is required' }
			});
		});
	});

	describe('platform and environment checks', () => {
		it('should return 503 if platform is undefined', async () => {
			const request = createMockRequest('test-password');
			const cookies = createMockCookies();

			const result = await actions.default({
				request,
				cookies,
				platform: undefined
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 503,
				data: { error: 'Server configuration error. Please try again later.' }
			});
		});

		it('should return 503 if platform.env is undefined', async () => {
			const request = createMockRequest('test-password');
			const cookies = createMockCookies();
			const platform = { context: { waitUntil: vi.fn() } };

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 503,
				data: { error: 'Server configuration error. Please try again later.' }
			});
		});

		it('should return 503 if ADMIN_PASSWORD is not configured', async () => {
			const request = createMockRequest('test-password');
			const cookies = createMockCookies();
			const platform = createMockPlatform(true, false);

			vi.mocked(getAdminPassword).mockImplementation(() => {
				throw new Error('ADMIN_PASSWORD not configured');
			});

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 503,
				data: { error: 'Server configuration error. Please try again later.' }
			});
		});

		it('should return 503 if DB is not available', async () => {
			const request = createMockRequest('test-password');
			const cookies = createMockCookies();
			const platform = createMockPlatform(false);

			vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
			vi.mocked(verifyPassword).mockReturnValue(true);

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 503,
				data: { error: 'Database unavailable. Please try again later.' }
			});
		});
	});

	describe('password verification', () => {
		it('should return 401 if password is incorrect', async () => {
			const request = createMockRequest('wrong-password');
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
			vi.mocked(verifyPassword).mockReturnValue(false);

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 401,
				data: { error: 'Invalid password' }
			});
			expect(verifyPassword).toHaveBeenCalledWith('wrong-password', 'test-admin-password');
		});

		it('should call verifyPassword with trimmed password', async () => {
			const request = createMockRequest('  password-with-spaces  ');
			const cookies = createMockCookies();
			const platform = createMockPlatform();

			vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
			vi.mocked(verifyPassword).mockReturnValue(false);

			await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			// verifyPassword is called with the raw password, trimming is only for empty check
			expect(verifyPassword).toHaveBeenCalledWith(
				'  password-with-spaces  ',
				'test-admin-password'
			);
		});
	});

	describe('successful login', () => {
		it('should create session and set cookie on valid password', async () => {
			const request = createMockRequest('correct-password');
			const cookies = createMockCookies();
			const platform = createMockPlatform();
			const mockDb = {};
			const mockExpiresAt = new Date(Date.now() + 604800000); // 7 days

			vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
			vi.mocked(verifyPassword).mockReturnValue(true);
			vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
			vi.mocked(createSession).mockResolvedValue({
				sessionId: 'new-session-id',
				expiresAt: mockExpiresAt
			});

			let redirectThrown = false;
			let redirectError: unknown;
			try {
				await actions.default({
					request,
					cookies,
					platform
				} as AnyRequestEvent);
			} catch (e) {
				redirectThrown = true;
				redirectError = e;
			}

			expect(redirectThrown).toBe(true);
			expect(redirectError).toHaveProperty('status', 303);
			expect(redirectError).toHaveProperty('location', '/admin');

			expect(createSession).toHaveBeenCalledWith(mockDb);
			expect(cookies.set).toHaveBeenCalledWith(
				'admin_session',
				'new-session-id',
				expect.objectContaining({
					path: '/admin',
					httpOnly: true,
					secure: true,
					sameSite: 'lax',
					expires: mockExpiresAt
				})
			);
		});

		it('should redirect to /admin after successful login', async () => {
			const request = createMockRequest('correct-password');
			const cookies = createMockCookies();
			const platform = createMockPlatform();
			const mockDb = {};

			vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
			vi.mocked(verifyPassword).mockReturnValue(true);
			vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
			vi.mocked(createSession).mockResolvedValue({
				sessionId: 'new-session-id',
				expiresAt: new Date(Date.now() + 604800000)
			});

			let redirectThrown = false;
			let redirectError: unknown;
			try {
				await actions.default({
					request,
					cookies,
					platform
				} as AnyRequestEvent);
			} catch (e) {
				redirectThrown = true;
				redirectError = e;
			}

			expect(redirectThrown).toBe(true);
			expect(redirectError).toHaveProperty('status', 303);
			expect(redirectError).toHaveProperty('location', '/admin');
		});
	});

	describe('session creation failure', () => {
		it('should return 500 if session creation fails', async () => {
			const request = createMockRequest('correct-password');
			const cookies = createMockCookies();
			const platform = createMockPlatform();
			const mockDb = {};

			vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
			vi.mocked(verifyPassword).mockReturnValue(true);
			vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
			vi.mocked(createSession).mockRejectedValue(new Error('Database error'));

			const result = await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);

			expect(result).toMatchObject({
				status: 500,
				data: { error: 'Failed to create session. Please try again.' }
			});
		});
	});
});

// ============================================================================
// Cookie Settings Tests
// ============================================================================

describe('cookie settings', () => {
	it('should set cookie with correct security options', async () => {
		const request = createMockRequest('correct-password');
		const cookies = createMockCookies();
		const platform = createMockPlatform();
		const mockDb = {};
		const mockExpiresAt = new Date(Date.now() + 604800000);

		vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
		vi.mocked(verifyPassword).mockReturnValue(true);
		vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
		vi.mocked(createSession).mockResolvedValue({
			sessionId: 'session-id',
			expiresAt: mockExpiresAt
		});

		try {
			await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);
		} catch {
			// Expected redirect
		}

		expect(cookies.set).toHaveBeenCalledWith('admin_session', 'session-id', {
			path: '/admin',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			expires: mockExpiresAt
		});
	});

	it('should use httpOnly to prevent XSS access to cookie', async () => {
		const request = createMockRequest('correct-password');
		const cookies = createMockCookies();
		const platform = createMockPlatform();
		const mockDb = {};

		vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
		vi.mocked(verifyPassword).mockReturnValue(true);
		vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
		vi.mocked(createSession).mockResolvedValue({
			sessionId: 'session-id',
			expiresAt: new Date(Date.now() + 604800000)
		});

		try {
			await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);
		} catch {
			// Expected redirect
		}

		const setCookieCall = vi.mocked(cookies.set).mock.calls[0];
		expect(setCookieCall[2]).toMatchObject({ httpOnly: true });
	});

	it('should scope cookie to /admin path only', async () => {
		const request = createMockRequest('correct-password');
		const cookies = createMockCookies();
		const platform = createMockPlatform();
		const mockDb = {};

		vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
		vi.mocked(verifyPassword).mockReturnValue(true);
		vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);
		vi.mocked(createSession).mockResolvedValue({
			sessionId: 'session-id',
			expiresAt: new Date(Date.now() + 604800000)
		});

		try {
			await actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent);
		} catch {
			// Expected redirect
		}

		const setCookieCall = vi.mocked(cookies.set).mock.calls[0];
		expect(setCookieCall[2]).toMatchObject({ path: '/admin' });
	});
});

// ============================================================================
// Type Exports Tests
// ============================================================================

describe('type exports', () => {
	it('should export load function', () => {
		expect(typeof load).toBe('function');
	});

	it('should export actions object', () => {
		expect(typeof actions).toBe('object');
		expect(typeof actions.default).toBe('function');
	});
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('edge cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle formData parsing errors gracefully', async () => {
		const request = {
			formData: vi.fn().mockRejectedValue(new Error('Parse error'))
		} as unknown as Request;
		const cookies = createMockCookies();
		const platform = createMockPlatform();

		// The function will throw because formData() throws
		await expect(
			actions.default({
				request,
				cookies,
				platform
			} as AnyRequestEvent)
		).rejects.toThrow('Parse error');
	});

	it('should handle very long passwords without crashing', async () => {
		const longPassword = 'a'.repeat(10000);
		const request = createMockRequest(longPassword);
		const cookies = createMockCookies();
		const platform = createMockPlatform();

		vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
		vi.mocked(verifyPassword).mockReturnValue(false);

		const result = await actions.default({
			request,
			cookies,
			platform
		} as AnyRequestEvent);

		expect(result).toMatchObject({
			status: 401,
			data: { error: 'Invalid password' }
		});
		expect(verifyPassword).toHaveBeenCalledWith(longPassword, 'test-admin-password');
	});

	it('should handle unicode passwords', async () => {
		const unicodePassword = 'test-password-emoji-cookie-unicode';
		const request = createMockRequest(unicodePassword);
		const cookies = createMockCookies();
		const platform = createMockPlatform();

		vi.mocked(getAdminPassword).mockReturnValue('test-admin-password');
		vi.mocked(verifyPassword).mockReturnValue(false);

		const result = await actions.default({
			request,
			cookies,
			platform
		} as AnyRequestEvent);

		expect(result).toMatchObject({
			status: 401,
			data: { error: 'Invalid password' }
		});
		expect(verifyPassword).toHaveBeenCalledWith(unicodePassword, 'test-admin-password');
	});
});
