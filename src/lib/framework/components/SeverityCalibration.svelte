<script>
	import {
		blendBySeverity,
		generateCalibrationStages,
		calculateOverallSeverity
	} from '../colorTesting/severityCalibrator.js';

	let { colorblindnessType, onComplete } = $props();

	// Generate all calibration stages for this CVD type
	const stages = generateCalibrationStages(colorblindnessType);

	// Current stage tracking
	let currentStageIndex = $state(0);
	let stageResults = $state([]);

	// Current stage data
	let currentStage = $derived(stages[currentStageIndex]);
	let severitySlider = $state(0);
	let comparisonColor = $derived(
		blendBySeverity(currentStage.referenceColor, currentStage.fullySimulated, severitySlider)
	);

	// Progress tracking
	let progress = $derived(((currentStageIndex + 1) / stages.length) * 100);

	function handleStageComplete() {
		// Record this stage's result
		stageResults.push({
			stageName: currentStage.stageName,
			severity: severitySlider
		});

		// Move to next stage or finish
		if (currentStageIndex < stages.length - 1) {
			currentStageIndex++;
			severitySlider = 0; // Reset slider for next stage
		} else {
			// All stages complete - calculate overall severity
			const overallSeverity = calculateOverallSeverity(stageResults);
			onComplete(overallSeverity);
		}
	}
</script>

<div class="calibration">
	<div class="header">
		<h2>Severity Calibration</h2>
		<p class="subtitle">
			Stage {currentStageIndex + 1} of {stages.length}: {currentStage.stageName}
		</p>
	</div>

	<!-- Progress Bar -->
	<div class="progress-bar">
		<div class="progress-fill" style="width: {progress}%"></div>
	</div>

	<div class="instructions">
		<p>
			We're showing you a <strong>{currentStage.label}</strong> color. Slide the bar below to adjust
			how the <strong>right color</strong> appears.
		</p>
		<p class="help-text">
			Stop when both colors look <strong>identical</strong> to you. This is your severity threshold
			for <strong>{currentStage.stageName}</strong>.
		</p>
	</div>

	<div class="colors">
		<div class="color-container">
			<div class="color-box" style="background: {currentStage.referenceColor}"></div>
			<span class="color-label">Original {currentStage.label}</span>
		</div>

		<div class="arrow">→</div>

		<div class="color-container">
			<div class="color-box animated" style="background: {comparisonColor}"></div>
			<span class="color-label">Adjusted</span>
		</div>
	</div>

	<div class="slider-section">
		<label for="severity-slider">
			<strong>Severity: {(severitySlider * 100).toFixed(0)}%</strong>
		</label>

		<input
			type="range"
			id="severity-slider"
			bind:value={severitySlider}
			min="0"
			max="1"
			step="0.01"
		/>

		<div class="slider-labels">
			<span>Can See Difference (0%)</span>
			<span>Look Identical (100%)</span>
		</div>
	</div>

	<div class="button-section">
		<button class="complete-btn" onclick={handleStageComplete}>
			{#if currentStageIndex < stages.length - 1}
				Next Stage ({currentStageIndex + 2}/{stages.length})
			{:else}
				Complete Calibration
			{/if}
		</button>

		<p class="hint">
			Tip: Slide back and forth to find the exact point where the colors become indistinguishable
		</p>
	</div>
</div>

<style>
	.calibration {
		max-width: 800px;
		margin: 0 auto;
		padding: 40px;
		background: #ffffff;
		border: 3px solid #000000;
		border-radius: 8px;
	}

	.header {
		text-align: center;
		margin-bottom: 30px;
	}

	h2 {
		font-size: 32px;
		margin: 0 0 10px 0;
		color: #000000;
	}

	.subtitle {
		font-size: 18px;
		color: #666666;
		margin: 0;
		font-style: italic;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 30px;
		border: 2px solid #cccccc;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(to right, #4caf50, #2196f3);
		transition: width 0.3s ease-out;
	}

	.instructions {
		text-align: center;
		margin-bottom: 40px;
		padding: 20px;
		background: #f9f9f9;
		border-radius: 8px;
		border: 2px solid #e0e0e0;
	}

	.instructions p {
		font-size: 16px;
		margin: 0 0 10px 0;
		color: #000000;
		line-height: 1.6;
	}

	.instructions p:last-child {
		margin-bottom: 0;
	}

	.help-text {
		font-size: 14px;
		color: #666666;
	}

	.colors {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 50px;
		margin-bottom: 50px;
	}

	.color-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}

	.color-box {
		width: 200px;
		height: 200px;
		border: 4px solid #000000;
		border-radius: 12px;
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.color-box.animated {
		transition: background-color 0.15s ease-out;
	}

	.color-label {
		font-size: 18px;
		font-weight: bold;
		color: #000000;
	}

	.arrow {
		font-size: 48px;
		font-weight: bold;
		color: #666666;
	}

	.slider-section {
		margin-bottom: 40px;
		padding: 30px;
		background: #f0f0f0;
		border-radius: 8px;
		border: 2px solid #cccccc;
	}

	.slider-section label {
		display: block;
		font-size: 20px;
		margin-bottom: 20px;
		text-align: center;
		color: #000000;
	}

	.slider-section strong {
		color: #cc0000;
		font-size: 24px;
	}

	input[type='range'] {
		width: 100%;
		height: 12px;
		background: linear-gradient(to right, #90ee90, #ffd700, #ff6347);
		border-radius: 6px;
		outline: none;
		margin-bottom: 15px;
		cursor: pointer;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 32px;
		height: 32px;
		background: #000000;
		border: 4px solid #ffffff;
		border-radius: 50%;
		cursor: grab;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		transition: transform 0.1s;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	input[type='range']::-webkit-slider-thumb:active {
		cursor: grabbing;
		transform: scale(1.15);
	}

	input[type='range']::-moz-range-thumb {
		width: 32px;
		height: 32px;
		background: #000000;
		border: 4px solid #ffffff;
		border-radius: 50%;
		cursor: grab;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		transition: transform 0.1s;
	}

	input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.1);
	}

	input[type='range']::-moz-range-thumb:active {
		cursor: grabbing;
		transform: scale(1.15);
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: #666666;
	}

	.button-section {
		text-align: center;
	}

	.complete-btn {
		padding: 20px 60px;
		font-family: 'Average', serif;
		font-size: 20px;
		font-weight: bold;
		background: #000000;
		color: #ffffff;
		border: 3px solid #000000;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: 15px;
	}

	.complete-btn:hover {
		background: #333333;
		transform: translateY(-3px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
	}

	.complete-btn:active {
		transform: translateY(-1px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
	}

	.hint {
		font-size: 14px;
		color: #999999;
		font-style: italic;
		margin: 0;
	}

	@media (max-width: 768px) {
		.calibration {
			padding: 25px;
		}

		.colors {
			flex-direction: column;
			gap: 30px;
		}

		.arrow {
			transform: rotate(90deg);
			font-size: 36px;
		}

		.color-box {
			width: 150px;
			height: 150px;
		}

		.slider-section {
			padding: 20px;
		}

		.complete-btn {
			width: 100%;
			padding: 18px 20px;
		}
	}
</style>
