/**
 * Site Configuration
 *
 * This module contains all site-wide configuration settings migrated from the legacy hugo.toml.
 * It provides a typed, centralized configuration object for the entire application.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/** Contact information configuration */
export interface ContactConfig {
	email: string;
	emailEnabled: boolean;
	phone: string;
	phoneEnabled: boolean;
	address: string;
	addressEnabled: boolean;
	hours: string[];
	hoursEnabled: boolean;
}

/** Social media links configuration */
export interface SocialConfig {
	facebook: string;
	facebookEnabled: boolean;
	instagram: string;
	instagramEnabled: boolean;
}

/** Hero section configuration */
export interface HeroConfig {
	imageLeft: string;
	imageLeftVisibility: number;
	imageRight: string;
	imageRightVisibility: number;
}

/** Newsletter configuration */
export interface NewsletterConfig {
	enabled: boolean;
	headline: string;
	placeholder: string;
	buttonText: string;
	successMessage: string;
	errorMessage: string;
	/** Email settings for welcome emails */
	email: {
		enabled: boolean;
		fromAddress: string;
		fromName: string;
		welcomeSubject: string;
	};
}

/** Cart and checkout configuration */
export interface CartConfig {
	enabled: boolean;
	buttonText: string;
	checkoutButtonText: string;
	checkoutPageTitle: string;
	emptyMessage: string;
	successMessage: string;
	errorMessage: string;
}

/** Fulfillment (pickup/delivery) configuration */
export interface FulfillmentConfig {
	pickupEnabled: boolean;
	deliveryEnabled: boolean;
	pickupLocation: string;
	deliveryArea: string;
	allowedDeliveryZips: string[];
	deliveryZipError: string;
}

/** Order limits and pricing configuration */
export interface OrderConfig {
	maxOrderQuantity: number;
	maxOrderMessage: string;
	dropWindowCookieLimit: number;
	dropWindowSoldOutMessage: string;
	taxEnabled: boolean;
	salesTaxRate: number;
	smallOrderFeeThreshold: number;
}

/** Tip configuration */
export interface TipConfig {
	enabled: boolean;
	percentages: number[];
}

/** Gift box configuration */
export interface GiftBoxConfig {
	enabled: boolean;
	priceCents: number;
	stripePriceId: string;
}

/** Google Calendar configuration */
export interface CalendarConfig {
	enabled: boolean;
	embedUrl: string;
	icalUrl: string;
	pageEnabled: boolean;
	homepageEnabled: boolean;
	homepageTitle: string;
	homepageSubscribeEnabled: boolean;
	subscribeEnabled: boolean;
	subscribeText: string;
	subscribeStyle: 'primary' | 'secondary';
}

/** Navigation menu item */
export interface MenuItem {
	name: string;
	url: string;
	weight: number;
}

/** Color theme configuration */
export interface ColorsConfig {
	primary: string;
	primaryHover: string;
	secondary: string;
	secondaryDark: string;
	tertiary: string;
	tertiaryLight: string;
	tertiaryMedium: string;
	accent: string;
	textLight: string;
	cardBg: string;
	overlay: string;
	headerBg: string;
	headerText: string;
	footerBg: string;
	footerText: string;
	footerHeading: string;
	btnBg: string;
	btnText: string;
	btnHoverBg: string;
	btnNavBg: string;
}

/** Feature flags for enabling/disabling site features */
export interface FeatureFlags {
	comingSoonMode: boolean;
	comingSoonHeadline: string;
	comingSoonText: string;
}

/** Complete site configuration */
export interface SiteConfig {
	// Basic site info
	title: string;
	description: string;
	tagline: string;
	author: string;
	baseUrl: string;
	logo: string;

	// Contact and social
	contact: ContactConfig;
	social: SocialConfig;

	// Visual configuration
	hero: HeroConfig;
	colors: ColorsConfig;

	// Feature configurations
	newsletter: NewsletterConfig;
	cart: CartConfig;
	fulfillment: FulfillmentConfig;
	order: OrderConfig;
	tip: TipConfig;
	giftBox: GiftBoxConfig;
	calendar: CalendarConfig;

	// Navigation
	menu: MenuItem[];

	// Feature flags
	features: FeatureFlags;
}

// ============================================================================
// Configuration Object
// ============================================================================

/**
 * Site configuration object containing all settings migrated from legacy hugo.toml.
 * This is the single source of truth for site-wide configuration.
 */
