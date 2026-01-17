<script lang="ts">
	import { enhance } from '$app/forms';
	import { config } from '$lib/config';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let isSubmitting = $state(false);
	let password = $state('');

	// Track if password field has been touched for validation UX
	let touched = $state(false);

	// Show error state only if touched and empty
	let showError = $derived(touched && password.trim().length === 0);
</script>

<svelte:head>
	<title>Admin Login | {config.title}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-tertiary px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md">
		<!-- Logo and Title -->
		<div class="text-center">
			<div
				class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-tertiary-medium"
			>
				<img src="/CookieIsleLogo.png" alt="" class="h-16 w-auto" aria-hidden="true" />
			</div>
			<h1 class="mt-4 text-2xl font-bold tracking-tight text-secondary">Admin Login</h1>
			<p class="mt-2 text-sm text-text-light">Enter your password to access the admin dashboard</p>
		</div>

		<!-- Login Form -->
		<div class="mt-8">
			<div class="rounded-xl bg-white px-6 py-8 shadow-lg sm:px-10">
				<form
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
					class="space-y-6"
				>
					<!-- Error Message -->
					{#if form?.error}
						<div
							class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
							role="alert"
							aria-live="polite"
						>
							<div class="flex items-center gap-2">
								<svg
									class="h-5 w-5 flex-shrink-0"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>{form.error}</span>
							</div>
						</div>
					{/if}

					<!-- Password Field -->
					<div>
						<label for="password" class="block text-sm font-medium text-secondary">
							Password
						</label>
						<div class="mt-2">
							<input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								bind:value={password}
								onblur={() => (touched = true)}
								disabled={isSubmitting}
								class="block w-full rounded-lg border-0 px-4 py-3 text-secondary shadow-sm ring-1 ring-inset
									{showError ? 'ring-red-300 focus:ring-red-500' : 'ring-tertiary-medium focus:ring-primary'}
									placeholder:text-text-light/50 focus:ring-2 focus:ring-inset
									disabled:cursor-not-allowed disabled:bg-tertiary-light disabled:text-text-light/70
									sm:text-sm sm:leading-6"
								placeholder="Enter your admin password"
								aria-describedby={showError ? 'password-error' : undefined}
								aria-invalid={showError}
							/>
						</div>
						{#if showError}
							<p id="password-error" class="mt-2 text-sm text-red-600">Password is required</p>
						{/if}
					</div>

					<!-- Submit Button -->
					<div>
						<button
							type="submit"
							disabled={isSubmitting || password.trim().length === 0}
							class="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm
								transition-colors duration-200 hover:bg-primary-hover focus-visible:outline
								focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed
								disabled:bg-tertiary-medium disabled:text-text-light"
							aria-busy={isSubmitting}
						>
							{#if isSubmitting}
								<svg
									class="mr-2 -ml-1 h-5 w-5 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Signing in...
							{:else}
								Sign in
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Back to Site Link -->
		<div class="mt-6 text-center">
			<a
				href="/"
				class="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
			>
				&larr; Back to {config.title}
			</a>
		</div>
	</div>
</div>
