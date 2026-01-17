import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';

// Mock modules before importing the module under test
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	validateSession: vi.fn()
}));

import { getDb } from '$lib/server/db';
import { validateSession } from '$lib/server/auth';
import { load } from './+layout.server';

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

function createMockPlatform(hasDb = true): App.Platform {
	return {
		env: {
			DB: hasDb ? ({} as D1Database) : undefined,
			ADMIN_PASSWORD: 'test-admin-password'
		},
		context: {
			waitUntil: vi.fn()
		}
	} as unknown as App.Platform;
}

function createMockUrl(pathname: string): URL {
	return new URL(`https://example.com${pathname}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoadParams = Parameters<typeof load>[0];

function createLoadParams(
	options: Partial<{
		sessionId: string | undefined;
		hasDb: boolean;
		pathname: string;
	}> = {}
): LoadParams {
	const { sessionId, hasDb = true, pathname = '/admin' } = options;

	return {
		cookies: createMockCookies(sessionId),
		platform: createMockPlatform(hasDb),
		url: createMockUrl(pathname)
	} as unknown as LoadParams;
}

// ============================================================================
// Login Page Exclusion Tests
// ============================================================================

describe('login page exclusion', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should skip auth check for /admin/login path', async () => {
		const params = createLoadParams({ pathname: '/admin/login' });

		const result = await load(params);

		expect(result).toEqual({});
		expect(params.cookies.get).not.toHaveBeenCalled();
		expect(validateSession).not.toHaveBeenCalled();
	});

	it('should return empty object for login page without session', async () => {
		const params = createLoadParams({ pathname: '/admin/login', sessionId: undefined });

		const result = await load(params);

		expect(result).toEqual({});
	});

	it('should return empty object for login page even with session', async () => {
		const params = createLoadParams({ pathname: '/admin/login', sessionId: 'some-session' });

		const result = await load(params);

		expect(result).toEqual({});
		// Should not check the session for login page
		expect(validateSession).not.toHaveBeenCalled();
	});
});

// ============================================================================
// Missing Session Cookie Tests
// ============================================================================

describe('missing session cookie', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should redirect to /admin/login when no session cookie exists', async () => {
		const params = createLoadParams({ sessionId: undefined, pathname: '/admin' });

		let redirectThrown = false;
		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectThrown = true;
			redirectError = e;
		}

		expect(redirectThrown).toBe(true);
		expect(redirectError).toHaveProperty('status', 303);
		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should redirect to login for admin dashboard without session', async () => {
		const params = createLoadParams({ sessionId: undefined, pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should redirect to login for admin orders page without session', async () => {
		const params = createLoadParams({ sessionId: undefined, pathname: '/admin/orders' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should redirect to login for admin products page without session', async () => {
		const params = createLoadParams({ sessionId: undefined, pathname: '/admin/products' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should redirect to login for nested admin pages without session', async () => {
		const params = createLoadParams({ sessionId: undefined, pathname: '/admin/orders/123' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});
});

// ============================================================================
// Database Unavailable Tests
// ============================================================================

describe('database unavailable', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should redirect to login when database is not available', async () => {
		const params = createLoadParams({
			sessionId: 'some-session',
			hasDb: false,
			pathname: '/admin'
		});

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('status', 303);
		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should not call validateSession when database is unavailable', async () => {
		const params = createLoadParams({
			sessionId: 'some-session',
			hasDb: false,
			pathname: '/admin'
		});

		try {
			await load(params);
		} catch {
			// Expected redirect
		}

		expect(validateSession).not.toHaveBeenCalled();
	});

	it('should redirect to login when platform is undefined', async () => {
		const cookies = createMockCookies('some-session');
		const url = createMockUrl('/admin');
		const params = { cookies, platform: undefined, url } as unknown as LoadParams;

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should redirect to login when platform.env is undefined', async () => {
		const cookies = createMockCookies('some-session');
		const url = createMockUrl('/admin');
		const params = {
			cookies,
			platform: { context: { waitUntil: vi.fn() } },
			url
		} as unknown as LoadParams;

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});
});

// ============================================================================
// Session Validation Tests
// ============================================================================

describe('session validation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call validateSession with correct parameters', async () => {
		const mockDb = { mockDb: true };
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({
			valid: true,
			sessionId: 'valid-session',
			expiresAt: new Date(Date.now() + 86400000)
		});

		const params = createLoadParams({ sessionId: 'test-session-id', pathname: '/admin' });

		await load(params);

		expect(getDb).toHaveBeenCalled();
		expect(validateSession).toHaveBeenCalledWith(mockDb, 'test-session-id');
	});

	it('should return authenticated: true when session is valid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({
			valid: true,
			sessionId: 'valid-session',
			expiresAt: new Date(Date.now() + 86400000)
		});

		const params = createLoadParams({ sessionId: 'valid-session', pathname: '/admin' });

		const result = await load(params);

		expect(result).toEqual({ authenticated: true });
	});

	it('should allow access to admin dashboard with valid session', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({
			valid: true,
			sessionId: 'valid-session',
			expiresAt: new Date(Date.now() + 86400000)
		});

		const params = createLoadParams({ sessionId: 'valid-session', pathname: '/admin' });

		const result = await load(params);

		expect(result).toHaveProperty('authenticated', true);
	});

	it('should allow access to admin orders with valid session', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: true });

		const params = createLoadParams({ sessionId: 'valid-session', pathname: '/admin/orders' });

		const result = await load(params);

		expect(result).toHaveProperty('authenticated', true);
	});

	it('should allow access to nested admin pages with valid session', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: true });

		const params = createLoadParams({
			sessionId: 'valid-session',
			pathname: '/admin/products/123/edit'
		});

		const result = await load(params);

		expect(result).toHaveProperty('authenticated', true);
	});
});

// ============================================================================
// Invalid Session Tests
// ============================================================================

describe('invalid session', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should redirect to login when session is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: false });

		const params = createLoadParams({ sessionId: 'invalid-session', pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('status', 303);
		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should clear the cookie when session is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: false });

		const params = createLoadParams({ sessionId: 'invalid-session', pathname: '/admin' });

		try {
			await load(params);
		} catch {
			// Expected redirect
		}

		expect(params.cookies.delete).toHaveBeenCalledWith('admin_session', { path: '/admin' });
	});

	it('should redirect when session is expired', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: false });

		const params = createLoadParams({ sessionId: 'expired-session', pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should redirect when session does not exist in database', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: false });

		const params = createLoadParams({ sessionId: 'non-existent-session', pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('error handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should redirect to login when validateSession throws an error', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockRejectedValue(new Error('Database connection error'));

		const params = createLoadParams({ sessionId: 'some-session', pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('status', 303);
		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should clear cookie when validation throws error', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockRejectedValue(new Error('Database error'));

		const params = createLoadParams({ sessionId: 'some-session', pathname: '/admin' });

		try {
			await load(params);
		} catch {
			// Expected redirect
		}

		expect(params.cookies.delete).toHaveBeenCalledWith('admin_session', { path: '/admin' });
	});

	it('should redirect to login when getDb throws an error', async () => {
		vi.mocked(getDb).mockImplementation(() => {
			throw new Error('Failed to get database');
		});

		const params = createLoadParams({ sessionId: 'some-session', pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});

	it('should handle network errors gracefully', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockRejectedValue(new Error('Network timeout'));

		const params = createLoadParams({ sessionId: 'some-session', pathname: '/admin' });

		let redirectError: unknown;
		try {
			await load(params);
		} catch (e) {
			redirectError = e;
		}

		expect(redirectError).toHaveProperty('location', '/admin/login');
	});
});

// ============================================================================
// Cookie Handling Tests
// ============================================================================

describe('cookie handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should read admin_session cookie', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: true });

		const params = createLoadParams({ sessionId: 'my-session', pathname: '/admin' });

		await load(params);

		expect(params.cookies.get).toHaveBeenCalledWith('admin_session');
	});

	it('should delete cookie with correct path when clearing', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: false });

		const params = createLoadParams({ sessionId: 'invalid-session', pathname: '/admin' });

		try {
			await load(params);
		} catch {
			// Expected redirect
		}

		expect(params.cookies.delete).toHaveBeenCalledWith('admin_session', { path: '/admin' });
	});

	it('should not delete cookie when session is valid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
		vi.mocked(validateSession).mockResolvedValue({ valid: true });

		const params = createLoadParams({ sessionId: 'valid-session', pathname: '/admin' });

		await load(params);

		expect(params.cookies.delete).not.toHaveBeenCalled();
	});
});

// ============================================================================
// Multiple Admin Routes Tests
// ============================================================================

describe('multiple admin routes protection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const adminRoutes = [
		'/admin',
		'/admin/orders',
		'/admin/orders/123',
		'/admin/products',
		'/admin/products/new',
		'/admin/products/456',
		'/admin/slots',
		'/admin/newsletter',
		'/admin/settings'
	];

	adminRoutes.forEach((route) => {
		it(`should protect ${route} route`, async () => {
			const params = createLoadParams({ sessionId: undefined, pathname: route });

			let redirectError: unknown;
			try {
				await load(params);
			} catch (e) {
				redirectError = e;
			}

			expect(redirectError).toHaveProperty('location', '/admin/login');
		});
	});

	adminRoutes.forEach((route) => {
		it(`should allow access to ${route} with valid session`, async () => {
			const mockDb = {};
			vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);
			vi.mocked(validateSession).mockResolvedValue({ valid: true });

			const params = createLoadParams({ sessionId: 'valid-session', pathname: route });

			const result = await load(params);

			expect(result).toHaveProperty('authenticated', true);
		});
	});
});

// ============================================================================
// Type Export Tests
// ============================================================================

describe('type exports', () => {
	it('should export load function', () => {
		expect(typeof load).toBe('function');
	});

	it('load function should be async', () => {
		expect(load.constructor.name).toBe('AsyncFunction');
	});
});
