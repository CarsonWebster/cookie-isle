<script lang="ts">
	import { enhance } from '$app/forms';
	import { config } from '$lib/config';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);

	// Determine the current state
	let isUnsubscribed = $derived(data.alreadyUnsubscribed || form?.success);
</script>

<svelte:head>
	<title>Unsubscribe | {config.title}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-tertiary via-tertiary-light to-tertiary-medium px-4 py-12"
>
	<div class="w-full max-w-md">
		<!-- Logo and Title -->
		<div class="text-center">
			<img src="/Cookieart.png" alt="" class="mx-auto mb-4 h-16 w-auto" aria-hidden="true" />
			<h1 class="text-2xl font-bold tracking-tight text-secondary">{config.title}</h1>
		</div>

		<!-- Card -->
		<div class="mt-8 rounded-xl bg-white p-8 shadow-lg">
			{#if isUnsubscribed}
				<!-- Success State -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-8 w-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h2 class="mb-2 text-xl font-semibold text-secondary">You've been unsubscribed</h2>
					<p class="text-text-light">
						{data.email} has been removed from our newsletter list.
					</p>
					<p class="mt-4 text-sm text-text-light">
						We're sorry to see you go! If you change your mind, you can always sign up again.
					</p>
				</div>
			{:else}
				<!-- Confirmation Form -->
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary"
					>
						<span class="text-3xl">📧</span>
					</div>
					<h2 class="mb-2 text-xl font-semibold text-secondary">Unsubscribe from Newsletter</h2>
					<p class="mb-6 text-text-light">
						Are you sure you want to unsubscribe <strong>{data.email}</strong> from our newsletter?
					</p>

					{#if form?.error}
						<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
							{form.error}
						</div>
					{/if}

					<form
						method="POST"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ update }) => {
								await update();
								isSubmitting = false;
							};
						}}
					>
						<input type="hidden" name="token" value={data.token} />
						<button
							type="submit"
							disabled={isSubmitting}
							class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmitting}
								Unsubscribing...
							{:else}
								Yes, Unsubscribe Me
							{/if}
						</button>
					</form>

					<p class="mt-4 text-sm text-text-light">
						Changed your mind?
						<a href="/" class="font-medium text-primary hover:text-primary-hover"
							>Go back to our site</a
						>
					</p>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="mt-6 text-center">
			<a href="/" class="text-sm text-text-light transition-colors hover:text-primary">
				&larr; Back to {config.title}
			</a>
		</div>
	</div>
</div>
