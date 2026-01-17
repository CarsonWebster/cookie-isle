import { describe, it, expect } from 'vitest';
import { config } from '$lib/config';

/**
 * Unit tests for Hero component logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the configuration and logic used by the Hero component.
 *
 * PRD Reference: 2.1
 */
describe('Hero Component Logic', () => {
	describe('hero configuration', () => {
		it('hero config exists in site config', () => {
			expect(config.hero).toBeDefined();
		});

		it('hero has image configuration', () => {
			expect(config.hero.imageLeft).toBeTruthy();
			expect(config.hero.imageRight).toBeTruthy();
		});

		it('hero image visibility values are numbers', () => {
			expect(typeof config.hero.imageLeftVisibility).toBe('number');
			expect(typeof config.hero.imageRightVisibility).toBe('number');
		});

		it('hero image visibility is in valid range (0-100)', () => {
			expect(config.hero.imageLeftVisibility).toBeGreaterThanOrEqual(0);
			expect(config.hero.imageLeftVisibility).toBeLessThanOrEqual(100);
			expect(config.hero.imageRightVisibility).toBeGreaterThanOrEqual(0);
			expect(config.hero.imageRightVisibility).toBeLessThanOrEqual(100);
		});
	});

	describe('site branding for hero', () => {
		it('site title is defined and non-empty', () => {
			expect(config.title).toBeTruthy();
			expect(config.title.length).toBeGreaterThan(0);
		});

		it('site tagline is defined', () => {
			expect(config.tagline).toBeTruthy();
		});

		it('site title is "The Cookie Isle"', () => {
			expect(config.title).toBe('The Cookie Isle');
		});

		it('tagline is the expected beach theme', () => {
			expect(config.tagline).toContain('sand');
		});
	});

	describe('hero colors and styling', () => {
		it('primary color is defined for CTA button', () => {
			expect(config.colors.primary).toBeTruthy();
			expect(config.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});

		it('button hover color is defined', () => {
			expect(config.colors.btnHoverBg).toBeTruthy();
			expect(config.colors.btnHoverBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});

		it('secondary color is defined for title text', () => {
			expect(config.colors.secondary).toBeTruthy();
			expect(config.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});

		it('text-light color is defined for tagline', () => {
			expect(config.colors.textLight).toBeTruthy();
			expect(config.colors.textLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});

		it('tertiary colors are defined for gradient background', () => {
			expect(config.colors.tertiary).toBeTruthy();
			expect(config.colors.tertiaryLight).toBeTruthy();
			expect(config.colors.tertiaryMedium).toBeTruthy();
		});

		it('accent color is defined for decorative elements', () => {
			expect(config.colors.accent).toBeTruthy();
			expect(config.colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});
	});

	describe('hero props validation', () => {
		it('title prop would be required (not undefined)', () => {
			// This tests that our expected usage passes a title
			const testTitle = config.title;
			expect(testTitle).toBeDefined();
			expect(typeof testTitle).toBe('string');
		});

		it('tagline prop is optional but available from config', () => {
			// tagline is optional in Props interface but config provides one
			const testTagline = config.tagline;
			expect(testTagline).toBeDefined();
		});

		it('menu page exists for CTA href', () => {
			// Verify the menu page URL exists in config (commonly used as CTA)
			const menuItem = config.menu.find((item) => item.url === '/menu');
			expect(menuItem).toBeDefined();
		});
	});

	describe('cart configuration for hero CTA', () => {
		it('cart is enabled for "Browse Menu" type CTAs', () => {
			expect(config.cart.enabled).toBe(true);
		});

		it('cart button text is available', () => {
			expect(config.cart.buttonText).toBeTruthy();
		});
	});
});
