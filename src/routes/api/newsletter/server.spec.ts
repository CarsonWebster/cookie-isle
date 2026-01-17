import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	_isValidEmail as isValidEmail,
	_validateNewsletterRequest as validateNewsletterRequest,
	_normalizeEmail as normalizeEmail,
	type NewsletterRequest
} from './+server';

// ============================================================================
// isValidEmail Tests
// ============================================================================

describe('isValidEmail', () => {
	describe('valid emails', () => {
		it('should accept a basic email format', () => {
			expect(isValidEmail('test@example.com')).toBe(true);
		});

		it('should accept email with subdomain', () => {
			expect(isValidEmail('test@mail.example.com')).toBe(true);
		});

		it('should accept email with dots in local part', () => {
			expect(isValidEmail('first.last@example.com')).toBe(true);
		});

		it('should accept email with plus sign', () => {
			expect(isValidEmail('test+tag@example.com')).toBe(true);
		});

		it('should accept email with numbers', () => {
			expect(isValidEmail('test123@example.com')).toBe(true);
		});

		it('should accept email with hyphen in domain', () => {
			expect(isValidEmail('test@my-domain.com')).toBe(true);
		});

		it('should accept email with minimum valid length', () => {
			expect(isValidEmail('a@b.c')).toBe(true);
		});

		it('should handle email with whitespace when trimmed', () => {
			expect(isValidEmail('  test@example.com  ')).toBe(true);
		});
	});

	describe('invalid emails', () => {
		it('should reject null', () => {
			expect(isValidEmail(null as unknown as string)).toBe(false);
		});

		it('should reject undefined', () => {
			expect(isValidEmail(undefined as unknown as string)).toBe(false);
		});

		it('should reject empty string', () => {
			expect(isValidEmail('')).toBe(false);
		});

		it('should reject number', () => {
			expect(isValidEmail(123 as unknown as string)).toBe(false);
		});

		it('should reject email without @', () => {
			expect(isValidEmail('testexample.com')).toBe(false);
		});

		it('should reject email without domain', () => {
			expect(isValidEmail('test@')).toBe(false);
		});

		it('should reject email without local part', () => {
			expect(isValidEmail('@example.com')).toBe(false);
		});

		it('should reject email without TLD', () => {
			expect(isValidEmail('test@example')).toBe(false);
		});

		it('should reject email with multiple @ symbols', () => {
			expect(isValidEmail('test@@example.com')).toBe(false);
		});

		it('should reject email with spaces in middle', () => {
			expect(isValidEmail('test user@example.com')).toBe(false);
		});

		it('should reject email shorter than 5 chars', () => {
			expect(isValidEmail('a@b.')).toBe(false);
		});

		it('should reject email longer than 254 chars', () => {
			const longEmail = 'a'.repeat(250) + '@example.com';
			expect(isValidEmail(longEmail)).toBe(false);
		});
	});
});

// ============================================================================
// normalizeEmail Tests
// ============================================================================

describe('normalizeEmail', () => {
	it('should lowercase email', () => {
		expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
	});

	it('should trim whitespace', () => {
		expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
	});

	it('should handle mixed case', () => {
		expect(normalizeEmail('TeSt@ExAmPlE.CoM')).toBe('test@example.com');
	});

	it('should preserve valid special characters', () => {
		expect(normalizeEmail('test+tag@example.com')).toBe('test+tag@example.com');
	});

	it('should trim and lowercase combined', () => {
		expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
	});
});

// ============================================================================
// validateNewsletterRequest Tests
// ============================================================================

