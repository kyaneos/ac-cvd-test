<script>
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		loading = true;
		error = '';
		try {
			await frameworkAuthStore.login(email, password);
			goto('/dashboard/test');
		} catch (e) {
			error = e.message || 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<h1>Login</h1>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleLogin();
		}}
	>
		<div class="form-group">
			<label for="email">Email</label>
			<input id="email" type="email" bind:value={email} placeholder="your@email.com" required />
		</div>

		<div class="form-group">
			<label for="password">Password</label>
			<input id="password" type="password" bind:value={password} placeholder="Password" required />
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'Logging in...' : 'Login'}
		</button>
	</form>

	<p class="link-text">
		Don't have an account? <a href="/auth/register">Register</a>
	</p>
</div>

<style>
	.auth-container {
		max-width: 400px;
		margin: 100px auto;
		padding: 40px;
		font-family: 'Average', serif;
		text-align: center;
		background: #ffffff;
	}

	h1 {
		margin-bottom: 30px;
		font-size: 32px;
		color: #000000;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		text-align: left;
	}

	label {
		margin-bottom: 8px;
		font-size: 14px;
		font-weight: bold;
		color: #000000;
	}

	input {
		padding: 12px;
		font-family: 'Average', serif;
		font-size: 16px;
		border: 2px solid #000000;
		border-radius: 4px;
		background: #ffffff;
	}

	input:focus {
		outline: none;
		border-color: #333333;
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
	}

	button {
		padding: 15px 30px;
		font-family: 'Average', serif;
		font-size: 18px;
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 10px;
	}

	button:hover:not(:disabled) {
		background: #333333;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #cc0000;
		font-size: 14px;
		margin: 0;
		padding: 10px;
		background: #ffeeee;
		border: 1px solid #cc0000;
		border-radius: 4px;
	}

	.link-text {
		margin-top: 20px;
		font-size: 14px;
		color: #666666;
	}

	.link-text a {
		color: #000000;
		text-decoration: underline;
	}

	.link-text a:hover {
		color: #333333;
	}
</style>
