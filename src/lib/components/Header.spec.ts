import { describe, it, expect } from 'vitest';
import { config, getSortedMenu } from '$lib/config';

/**
 * Unit tests for Header component logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the configuration and logic used by the Header component.
 */
describe('Header Component Logic', () => {
	describe('menu configuration', () => {
		it('has menu items configured', () => {
			expect(config.menu.length).toBeGreaterThan(0);
		});

		it('menu items have required properties', () => {
			config.menu.forEach((item) => {
				expect(item.name).toBeTruthy();
				expect(item.url).toBeTruthy();
				expect(typeof item.weight).toBe('number');
			});
		});

		it('getSortedMenu returns items sorted by weight', () => {
			const sorted = getSortedMenu();
			for (let i = 1; i < sorted.length; i++) {
				expect(sorted[i].weight).toBeGreaterThanOrEqual(sorted[i - 1].weight);
			}
		});

		it('home link is first in sorted menu', () => {
			const sorted = getSortedMenu();
			expect(sorted[0].url).toBe('/');
			expect(sorted[0].name).toBe('Home');
		});
	});

	describe('social links configuration', () => {
		it('instagram config has valid URL when enabled', () => {
			if (config.social.instagramEnabled) {
				expect(config.social.instagram).toMatch(/^https?:\/\//);
			} else {
				expect(true).toBe(true); // Pass if disabled
			}
		});

		it('facebook config has valid URL when enabled', () => {
			if (config.social.facebookEnabled) {
				expect(config.social.facebook).toMatch(/^https?:\/\//);
			} else {
				expect(true).toBe(true); // Pass if disabled
			}
		});
	});

	describe('cart configuration', () => {
		it('cart enabled flag is boolean', () => {
			expect(typeof config.cart.enabled).toBe('boolean');
		});

		it('cart is enabled by default', () => {
			expect(config.cart.enabled).toBe(true);
		});
	});

	describe('calendar configuration', () => {
		it('calendar config has enabled flags', () => {
			expect(typeof config.calendar.enabled).toBe('boolean');
			expect(typeof config.calendar.pageEnabled).toBe('boolean');
		});
	});

	describe('contact configuration', () => {
		it('email config is properly set', () => {
			expect(config.contact.email).toMatch(/@/);
			expect(typeof config.contact.emailEnabled).toBe('boolean');
		});

		it('phone config is properly set', () => {
			expect(config.contact.phone).toBeTruthy();
			expect(typeof config.contact.phoneEnabled).toBe('boolean');
		});
	});

	describe('header styling configuration', () => {
		it('header colors are defined', () => {
			expect(config.colors.headerBg).toBeTruthy();
			expect(config.colors.headerText).toBeTruthy();
		});

		it('site title is defined', () => {
			expect(config.title).toBe('The Cookie Isle');
		});
	});
});
