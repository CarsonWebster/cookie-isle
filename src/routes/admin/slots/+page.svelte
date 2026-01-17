<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Form state for creating new slot
	let date = $state('');
	let startTime = $state('');
	let endTime = $state('');
	let slotType = $state<'pickup' | 'delivery' | 'both'>('both');
	let maxCookies = $state('200');
	let isSubmitting = $state(false);

	// Get tomorrow's date as minimum date for date picker
	const tomorrow = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return d.toISOString().split('T')[0];
	});

	// State for showing/hiding past dates
	let showPastDates = $state(false);

	// Group slots by date, separating future and past
	const groupedSlots = $derived.by(() => {
		const futureMap = new Map<string, typeof data.slots>();
		const pastMap = new Map<string, typeof data.slots>();

		for (const slot of data.slots) {
			const isPast = slot.date < data.today;
			const targetMap = isPast ? pastMap : futureMap;

			if (!targetMap.has(slot.date)) {
				targetMap.set(slot.date, []);
			}
			targetMap.get(slot.date)!.push(slot);
		}

		// Sort future dates: soonest first (ascending)
		const futureDates = [...futureMap.entries()].sort(([a], [b]) => a.localeCompare(b));

		// Sort past dates: most recent first (descending)
		const pastDates = [...pastMap.entries()].sort(([a], [b]) => b.localeCompare(a));

		return { futureDates, pastDates };
	});

	// Format date for display
	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format time for display (HH:MM -> h:MM AM/PM)
	function formatTime(timeStr: string): string {
		const [hours, minutes] = timeStr.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	// Get badge color for slot type
	function getSlotTypeBadge(type: string) {
		switch (type) {
			case 'pickup':
				return 'bg-blue-100 text-blue-800';
			case 'delivery':
				return 'bg-green-100 text-green-800';
			case 'both':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Calculate capacity used for a date
	function getCapacityUsed(dateStr: string): number {
		return data.capacityMap[dateStr]?.cookiesOrdered ?? 0;
	}

	// Get max capacity for a date (sum of all active slots on that date)
	function getMaxCapacity(dateStr: string): number {
		const slotsOnDate = data.slots.filter((s) => s.date === dateStr && s.active);
		return slotsOnDate.reduce((sum, slot) => sum + (slot.maxCookies ?? 0), 0);
	}

	// Check if capacity is low (<= 20% remaining)
	function isLowCapacity(dateStr: string): boolean {
		const used = getCapacityUsed(dateStr);
		const max = getMaxCapacity(dateStr);
		if (max === 0) return false;
		return used >= max * 0.8;
	}

	// Reset form after successful creation
	$effect(() => {
		if (form?.success === 'created') {
			date = '';
			startTime = '';
			endTime = '';
			slotType = 'both';
			maxCookies = '200';
		}
	});
</script>

<svelte:head>
	<title>Manage Slots | Admin</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-secondary">Fulfillment Slots</h1>
			<p class="mt-2 text-text-light">Manage pickup and delivery time slots for orders</p>
		</div>
	</div>

	<!-- Error message -->
	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-4">
			<p class="text-sm font-medium text-red-800">{form.error}</p>
		</div>
	{/if}

	<!-- Success message -->
	{#if form?.success}
		<div class="rounded-lg bg-green-50 p-4">
			<p class="text-sm font-medium text-green-800">
				Slot {form.success === 'created'
					? 'created'
					: form.success === 'deleted'
						? 'deleted'
						: 'updated'} successfully!
			</p>
		</div>
	{/if}

	<!-- Create Slot Form -->
	<div class="rounded-xl bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold text-secondary">Create New Slot</h2>
		<form
			method="POST"
			action="?/createSlot"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<!-- Date -->
				<div>
					<label for="date" class="text-text-dark mb-1 block text-sm font-medium">Date</label>
					<input
						type="date"
						id="date"
						name="date"
						bind:value={date}
						min={tomorrow()}
						required
						class="w-full rounded-lg border border-tertiary-medium px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					/>
				</div>

				<!-- Start Time -->
				<div>
					<label for="startTime" class="text-text-dark mb-1 block text-sm font-medium">
						Start Time
					</label>
					<input
						type="time"
						id="startTime"
						name="startTime"
						bind:value={startTime}
						required
						class="w-full rounded-lg border border-tertiary-medium px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					/>
				</div>

				<!-- End Time -->
				<div>
					<label for="endTime" class="text-text-dark mb-1 block text-sm font-medium">
						End Time
					</label>
					<input
						type="time"
						id="endTime"
						name="endTime"
						bind:value={endTime}
						required
						class="w-full rounded-lg border border-tertiary-medium px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					/>
				</div>

				<!-- Slot Type -->
				<div>
					<label for="slotType" class="text-text-dark mb-1 block text-sm font-medium">Type</label>
					<select
						id="slotType"
						name="slotType"
						bind:value={slotType}
						required
						class="w-full rounded-lg border border-tertiary-medium px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					>
						<option value="pickup">Pickup</option>
						<option value="delivery">Delivery</option>
						<option value="both">Both</option>
					</select>
				</div>

				<!-- Max Cookies -->
				<div>
					<label for="maxCookies" class="text-text-dark mb-1 block text-sm font-medium">
						Max Cookies
					</label>
					<input
						type="number"
						id="maxCookies"
						name="maxCookies"
						bind:value={maxCookies}
						min="1"
						required
						class="w-full rounded-lg border border-tertiary-medium px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="mt-4 rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-btn-hover-bg disabled:bg-gray-400"
			>
				{isSubmitting ? 'Creating...' : 'Create Slot'}
			</button>
		</form>
	</div>

	<!-- Slots List -->
	<div class="space-y-6">
		{#if data.slots.length === 0}
			<div class="rounded-xl bg-white p-12 text-center shadow-md">
				<div
					class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-tertiary"
				>
					<svg
						class="h-10 w-10 text-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-secondary">No Slots Created Yet</h3>
				<p class="mt-2 text-text-light">Create your first fulfillment slot using the form above</p>
			</div>
		{:else}
			<!-- Future Dates (soonest first) -->
			{#if groupedSlots.futureDates.length === 0}
				<div class="rounded-xl bg-white p-8 text-center shadow-md">
					<p class="text-text-light">No upcoming slots. Create one using the form above.</p>
				</div>
			{:else}
				{#each groupedSlots.futureDates as [dateStr, slotsForDate]}
					{@render dateSlotCard(dateStr, slotsForDate)}
				{/each}
			{/if}

			<!-- Past Dates (collapsible) -->
			{#if groupedSlots.pastDates.length > 0}
				<div class="mt-8">
					<button
						type="button"
						onclick={() => (showPastDates = !showPastDates)}
						class="flex w-full items-center justify-between rounded-xl bg-gray-100 px-6 py-4 text-left transition-colors hover:bg-gray-200"
					>
						<span class="font-semibold text-text-light">
							Past Dates ({groupedSlots.pastDates.length})
						</span>
						<svg
							class="h-5 w-5 text-text-light transition-transform {showPastDates
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					{#if showPastDates}
						<div class="mt-4 space-y-6">
							{#each groupedSlots.pastDates as [dateStr, slotsForDate]}
								{@render dateSlotCard(dateStr, slotsForDate, true)}
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

{#snippet dateSlotCard(dateStr: string, slotsForDate: typeof data.slots, isPast: boolean = false)}
	<div class="rounded-xl bg-white p-6 shadow-md {isPast ? 'opacity-75' : ''}">
		<!-- Date Header with Capacity -->
		<div class="mb-4 flex items-center justify-between border-b border-tertiary-medium pb-4">
			<div>
				<h3 class="text-xl font-semibold text-secondary">
					{formatDate(dateStr)}
					{#if isPast}
						<span class="ml-2 text-sm font-normal text-text-light">(Past)</span>
					{/if}
				</h3>
				<p class="mt-1 text-sm text-text-light">{dateStr}</p>
			</div>
			<div class="text-right">
				<div class="text-text-dark text-sm font-medium">Daily Capacity</div>
				<div
					class="mt-1 text-lg font-bold {isLowCapacity(dateStr)
						? 'text-orange-600'
						: 'text-secondary'}"
				>
					{getCapacityUsed(dateStr)} / {getMaxCapacity(dateStr)} cookies
				</div>
				{#if isLowCapacity(dateStr)}
					<span class="mt-1 inline-block text-xs font-semibold text-orange-600"> Low Stock </span>
				{/if}
			</div>
		</div>

		<!-- Slots Table -->
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-tertiary-medium text-left text-sm text-text-light">
						<th class="pr-4 pb-3 font-semibold">Time</th>
						<th class="pr-4 pb-3 font-semibold">Type</th>
						<th class="pr-4 pb-3 font-semibold">Max Cookies</th>
						<th class="pr-4 pb-3 font-semibold">Status</th>
						<th class="pb-3 font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each slotsForDate as slot}
						<tr class="border-b border-tertiary-light">
							<td class="text-text-dark py-3 pr-4 font-medium">
								{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
							</td>
							<td class="py-3 pr-4">
								<span
									class="inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize {getSlotTypeBadge(
										slot.slotType ?? 'both'
									)}"
								>
									{slot.slotType ?? 'both'}
								</span>
							</td>
							<td class="text-text-dark py-3 pr-4">
								{slot.maxCookies ?? 0} cookies
							</td>
							<td class="py-3 pr-4">
								<form method="POST" action="?/toggleActive" use:enhance>
									<input type="hidden" name="slotId" value={slot.id} />
									<input type="hidden" name="active" value={slot.active ? 'true' : 'false'} />
									<button
										type="submit"
										class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold {slot.active
											? 'bg-green-100 text-green-800 hover:bg-green-200'
											: 'bg-gray-100 text-gray-800 hover:bg-gray-200'} transition-colors"
									>
										{slot.active ? 'Active' : 'Inactive'}
									</button>
								</form>
							</td>
							<td class="py-3">
								<form
									method="POST"
									action="?/deleteSlot"
									use:enhance
									onsubmit={(e) => {
										if (!confirm('Are you sure you want to delete this slot?')) {
											e.preventDefault();
										}
									}}
								>
									<input type="hidden" name="slotId" value={slot.id} />
									<button
										type="submit"
										class="text-red-600 hover:text-red-800"
										aria-label="Delete slot"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/snippet}
