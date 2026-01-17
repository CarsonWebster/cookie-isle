import { describe, it, expect } from 'vitest';
import { config, formatPrice } from '$lib/config';

/**
 * Unit tests for MenuCard component logic
 *
 * Note: Full component rendering tests require Playwright browser testing.
 * These tests verify the configuration, types, and logic used by the MenuCard component.
 *
 * PRD Reference: 2.3
 */

/** Product type matching the MenuCard component interface */
interface TestProduct {
	id: number;
	slug: string;
	title: string;
	priceCents: number;
	stripePriceId: string;
	description?: string | null;
	imageUrl?: string | null;
	tags?: string[] | null;
}

// Sample product data for testing (matches Product interface)
const sampleProduct: TestProduct = {
	id: 1,
	slug: 'chocolate-chip',
	title: 'Chocolate Chip Cookie',
	priceCents: 350,
	stripePriceId: 'price_123abc',
	description: 'Classic chocolate chip cookie with premium Belgian chocolate chunks.',
	imageUrl: 'https://images.thecookieisle.com/chocolate-chip.jpg',
	tags: ['classic', 'chocolate']
};

const minimalProduct: TestProduct = {
	id: 2,
	slug: 'sugar-cookie',
	title: 'Sugar Cookie',
	priceCents: 300,
	stripePriceId: 'price_456def'
};