export const config: SiteConfig = {
	// -------------------------------------------------------------------------
	// Basic Site Information
	// -------------------------------------------------------------------------
	title: 'The Cookie Isle',
	description: 'Fresh-baked cookies made with love at our cozy cottage-bakery',
	tagline: 'Sugar and sand makes life grand!',
	author: 'The Cookie Isle',
	baseUrl: 'https://thecookieisle.com',
	logo: 'CookieIsleLogo.png',

	// -------------------------------------------------------------------------
	// Contact Information
	// -------------------------------------------------------------------------
	contact: {
		email: 'contact@thecookieisle.com',
		emailEnabled: true,
		phone: '(555) 123-COOKIE',
		phoneEnabled: false,
		address: '123 Baker Street, Sweet Town, CA 90210',
		addressEnabled: false,
		hours: ['Mon-Fri: 7am - 6pm', 'Saturday: 8am - 5pm', 'Sunday: 9am - 2pm'],
		hoursEnabled: false
	},

	// -------------------------------------------------------------------------
	// Social Media
	// -------------------------------------------------------------------------
	social: {
		facebook: 'https://facebook.com/thecookieisle',
		facebookEnabled: false,
		instagram: 'https://instagram.com/thecookieisle',
		instagramEnabled: true
	},

	// -------------------------------------------------------------------------
	// Hero Section
	// -------------------------------------------------------------------------
	hero: {
		imageLeft: 'Palmtreeart.png',
		imageLeftVisibility: 100,
		imageRight: 'Cookieart.png',
		imageRightVisibility: 100
	},

	// -------------------------------------------------------------------------
	// Colors
	// -------------------------------------------------------------------------
	colors: {
		// Primary - Ocean teal
		primary: '#4CA2C2',
		primaryHover: '#173448',

		// Secondary - Warm brown
		secondary: '#5C4033',
		secondaryDark: '#3D2B1F',

		// Tertiary - Sandy beach tones
		tertiary: '#FBF8F3',
		tertiaryLight: '#FDFCFA',
		tertiaryMedium: '#E8E4DC',

		// Accent - Golden sun
		accent: '#E9B44C',

		// Text
		textLight: '#5D6B6A',

		// Surface
		cardBg: '#FFFFFF',
		overlay: 'rgba(38, 70, 83, 0.6)',

		// Header
		headerBg: '#FBF8F3',
		headerText: '#5C4033',

		// Footer
		footerBg: '#264653',
		footerText: '#FBF8F3',
		footerHeading: '#E9B44C',

		// Buttons
		btnBg: '#4CA2C2',
		btnText: '#FDFCFA',
		btnHoverBg: '#264653',
		btnNavBg: '#E9B44C'
	},

	// -------------------------------------------------------------------------
	// Newsletter
	// -------------------------------------------------------------------------
	newsletter: {
		enabled: true,
		headline: 'Get Notified When We Launch!',
		placeholder: 'Enter your email',
		buttonText: 'Notify Me',
		successMessage: "Thanks for signing up! We'll let you know when we launch.",
		errorMessage: 'Something went wrong. Please try again.',
		email: {
			enabled: true,
			fromAddress: 'contact@thecookieisle.com',
			fromName: 'The Cookie Isle',
			welcomeSubject: 'Welcome to The Cookie Isle!'
		}
	},

	// -------------------------------------------------------------------------
	// Cart & Checkout
	// -------------------------------------------------------------------------
	cart: {
		enabled: true,
		buttonText: 'Add to Cart',
		checkoutButtonText: 'Cart',
		checkoutPageTitle: 'Your Cart',
		emptyMessage: 'Your cart is empty. Browse our delicious cookies!',
		successMessage: "Thank you for your order! We'll be in touch soon.",
		errorMessage: 'Something went wrong. Please try again.'
	},

	// -------------------------------------------------------------------------
	// Fulfillment (Pickup/Delivery)
	// -------------------------------------------------------------------------
	fulfillment: {
		pickupEnabled: true,
		deliveryEnabled: true,
		pickupLocation: 'Coronado Island',
		deliveryArea: 'Coronado Island',
		allowedDeliveryZips: ['92118'],
		deliveryZipError:
			'Sorry, we only deliver to Coronado Island (ZIP 92118). Please select pickup instead, or contact us for special arrangements.'
	},

	// -------------------------------------------------------------------------
	// Order Settings
	// -------------------------------------------------------------------------
	order: {
		maxOrderQuantity: 50,
		maxOrderMessage:
			'For orders of more than {threshold} cookies, please contact us at {email} to discuss your order.',
		dropWindowCookieLimit: 200,
		dropWindowSoldOutMessage: 'Sold out for this date',
		taxEnabled: false,
		salesTaxRate: 0.0775,
		smallOrderFeeThreshold: 10
	},

	// -------------------------------------------------------------------------
	// Tip Settings
	// -------------------------------------------------------------------------
	tip: {
		enabled: true,
		percentages: [5, 10, 20]
	},

	// -------------------------------------------------------------------------
	// Gift Box Settings
	// -------------------------------------------------------------------------
	giftBox: {
		enabled: true,
		priceCents: 300, // $3.00
		stripePriceId: 'price_1ShNdrD2fyOJEz3alD8KqIOa'
	},

	// -------------------------------------------------------------------------
	// Google Calendar
	// -------------------------------------------------------------------------
	calendar: {
		enabled: false,
		embedUrl:
			'https://calendar.google.com/calendar/embed?src=c_5099568f04822947c2b6fbf47ad6667e9d9902df5c16e5c82ee5261c348079ae%40group.calendar.google.com&ctz=America%2FLos_Angeles',
		icalUrl:
			'https://calendar.google.com/calendar/ical/c_5099568f04822947c2b6fbf47ad6667e9d9902df5c16e5c82ee5261c348079ae%40group.calendar.google.com/public/basic.ics',
		pageEnabled: true,
		homepageEnabled: true,
		homepageTitle: 'Upcoming Events',
		homepageSubscribeEnabled: false,
		subscribeEnabled: true,
		subscribeText: 'Subscribe to Calendar',
		subscribeStyle: 'secondary'
	},

	// -------------------------------------------------------------------------
	// Navigation Menu
	// -------------------------------------------------------------------------
	menu: [
		{ name: 'Home', url: '/', weight: 1 },
		{ name: 'Menu', url: '/menu', weight: 2 },
		{ name: 'About', url: '/about', weight: 3 }
	],

	// -------------------------------------------------------------------------
	// Feature Flags
	// -------------------------------------------------------------------------
	features: {
		comingSoonMode: true,
		comingSoonHeadline: 'Coming Soon',
		comingSoonText: `I'm busy baking up something special!
The Cookie Isle is a cozy cottage bakery bringing fresh baked happiness to our community. 
Follow to be the first to know when we open!

Located in Coronado, CA`
	}
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats the max order message with the threshold and email values.
 * @param threshold - The maximum order quantity
 * @param email - The contact email address
 * @returns The formatted message string
 */
export function formatMaxOrderMessage(
	threshold: number = config.order.maxOrderQuantity,
	email: string = config.contact.email
): string {
	return config.order.maxOrderMessage
		.replace('{threshold}', String(threshold))
		.replace('{email}', email);
}

/**
 * Checks if a ZIP code is in the allowed delivery area.
 * @param zip - The ZIP code to check
 * @returns true if the ZIP is allowed for delivery
 */
export function isZipAllowedForDelivery(zip: string): boolean {
	return config.fulfillment.allowedDeliveryZips.includes(zip);
}

/**
 * Gets the sorted menu items.
 * @returns Menu items sorted by weight
 */
export function getSortedMenu(): MenuItem[] {
	return [...config.menu].sort((a, b) => a.weight - b.weight);
}

/**
 * Formats a price from cents to a display string.
 * @param cents - The price in cents
 * @returns Formatted price string (e.g., "$3.50")
 */
export function formatPrice(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculates tax amount from a subtotal.
 * @param subtotalCents - The subtotal in cents
 * @returns The tax amount in cents (0 if tax is disabled)
 */
export function calculateTax(subtotalCents: number): number {
	if (!config.order.taxEnabled) {
		return 0;
	}
	return Math.round(subtotalCents * config.order.salesTaxRate);
}

/**
 * Calculates tip amount from a subtotal and percentage.
 * @param subtotalCents - The subtotal in cents
 * @param percentage - The tip percentage (e.g., 10 for 10%)
 * @returns The tip amount in cents
 */
export function calculateTip(subtotalCents: number, percentage: number): number {
	return Math.round(subtotalCents * (percentage / 100));
}

// Default export for convenience
export default config;
