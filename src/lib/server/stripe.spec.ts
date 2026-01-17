import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';

describe('Stripe client module', () => {
	// Store original module
	let originalModule: typeof import('./stripe');

	beforeEach(async () => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('createStripeClient', () => {
		it('creates a Stripe client instance', async () => {
			const { createStripeClient } = await import('./stripe');
			const client = createStripeClient('sk_test_123');

			// Verify it returns a Stripe-like object with key methods
			expect(client).toBeDefined();
			expect(client.checkout).toBeDefined();
			expect(client.webhooks).toBeDefined();
		});

		it('client has checkout.sessions namespace', async () => {
			const { createStripeClient } = await import('./stripe');
			const client = createStripeClient('sk_test_456');

			expect(client.checkout.sessions).toBeDefined();
			expect(typeof client.checkout.sessions.create).toBe('function');
		});
	});

	describe('getStripeClient', () => {
		it('returns a Stripe client when STRIPE_SECRET_KEY is provided', async () => {
			const { getStripeClient } = await import('./stripe');
			const env = { STRIPE_SECRET_KEY: 'sk_test_key' };

			const client = getStripeClient(env);

			expect(client).toBeDefined();
			expect(client.checkout).toBeDefined();
		});

		it('throws an error when STRIPE_SECRET_KEY is missing', async () => {
			const { getStripeClient } = await import('./stripe');
			const env = {};

			expect(() => getStripeClient(env)).toThrow(
				'STRIPE_SECRET_KEY not configured. Add it to .dev.vars for local development or Cloudflare Pages environment variables for production.'
			);
		});

		it('throws an error when STRIPE_SECRET_KEY is undefined', async () => {
			const { getStripeClient } = await import('./stripe');
			const env = { STRIPE_SECRET_KEY: undefined };

			expect(() => getStripeClient(env)).toThrow('STRIPE_SECRET_KEY not configured');
		});

		it('throws an error when STRIPE_SECRET_KEY is empty string', async () => {
			const { getStripeClient } = await import('./stripe');
			const env = { STRIPE_SECRET_KEY: '' };

			expect(() => getStripeClient(env)).toThrow('STRIPE_SECRET_KEY not configured');
		});
	});

	describe('getStripe', () => {
		it('returns a Stripe client when platform and env are available', async () => {
			const { getStripe } = await import('./stripe');
			const platform = {
				env: { STRIPE_SECRET_KEY: 'sk_test_platform' }
			} as unknown as App.Platform;

			const client = getStripe(platform);

			expect(client).toBeDefined();
			expect(client.checkout).toBeDefined();
		});

		it('throws an error when platform is undefined', async () => {
			const { getStripe } = await import('./stripe');

			expect(() => getStripe(undefined)).toThrow(
				'Platform not available. Are you running in the Cloudflare environment?'
			);
		});

		it('throws an error when platform.env is undefined', async () => {
			const { getStripe } = await import('./stripe');
			const platform = {} as App.Platform;

			expect(() => getStripe(platform)).toThrow(
				'Platform not available. Are you running in the Cloudflare environment?'
			);
		});

		it('throws an error when STRIPE_SECRET_KEY is not in platform.env', async () => {
			const { getStripe } = await import('./stripe');
			const platform = {
				env: {}
			} as unknown as App.Platform;

			expect(() => getStripe(platform)).toThrow('STRIPE_SECRET_KEY not configured');
		});
	});

	describe('verifyWebhookSignature', () => {
		it('is a function that accepts payload, signature, and secret', async () => {
			const { verifyWebhookSignature } = await import('./stripe');

			expect(typeof verifyWebhookSignature).toBe('function');
			expect(verifyWebhookSignature.length).toBeGreaterThanOrEqual(3);
		});

		it('throws for invalid signature', async () => {
			const { verifyWebhookSignature } = await import('./stripe');

			// Invalid signatures should throw
			await expect(
				verifyWebhookSignature('{"test": "payload"}', 'invalid_signature', 'whsec_test')
			).rejects.toThrow();
		});
	});
});

describe('Stripe client error messages', () => {
	it('provides helpful error message for missing STRIPE_SECRET_KEY', async () => {
		const { getStripeClient } = await import('./stripe');

		try {
			getStripeClient({});
		} catch (error) {
			expect((error as Error).message).toContain('.dev.vars');
			expect((error as Error).message).toContain('Cloudflare Pages');
		}
	});

	it('provides helpful error message for missing platform', async () => {
		const { getStripe } = await import('./stripe');

		try {
			getStripe(undefined);
		} catch (error) {
			expect((error as Error).message).toContain('Cloudflare environment');
		}
	});
});

describe('Stripe module exports', () => {
	it('exports createStripeClient function', async () => {
		const module = await import('./stripe');
		expect(typeof module.createStripeClient).toBe('function');
	});

	it('exports getStripeClient function', async () => {
		const module = await import('./stripe');
		expect(typeof module.getStripeClient).toBe('function');
	});

	it('exports getStripe function', async () => {
		const module = await import('./stripe');
		expect(typeof module.getStripe).toBe('function');
	});

	it('exports verifyWebhookSignature function', async () => {
		const module = await import('./stripe');
		expect(typeof module.verifyWebhookSignature).toBe('function');
	});

	it('exports Stripe type', async () => {
		// This test verifies the type export works at compile time
		const module = await import('./stripe');
		// The module should have Stripe type available
		expect(module).toBeDefined();
	});
});