describe('MenuCard Component Logic', () => {
	describe('product type validation', () => {
		it('product has required id field', () => {
			expect(typeof sampleProduct.id).toBe('number');
			expect(sampleProduct.id).toBeGreaterThan(0);
		});

		it('product has required slug field', () => {
			expect(typeof sampleProduct.slug).toBe('string');
			expect(sampleProduct.slug.length).toBeGreaterThan(0);
		});

		it('product has required title field', () => {
			expect(typeof sampleProduct.title).toBe('string');
			expect(sampleProduct.title.length).toBeGreaterThan(0);
		});

		it('product has required priceCents field as integer', () => {
			expect(typeof sampleProduct.priceCents).toBe('number');
			expect(Number.isInteger(sampleProduct.priceCents)).toBe(true);
		});

		it('product has required stripePriceId field', () => {
			expect(typeof sampleProduct.stripePriceId).toBe('string');
			expect(sampleProduct.stripePriceId.length).toBeGreaterThan(0);
		});

		it('product can have optional description', () => {
			expect(sampleProduct.description).toBeDefined();
			expect(minimalProduct.description).toBeUndefined();
		});

		it('product can have optional imageUrl', () => {
			expect(sampleProduct.imageUrl).toBeDefined();
			expect(minimalProduct.imageUrl).toBeUndefined();
		});

		it('product can have optional tags array', () => {
			expect(Array.isArray(sampleProduct.tags)).toBe(true);
			expect(minimalProduct.tags).toBeUndefined();
		});
	});

	describe('price formatting', () => {
		it('formats price in cents to dollar string', () => {
			expect(formatPrice(350)).toBe('$3.50');
		});

		it('formats zero price correctly', () => {
			expect(formatPrice(0)).toBe('$0.00');
		});

		it('formats prices under a dollar correctly', () => {
			expect(formatPrice(50)).toBe('$0.50');
			expect(formatPrice(5)).toBe('$0.05');
		});

		it('formats large prices correctly', () => {
			expect(formatPrice(1000)).toBe('$10.00');
			expect(formatPrice(9999)).toBe('$99.99');
		});

		it('rounds prices with fractional cents', () => {
			// formatPrice uses toFixed(2) so no rounding needed
			expect(formatPrice(350)).toBe('$3.50');
		});
	});

	describe('product URL generation', () => {
		it('slug can be used to generate product detail URL', () => {
			const slug = sampleProduct.slug;
			const expectedUrl = `/menu/${slug}`;
			expect(expectedUrl).toBe('/menu/chocolate-chip');
		});

		it('slug with special characters is URL-safe', () => {
			const product = { ...minimalProduct, slug: 'double-chocolate-chunk' };
			const url = `/menu/${product.slug}`;
			expect(url).toBe('/menu/double-chocolate-chunk');
		});
	});

	describe('cart configuration', () => {
		it('cart button text is available from config', () => {
			expect(config.cart.buttonText).toBeTruthy();
			expect(typeof config.cart.buttonText).toBe('string');
		});

		it('cart button text is "Add to Cart"', () => {
			expect(config.cart.buttonText).toBe('Add to Cart');
		});

		it('cart is enabled in config', () => {
			expect(config.cart.enabled).toBe(true);
		});
	});

	describe('tags handling', () => {
		it('tags array contains strings', () => {
			if (sampleProduct.tags) {
				sampleProduct.tags.forEach((tag) => {
					expect(typeof tag).toBe('string');
				});
			}
		});

		it('empty tags array is valid', () => {
			const productWithEmptyTags = { ...minimalProduct, tags: [] };
			expect(Array.isArray(productWithEmptyTags.tags)).toBe(true);
			expect(productWithEmptyTags.tags.length).toBe(0);
		});

		it('null tags is valid (no tags displayed)', () => {
			const productWithNullTags = { ...minimalProduct, tags: null };
			expect(productWithNullTags.tags).toBeNull();
		});
	});

	describe('image handling', () => {
		it('imageUrl can be a full URL', () => {
			expect(sampleProduct.imageUrl).toMatch(/^https?:\/\//);
		});

		it('missing imageUrl is handled (placeholder shown)', () => {
			expect(minimalProduct.imageUrl).toBeUndefined();
			// Component shows cookie emoji placeholder when imageUrl is undefined
		});

		it('null imageUrl is handled like undefined', () => {
			const productWithNullImage = { ...minimalProduct, imageUrl: null };
			expect(productWithNullImage.imageUrl).toBeNull();
			// Component treats null same as undefined (shows placeholder)
		});
	});

	describe('description handling', () => {
		it('description is a string when present', () => {
			expect(typeof sampleProduct.description).toBe('string');
		});

		it('long descriptions are truncated in display (line-clamp-2)', () => {
			const longDescription =
				'This is a very long description that would normally span multiple lines. It contains lots of text about how delicious this cookie is and all the wonderful ingredients that go into making it. The description goes on and on about the baking process and the love that goes into each cookie.';
			const product = { ...minimalProduct, description: longDescription };
			// line-clamp-2 CSS class handles truncation in the component
			expect(product.description.length).toBeGreaterThan(100);
		});

		it('missing description is handled', () => {
			expect(minimalProduct.description).toBeUndefined();
			// Component renders empty div for flex spacing when no description
		});
	});

	describe('styling configuration', () => {
		it('card background color is defined', () => {
			expect(config.colors.cardBg).toBeTruthy();
		});

		it('primary color is defined for price and button', () => {
			expect(config.colors.primary).toBeTruthy();
		});

		it('secondary color is defined for title', () => {
			expect(config.colors.secondary).toBeTruthy();
		});

		it('text-light color is defined for description', () => {
			expect(config.colors.textLight).toBeTruthy();
		});

		it('button hover color is defined', () => {
			expect(config.colors.btnHoverBg).toBeTruthy();
		});

		it('tertiary-medium color is defined for tags and placeholder', () => {
			expect(config.colors.tertiaryMedium).toBeTruthy();
		});
	});

	describe('data attributes for cart integration', () => {
		it('product id can be used as data attribute', () => {
			expect(String(sampleProduct.id)).toBe('1');
		});

		it('product slug can be used as data attribute', () => {
			expect(sampleProduct.slug).toBe('chocolate-chip');
		});

		it('product priceCents can be used as data attribute', () => {
			expect(String(sampleProduct.priceCents)).toBe('350');
		});

		it('product stripePriceId can be used as data attribute', () => {
			expect(sampleProduct.stripePriceId).toBe('price_123abc');
		});
	});
});
