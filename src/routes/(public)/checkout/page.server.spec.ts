/**
 * Checkout Page Server Load Function Tests
 *
 * Tests for the checkout page's load function that fetches fulfillment slots
 * with capacity information.
 *
 * PRD Reference: 3.7.13
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { load } from './+page.server';
import {
	formatTimeDisplay,
	type FulfillmentSlotWithCapacity,
	type SlotsByDate
} from './checkout-utils';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Import after mocking
import { getDb } from '$lib/server/db';

// Type for the mocked getDb function
const mockGetDb = getDb as Mock;

// Type for the load function's expected return value
interface LoadResult {
	slots: FulfillmentSlotWithCapacity[];
	slotsByDate: SlotsByDate[];
}

// Helper function to safely call load and get result
async function callLoad(params: Partial<Parameters<typeof load>[0]>): Promise<LoadResult> {
	const result = await load(params as Parameters<typeof load>[0]);
	return result as LoadResult;
}

// Helper to create a future date string (YYYY-MM-DD)
function getFutureDate(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().split('T')[0];
}

// Mock slot data
const createMockSlot = (
	overrides: Partial<{
		id: number;
		date: string;
		startTime: string;
		endTime: string;
		slotType: string;
		maxCookies: number;
		active: boolean;
	}> = {}
) => ({
	id: 1,
	date: getFutureDate(1),
	startTime: '10:00',
	endTime: '12:00',
	slotType: 'both',
	maxCookies: 200,
	active: true,
	...overrides
});

describe('formatTimeDisplay', () => {
	it('formats morning time correctly', () => {
		expect(formatTimeDisplay('09:00')).toBe('9:00 AM');
		expect(formatTimeDisplay('10:30')).toBe('10:30 AM');
		expect(formatTimeDisplay('11:45')).toBe('11:45 AM');
	});

	it('formats noon correctly', () => {
		expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
		expect(formatTimeDisplay('12:30')).toBe('12:30 PM');
	});

	it('formats afternoon time correctly', () => {
		expect(formatTimeDisplay('13:00')).toBe('1:00 PM');
		expect(formatTimeDisplay('14:30')).toBe('2:30 PM');
		expect(formatTimeDisplay('17:45')).toBe('5:45 PM');
	});

	it('formats evening time correctly', () => {
		expect(formatTimeDisplay('18:00')).toBe('6:00 PM');
		expect(formatTimeDisplay('20:30')).toBe('8:30 PM');
		expect(formatTimeDisplay('23:59')).toBe('11:59 PM');
	});

	it('formats midnight correctly', () => {
		expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
		expect(formatTimeDisplay('00:30')).toBe('12:30 AM');
	});

	it('handles single-digit minutes with padding', () => {
		expect(formatTimeDisplay('09:05')).toBe('9:05 AM');
		expect(formatTimeDisplay('14:01')).toBe('2:01 PM');
	});
});

describe('+page.server load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('when platform is not available', () => {
		it('returns empty slots array when platform is undefined', async () => {
			const result = await callLoad({ platform: undefined });

			expect(result).toEqual({ slots: [], slotsByDate: [] });
			expect(mockGetDb).not.toHaveBeenCalled();
		});

		it('returns empty slots array when platform.env is undefined', async () => {
			const result = await callLoad({
				platform: { env: undefined } as unknown as App.Platform
			});

			expect(result).toEqual({ slots: [], slotsByDate: [] });
			expect(mockGetDb).not.toHaveBeenCalled();
		});

		it('returns empty slots array when platform.env.DB is undefined', async () => {
			const result = await callLoad({
				platform: { env: {} } as unknown as App.Platform
			});

			expect(result).toEqual({ slots: [], slotsByDate: [] });
			expect(mockGetDb).not.toHaveBeenCalled();
		});
	});

	describe('when platform is available', () => {
		const createMockDb = (
			slots: ReturnType<typeof createMockSlot>[],
			capacityRecords: Array<{
				date: string;
				cookiesOrdered: number | null;
				updatedAt: string | null;
			}> = []
		) => {
			// Mock for fulfillment_slots query
			const slotsWhere = vi.fn().mockResolvedValue(slots);
			const slotsFrom = vi.fn().mockReturnValue({ where: slotsWhere });

			// Mock for daily_capacity query
			const capacityFrom = vi.fn().mockResolvedValue(capacityRecords);

			let callCount = 0;
			const mockSelect = vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					// First call is for fulfillment_slots
					return { from: slotsFrom };
				}
				// Second call is for daily_capacity
				return { from: capacityFrom };
			});

			return {
				select: mockSelect,
				_mocks: { mockSelect, slotsFrom, slotsWhere, capacityFrom }
			};
		};

		const createMockPlatform = () =>
			({
				env: { DB: {} as D1Database }
			}) as unknown as App.Platform;

		it('returns empty arrays when no slots exist', async () => {
			const mockDb = createMockDb([], []);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots).toEqual([]);
			expect(result.slotsByDate).toEqual([]);
		});

		it('returns slots with capacity information', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow, maxCookies: 200 })];
			const capacity = [{ date: tomorrow, cookiesOrdered: 50, updatedAt: null }];

			const mockDb = createMockDb(slots, capacity);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots).toHaveLength(1);
			expect(result.slots[0]).toMatchObject({
				id: 1,
				date: tomorrow,
				cookiesOrdered: 50,
				remainingCapacity: 150,
				isSoldOut: false
			});
		});

		it('calculates sold out status correctly', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow, maxCookies: 100 })];
			const capacity = [{ date: tomorrow, cookiesOrdered: 100, updatedAt: null }];

			const mockDb = createMockDb(slots, capacity);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].isSoldOut).toBe(true);
			expect(result.slots[0].remainingCapacity).toBe(0);
		});

		it('marks slot as sold out when over capacity', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow, maxCookies: 100 })];
			const capacity = [{ date: tomorrow, cookiesOrdered: 150, updatedAt: null }];

			const mockDb = createMockDb(slots, capacity);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].isSoldOut).toBe(true);
			expect(result.slots[0].remainingCapacity).toBe(-50);
		});

		it('defaults to 0 cookies ordered when no capacity record exists', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow, maxCookies: 200 })];

			const mockDb = createMockDb(slots, []); // No capacity records
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].cookiesOrdered).toBe(0);
			expect(result.slots[0].remainingCapacity).toBe(200);
			expect(result.slots[0].isSoldOut).toBe(false);
		});

		it('defaults to 200 max cookies when slot has null maxCookies', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [
				createMockSlot({ id: 1, date: tomorrow, maxCookies: null as unknown as number })
			];

			const mockDb = createMockDb(slots, []);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].remainingCapacity).toBe(200);
		});

		it('preserves slot type information', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [
				createMockSlot({ id: 1, date: tomorrow, slotType: 'pickup' }),
				createMockSlot({ id: 2, date: tomorrow, slotType: 'delivery' }),
				createMockSlot({ id: 3, date: tomorrow, slotType: 'both' })
			];

			const mockDb = createMockDb(slots, []);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].slotType).toBe('pickup');
			expect(result.slots[1].slotType).toBe('delivery');
			expect(result.slots[2].slotType).toBe('both');
		});

		it('sorts slots by date then by start time', async () => {
			const day1 = getFutureDate(1);
			const day2 = getFutureDate(2);
			const slots = [
				createMockSlot({ id: 1, date: day2, startTime: '14:00' }),
				createMockSlot({ id: 2, date: day1, startTime: '10:00' }),
				createMockSlot({ id: 3, date: day1, startTime: '14:00' }),
				createMockSlot({ id: 4, date: day2, startTime: '10:00' })
			];

			const mockDb = createMockDb(slots, []);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			// Should be sorted by date first, then time
			expect(result.slots[0].id).toBe(2); // day1, 10:00
			expect(result.slots[1].id).toBe(3); // day1, 14:00
			expect(result.slots[2].id).toBe(4); // day2, 10:00
			expect(result.slots[3].id).toBe(1); // day2, 14:00
		});

		it('groups slots by date correctly', async () => {
			const day1 = getFutureDate(1);
			const day2 = getFutureDate(2);
			const slots = [
				createMockSlot({ id: 1, date: day1, startTime: '10:00' }),
				createMockSlot({ id: 2, date: day1, startTime: '14:00' }),
				createMockSlot({ id: 3, date: day2, startTime: '10:00' })
			];

			const mockDb = createMockDb(slots, []);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slotsByDate).toHaveLength(2);
			expect(result.slotsByDate[0].date).toBe(day1);
			expect(result.slotsByDate[0].slots).toHaveLength(2);
			expect(result.slotsByDate[1].date).toBe(day2);
			expect(result.slotsByDate[1].slots).toHaveLength(1);
		});

		it('includes formatted date heading', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow })];

			const mockDb = createMockDb(slots, []);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			// formattedDate should be like "Saturday, January 18"
			expect(result.slotsByDate[0].formattedDate).toMatch(/^\w+, \w+ \d+$/);
		});

		it('calls database with correct query structure', async () => {
			const mockDb = createMockDb([], []);
			mockGetDb.mockReturnValue(mockDb);

			await callLoad({ platform: createMockPlatform() });

			// Verify select was called twice (slots and capacity)
			expect(mockDb._mocks.mockSelect).toHaveBeenCalledTimes(2);
		});
	});

	describe('slot filtering logic', () => {
		const createMockDb = (
			slots: ReturnType<typeof createMockSlot>[],
			capacityRecords: Array<{
				date: string;
				cookiesOrdered: number | null;
				updatedAt: string | null;
			}> = []
		) => {
			const slotsWhere = vi.fn().mockResolvedValue(slots);
			const slotsFrom = vi.fn().mockReturnValue({ where: slotsWhere });
			const capacityFrom = vi.fn().mockResolvedValue(capacityRecords);

			let callCount = 0;
			const mockSelect = vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return { from: slotsFrom };
				}
				return { from: capacityFrom };
			});

			return { select: mockSelect };
		};

		const createMockPlatform = () => ({ env: { DB: {} as D1Database } }) as unknown as App.Platform;

		it('handles multiple capacity records for different dates', async () => {
			const day1 = getFutureDate(1);
			const day2 = getFutureDate(2);
			const slots = [
				createMockSlot({ id: 1, date: day1, maxCookies: 100 }),
				createMockSlot({ id: 2, date: day2, maxCookies: 100 })
			];
			const capacity = [
				{ date: day1, cookiesOrdered: 25, updatedAt: null },
				{ date: day2, cookiesOrdered: 75, updatedAt: null }
			];

			const mockDb = createMockDb(slots, capacity);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].remainingCapacity).toBe(75); // 100 - 25
			expect(result.slots[1].remainingCapacity).toBe(25); // 100 - 75
		});

		it('handles null cookiesOrdered in capacity record', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow, maxCookies: 100 })];
			const capacity = [{ date: tomorrow, cookiesOrdered: null, updatedAt: null }];

			const mockDb = createMockDb(slots, capacity);
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({ platform: createMockPlatform() });

			expect(result.slots[0].cookiesOrdered).toBe(0);
			expect(result.slots[0].remainingCapacity).toBe(100);
		});
	});

	describe('return type', () => {
		it('always returns an object with slots and slotsByDate arrays', async () => {
			// Test with no platform
			const result1 = await callLoad({ platform: undefined });
			expect(result1).toHaveProperty('slots');
			expect(result1).toHaveProperty('slotsByDate');
			expect(Array.isArray(result1.slots)).toBe(true);
			expect(Array.isArray(result1.slotsByDate)).toBe(true);
		});

		it('slots contain all required fields', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow })];

			const mockDb = {
				select: vi.fn().mockImplementation(() => {
					const callNum = mockDb.select.mock.calls.length;
					if (callNum === 1) {
						return {
							from: vi.fn().mockReturnValue({
								where: vi.fn().mockResolvedValue(slots)
							})
						};
					}
					return { from: vi.fn().mockResolvedValue([]) };
				})
			};
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({
				platform: { env: { DB: {} as D1Database } } as unknown as App.Platform
			});

			const slot = result.slots[0];
			expect(slot).toHaveProperty('id');
			expect(slot).toHaveProperty('date');
			expect(slot).toHaveProperty('startTime');
			expect(slot).toHaveProperty('endTime');
			expect(slot).toHaveProperty('slotType');
			expect(slot).toHaveProperty('maxCookies');
			expect(slot).toHaveProperty('cookiesOrdered');
			expect(slot).toHaveProperty('remainingCapacity');
			expect(slot).toHaveProperty('isSoldOut');
		});

		it('slotsByDate entries contain all required fields', async () => {
			const tomorrow = getFutureDate(1);
			const slots = [createMockSlot({ id: 1, date: tomorrow })];

			const mockDb = {
				select: vi.fn().mockImplementation(() => {
					const callNum = mockDb.select.mock.calls.length;
					if (callNum === 1) {
						return {
							from: vi.fn().mockReturnValue({
								where: vi.fn().mockResolvedValue(slots)
							})
						};
					}
					return { from: vi.fn().mockResolvedValue([]) };
				})
			};
			mockGetDb.mockReturnValue(mockDb);

			const result = await callLoad({
				platform: { env: { DB: {} as D1Database } } as unknown as App.Platform
			});

			const dateGroup = result.slotsByDate[0];
			expect(dateGroup).toHaveProperty('date');
			expect(dateGroup).toHaveProperty('formattedDate');
			expect(dateGroup).toHaveProperty('slots');
			expect(Array.isArray(dateGroup.slots)).toBe(true);
		});
	});
});
