<script>
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let colorblindnessType = $state('deuteranomaly');
	let error = $state('');
	let loading = $state(false);

	const types = [
		{ value: 'deuteranomaly', label: 'Deuteranomaly (Red-Green, Most Common)' },
		{ value: 'protanomaly', label: 'Protanomaly (Red-Green)' },
		{ value: 'tritanomaly', label: 'Tritanomaly (Blue-Yellow, Rare)' },
		{ value: 'deuteranopia', label: 'Deuteranopia (Red-Green, Severe)' },
		{ value: 'protanopia', label: 'Protanopia (Red-Green, Severe)' },
		{ value: 'tritanopia', label: 'Tritanopia (Blue-Yellow, Severe)' },
		{ value: 'achromatomaly', label: 'Achromatomaly (Partial Color Blindness)' },
		{ value: 'achromatopsia', label: 'Achromatopsia (Complete Color Blindness)' },
		{ value: 'normal', label: 'Normal Vision (No Color Blindness)' }
	];

	async function handleRegister() {
		if (password !== passwordConfirm) {
			error = 'Passwords do not match';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}
		loading = true;
		error = '';
		try {
			await frameworkAuthStore.register(email, password, passwordConfirm, colorblindnessType);
			goto('/dashboard/test');
		} catch (e) {
			error = e.message || 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<h1>Register</h1>
	<p class="subtitle">Create an account to start testing your color vision</p>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleRegister();
		}}
	>
		<div class="form-group">
			<label for="email">Email</label>
			<input id="email" type="email" bind:value={email} placeholder="your@email.com" required />
		</div>

		<div class="form-group">
			<label for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder="At least 8 characters"
				required
			/>
		</div>

		<div class="form-group">
			<label for="passwordConfirm">Confirm Password</label>
			<input
				id="passwordConfirm"
				type="password"
				bind:value={passwordConfirm}
				placeholder="Re-type your password"
				required
			/>
		</div>

		<div class="form-group">
			<label for="colorblindnessType">Colorblindness Type</label>
			<select id="colorblindnessType" bind:value={colorblindnessType}>
				{#each types as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
			<small>Select your assumed colorblindness type. You can change this later.</small>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'Creating Account...' : 'Register'}
		</button>
	</form>

	<p class="link-text">
		Already have an account? <a href="/auth/login">Login</a>
	</p>
</div>

<style>
	.auth-container {
		max-width: 500px;
		margin: 60px auto;
		padding: 40px;
		font-family: 'Average', serif;
		text-align: center;
		background: #ffffff;
	}

	h1 {
		margin-bottom: 10px;
		font-size: 32px;
		color: #000000;
	}

	.subtitle {
		margin-bottom: 30px;
		font-size: 14px;
		color: #666666;
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

	input,
	select {
		padding: 12px;
		font-family: 'Average', serif;
		font-size: 16px;
		border: 2px solid #000000;
		border-radius: 4px;
		background: #ffffff;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #333333;
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
	}

	small {
		margin-top: 6px;
		font-size: 12px;
		color: #666666;
		font-style: italic;
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
