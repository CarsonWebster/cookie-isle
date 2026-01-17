import { describe, it, expect } from 'vitest';
import { config, getSortedMenu } from '$lib/config';

/**
 * Unit tests for Footer component logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the configuration and logic used by the Footer component.
 */
describe('Footer Component Logic', () => {
	describe('brand section configuration', () => {
		it('site title is defined', () => {
			expect(config.title).toBeTruthy();
			expect(config.title).toBe('The Cookie Isle');
		});

		it('tagline is defined', () => {
			expect(config.tagline).toBeTruthy();
		});

		it('description is defined', () => {
			expect(config.description).toBeTruthy();
		});
	});

	describe('navigation links configuration', () => {
		it('has menu items configured', () => {
			expect(config.menu.length).toBeGreaterThan(0);
		});

		it('getSortedMenu returns items sorted by weight', () => {
			const sorted = getSortedMenu();
			for (let i = 1; i < sorted.length; i++) {
				expect(sorted[i].weight).toBeGreaterThanOrEqual(sorted[i - 1].weight);
			}
		});

		it('all menu items have valid URLs', () => {
			const sorted = getSortedMenu();
			sorted.forEach((item) => {
				expect(item.url).toBeTruthy();
				expect(item.url.startsWith('/')).toBe(true);
			});
		});
	});

	describe('contact configuration', () => {
		it('email config is properly set', () => {
			expect(config.contact.email).toBeTruthy();
			expect(config.contact.email).toMatch(/@/);
			expect(typeof config.contact.emailEnabled).toBe('boolean');
		});

		it('phone config is properly set', () => {
			expect(config.contact.phone).toBeTruthy();
			expect(typeof config.contact.phoneEnabled).toBe('boolean');
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

		it('social enabled flags are booleans', () => {
			expect(typeof config.social.instagramEnabled).toBe('boolean');
			expect(typeof config.social.facebookEnabled).toBe('boolean');
		});
	});

	describe('calendar configuration', () => {
		it('calendar config has enabled flags', () => {
			expect(typeof config.calendar.enabled).toBe('boolean');
			expect(typeof config.calendar.pageEnabled).toBe('boolean');
		});
	});

	describe('footer styling configuration', () => {
		it('footer colors are defined', () => {
			expect(config.colors.footerBg).toBeTruthy();
			expect(config.colors.footerText).toBeTruthy();
			expect(config.colors.footerHeading).toBeTruthy();
		});

		it('footer colors are valid hex values', () => {
			const hexRegex = /^#[0-9A-Fa-f]{6}$/;
			expect(config.colors.footerBg).toMatch(hexRegex);
			expect(config.colors.footerText).toMatch(hexRegex);
			expect(config.colors.footerHeading).toMatch(hexRegex);
		});
	});

	describe('copyright year logic', () => {
		it('current year is a valid 4-digit year', () => {
			const currentYear = new Date().getFullYear();
			expect(currentYear).toBeGreaterThanOrEqual(2024);
			expect(currentYear).toBeLessThanOrEqual(2100);
			expect(String(currentYear)).toHaveLength(4);
		});
	});
});
