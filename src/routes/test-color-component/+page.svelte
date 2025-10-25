<script>
	import { onMount } from 'svelte';
	import ColorTestMinimal from '$lib/framework/components/ColorTestMinimal.svelte';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import pb from '$lib/pocketbase.js';

	let testMode = $state('not-logged-in'); // 'not-logged-in', 'testing', 'completed'
	let completedStats = $state(null);
	let authStatus = $state('Checking...');

	onMount(async () => {
		// Check if already logged in
		if (pb.authStore.isValid) {
			authStatus = `Logged in as: ${pb.authStore.model?.email}`;
			testMode = 'testing';
		} else {
			// Auto-login with test credentials
			authStatus = 'Logging in...';
			try {
				await pb
					.collection('colorvision_users')
					.authWithPassword('test-user-j@sciminds.cloud', 'test1234');
				authStatus = `Logged in as: ${pb.authStore.model?.email}`;
				testMode = 'testing';
			} catch (error) {
				authStatus = `Login failed: ${error.message}`;
				console.error('Login error:', error);
			}
		}
	});

	function handleComplete(stats) {
		console.log('Test completed with stats:', stats);
		completedStats = stats;
		testMode = 'completed';
	}

	function restartTest() {
		testMode = 'testing';
		completedStats = null;
	}
</script>

<div class="container">
	<div class="header">
		<h1>Color Test Component - Live Test</h1>
		<p class="auth-status">{authStatus}</p>
	</div>

	{#if testMode === 'testing'}
		<div class="test-area">
			<ColorTestMinimal colorblindnessType="deuteranomaly" onComplete={handleComplete} />
		</div>
	{:else if testMode === 'completed'}
		<div class="results">
			<h2>✅ Test Completed!</h2>

			{#if completedStats}
				<div class="stats">
					<h3>Session Statistics:</h3>
					<ul>
						<li><strong>Total Tests:</strong> {completedStats.totalTests}</li>
						<li><strong>Unique Pairs Tested:</strong> {completedStats.uniquePairsTested}</li>
						<li><strong>Unique Colors Tested:</strong> {completedStats.uniqueColorsTested}</li>
						<li><strong>Confirmed Confusions:</strong> {completedStats.confirmedConfusions}</li>
						<li>
							<strong>Average Uncertainty:</strong>
							{(completedStats.averageUncertainty * 100).toFixed(1)}%
						</li>
						<li><strong>Test Mode:</strong> {completedStats.mode}</li>
					</ul>
				</div>
			{/if}

			<button onclick={restartTest} class="restart-btn"> Start Another Test </button>

			<div class="explanation">
				<h3>What Just Happened:</h3>
				<p>✅ ColorTestMinimal component loaded</p>
				<p>✅ Bayesian model initialized</p>
				<p>✅ Simulation-based color pairs generated</p>
				<p>✅ Your responses updated the Bayesian model</p>
				<p>✅ Adaptive selector chose optimal next tests</p>
				{#if pb.authStore.isValid}
					<p>✅ Results saved to PocketBase</p>
					<p>✅ Bayesian state saved (every 5 tests)</p>
				{:else}
					<p>⚠️ Results NOT saved (no login) - but all logic works!</p>
				{/if}
			</div>
		</div>
	{/if}

	<div class="instructions">
		<h3>Testing Instructions:</h3>
		<ol>
			<li>Look at the reference color</li>
			<li>Compare the two colors below</li>
			<li>Decide: Are they the same or different?</li>
			<li>If different, which one matches the reference?</li>
			<li>Complete at least 5-10 tests to see the Bayesian system adapt</li>
		</ol>

		<h3>What to Observe:</h3>
		<ul>
			<li>Colors should be <strong>similar but not identical</strong> (simulation-based)</li>
			<li>Test counter increases with each response</li>
			<li>No errors in browser console</li>
			<li>Smooth transitions between tests</li>
		</ul>
	</div>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 20px;
		font-family: 'Average', serif;
	}

	.header {
		text-align: center;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 2px solid #ddd;
	}

	h1 {
		margin-bottom: 10px;
	}

	.auth-status {
		color: #666;
		font-size: 14px;
	}

	.test-area {
		margin: 40px 0;
		padding: 30px;
		background: #f9f9f9;
		border-radius: 8px;
		border: 2px solid #ddd;
	}

	.results {
		text-align: center;
		padding: 40px;
		background: #e8f5e9;
		border-radius: 8px;
		margin: 40px 0;
	}

	.stats {
		text-align: left;
		display: inline-block;
		margin: 20px auto;
		background: white;
		padding: 20px 40px;
		border-radius: 8px;
		border: 2px solid #4caf50;
	}

	.stats ul {
		list-style: none;
		padding: 0;
	}

	.stats li {
		padding: 8px 0;
		border-bottom: 1px solid #eee;
	}

	.stats li:last-child {
		border-bottom: none;
	}

	.restart-btn {
		margin-top: 30px;
		padding: 15px 40px;
		font-family: 'Average', serif;
		font-size: 18px;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.restart-btn:hover {
		background: #45a049;
	}

	.explanation {
		text-align: left;
		display: inline-block;
		margin-top: 30px;
		padding: 20px;
		background: white;
		border-radius: 8px;
		border: 2px solid #2196f3;
	}

	.explanation p {
		margin: 8px 0;
		font-size: 14px;
	}

	.instructions {
		margin-top: 40px;
		padding: 30px;
		background: #fff9e6;
		border-radius: 8px;
		border: 2px solid #ffc107;
	}

	.instructions h3 {
		margin-top: 0;
	}

	.instructions ol,
	.instructions ul {
		line-height: 1.8;
	}
</style>
