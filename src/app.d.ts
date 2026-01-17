// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// Extended Env interface with environment variables
		// These are loaded from .dev.vars locally and Cloudflare Pages env vars in production
		interface ExtendedEnv extends Env {
			STRIPE_SECRET_KEY?: string;
			STRIPE_WEBHOOK_SECRET?: string;
			ADMIN_PASSWORD?: string;
			RESEND_API_KEY?: string;
			/** Set to 'true' to enable sending real emails. Prevents accidental emails in dev/staging. */
			EMAIL_PRODUCTION_MODE?: string;
		}

		interface Platform {
			env: ExtendedEnv;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
