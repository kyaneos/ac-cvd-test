<script>
	import { onMount } from 'svelte';
	import ColorTestMinimal from '$lib/framework/components/ColorTestMinimal.svelte';
	import SeverityCalibration from '$lib/framework/components/SeverityCalibration.svelte';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase.js';

	let auth = $derived($frameworkAuthStore);
	let colorblindnessType = $derived(auth.user?.colorblindness_type || 'deuteranomaly');
	let showInstructions = $state(true);
	let showCalibration = $state(false);
	let calibratedSeverity = $state(null);

	// Check if there's an active test session on mount
	onMount(() => {
		const activeTest = localStorage.getItem('activeTestSession');
		if (activeTest === 'true') {
			showInstructions = false;
			showCalibration = false;
		}
	});

	function handleComplete(stats) {
		console.log('Test session completed:', stats);
		// Clear active session flag
		localStorage.removeItem('activeTestSession');
		goto('/dashboard/results');
	}

	async function handleCalibrationComplete(severity) {
		calibratedSeverity = severity;
		console.log('Calibration complete! Estimated severity:', severity);

		// Save to user profile
		try {
			await pb.collection('colorvision_users').update(auth.user.id, {
				cvd_severity: severity
			});

			// Refresh user data in auth store
			await frameworkAuthStore.refresh();
		} catch (error) {
			console.error('Error saving calibrated severity:', error);
		}

		// Proceed to testing
		showCalibration = false;
		startTesting();
	}

	function startTesting() {
		// Set active session flag
		localStorage.setItem('activeTestSession', 'true');
		showInstructions = false;
	}

	function skipCalibration() {
		showInstructions = false;
		showCalibration = false;
		startTesting();
	}

	function beginCalibration() {
		showInstructions = false;
		showCalibration = true;
	}
</script>

<div class="test-page">
	{#if showInstructions}
		<div class="instructions">
			<h2>Welcome to the Color Discrimination Test</h2>
			<p class="intro">
				This test uses adaptive Bayesian algorithms to build a personalized map of your color
				vision.
			</p>

			<div class="info-section">
				<h3>How it works:</h3>
				<ol>
					<li>You'll see a reference color at the top</li>
					<li>Compare it with two colors below</li>
					<li>Tell us: Do they look the same or different?</li>
					<li>If different, which one matches the reference?</li>
				</ol>
			</div>

			<div class="info-section">
				<h3>What you should know:</h3>
				<ul>
					<li><strong>No time limit</strong> - Take as long as you need</li>
					<li><strong>Infinite testing</strong> - Test continues until you end it</li>
					<li><strong>Adaptive learning</strong> - Each response makes the system smarter</li>
					<li><strong>Your progress is saved</strong> - Come back anytime to continue</li>
				</ul>
			</div>

			<div class="info-section type-info">
				<p>
					<strong>Testing for:</strong>
					{colorblindnessType}
				</p>
				<p class="note">
					The system uses simulation-based algorithms to find colors that should be confusable for
					your type, then learns from your actual responses.
				</p>
			</div>

			{#if !auth.user?.cvd_severity}
				<div class="calibration-option">
					<h3>Optional: Quick Severity Calibration</h3>
					<p>
						Use an interactive slider to estimate your CVD severity. This helps improve initial test
						accuracy and personalizes your visualization.
					</p>
					<div class="button-group">
						<button class="calibrate-btn" onclick={beginCalibration}> Calibrate Severity </button>
						<button class="skip-btn" onclick={skipCalibration}> Skip Calibration </button>
					</div>
				</div>
			{:else}
				<div class="severity-display">
					<p>
						<strong>Your Severity:</strong>
						{(auth.user.cvd_severity * 100).toFixed(0)}%
					</p>
				</div>
				<button class="start-btn" onclick={startTesting}> Start Testing </button>
			{/if}
		</div>
	{:else if showCalibration}
		<SeverityCalibration {colorblindnessType} onComplete={handleCalibrationComplete} />
	{:else}
		<ColorTestMinimal {colorblindnessType} onComplete={handleComplete} />
	{/if}
</div>

<style>
	.test-page {
		max-width: 1000px;
		margin: 0 auto;
		font-family: 'Average', serif;
	}

	.instructions {
		max-width: 700px;
		margin: 0 auto;
		text-align: center;
	}

	h2 {
		font-size: 32px;
		margin-bottom: 20px;
		color: #000000;
	}

	.intro {
		font-size: 18px;
		color: #333333;
		margin-bottom: 40px;
		line-height: 1.6;
	}

	.info-section {
		margin-bottom: 30px;
		padding: 25px;
		background: #f9f9f9;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		text-align: left;
	}

	.info-section h3 {
		font-size: 20px;
		margin: 0 0 15px 0;
		color: #000000;
	}

	.info-section ol,
	.info-section ul {
		margin: 0;
		padding-left: 25px;
		line-height: 1.8;
		color: #333333;
	}

	.info-section li {
		margin-bottom: 10px;
	}

	.type-info {
		background: #e8f4f8;
		border-color: #b8d4e0;
		text-align: center;
	}

	.type-info p {
		margin: 10px 0;
		font-size: 16px;
	}

	.type-info strong {
		color: #000000;
		font-size: 18px;
	}

	.note {
		font-size: 14px;
		color: #666666;
		font-style: italic;
	}

	.start-btn {
		margin-top: 40px;
		padding: 20px 50px;
		font-family: 'Average', serif;
		font-size: 22px;
		background: #000000;
		color: #ffffff;
		border: 3px solid #000000;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.start-btn:hover {
		background: #333333;
		transform: translateY(-3px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
	}

	.start-btn:active {
		transform: translateY(-1px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
	}

	.calibration-option {
		margin-top: 30px;
		padding: 30px;
		background: #fffbf0;
		border: 2px solid #ffd700;
		border-radius: 8px;
	}

	.calibration-option h3 {
		font-size: 22px;
		margin: 0 0 15px 0;
		color: #000000;
	}

	.calibration-option p {
		font-size: 16px;
		color: #333333;
		margin-bottom: 20px;
		line-height: 1.6;
	}

	.button-group {
		display: flex;
		gap: 15px;
		justify-content: center;
	}

	.calibrate-btn,
	.skip-btn {
		padding: 15px 30px;
		font-family: 'Average', serif;
		font-size: 16px;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.calibrate-btn {
		background: #000000;
		color: #ffffff;
	}

	.calibrate-btn:hover {
		background: #333333;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.skip-btn {
		background: #ffffff;
		color: #000000;
	}

	.skip-btn:hover {
		background: #f0f0f0;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.severity-display {
		margin-top: 20px;
		padding: 15px;
		background: #e8f4e8;
		border: 2px solid #90ee90;
		border-radius: 6px;
	}

	.severity-display p {
		margin: 0;
		font-size: 16px;
		color: #000000;
	}

	@media (max-width: 768px) {
		.button-group {
			flex-direction: column;
		}

		.calibrate-btn,
		.skip-btn {
			width: 100%;
		}
	}
</style>
