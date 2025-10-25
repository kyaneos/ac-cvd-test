<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';

	let isChecking = true;

	onMount(() => {
		// Check if user is already logged in
		const unsubscribe = frameworkAuthStore.subscribe((state) => {
			if (state.isAuthenticated) {
				goto('/dashboard/test');
			} else {
				isChecking = false;
			}
		});

		return unsubscribe;
	});

	function handleLogin() {
		goto('/auth/login');
	}

	function handleRegister() {
		goto('/auth/register');
	}
</script>

{#if isChecking}
	<div class="container">
		<p>Loading...</p>
	</div>
{:else}
	<div class="container">
		<h1>Color Vision Test</h1>
		<p>Welcome to the personalized color vision testing application.</p>

		<div class="actions">
			<button onclick={handleLogin}>Login</button>
			<button onclick={handleRegister}>Register</button>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 600px;
		margin: 100px auto;
		padding: 60px 40px;
		text-align: center;
		font-family: 'Average', serif;
		background: #ffffff;
		border: 3px solid #000000;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	h1 {
		font-size: 36px;
		margin-bottom: 20px;
		color: #000000;
	}

	p {
		margin-bottom: 40px;
		color: #333333;
		font-size: 18px;
		line-height: 1.6;
	}

	.actions {
		display: flex;
		gap: 20px;
		justify-content: center;
	}

	button {
		padding: 15px 40px;
		font-family: 'Average', serif;
		font-size: 18px;
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover {
		background: #333333;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	button:first-child {
		background: #ffffff;
		color: #000000;
	}

	button:first-child:hover {
		background: #f0f0f0;
	}
</style>
