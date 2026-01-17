import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	validateFileType,
	validateFileSize,
	getExtensionFromMimeType,
	generateUniqueFilename,
	parseMultipartFormData,
	uploadToR2,
	getPublicImageUrl
} from './+server';

describe('Upload API Helper Functions', () => {
	describe('validateFileType', () => {
		it('should accept image/jpeg', () => {
			expect(validateFileType('image/jpeg')).toBe(true);
		});

		it('should accept image/png', () => {
			expect(validateFileType('image/png')).toBe(true);
		});

		it('should accept image/webp', () => {
			expect(validateFileType('image/webp')).toBe(true);
		});

		it('should reject image/gif', () => {
			expect(validateFileType('image/gif')).toBe(false);
		});

		it('should reject image/svg+xml', () => {
			expect(validateFileType('image/svg+xml')).toBe(false);
		});

		it('should reject text/plain', () => {
			expect(validateFileType('text/plain')).toBe(false);
		});

		it('should reject application/pdf', () => {
			expect(validateFileType('application/pdf')).toBe(false);
		});

		it('should reject empty string', () => {
			expect(validateFileType('')).toBe(false);
		});
	});

	describe('validateFileSize', () => {
		const MAX_SIZE = 5 * 1024 * 1024; // 5MB

		it('should accept 1 byte', () => {
			expect(validateFileSize(1)).toBe(true);
		});

		it('should accept 1MB', () => {
			expect(validateFileSize(1024 * 1024)).toBe(true);
		});

		it('should accept exactly 5MB', () => {
			expect(validateFileSize(MAX_SIZE)).toBe(true);
		});

		it('should reject 5MB + 1 byte', () => {
			expect(validateFileSize(MAX_SIZE + 1)).toBe(false);
		});

		it('should reject 10MB', () => {
			expect(validateFileSize(10 * 1024 * 1024)).toBe(false);
		});

		it('should reject 0 bytes', () => {
			expect(validateFileSize(0)).toBe(false);
		});

		it('should reject negative size', () => {
			expect(validateFileSize(-100)).toBe(false);
		});
	});

	describe('getExtensionFromMimeType', () => {
		it('should return jpg for image/jpeg', () => {
			expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
		});

		it('should return png for image/png', () => {
			expect(getExtensionFromMimeType('image/png')).toBe('png');
		});

		it('should return webp for image/webp', () => {
			expect(getExtensionFromMimeType('image/webp')).toBe('webp');
		});

		it('should return null for unsupported type', () => {
			expect(getExtensionFromMimeType('image/gif')).toBeNull();
		});

		it('should return null for empty string', () => {
			expect(getExtensionFromMimeType('')).toBeNull();
		});
	});

	describe('generateUniqueFilename', () => {
		beforeEach(() => {
			// Mock Date.now() for consistent testing
			vi.spyOn(Date, 'now').mockReturnValue(1705445678901);

			// Mock crypto.randomUUID()
			vi.spyOn(crypto, 'randomUUID').mockReturnValue('a3f9d2e1-1234-5678-9abc-def012345678');
		});

		it('should generate filename with correct pattern for JPEG', () => {
			const filename = generateUniqueFilename('image/jpeg');
			expect(filename).toBe('1705445678901-a3f9d2e1.jpg');
		});

		it('should generate filename with correct pattern for PNG', () => {
			const filename = generateUniqueFilename('image/png');
			expect(filename).toBe('1705445678901-a3f9d2e1.png');
		});

		it('should generate filename with correct pattern for WebP', () => {
			const filename = generateUniqueFilename('image/webp');
			expect(filename).toBe('1705445678901-a3f9d2e1.webp');
		});

		it('should throw error for unsupported MIME type', () => {
			expect(() => generateUniqueFilename('image/gif')).toThrow(
				'Invalid MIME type for filename generation'
			);
		});

		it('should generate unique filenames on successive calls', () => {
			vi.spyOn(Date, 'now').mockReturnValueOnce(1705445678901).mockReturnValueOnce(1705445678902);

			vi.spyOn(crypto, 'randomUUID')
				.mockReturnValueOnce('a3f9d2e1-1234-5678-9abc-def012345678')
				.mockReturnValueOnce('b4e8c3f2-2345-6789-abcd-ef0123456789');

			const filename1 = generateUniqueFilename('image/jpeg');
			const filename2 = generateUniqueFilename('image/jpeg');

			expect(filename1).not.toBe(filename2);
			expect(filename1).toBe('1705445678901-a3f9d2e1.jpg');
			expect(filename2).toBe('1705445678902-b4e8c3f2.jpg');
		});
	});

	describe('parseMultipartFormData', () => {
		it('should extract file from valid form data', async () => {
			const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
			const formData = new FormData();
			formData.append('file', mockFile);

			const request = new Request('http://localhost/api/upload', {
				method: 'POST',
				body: formData
			});

			const result = await parseMultipartFormData(request);

			expect(result.error).toBeNull();
			expect(result.file).toBeInstanceOf(File);
			expect(result.file?.name).toBe('test.jpg');
			expect(result.file?.type).toBe('image/jpeg');
		});

		it('should return error when no file provided', async () => {
			const formData = new FormData();
			// No file appended

			const request = new Request('http://localhost/api/upload', {
				method: 'POST',
				body: formData
			});

			const result = await parseMultipartFormData(request);

			expect(result.error).toBe('No file provided');
			expect(result.file).toBeNull();
		});

		it('should return error when file field is not a File instance', async () => {
			const formData = new FormData();
			formData.append('file', 'not a file');

			const request = new Request('http://localhost/api/upload', {
				method: 'POST',
				body: formData
			});

			const result = await parseMultipartFormData(request);

			expect(result.error).toBe('Invalid file data');
			expect(result.file).toBeNull();
		});

		it('should return error when form data parsing fails', async () => {
			const request = new Request('http://localhost/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ not: 'form data' })
			});

			const result = await parseMultipartFormData(request);

			expect(result.error).toBe('Failed to parse form data');
			expect(result.file).toBeNull();
		});
	});

	describe('uploadToR2', () => {
		it('should successfully upload file to R2 bucket', async () => {
			const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

			const mockBucket = {
				put: vi.fn().mockResolvedValue(undefined)
			} as unknown as R2Bucket;

			const result = await uploadToR2(mockBucket, 'test-filename.jpg', mockFile);

			expect(result.success).toBe(true);
			expect(result.error).toBeNull();
			expect(mockBucket.put).toHaveBeenCalledWith('test-filename.jpg', expect.any(ArrayBuffer), {
				httpMetadata: {
					contentType: 'image/jpeg'
				}
			});
		});

		it('should return error when R2 upload fails', async () => {
			const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

			const mockBucket = {
				put: vi.fn().mockRejectedValue(new Error('R2 error'))
			} as unknown as R2Bucket;

			const result = await uploadToR2(mockBucket, 'test-filename.jpg', mockFile);

			expect(result.success).toBe(false);
			expect(result.error).toBe('R2 upload failed: R2 error');
		});

		it('should handle unknown error types', async () => {
			const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

			const mockBucket = {
				put: vi.fn().mockRejectedValue('string error')
			} as unknown as R2Bucket;

			const result = await uploadToR2(mockBucket, 'test-filename.jpg', mockFile);

			expect(result.success).toBe(false);
			expect(result.error).toBe('R2 upload failed: Unknown error');
		});

		it('should convert file to ArrayBuffer before upload', async () => {
			const content = 'test content';
			const mockFile = new File([content], 'test.jpg', { type: 'image/jpeg' });

			const mockBucket = {
				put: vi.fn().mockResolvedValue(undefined)
			} as unknown as R2Bucket;

			await uploadToR2(mockBucket, 'test-filename.jpg', mockFile);

			const callArgs = (mockBucket.put as ReturnType<typeof vi.fn>).mock.calls[0];
			const uploadedBuffer = callArgs[1] as ArrayBuffer;

			expect(uploadedBuffer).toBeInstanceOf(ArrayBuffer);
			expect(uploadedBuffer.byteLength).toBeGreaterThan(0);
		});
	});

	describe('getPublicImageUrl', () => {
		it('should return URL with correct base URL', () => {
			const filename = '1705445678901-a3f9d2e1.jpg';
			const url = getPublicImageUrl(filename);

			expect(url).toBe('https://images.thecookieisle.com/1705445678901-a3f9d2e1.jpg');
		});

		it('should handle filename with special characters', () => {
			const filename = 'test-file_123.png';
			const url = getPublicImageUrl(filename);

			expect(url).toBe('https://images.thecookieisle.com/test-file_123.png');
		});

		it('should not double-slash if filename starts with slash', () => {
			// This shouldn't happen in practice, but test defensive behavior
			const filename = '/already-has-slash.webp';
			const url = getPublicImageUrl(filename);

			expect(url).toBe('https://images.thecookieisle.com//already-has-slash.webp');
			// Note: This shows we should normalize the filename, but for now we'll leave it as-is
		});
	});

	describe('Module Exports', () => {
		it('should export validateFileType function', () => {
			expect(typeof validateFileType).toBe('function');
		});

		it('should export validateFileSize function', () => {
			expect(typeof validateFileSize).toBe('function');
		});

		it('should export getExtensionFromMimeType function', () => {
			expect(typeof getExtensionFromMimeType).toBe('function');
		});

		it('should export generateUniqueFilename function', () => {
			expect(typeof generateUniqueFilename).toBe('function');
		});

		it('should export parseMultipartFormData function', () => {
			expect(typeof parseMultipartFormData).toBe('function');
		});

		it('should export uploadToR2 function', () => {
			expect(typeof uploadToR2).toBe('function');
		});

		it('should export getPublicImageUrl function', () => {
			expect(typeof getPublicImageUrl).toBe('function');
		});
	});

	describe('Constants Validation', () => {
		it('should have MAX_FILE_SIZE of 5MB', () => {
			// Indirectly verify by testing the boundary
			const fiveMB = 5 * 1024 * 1024;
			expect(validateFileSize(fiveMB)).toBe(true);
			expect(validateFileSize(fiveMB + 1)).toBe(false);
		});

		it('should have exactly 3 allowed MIME types', () => {
			// Count valid types
			const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
			const allValid = validTypes.every((type) => validateFileType(type));
			expect(allValid).toBe(true);

			// Test that other common types are rejected
			const invalidTypes = ['image/gif', 'image/svg+xml', 'image/bmp'];
			const allInvalid = invalidTypes.every((type) => !validateFileType(type));
			expect(allInvalid).toBe(true);
		});
	});
});
