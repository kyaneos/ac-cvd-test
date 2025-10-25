<script>
	import { onMount, onDestroy } from 'svelte';
	import { frameworkTestStore } from '$lib/framework/stores/frameworkTestStore.js';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';

	// Props
	let { colorblindnessType = 'deuteranomaly', onComplete = null } = $props();

	// State
	let currentTrial = $state(null);
	let testCount = $state(0);
	let isLoading = $state(true);
	let testActive = $state(false);

	// Get user's severity from auth store
	let auth = $derived($frameworkAuthStore);
	let userSeverity = $derived(auth.user?.cvd_severity ?? null);

	// Prevent navigation when test is active
	function beforeUnloadHandler(e) {
		if (testActive && testCount > 0) {
			e.preventDefault();
			e.returnValue =
				'You have an active test. Your progress will be saved, but you will need to end the test first.';
			return e.returnValue;
		}
	}

	onMount(async () => {
		// Start test session with user's severity
		await frameworkTestStore.startSession(colorblindnessType, 5, userSeverity);
		nextTrial();
		isLoading = false;
		testActive = true;

		// Add beforeunload listener
		window.addEventListener('beforeunload', beforeUnloadHandler);
	});

	onDestroy(() => {
		// Clean up listener
		window.removeEventListener('beforeunload', beforeUnloadHandler);
	});

	function nextTrial() {
		const trial = frameworkTestStore.getNextTrial();
		currentTrial = trial;
		if (trial) {
			testCount++;
		}
		console.log('Next trial:', trial);
	}

	async function handleResponse(response) {
		if (!currentTrial) return;

		console.log('Handling response:', response);

		// Record response and update Bayesian model
		await frameworkTestStore.recordResponse(response);

		// After 50 tests, estimate severity every 10 tests
		if (testCount >= 50 && testCount % 10 === 0) {
			const bayesianModel = $frameworkTestStore.bayesianModel;
			const estimatedSeverity = bayesianModel?.estimateSeverity();

			if (estimatedSeverity !== null && auth.user) {
				console.log(`🔍 Updating inferred severity: ${(estimatedSeverity * 100).toFixed(0)}%`);

				// Import pocketbase
				const pb = await import('$lib/pocketbase.js').then((m) => m.default);

				// Update user profile with refined estimate
				try {
					await pb.collection('colorvision_users').update(auth.user.id, {
						cvd_severity: estimatedSeverity
					});

					// Refresh auth store to get updated severity
					await frameworkAuthStore.refresh();

					console.log('✅ Severity updated in database');
				} catch (error) {
					console.error('Failed to update severity:', error);
				}
			}
		}

		// Get next trial
		nextTrial();
	}

	function getStats() {
		return frameworkTestStore.getStats();
	}

	async function endTest() {
		testActive = false;
		await frameworkTestStore.endSession();
		if (onComplete) {
			const stats = getStats();
			onComplete(stats);
		}
	}
</script>

{#if isLoading}
	<div class="container">
		<p>Loading test...</p>
	</div>
{:else if currentTrial}
	<div class="container">
		<div class="header">
			<h2>Color Discrimination Test</h2>
			<p class="test-count">Test #{testCount}</p>
		</div>

		<div class="instructions">
			<p><strong>Reference Color:</strong></p>
		</div>

		<!-- Reference Color -->
		<div class="color-display">
			<div class="color-box" style="background-color: {currentTrial.reference};"></div>
		</div>

		<div class="instructions">
			<p><strong>Compare these two colors:</strong></p>
			<p>Are they the same or different? If different, which matches the reference?</p>
		</div>

		<!-- Comparison Colors - Clickable -->
		<div class="comparison-container">
			<button
				class="color-choice"
				onclick={() => handleResponse('color1')}
				title="Click if this matches the reference"
			>
				<div class="color-box" style="background-color: {currentTrial.color1};"></div>
				<p class="color-position">Color 1</p>
			</button>

			<button
				class="color-choice"
				onclick={() => handleResponse('color2')}
				title="Click if this matches the reference"
			>
				<div class="color-box" style="background-color: {currentTrial.color2};"></div>
				<p class="color-position">Color 2</p>
			</button>
		</div>

		<!-- Same Button -->
		<div class="button-group">
			<button class="same-button" onclick={() => handleResponse('same')}>
				They Look the Same
			</button>
		</div>

		<div class="actions">
			<button onclick={endTest} class="end-button"> End Test </button>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 40px 20px;
		font-family: 'Average', serif;
		text-align: center;
	}

	.header {
		margin-bottom: 30px;
	}

	h2 {
		margin: 0 0 10px 0;
		font-size: 28px;
	}

	.test-count {
		color: #666;
		font-size: 14px;
		margin: 0;
	}

	.instructions {
		margin: 30px 0 20px 0;
	}

	.instructions p {
		margin: 5px 0;
		font-size: 16px;
	}

	.color-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin: 20px auto;
	}

	.color-box {
		width: 200px;
		height: 200px;
		border: 3px solid #000;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.color-label {
		font-family: 'Courier New', monospace;
		font-size: 14px;
		color: #666;
	}

	.comparison-container {
		display: flex;
		justify-content: center;
		gap: 40px;
		margin: 30px 0;
		flex-wrap: wrap;
	}

	.color-choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s;
	}

	.color-choice:hover {
		transform: scale(1.05);
	}

	.color-choice:hover .color-box {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		border-width: 4px;
	}

	.color-choice:active {
		transform: scale(0.98);
	}

	.color-choice .color-box {
		width: 150px;
		height: 150px;
	}

	.color-position {
		font-weight: bold;
		margin: 5px 0 0 0;
		color: #000;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 15px;
		margin: 40px auto;
		max-width: 400px;
	}

	button {
		padding: 15px 30px;
		font-family: 'Average', serif;
		font-size: 16px;
		background: white;
		color: #000;
		border: 2px solid #000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover {
		background: #f0f0f0;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	button:active {
		transform: translateY(0);
	}

	.same-button {
		font-size: 18px;
		font-weight: bold;
	}

	.actions {
		margin-top: 40px;
		padding-top: 20px;
		border-top: 1px solid #ddd;
	}

	.end-button {
		background: #ff4444;
		color: white;
		border-color: #cc0000;
	}

	.end-button:hover {
		background: #cc0000;
	}
</style>
