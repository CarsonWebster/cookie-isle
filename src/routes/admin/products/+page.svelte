<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Handle row click to edit product
	function handleRowClick(productId: number) {
		goto(`/admin/products/${productId}`);
	}
</script>

<svelte:head>
	<title>Products | Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between border-b border-gray-200 pb-5">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Products</h1>
			<p class="mt-2 text-sm text-gray-600">Manage your product catalog</p>
		</div>
		<a
			href="/admin/products/new"
			class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-btn-hover-bg focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
		>
			Add Product
		</a>
	</div>

	<!-- Products Table (Desktop) -->
	<div class="hidden overflow-x-auto rounded-lg border border-gray-200 shadow-sm md:block">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Image
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Product
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Price
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Status
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Active
					</th>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if data.products.length === 0}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center">
							<div class="text-gray-500">
								<p class="text-lg font-medium">No products found</p>
								<p class="mt-1 text-sm">Add your first product to get started</p>
							</div>
						</td>
					</tr>
				{:else}
					{#each data.products as product (product.id)}
						<tr class="transition-colors hover:bg-gray-50">
							<!-- Image -->
							<td class="px-6 py-4 whitespace-nowrap">
								{#if product.imageUrl}
									<img
										src={product.imageUrl}
										alt={product.title}
										class="h-12 w-12 rounded-lg object-cover"
									/>
								{:else}
									<div
										class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl"
									>
										🍪
									</div>
								{/if}
							</td>

							<!-- Product Info -->
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									<div>
										<div class="text-sm font-medium text-gray-900">{product.title}</div>
										<div class="text-xs text-gray-500">/{product.slug}</div>
									</div>
									{#if product.featured}
										<span
											class="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"
										>
											Featured
										</span>
									{/if}
								</div>
							</td>

							<!-- Price -->
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
								{product.priceFormatted}
							</td>

							<!-- Status -->
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {product.active
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800'}"
								>
									{product.active ? 'Active' : 'Inactive'}
								</span>
							</td>

							<!-- Active Toggle -->
							<td class="px-6 py-4 whitespace-nowrap">
								<form method="POST" action="?/toggleActive" use:enhance>
									<input type="hidden" name="productId" value={product.id} />
									<input type="hidden" name="active" value={!product.active} />
									<button
										type="submit"
										class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none {product.active
											? 'bg-primary'
											: 'bg-gray-200'}"
										aria-label={product.active
											? `Deactivate ${product.title}`
											: `Activate ${product.title}`}
									>
										<span
											class="inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform {product.active
												? 'translate-x-6'
												: 'translate-x-1'}"
										></span>
									</button>
								</form>
							</td>

							<!-- Actions -->
							<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
								<button
									type="button"
									onclick={() => handleRowClick(product.id)}
									class="text-primary transition-colors hover:text-btn-hover-bg"
								>
									Edit
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Products Cards (Mobile) -->
	<div class="space-y-4 md:hidden">
		{#if data.products.length === 0}
			<div class="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
				<div class="text-gray-500">
					<p class="text-lg font-medium">No products found</p>
					<p class="mt-1 text-sm">Add your first product to get started</p>
				</div>
			</div>
		{:else}
			{#each data.products as product (product.id)}
				<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div class="flex items-start gap-4">
						<!-- Image -->
						{#if product.imageUrl}
							<img
								src={product.imageUrl}
								alt={product.title}
								class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
							/>
						{:else}
							<div
								class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-3xl"
							>
								🍪
							</div>
						{/if}

						<!-- Product Info -->
						<div class="flex-1">
							<div class="flex items-start justify-between">
								<div>
									<div class="flex items-center gap-2">
										<h3 class="text-sm font-medium text-gray-900">{product.title}</h3>
										{#if product.featured}
											<span
												class="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"
											>
												Featured
											</span>
										{/if}
									</div>
									<p class="mt-1 text-sm font-medium text-gray-900">{product.priceFormatted}</p>
									<p class="mt-1 text-xs text-gray-500">/{product.slug}</p>
								</div>

								<!-- Status Badge -->
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {product.active
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800'}"
								>
									{product.active ? 'Active' : 'Inactive'}
								</span>
							</div>

							<!-- Actions -->
							<div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
								<!-- Active Toggle -->
								<form method="POST" action="?/toggleActive" use:enhance>
									<input type="hidden" name="productId" value={product.id} />
									<input type="hidden" name="active" value={!product.active} />
									<button
										type="submit"
										class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none {product.active
											? 'bg-primary'
											: 'bg-gray-200'}"
										aria-label={product.active
											? `Deactivate ${product.title}`
											: `Activate ${product.title}`}
									>
										<span
											class="inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform {product.active
												? 'translate-x-6'
												: 'translate-x-1'}"
										></span>
									</button>
								</form>

								<!-- Edit Button -->
								<button
									type="button"
									onclick={() => handleRowClick(product.id)}
									class="text-sm font-medium text-primary transition-colors hover:text-btn-hover-bg"
								>
									Edit
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
