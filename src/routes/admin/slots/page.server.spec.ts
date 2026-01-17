import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

// Mock the database module
vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

// Mock SvelteKit's error function
vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		error: (status: number, message: string) => {
			throw new Error(message);
		}
	};
});

import { getDb } from '$lib/server/db';

describe('Admin Slots Page - Load Function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should load slots and capacity data for future dates', async () => {
		const mockSlots = [
			{
				id: 1,
				date: '2026-01-20',
				startTime: '10:00',
				endTime: '12:00',
				slotType: 'pickup',
				maxCookies: 200,
				active: true
			},
			{
				id: 2,
				date: '2026-01-21',
				startTime: '14:00',
				endTime: '16:00',
				slotType: 'delivery',
				maxCookies: 150,
				active: true
			}
		];

		const mockCapacity = [
			{ date: '2026-01-20', cookiesOrdered: 50, updatedAt: '2026-01-19T10:00:00Z' },
			{ date: '2026-01-21', cookiesOrdered: 100, updatedAt: '2026-01-19T10:00:00Z' }
		];

		// Mock chain: select() -> from() -> orderBy() returns Promise<slots>
		// Mock chain: select() -> from() returns Promise<capacity>
		const mockOrderBy = vi.fn().mockResolvedValue(mockSlots);
		const mockFrom = vi.fn().mockImplementation(() => {
			// Return different results based on call count
			const callCount = mockFrom.mock.calls.length;
			if (callCount === 1) {
				// First call (slots) - has orderBy
				return { orderBy: mockOrderBy };
			}
			// Second call (capacity) - returns directly
			return Promise.resolve(mockCapacity);
		});
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

		const mockDb = { select: mockSelect };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const result = await load({
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toBeDefined();
		if (result) {
			expect(result.slots).toEqual(mockSlots);
			expect(result.capacityMap).toEqual({
				'2026-01-20': mockCapacity[0],
				'2026-01-21': mockCapacity[1]
			});
		}
		expect(getDb).toHaveBeenCalledWith({ env: { DB: {} } });
	});

	it('should throw error when database is not configured', async () => {
		await expect(load({ platform: undefined } as any)).rejects.toThrow('Database not configured');
	});

	it('should return empty arrays when no slots exist', async () => {
		const mockOrderBy = vi.fn().mockResolvedValue([]);
		const mockFrom = vi.fn().mockImplementation(() => {
			const callCount = mockFrom.mock.calls.length;
			if (callCount === 1) {
				return { orderBy: mockOrderBy };
			}
			return Promise.resolve([]);
		});
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

		const mockDb = { select: mockSelect };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const result = await load({
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toBeDefined();
		if (result) {
			expect(result.slots).toEqual([]);
			expect(result.capacityMap).toEqual({});
		}
	});
});

describe('Admin Slots Page - Create Slot Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create a new slot with valid data', async () => {
		const mockInsert = vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue(undefined)
		});

		const mockDb = { insert: mockInsert };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '10:00');
		formData.set('endTime', '12:00');
		formData.set('slotType', 'pickup');
		formData.set('maxCookies', '200');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ success: 'created' });
		expect(mockInsert).toHaveBeenCalled();
	});

	it('should fail when database is not configured', async () => {
		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '10:00');
		formData.set('endTime', '12:00');
		formData.set('slotType', 'pickup');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: undefined
		} as any);

		expect(result).toEqual({ status: 500, data: { error: 'Database not configured' } });
	});

	it('should fail when required fields are missing', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		// Missing startTime, endTime, slotType

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Missing required fields' } });
	});

	it('should fail when date format is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '01/20/2026'); // Invalid format
		formData.set('startTime', '10:00');
		formData.set('endTime', '12:00');
		formData.set('slotType', 'pickup');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Invalid date format' } });
	});

	it('should fail when time format is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '10:00 AM'); // Invalid format
		formData.set('endTime', '12:00');
		formData.set('slotType', 'pickup');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Invalid time format' } });
	});

	it('should fail when slot type is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '10:00');
		formData.set('endTime', '12:00');
		formData.set('slotType', 'invalid');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Invalid slot type' } });
	});

	it('should fail when max cookies is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '10:00');
		formData.set('endTime', '12:00');
		formData.set('slotType', 'pickup');
		formData.set('maxCookies', '-10');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Invalid max cookies value' } });
	});

	it('should fail when end time is before start time', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '12:00');
		formData.set('endTime', '10:00'); // Before start time
		formData.set('slotType', 'pickup');

		const result = await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'End time must be after start time' } });
	});

	it('should use default max cookies value when not provided', async () => {
		const mockValues = vi.fn().mockResolvedValue(undefined);
		const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

		const mockDb = { insert: mockInsert };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('date', '2026-01-20');
		formData.set('startTime', '10:00');
		formData.set('endTime', '12:00');
		formData.set('slotType', 'pickup');
		// maxCookies not provided

		await actions.createSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				maxCookies: 200 // Default value
			})
		);
	});
});

describe('Admin Slots Page - Toggle Active Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should toggle slot from active to inactive', async () => {
		const mockWhere = vi.fn().mockResolvedValue(undefined);
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

		const mockDb = { update: mockUpdate };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('slotId', '1');
		formData.set('active', 'true');

		const result = await actions.toggleActive({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ success: 'updated' });
		expect(mockSet).toHaveBeenCalledWith({ active: false });
	});

	it('should toggle slot from inactive to active', async () => {
		const mockWhere = vi.fn().mockResolvedValue(undefined);
		const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
		const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

		const mockDb = { update: mockUpdate };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('slotId', '1');
		formData.set('active', 'false');

		const result = await actions.toggleActive({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ success: 'updated' });
		expect(mockSet).toHaveBeenCalledWith({ active: true });
	});

	it('should fail when database is not configured', async () => {
		const formData = new FormData();
		formData.set('slotId', '1');
		formData.set('active', 'true');

		const result = await actions.toggleActive({
			request: { formData: async () => formData } as any,
			platform: undefined
		} as any);

		expect(result).toEqual({ status: 500, data: { error: 'Database not configured' } });
	});

	it('should fail when slot ID is missing', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('active', 'true');

		const result = await actions.toggleActive({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Missing slot ID' } });
	});

	it('should fail when slot ID is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('slotId', 'invalid');
		formData.set('active', 'true');

		const result = await actions.toggleActive({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Invalid slot ID' } });
	});
});

describe('Admin Slots Page - Delete Slot Action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should delete a slot', async () => {
		const mockWhere = vi.fn().mockResolvedValue(undefined);
		const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

		const mockDb = { delete: mockDelete };
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('slotId', '1');

		const result = await actions.deleteSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ success: 'deleted' });
		expect(mockDelete).toHaveBeenCalled();
	});

	it('should fail when database is not configured', async () => {
		const formData = new FormData();
		formData.set('slotId', '1');

		const result = await actions.deleteSlot({
			request: { formData: async () => formData } as any,
			platform: undefined
		} as any);

		expect(result).toEqual({ status: 500, data: { error: 'Database not configured' } });
	});

	it('should fail when slot ID is missing', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();

		const result = await actions.deleteSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Missing slot ID' } });
	});

	it('should fail when slot ID is invalid', async () => {
		const mockDb = {};
		vi.mocked(getDb).mockReturnValue(mockDb as any);

		const formData = new FormData();
		formData.set('slotId', 'not-a-number');

		const result = await actions.deleteSlot({
			request: { formData: async () => formData } as any,
			platform: { env: { DB: {} } } as any
		} as any);

		expect(result).toEqual({ status: 400, data: { error: 'Invalid slot ID' } });
	});
});