describe('validateNewsletterRequest', () => {
	describe('valid requests', () => {
		it('should accept valid request with email only', () => {
			const body: NewsletterRequest = { email: 'test@example.com' };
			expect(validateNewsletterRequest(body)).toEqual([]);
		});

		it('should accept valid request with email and source', () => {
			const body: NewsletterRequest = { email: 'test@example.com', source: 'coming-soon' };
			expect(validateNewsletterRequest(body)).toEqual([]);
		});

		it('should accept email with whitespace (trimmed during validation)', () => {
			const body = { email: '  test@example.com  ' };
			expect(validateNewsletterRequest(body)).toEqual([]);
		});
	});

	describe('invalid body', () => {
		it('should reject null body', () => {
			const errors = validateNewsletterRequest(null);
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('should reject undefined body', () => {
			const errors = validateNewsletterRequest(undefined);
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('should reject string body', () => {
			const errors = validateNewsletterRequest('not an object');
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('should reject array body', () => {
			const errors = validateNewsletterRequest([]);
			expect(errors).toContain('Request body must be a valid JSON object');
		});

		it('should reject number body', () => {
			const errors = validateNewsletterRequest(123);
			expect(errors).toContain('Request body must be a valid JSON object');
		});
	});

	describe('email validation', () => {
		it('should require email field', () => {
			const errors = validateNewsletterRequest({});
			expect(errors).toContain('Email is required');
		});

		it('should reject null email', () => {
			const errors = validateNewsletterRequest({ email: null });
			expect(errors).toContain('Email is required');
		});

		it('should reject non-string email', () => {
			const errors = validateNewsletterRequest({ email: 123 });
			expect(errors).toContain('Email must be a string');
		});

		it('should reject invalid email format', () => {
			const errors = validateNewsletterRequest({ email: 'notanemail' });
			expect(errors).toContain('Invalid email format');
		});

		it('should reject empty string email', () => {
			const errors = validateNewsletterRequest({ email: '' });
			expect(errors).toContain('Email is required');
		});

		it('should reject email without @ symbol', () => {
			const errors = validateNewsletterRequest({ email: 'testexample.com' });
			expect(errors).toContain('Invalid email format');
		});

		it('should reject email without domain', () => {
			const errors = validateNewsletterRequest({ email: 'test@' });
			expect(errors).toContain('Invalid email format');
		});
	});

	describe('source validation', () => {
		it('should accept valid string source', () => {
			const errors = validateNewsletterRequest({ email: 'test@example.com', source: 'homepage' });
			expect(errors).toEqual([]);
		});

		it('should accept undefined source', () => {
			const errors = validateNewsletterRequest({ email: 'test@example.com' });
			expect(errors).toEqual([]);
		});

		it('should reject non-string source', () => {
			const errors = validateNewsletterRequest({ email: 'test@example.com', source: 123 });
			expect(errors).toContain('Source must be a string');
		});

		it('should reject array source', () => {
			const errors = validateNewsletterRequest({ email: 'test@example.com', source: [] });
			expect(errors).toContain('Source must be a string');
		});

		it('should reject object source', () => {
			const errors = validateNewsletterRequest({ email: 'test@example.com', source: {} });
			expect(errors).toContain('Source must be a string');
		});
	});

	describe('multiple errors', () => {
		it('should return multiple validation errors', () => {
			const errors = validateNewsletterRequest({ email: 123, source: 456 });
			expect(errors).toContain('Email must be a string');
			expect(errors).toContain('Source must be a string');
		});
	});
});

// ============================================================================
// Type Export Tests
// ============================================================================

describe('type exports', () => {
	it('should export NewsletterRequest type', () => {
		const req: NewsletterRequest = { email: 'test@example.com', source: 'test' };
		expect(req.email).toBe('test@example.com');
		expect(req.source).toBe('test');
	});

	it('should allow optional source in NewsletterRequest', () => {
		const req: NewsletterRequest = { email: 'test@example.com' };
		expect(req.email).toBe('test@example.com');
		expect(req.source).toBeUndefined();
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
	it('should handle very long valid email', () => {
		// Max length is 254 chars
		const localPart = 'a'.repeat(64);
		const domain = 'b'.repeat(200) + '.com';
		const email = `${localPart}@${domain}`;
		// This should be over 254 chars and thus invalid
		expect(email.length).toBeGreaterThan(254);
		expect(isValidEmail(email)).toBe(false);
	});

	it('should handle email at exactly 254 chars', () => {
		// Create an email that's exactly 254 chars
		const localPart = 'a'.repeat(64);
		const domainPart = 'b'.repeat(254 - 64 - 1 - 4); // minus local, @, and .com
		const email = `${localPart}@${domainPart}.com`;
		expect(email.length).toBe(254);
		expect(isValidEmail(email)).toBe(true);
	});

	it('should handle unicode in email local part gracefully', () => {
		// Unicode emails might pass basic regex but that's acceptable for this use case
		expect(isValidEmail('tëst@example.com')).toBe(true);
	});

	it('should normalize email with unicode', () => {
		// Should preserve unicode during normalization
		expect(normalizeEmail('TËST@EXAMPLE.COM')).toBe('tëst@example.com');
	});
});

// ============================================================================
// Integration-style Tests (function composition)
// ============================================================================

describe('function composition', () => {
	it('should validate and normalize email correctly', () => {
		const rawEmail = '  TEST@EXAMPLE.COM  ';

		// First validate
		const validationErrors = validateNewsletterRequest({ email: rawEmail });
		expect(validationErrors).toEqual([]);

		// Then normalize
		const normalized = normalizeEmail(rawEmail);
		expect(normalized).toBe('test@example.com');
	});

	it('should reject invalid email before normalization', () => {
		const rawEmail = 'not-an-email';

		const validationErrors = validateNewsletterRequest({ email: rawEmail });
		expect(validationErrors.length).toBeGreaterThan(0);
	});
});
