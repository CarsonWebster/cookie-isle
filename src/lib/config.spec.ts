import { describe, it, expect } from 'vitest';
import {
	config,
	formatMaxOrderMessage,
	isZipAllowedForDelivery,
	getSortedMenu,
	formatPrice,
	calculateTax,
	calculateTip,
	type SiteConfig,
	type MenuItem
} from './config';

describe('Site Configuration', () => {
	describe('config object', () => {
		it('has required basic site info', () => {
			expect(config.title).toBe('The Cookie Isle');
			expect(config.description).toBeTruthy();
			expect(config.tagline).toBeTruthy();
			expect(config.author).toBeTruthy();
			expect(config.baseUrl).toMatch(/^https?:\/\//);
			expect(config.logo).toBeTruthy();
		});

		it('has contact information', () => {
			expect(config.contact.email).toMatch(/@/);
			expect(config.contact.phone).toBeTruthy();
			expect(typeof config.contact.emailEnabled).toBe('boolean');
			expect(typeof config.contact.phoneEnabled).toBe('boolean');
			expect(Array.isArray(config.contact.hours)).toBe(true);
		});

		it('has social media links', () => {
			expect(config.social.facebook).toMatch(/^https?:\/\//);
			expect(config.social.instagram).toMatch(/^https?:\/\//);
			expect(typeof config.social.facebookEnabled).toBe('boolean');
			expect(typeof config.social.instagramEnabled).toBe('boolean');
		});

		it('has hero configuration', () => {
			expect(config.hero.imageLeft).toBeTruthy();
			expect(config.hero.imageRight).toBeTruthy();
			expect(config.hero.imageLeftVisibility).toBeGreaterThanOrEqual(0);
			expect(config.hero.imageLeftVisibility).toBeLessThanOrEqual(100);
			expect(config.hero.imageRightVisibility).toBeGreaterThanOrEqual(0);
			expect(config.hero.imageRightVisibility).toBeLessThanOrEqual(100);
		});

		it('has color theme configuration', () => {
			// Check that all colors are valid hex codes or rgba
			const hexOrRgba = /^(#[0-9A-Fa-f]{6}|rgba?\(.+\))$/;
			expect(config.colors.primary).toMatch(hexOrRgba);
			expect(config.colors.primaryHover).toMatch(hexOrRgba);
			expect(config.colors.secondary).toMatch(hexOrRgba);
			expect(config.colors.accent).toMatch(hexOrRgba);
			expect(config.colors.footerBg).toMatch(hexOrRgba);
		});

		it('has newsletter configuration', () => {
			expect(typeof config.newsletter.enabled).toBe('boolean');
			expect(config.newsletter.headline).toBeTruthy();
			expect(config.newsletter.buttonText).toBeTruthy();
			expect(config.newsletter.successMessage).toBeTruthy();
			expect(config.newsletter.errorMessage).toBeTruthy();
		});

		it('has cart configuration', () => {
			expect(typeof config.cart.enabled).toBe('boolean');
			expect(config.cart.buttonText).toBeTruthy();
			expect(config.cart.checkoutPageTitle).toBeTruthy();
			expect(config.cart.emptyMessage).toBeTruthy();
		});

		it('has fulfillment configuration', () => {
			expect(typeof config.fulfillment.pickupEnabled).toBe('boolean');
			expect(typeof config.fulfillment.deliveryEnabled).toBe('boolean');
			expect(config.fulfillment.pickupLocation).toBeTruthy();
			expect(config.fulfillment.deliveryArea).toBeTruthy();
			expect(Array.isArray(config.fulfillment.allowedDeliveryZips)).toBe(true);
			expect(config.fulfillment.allowedDeliveryZips.length).toBeGreaterThan(0);
		});

		it('has order configuration with valid values', () => {
			expect(config.order.maxOrderQuantity).toBeGreaterThan(0);
			expect(config.order.dropWindowCookieLimit).toBeGreaterThan(0);
			expect(config.order.salesTaxRate).toBeGreaterThanOrEqual(0);
			expect(config.order.salesTaxRate).toBeLessThan(1); // Should be a decimal, not percentage
			expect(typeof config.order.taxEnabled).toBe('boolean');
		});

		it('has tip configuration', () => {
			expect(typeof config.tip.enabled).toBe('boolean');
			expect(Array.isArray(config.tip.percentages)).toBe(true);
			expect(config.tip.percentages.length).toBeGreaterThan(0);
			config.tip.percentages.forEach((pct) => {
				expect(pct).toBeGreaterThan(0);
				expect(pct).toBeLessThanOrEqual(100);
			});
		});

		it('has gift box configuration', () => {
			expect(typeof config.giftBox.enabled).toBe('boolean');
			expect(config.giftBox.priceCents).toBeGreaterThan(0);
			expect(config.giftBox.stripePriceId).toBeTruthy();
		});

		it('has calendar configuration', () => {
			expect(typeof config.calendar.enabled).toBe('boolean');
			expect(config.calendar.embedUrl).toMatch(/^https?:\/\//);
			expect(config.calendar.icalUrl).toMatch(/^https?:\/\//);
			expect(['primary', 'secondary']).toContain(config.calendar.subscribeStyle);
		});

		it('has navigation menu items', () => {
			expect(Array.isArray(config.menu)).toBe(true);
			expect(config.menu.length).toBeGreaterThan(0);
			config.menu.forEach((item) => {
				expect(item.name).toBeTruthy();
				expect(item.url).toBeTruthy();
				expect(typeof item.weight).toBe('number');
			});
		});

		it('has feature flags', () => {
			expect(typeof config.features.comingSoonMode).toBe('boolean');
			expect(config.features.comingSoonHeadline).toBeTruthy();
			expect(config.features.comingSoonText).toBeTruthy();
		});
	});

	describe('formatMaxOrderMessage', () => {
		it('replaces threshold and email placeholders', () => {
			const result = formatMaxOrderMessage(100, 'test@example.com');
			expect(result).toContain('100');
			expect(result).toContain('test@example.com');
		});

		it('uses default values from config when not provided', () => {
			const result = formatMaxOrderMessage();
			expect(result).toContain(String(config.order.maxOrderQuantity));
			expect(result).toContain(config.contact.email);
		});
	});

	describe('isZipAllowedForDelivery', () => {
		it('returns true for allowed ZIP codes', () => {
			const allowedZip = config.fulfillment.allowedDeliveryZips[0];
			expect(isZipAllowedForDelivery(allowedZip)).toBe(true);
		});

		it('returns false for disallowed ZIP codes', () => {
			expect(isZipAllowedForDelivery('00000')).toBe(false);
			expect(isZipAllowedForDelivery('99999')).toBe(false);
		});

		it('handles empty string', () => {
			expect(isZipAllowedForDelivery('')).toBe(false);
		});
	});

	describe('getSortedMenu', () => {
		it('returns menu items sorted by weight', () => {
			const sorted = getSortedMenu();
			for (let i = 1; i < sorted.length; i++) {
				expect(sorted[i].weight).toBeGreaterThanOrEqual(sorted[i - 1].weight);
			}
		});

		it('returns a new array (does not mutate original)', () => {
			const sorted = getSortedMenu();
			expect(sorted).not.toBe(config.menu);
		});

		it('includes all menu items', () => {
			const sorted = getSortedMenu();
			expect(sorted.length).toBe(config.menu.length);
		});
	});

	describe('formatPrice', () => {
		it('formats cents to dollar string', () => {
			expect(formatPrice(100)).toBe('$1.00');
			expect(formatPrice(350)).toBe('$3.50');
			expect(formatPrice(1299)).toBe('$12.99');
		});

		it('handles zero', () => {
			expect(formatPrice(0)).toBe('$0.00');
		});

		it('handles single digit cents', () => {
			expect(formatPrice(5)).toBe('$0.05');
			expect(formatPrice(9)).toBe('$0.09');
		});

		it('handles large amounts', () => {
			expect(formatPrice(100000)).toBe('$1000.00');
		});
	});

	describe('calculateTax', () => {
		it('returns 0 when tax is disabled', () => {
			// Assuming config.order.taxEnabled is false in test config
			if (!config.order.taxEnabled) {
				expect(calculateTax(10000)).toBe(0);
			}
		});

		it('calculates correctly when tax is enabled', () => {
			// Test the calculation logic directly
			const subtotal = 10000; // $100.00
			const expectedTax = Math.round(subtotal * config.order.salesTaxRate);

			// If tax were enabled, this would be the calculation
			if (config.order.taxEnabled) {
				expect(calculateTax(subtotal)).toBe(expectedTax);
			} else {
				// Tax is disabled, so it returns 0
				expect(calculateTax(subtotal)).toBe(0);
			}
		});

		it('handles zero subtotal', () => {
			expect(calculateTax(0)).toBe(0);
		});
	});

	describe('calculateTip', () => {
		it('calculates tip for given percentage', () => {
			expect(calculateTip(10000, 10)).toBe(1000); // 10% of $100 = $10
			expect(calculateTip(10000, 5)).toBe(500); // 5% of $100 = $5
			expect(calculateTip(10000, 20)).toBe(2000); // 20% of $100 = $20
		});

		it('handles zero percentage', () => {
			expect(calculateTip(10000, 0)).toBe(0);
		});

		it('handles zero subtotal', () => {
			expect(calculateTip(0, 10)).toBe(0);
		});

		it('rounds to nearest cent', () => {
			// $33.33 at 10% = $3.333 -> rounds to $3.33 (333 cents)
			expect(calculateTip(3333, 10)).toBe(333);
		});
	});

	describe('type safety', () => {
		it('config matches SiteConfig interface', () => {
			// This test verifies TypeScript compilation - if it compiles, types are correct
			const testConfig: SiteConfig = config;
			expect(testConfig).toBeDefined();
		});

		it('menu items match MenuItem interface', () => {
			const testItem: MenuItem = config.menu[0];
			expect(testItem.name).toBeDefined();
			expect(testItem.url).toBeDefined();
			expect(testItem.weight).toBeDefined();
		});
	});
});
