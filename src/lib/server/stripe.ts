import Stripe from 'stripe';

/**
 * Creates a Stripe client instance with the given API key.
 * Use this in server-side code for manual client creation.
 */
export function createStripeClient(apiKey: string): Stripe {
	return new Stripe(apiKey, {
		// Use the latest API version
		apiVersion: '2025-12-15.clover',
		// Set httpClient to fetch for Cloudflare Workers compatibility
		httpClient: Stripe.createFetchHttpClient()
	});
}

/**
 * Gets a Stripe client from environment variables.
 * Throws if STRIPE_SECRET_KEY is not available.
 *
 * @param env - The Cloudflare environment object
 * @returns Stripe client instance
 */
export function getStripeClient(env: { STRIPE_SECRET_KEY?: string }): Stripe {
	const apiKey = env.STRIPE_SECRET_KEY;
	if (!apiKey) {
		throw new Error(
			'STRIPE_SECRET_KEY not configured. Add it to .dev.vars for local development or Cloudflare Pages environment variables for production.'
		);
	}
	return createStripeClient(apiKey);
}

/**
 * Gets a Stripe client from the SvelteKit platform.
 * Throws if platform or STRIPE_SECRET_KEY is not available.
 *
 * @param platform - SvelteKit platform object from RequestEvent
 * @returns Stripe client instance
 */
export function getStripe(platform: App.Platform | undefined): Stripe {
	if (!platform?.env) {
		throw new Error('Platform not available. Are you running in the Cloudflare environment?');
	}
	return getStripeClient(platform.env);
}

/**
 * Verifies a Stripe webhook signature.
 * Returns the verified event or throws if verification fails.
 *
 * @param payload - Raw request body as string
 * @param signature - Stripe-Signature header value
 * @param webhookSecret - Webhook endpoint secret (whsec_...)
 * @returns Verified Stripe event
 */
export async function verifyWebhookSignature(
	payload: string,
	signature: string,
	webhookSecret: string
): Promise<Stripe.Event> {
	const stripe = createStripeClient('dummy'); // We just need the verification method
	return stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
}

// Export the Stripe type for use in other modules
export type { Stripe };
