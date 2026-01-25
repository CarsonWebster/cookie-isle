<script lang="ts">
	import { formatSubscribedDate } from '$lib/format';

	let { data } = $props();

	const subscribers = $derived(data.subscribers);
	const totalCount = $derived(data.totalCount ?? 0);
	const activeCount = $derived(data.activeCount ?? 0);
	const unsubscribedCount = $derived(totalCount - activeCount);
	const hasSubscribers = $derived(totalCount > 0);
</script>

<svelte:head>
	<title>Newsletter Subscribers | Admin</title>
</svelte:head>

<div class="mx-auto max-w-7xl">
	<!-- Page Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-secondary">Newsletter Subscribers</h1>
			<p class="mt-2 text-text-light">Manage your newsletter subscriber list</p>
		</div>

		<!-- Export Button -->
		{#if hasSubscribers}
			<a
				href="/admin/newsletter/export"
				download
				class="rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
			>
				📥 Export to CSV
			</a>
		{/if}
	</div>

	<!-- Stats Cards -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<!-- Active Subscribers -->
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-text-light">Active Subscribers</p>
					<p class="mt-1 text-3xl font-bold text-green-600">{activeCount}</p>
				</div>
				<div class="rounded-full bg-green-100 p-3">
					<span class="text-2xl">✅</span>
				</div>
			</div>
		</div>

		<!-- Unsubscribed -->
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-text-light">Unsubscribed</p>
					<p class="mt-1 text-3xl font-bold text-gray-500">{unsubscribedCount}</p>
				</div>
				<div class="rounded-full bg-gray-100 p-3">
					<span class="text-2xl">📭</span>
				</div>
			</div>
		</div>

		<!-- Total -->
		<div class="rounded-xl bg-white p-6 shadow-md">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-text-light">Total All Time</p>
					<p class="mt-1 text-3xl font-bold text-secondary">{totalCount}</p>
				</div>
				<div class="rounded-full bg-primary/10 p-3">
					<span class="text-2xl">📧</span>
				</div>
			</div>
		</div>
	</div>

	{#if hasSubscribers}
		<!-- Desktop Table View -->
		<div class="hidden overflow-hidden rounded-xl bg-white shadow-md md:block">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Name
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Email
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Status
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Source
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Subscribed Date
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each subscribers as subscriber (subscriber.id)}
						<tr class="hover:bg-gray-50 {subscriber.subscribed === false ? 'opacity-60' : ''}">
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="text-sm font-medium text-secondary">
									{subscriber.firstName || '—'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<span class="mr-2 text-xl">{subscriber.subscribed === false ? '📭' : '📧'}</span>
									<a
										href="mailto:{subscriber.email}"
										class="text-sm font-medium text-secondary hover:text-primary hover:underline"
									>
										{subscriber.email}
									</a>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {subscriber.subscribed ===
									false
										? 'bg-gray-100 text-gray-600'
										: 'bg-green-100 text-green-800'}"
								>
									{subscriber.subscribed === false ? 'Unsubscribed' : 'Active'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {subscriber.source ===
									'coming-soon'
										? 'bg-blue-100 text-blue-800'
										: 'bg-gray-100 text-gray-800'}"
								>
									{subscriber.source || 'website'}
								</span>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-text-light">
								{formatSubscribedDate(subscriber.subscribedAt)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Card View -->
		<div class="space-y-4 md:hidden">
			{#each subscribers as subscriber (subscriber.id)}
				<div
					class="rounded-xl bg-white p-4 shadow-md {subscriber.subscribed === false
						? 'opacity-60'
						: ''}"
				>
					<div class="mb-3 flex items-start justify-between">
						<div class="flex items-center">
							<span class="mr-2 text-xl">{subscriber.subscribed === false ? '📭' : '📧'}</span>
							<a
								href="mailto:{subscriber.email}"
								class="text-sm font-medium text-secondary hover:text-primary hover:underline"
							>
								{subscriber.email}
							</a>
						</div>
						<span
							class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {subscriber.subscribed ===
							false
								? 'bg-gray-100 text-gray-600'
								: 'bg-green-100 text-green-800'}"
						>
							{subscriber.subscribed === false ? 'Unsubscribed' : 'Active'}
						</span>
					</div>

					<div class="space-y-2 text-sm">
						{#if subscriber.firstName}
							<div class="flex justify-between">
								<span class="text-text-light">Name:</span>
								<span class="font-medium text-secondary">{subscriber.firstName}</span>
							</div>
						{/if}

						<div class="flex justify-between">
							<span class="text-text-light">Source:</span>
							<span
								class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {subscriber.source ===
								'coming-soon'
									? 'bg-blue-100 text-blue-800'
									: 'bg-gray-100 text-gray-800'}"
							>
								{subscriber.source || 'website'}
							</span>
						</div>

						<div class="flex justify-between">
							<span class="text-text-light">Subscribed:</span>
							<span class="font-medium text-secondary">
								{formatSubscribedDate(subscriber.subscribedAt)}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="rounded-xl bg-white p-12 text-center shadow-md">
			<div class="mb-4 text-6xl">📭</div>
			<h3 class="mb-2 text-xl font-semibold text-secondary">No subscribers yet</h3>
			<p class="text-text-light">
				Newsletter subscribers will appear here once people start signing up.
			</p>
		</div>
	{/if}
</div>
