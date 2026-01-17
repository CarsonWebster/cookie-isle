import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';

describe('Image Serving Endpoint', () => {
	describe('GET /images/[...path]', () => {
		describe('successful image fetch', () => {
			it('should serve JPEG image with correct headers', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: '"abc123"'
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test-image.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(mockR2.get).toHaveBeenCalledWith('test-image.jpg');
				expect(result.status).toBe(200);
				expect(result.headers.get('Content-Type')).toBe('image/jpeg');
				expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
				expect(result.headers.get('Content-Length')).toBe('1024');
				expect(result.headers.get('ETag')).toBe('"abc123"');
			});

			it('should serve PNG image with correct Content-Type', async () => {
				const mockImageData = new ArrayBuffer(2048);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/png' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test-image.png' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.status).toBe(200);
				expect(result.headers.get('Content-Type')).toBe('image/png');
			});

			it('should serve WebP image with correct Content-Type', async () => {
				const mockImageData = new ArrayBuffer(512);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/webp' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test-image.webp' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.status).toBe(200);
				expect(result.headers.get('Content-Type')).toBe('image/webp');
			});

			it('should handle nested paths', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'products/cookies/chocolate-chip.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(mockR2.get).toHaveBeenCalledWith('products/cookies/chocolate-chip.jpg');
				expect(result.status).toBe(200);
			});

			it('should include ETag header when available', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: '"etag-value-123"'
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('ETag')).toBe('"etag-value-123"');
			});

			it('should not include ETag header when not available', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('ETag')).toBeNull();
			});
		});

		describe('Content-Type detection', () => {
			it('should detect Content-Type from file extension when metadata missing', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test-image.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/jpeg');
			});

			it('should detect JPEG from .jpeg extension', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpeg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/jpeg');
			});

			it('should detect PNG from .png extension', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.png' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/png');
			});

			it('should detect WebP from .webp extension', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.webp' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/webp');
			});

			it('should detect GIF from .gif extension', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.gif' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/gif');
			});

			it('should detect SVG from .svg extension', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.svg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/svg+xml');
			});

			it('should detect AVIF from .avif extension', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.avif' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/avif');
			});

			it('should use generic Content-Type for unknown extensions', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.unknown' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('application/octet-stream');
			});

			it('should handle case-insensitive extensions', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: null,
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.JPG' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Type')).toBe('image/jpeg');
			});
		});

		describe('caching headers', () => {
			it('should include immutable cache directive', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Cache-Control')).toContain('immutable');
			});

			it('should cache for 1 year (31536000 seconds)', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Cache-Control')).toContain('max-age=31536000');
			});

			it('should mark cache as public', async () => {
				const mockImageData = new ArrayBuffer(1024);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Cache-Control')).toContain('public');
			});
		});

		describe('error handling', () => {
			it('should return 404 when image not found', async () => {
				const mockR2 = {
					get: vi.fn().mockResolvedValue(null)
				};

				await expect(
					GET({
						params: { path: 'nonexistent.jpg' },
						platform: { env: { IMAGES: mockR2 } }
					} as any)
				).rejects.toMatchObject({
					status: 404,
					body: { message: 'Image not found' }
				});
			});

			it('should return 503 when platform is undefined', async () => {
				await expect(
					GET({
						params: { path: 'test.jpg' },
						platform: undefined
					} as any)
				).rejects.toMatchObject({
					status: 503,
					body: { message: 'Image storage not available' }
				});
			});

			it('should return 503 when platform.env is undefined', async () => {
				await expect(
					GET({
						params: { path: 'test.jpg' },
						platform: { env: {} }
					} as any)
				).rejects.toMatchObject({
					status: 503,
					body: { message: 'Image storage not available' }
				});
			});

			it('should return 503 when IMAGES binding is missing', async () => {
				await expect(
					GET({
						params: { path: 'test.jpg' },
						platform: { env: { IMAGES: undefined } }
					} as any)
				).rejects.toMatchObject({
					status: 503,
					body: { message: 'Image storage not available' }
				});
			});

			it('should return 400 when path is empty string', async () => {
				const mockR2 = {
					get: vi.fn()
				};

				await expect(
					GET({
						params: { path: '' },
						platform: { env: { IMAGES: mockR2 } }
					} as any)
				).rejects.toMatchObject({
					status: 400,
					body: { message: 'Image path is required' }
				});
			});
		});

		describe('response body', () => {
			it('should return image data as ArrayBuffer', async () => {
				const mockImageData = new Uint8Array([1, 2, 3, 4, 5]).buffer;
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				const body = await result.arrayBuffer();
				expect(body).toBeInstanceOf(ArrayBuffer);
				expect(body.byteLength).toBe(5);
			});

			it('should include Content-Length header', async () => {
				const mockImageData = new ArrayBuffer(4096);
				const mockObject = {
					arrayBuffer: vi.fn().mockResolvedValue(mockImageData),
					httpMetadata: { contentType: 'image/jpeg' },
					httpEtag: null
				};

				const mockR2 = {
					get: vi.fn().mockResolvedValue(mockObject)
				};

				const result = await GET({
					params: { path: 'test.jpg' },
					platform: { env: { IMAGES: mockR2 } }
				} as any);

				expect(result.headers.get('Content-Length')).toBe('4096');
			});
		});
	});
});
