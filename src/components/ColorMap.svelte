<script>
	import {
		simulateDeuteranomaly,
		generateConfusionColors,
		analyzeResults
	} from '../utils/colorSimulation.js';
	import RoverModel from './RoverModel.svelte';
	import ACDialogue from './ACDialogue.svelte';
	import { wiiSounds } from '../utils/wiiSounds.js';
	import { onMount } from 'svelte';

	let { testResults = [] } = $props();

	// Detect if these are adaptive test results
	let isAdaptive = $derived(testResults.length > 0 && testResults[0]?.bayesianStats);

	console.log('ColorMap: testResults:', testResults.length, 'isAdaptive:', isAdaptive);

	// Calculate severity and analyze personal results
	let severity = $derived(
		isAdaptive && testResults.length > 0
			? testResults[testResults.length - 1]?.bayesianStats?.severityEstimate || 0.6
			: 0.6
	);

	let confidence = $derived(
		isAdaptive && testResults.length > 0
			? testResults[testResults.length - 1]?.bayesianStats?.confidenceLevel || 0
			: 0
	);

	// Analyze personal test results - simplified and unified structure
	function analyzePersonalResults() {
		if (testResults.length === 0) return null;

		const confusions = [];
		const responses = [];

		testResults.forEach((result) => {
			if (!result.correct) {
				confusions.push({
					reference: result.reference || result.referenceColor,
					chosen: result.chosenColor || result.selectedColor,
					correct: result.correctColor || result.options?.[result.correct],
					axis: result.axis || result.category || 'unknown',
					difficulty: result.difficulty || 'medium',
					responseTime: result.responseTime || 3000
				});
			}
			responses.push(result);
		});

		return {
			totalQuestions: testResults.length,
			correctAnswers: testResults.filter((r) => r.correct).length,
			accuracy: (testResults.filter((r) => r.correct).length / testResults.length) * 100,
			personalConfusions: confusions,
			averageResponseTime:
				responses.reduce((sum, r) => sum + (r.responseTime || 3000), 0) / responses.length,
			difficultyProgression: responses.map((r) => ({
				difficulty: r.difficulty || 'medium',
				correct: r.correct
			})),
			axisPerformance: getAxisPerformance(responses)
		};
	}

	let personalAnalysis = $derived(analyzePersonalResults());

	// Calculate axis-specific performance
	function getAxisPerformance(responses) {
		const axes = {};
		responses.forEach((response) => {
			const axis = response.axis || response.category || 'unknown';
			if (!axes[axis]) {
				axes[axis] = { total: 0, correct: 0 };
			}
			axes[axis].total++;
			if (response.correct) axes[axis].correct++;
		});

		Object.keys(axes).forEach((axis) => {
			axes[axis].accuracy = (axes[axis].correct / axes[axis].total) * 100;
		});

		return axes;
	}

	let currentView = $state('personal'); // 'personal', 'simulation', 'practice'
	let showComparison = $state(true);
	let isDragging = $state(false);
	let roverIsSpeaking = $state(false);
	let scrollAudio = null;
	let scrollLoopInterval = null;
	let dialogueShown = $state(false); // Track if dialogue has been shown this session
	let stableDialogue = $state(''); // Stable dialogue text to prevent re-triggering

	const rainbowColors = [
		'#FF0000',
		'#FF3300',
		'#FF6600',
		'#FF9900',
		'#FFCC00',
		'#FFFF00',
		'#CCFF00',
		'#99FF00',
		'#66FF00',
		'#33FF00',
		'#00FF00',
		'#00FF33',
		'#00FF66',
		'#00FF99',
		'#00FFCC',
		'#00FFFF',
		'#00CCFF',
		'#0099FF',
		'#0066FF',
		'#0033FF',
		'#0000FF',
		'#3300FF',
		'#6600FF',
		'#9900FF',
		'#CC00FF',
		'#FF00FF',
		'#FF00CC',
		'#FF0099',
		'#FF0066',
		'#FF0033'
	];

	const confusionPairs = generateConfusionColors();

	let simulatedColors = $derived(
		rainbowColors.map((color) => simulateDeuteranomaly(color, severity))
	);

	// Generate personalized dialogue based on results
	let personalizedDialogue = $derived(
		!personalAnalysis
			? 'This tool will help you explore how colors might appear different. Use the controls to adjust the simulation and see how colors can be affected.'
			: isAdaptive && personalAnalysis.personalConfusions.length > 0
				? (() => {
						const accuracy = Math.round(personalAnalysis.accuracy);
						const confusionCount = personalAnalysis.personalConfusions.length;
						const avgTime = Math.round((personalAnalysis.averageResponseTime / 1000) * 10) / 10;

						return `Great work on the test! You got ${accuracy}% correct with ${confusionCount} challenging areas. Your average response time was ${avgTime} seconds. Let's explore your personal color vision patterns - this analysis is based on YOUR specific responses!`;
					})()
				: isAdaptive
					? `Excellent! You did really well on the adaptive test. This personalized analysis shows how colors might appear to you based on the system's assessment of your color vision.`
					: `Based on your test results, here's a personalized view of how colors might appear to you. This analysis is tailored to your specific responses.`
	);

	onMount(async () => {
		await wiiSounds.init();
		// Set stable dialogue text once on mount to prevent re-triggering
		stableDialogue = personalizedDialogue;
		// Only play dialogue if not shown yet this session
		if (!dialogueShown) {
			dialogueShown = true;
			// Will auto-play with autoPlay={!dialogueShown} prop
		}
	});

	function adjustSeverity(value) {
		severity = value;
	}

	function handleSliderMouseDown() {
		isDragging = true;
		wiiSounds.play('click'); // Button grab sound
	}

	function handleSliderMouseMove() {
		if (isDragging) {
			// Start scroll sound if not already playing
			if (!scrollAudio || scrollAudio.ended) {
				playScrollSound();
			}
		}
	}

	function handleSliderMouseUp() {
		if (isDragging) {
			isDragging = false;
			stopScrollSound();
		}
	}

	function playScrollSound() {
		// Stop any existing scroll audio
		stopScrollSound();

		// Create and play scroll audio
		scrollAudio = new Audio('/assets/sounds/Sound Effects/UI and System/UI_Scroll.wav');
		scrollAudio.volume = 0.3;
		scrollAudio.play().catch(() => {});

		// Set up looping when audio ends (if still dragging)
		scrollAudio.addEventListener('ended', () => {
			if (isDragging) {
				// Continue looping if still dragging
				playScrollSound();
			}
		});
	}

	function stopScrollSound() {
		if (scrollAudio) {
			scrollAudio.pause();
			scrollAudio.currentTime = 0;
			scrollAudio = null;
		}
		if (scrollLoopInterval) {
			clearInterval(scrollLoopInterval);
			scrollLoopInterval = null;
		}
	}
</script>

<div class="map-container">
	<div class="character-guide">
		<RoverModel mood="thinking" size="small" isSpeaking={roverIsSpeaking} />
		<ACDialogue
			character="Rover"
			text={stableDialogue || personalizedDialogue}
			externalControl={false}
			autoPlay={!dialogueShown}
			showTail={true}
			mood="thinking"
			speed={25}
			delay={500}
			class="small-dialogue"
			onSpeakingChange={(speaking) => {
				console.log('ColorMap: Rover speaking state changed to', speaking);
				roverIsSpeaking = speaking;
			}}
		>
			{#snippet children()}{/snippet}
		</ACDialogue>
	</div>

	<!-- Navigation Tabs -->
	<div class="view-tabs">
		<button
			class="tab-button"
			class:active={currentView === 'personal'}
			onmouseenter={() => wiiSounds.play('hover')}
			onclick={() => {
				wiiSounds.play('select');
				currentView = 'personal';
			}}
		>
			📊 Your Results
		</button>
		<button
			class="tab-button"
			class:active={currentView === 'simulation'}
			onmouseenter={() => wiiSounds.play('hover')}
			onclick={() => {
				wiiSounds.play('select');
				currentView = 'simulation';
			}}
		>
			🌈 Color Simulation
		</button>
		{#if personalAnalysis?.personalConfusions.length > 0}
			<button
				class="tab-button"
				class:active={currentView === 'practice'}
				onmouseenter={() => wiiSounds.play('hover')}
				onclick={() => {
					wiiSounds.play('select');
					currentView = 'practice';
				}}
			>
				🎯 Challenging Colors
			</button>
		{/if}
	</div>

	<!-- Content Views -->
	{#if currentView === 'personal'}
		<div class="personal-analysis">
			{#if personalAnalysis}
				<div class="stats-overview">
					<h3 class="section-title">📈 Your Test Performance</h3>
					<div class="stats-grid">
						<div class="stat-card">
							<div class="stat-value">{personalAnalysis.totalQuestions}</div>
							<div class="stat-label">Questions</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">{Math.round(personalAnalysis.accuracy)}%</div>
							<div class="stat-label">Accuracy</div>
						</div>
						{#if isAdaptive}
							<div class="stat-card">
								<div class="stat-value">{Math.round(confidence * 100)}%</div>
								<div class="stat-label">AI Confidence</div>
							</div>
							<div class="stat-card">
								<div class="stat-value">
									{Math.round((personalAnalysis.averageResponseTime / 1000) * 10) / 10}s
								</div>
								<div class="stat-label">Avg Time</div>
							</div>
						{/if}
					</div>
				</div>

				{#if isAdaptive && personalAnalysis.axisPerformance}
					<div class="axis-performance">
						<h3 class="section-title">🎯 Color Axis Performance</h3>
						<div class="axis-grid">
							{#each Object.entries(personalAnalysis.axisPerformance) as [axis, performance]}
								<div class="axis-card" class:challenging={performance.accuracy < 70}>
									<div class="axis-name">{axis.replace('-', ' ')}</div>
									<div class="axis-accuracy">{Math.round(performance.accuracy)}%</div>
									<div class="axis-count">{performance.correct}/{performance.total}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{:else}
				<div class="no-results">
					<h3 class="section-title">📊 No Test Data Available</h3>
					<p>Complete the color vision test to see your personalized analysis here.</p>
				</div>
			{/if}
		</div>
	{:else if currentView === 'simulation'}
		<div class="simulation-view">
			<div class="controls">
				<label class="severity-control">
					<span class="control-label">Simulation Strength:</span>
					<input
						type="range"
						min="0"
						max="1"
						step="0.1"
						bind:value={severity}
						onmouseenter={() => wiiSounds.play('hover')}
						onmousedown={handleSliderMouseDown}
						onmousemove={handleSliderMouseMove}
						onmouseup={handleSliderMouseUp}
						onmouseleave={handleSliderMouseUp}
						class="severity-slider"
					/>
					<span class="severity-value">{Math.round(severity * 100)}%</span>
				</label>

				<button
					class="toggle-button"
					onmouseenter={() => wiiSounds.play('hover')}
					onclick={() => {
						wiiSounds.play('select');
						showComparison = !showComparison;
					}}
				>
					{showComparison ? 'Show Rainbow' : 'Show Comparison'}
				</button>
			</div>

			{#if showComparison}
				<div class="comparison-section">
					<h3 class="section-title">🌈 Color Confusion Areas 🌈</h3>

					<div class="confusion-grid">
						<h4 class="grid-title">These colors can be tricky:</h4>
						{#each confusionPairs.hardToDistinguish as pair}
							<div class="confusion-pair">
								<div class="pair-label">{pair.label}</div>
								<div class="color-comparison">
									<div class="color-block">
										<div class="swatch" style="background-color: {pair.normal}"></div>
										<div class="label">Normal</div>
									</div>
									<div class="arrow">→</div>
									<div class="color-block">
										<div
											class="swatch"
											style="background-color: {simulateDeuteranomaly(pair.normal, severity)}"
										></div>
										<div class="label">Simulated View</div>
									</div>
									<div class="vs">VS</div>
									<div class="color-block">
										<div class="swatch" style="background-color: {pair.confused}"></div>
										<div class="label">Confused With</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="rainbow-section">
					<h3 class="section-title">🎨 Full Color Spectrum 🎨</h3>

					<div class="spectrum-container">
						<div class="spectrum-row">
							<h4 class="spectrum-label">Normal Vision:</h4>
							<div class="color-spectrum">
								{#each rainbowColors as color}
									<div class="spectrum-slice" style="background-color: {color}" title={color}></div>
								{/each}
							</div>
						</div>

						<div class="spectrum-row">
							<h4 class="spectrum-label">Simulated View:</h4>
							<div class="color-spectrum">
								{#each simulatedColors as color, i}
									<div
										class="spectrum-slice"
										style="background-color: {color}"
										title={`Original: ${rainbowColors[i]} → Simulated: ${color}`}
									></div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else if currentView === 'practice'}
		<div class="practice-view">
			{#if personalAnalysis?.personalConfusions.length > 0}
				<div class="personal-confusions">
					<h3 class="section-title">❌ Your Challenging Colors</h3>
					<div class="confusion-grid">
						{#each personalAnalysis.personalConfusions as confusion}
							<div class="confusion-card">
								<div class="confusion-colors">
									<div class="color-swatch" style="background-color: {confusion.reference}"></div>
									<span class="vs-arrow">→</span>
									<div
										class="color-swatch chosen"
										style="background-color: {confusion.chosen}"
									></div>
									<span class="vs-text">vs</span>
									<div
										class="color-swatch correct"
										style="background-color: {confusion.correct}"
									></div>
								</div>
								<div class="confusion-details">
									<div class="confusion-axis">{confusion.axis} axis</div>
									<div class="confusion-time">
										{Math.round((confusion.responseTime / 1000) * 10) / 10}s
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="perfect-score">
					<h3 class="section-title">🎉 Perfect Performance!</h3>
					<p>
						You didn't make any mistakes during the test. This suggests excellent color
						discrimination abilities!
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
	@import url('../styles/sprites.css');

	.map-container {
		max-width: 1000px;
		margin: 0 auto;
		font-family: 'Nunito', sans-serif;
		background: #ffffff;
		padding: 20px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
	}

	/* Tab Navigation */
	.view-tabs {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin: 20px 0;
		border-bottom: 2px solid #e0e0e0;
		padding-bottom: 10px;
	}

	.tab-button {
		background: #f5f5f5;
		border: 2px solid #d0d0d0;
		padding: 10px 20px;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.3s;
		font-weight: 600;
		font-size: 14px;
	}

	.tab-button:hover {
		background: #e8f4fd;
		border-color: #4ecdc4;
		transform: translateY(-2px);
	}

	.tab-button.active {
		background: #4ecdc4;
		color: white;
		border-color: #4ecdc4;
	}

	/* Personal Analysis Styles */
	.personal-analysis {
		padding: 20px;
	}

	.stats-overview {
		margin-bottom: 30px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
		margin-top: 15px;
	}

	.stat-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 20px;
		border-radius: 15px;
		text-align: center;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 800;
		margin-bottom: 5px;
	}

	.stat-label {
		font-size: 0.9rem;
		opacity: 0.9;
		font-weight: 600;
	}

	/* Axis Performance */
	.axis-performance {
		margin-bottom: 30px;
	}

	.axis-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-top: 15px;
	}

	.axis-card {
		background: #f0f8ff;
		border: 2px solid #87ceeb;
		padding: 15px;
		border-radius: 12px;
		text-align: center;
	}

	.axis-card.challenging {
		background: #fff0f0;
		border-color: #ffb6c1;
	}

	.axis-name {
		font-weight: 700;
		text-transform: capitalize;
		margin-bottom: 8px;
		color: #2f4f4f;
	}

	.axis-accuracy {
		font-size: 1.4rem;
		font-weight: 600;
		color: #1e90ff;
	}

	.axis-card.challenging .axis-accuracy {
		color: #dc143c;
	}

	.axis-count {
		font-size: 0.9rem;
		color: #666;
		margin-top: 4px;
	}

	/* Personal Confusions */
	.personal-confusions {
		margin-bottom: 30px;
	}

	.confusion-grid {
		display: grid;
		gap: 15px;
		margin-top: 15px;
	}

	.confusion-card {
		background: #fff8f0;
		border: 2px solid #ffe5cc;
		border-radius: 12px;
		padding: 15px;
	}

	.confusion-colors {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15px;
		margin-bottom: 10px;
	}

	.color-swatch {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 3px solid #fff;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
	}

	.color-swatch.large {
		width: 60px;
		height: 60px;
	}

	.color-swatch.medium {
		width: 50px;
		height: 50px;
	}

	.color-swatch.chosen {
		border-color: #ff6347;
	}

	.color-swatch.correct {
		border-color: #32cd32;
	}

	.vs-arrow,
	.vs-text {
		font-weight: 700;
		color: #8b4513;
	}

	.confusion-details {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		color: #666;
	}

	.confusion-axis {
		font-weight: 600;
	}

	/* Practice View */
	.practice-view {
		padding: 20px;
	}

	.practice-intro {
		text-align: center;
		color: #666;
		margin-bottom: 20px;
		font-size: 1.1rem;
	}

	.practice-grid {
		display: grid;
		gap: 20px;
		margin-top: 20px;
	}

	.practice-card {
		background: #f0f8ff;
		border: 2px solid #87ceeb;
		border-radius: 15px;
		padding: 20px;
	}

	.practice-header {
		font-weight: 700;
		color: #4682b4;
		margin-bottom: 15px;
		text-align: center;
		font-size: 1.1rem;
	}

	.practice-question {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 20px;
		margin-bottom: 15px;
	}

	.practice-reference {
		text-align: center;
	}

	.practice-choices {
		display: flex;
		gap: 20px;
	}

	.choice-group {
		text-align: center;
	}

	.choice-label,
	.swatch-label {
		font-size: 0.9rem;
		color: #666;
		margin-top: 8px;
		font-weight: 600;
	}

	.practice-tips {
		background: #fff9e6;
		padding: 10px;
		border-radius: 8px;
		border-left: 4px solid #ffa500;
		color: #8b4513;
		font-size: 0.9rem;
	}

	/* Perfect Score */
	.perfect-score,
	.no-results,
	.no-practice-needed {
		text-align: center;
		padding: 40px 20px;
		background: #f0fff0;
		border: 2px solid #90ee90;
		border-radius: 15px;
	}

	.no-results {
		background: #fff8f0;
		border-color: #ffe5cc;
	}

	.character-guide {
		display: flex;
		align-items: flex-start;
		gap: 20px;
		margin-bottom: 30px;
		animation: slideIn 0.5s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.character-sprite {
		animation: bob 2s ease-in-out infinite;
	}

	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	:global(.small-dialogue) {
		transform: scale(0.7);
		transform-origin: left center;
		max-width: 400px;
	}

	:global(.small-dialogue .dialogue) {
		min-height: 200px;
		height: 200px;
		min-width: 400px;
		max-width: 500px;
	}

	:global(.small-dialogue .dialogue-text) {
		font-size: 1.4rem;
		padding: 0.8rem;
	}

	:global(.small-dialogue .dialogue-character) {
		font-size: 1.4rem;
		padding: 0.3rem 1.2rem;
	}

	.controls {
		background: #fff8f0;
		padding: 20px;
		border-radius: 20px;
		border: 3px solid #d2691e;
		margin-bottom: 30px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}

	.severity-control {
		display: flex;
		align-items: center;
		gap: 15px;
		flex: 1;
	}

	.control-label {
		font-weight: 700;
		color: #8b4513;
	}

	.severity-slider {
		flex: 1;
		height: 8px;
		border-radius: 10px;
		background: linear-gradient(90deg, #98fb98, #ffb6c1);
		outline: none;
		-webkit-appearance: none;
	}

	.severity-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		background: #ff6b9d;
		border: 3px solid #fff;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s;
	}

	.severity-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.severity-value {
		font-weight: 700;
		color: #ff6b9d;
		min-width: 40px;
	}

	.toggle-button {
		background: linear-gradient(135deg, #4ecdc4, #45b7d1);
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 20px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
	}

	.toggle-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	}

	.comparison-section,
	.rainbow-section {
		background: #fff;
		padding: 30px;
		border-radius: 20px;
		border: 3px solid #d2691e;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.section-title {
		text-align: center;
		color: #8b4513;
		font-size: 24px;
		margin-bottom: 25px;
		font-weight: 800;
	}

	.confusion-grid,
	.easy-grid {
		margin-bottom: 30px;
	}

	.grid-title {
		color: #666;
		font-size: 16px;
		margin-bottom: 20px;
		font-weight: 700;
	}

	.confusion-pair,
	.easy-pair {
		background: #fff8f0;
		padding: 15px;
		border-radius: 15px;
		margin-bottom: 15px;
		border: 2px solid #ffe5cc;
	}

	.pair-label {
		font-weight: 700;
		color: #8b4513;
		margin-bottom: 10px;
		font-size: 14px;
	}

	.color-comparison {
		display: flex;
		align-items: center;
		gap: 10px;
		justify-content: center;
	}

	.color-block {
		text-align: center;
	}

	.swatch {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 3px solid #fff;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
		margin-bottom: 5px;
	}

	.label {
		font-size: 12px;
		color: #666;
		font-weight: 600;
	}

	.arrow,
	.vs {
		font-weight: 700;
		color: #8b4513;
		font-size: 20px;
	}

	.spectrum-container {
		margin-bottom: 30px;
	}

	.spectrum-row {
		margin-bottom: 20px;
	}

	.spectrum-label {
		color: #8b4513;
		font-weight: 700;
		margin-bottom: 10px;
	}

	.color-spectrum {
		display: flex;
		height: 50px;
		border-radius: 25px;
		overflow: hidden;
		border: 3px solid #fff;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
	}

	.spectrum-slice {
		flex: 1;
		transition: transform 0.3s;
	}

	.spectrum-slice:hover {
		transform: scaleY(1.2);
		z-index: 1;
	}

	.color-wheel-section {
		text-align: center;
	}

	.wheel-title {
		color: #8b4513;
		font-weight: 700;
		margin-bottom: 20px;
	}

	.wheels-container {
		display: flex;
		justify-content: center;
		gap: 50px;
	}

	.wheel-wrapper {
		text-align: center;
	}

	.wheel-label {
		font-weight: 700;
		color: #666;
		margin-bottom: 10px;
	}

	.color-wheel {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		position: relative;
		overflow: hidden;
		border: 5px solid #fff;
		box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
		animation: rotate 20s linear infinite;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.wheel-segment {
		position: absolute;
		width: 50%;
		height: 50%;
		top: 50%;
		left: 50%;
		transform-origin: 0 0;
		clip-path: polygon(0 0, 50% 0, 0 100%);
	}

	.test-insights {
		margin-top: 30px;
		background: #e8f5e9;
		padding: 25px;
		border-radius: 20px;
		border: 3px solid #4caf50;
	}

	.insight-card {
		background: #fff;
		padding: 20px;
		border-radius: 15px;
	}

	.insight-text {
		color: #333;
		line-height: 1.6;
		margin-bottom: 15px;
	}

	.tip {
		background: #fff3e0;
		padding: 15px;
		border-radius: 10px;
		border-left: 4px solid #ffa500;
		color: #666;
		font-weight: 600;
	}

	/* Personal Data Styles */
	.personal-stats {
		background: #fff8dc;
		padding: 20px;
		border-radius: 12px;
		border: 2px solid #dda0dd;
		margin-bottom: 25px;
	}

	.accuracy-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-top: 15px;
	}

	.axis-stat {
		background: #f0f8ff;
		padding: 12px;
		border-radius: 8px;
		border: 2px solid #87ceeb;
		text-align: center;
	}

	.axis-stat.challenging {
		background: #fff0f0;
		border-color: #ffb6c1;
	}

	.axis-name {
		font-weight: 700;
		text-transform: capitalize;
		margin-bottom: 5px;
		color: #2f4f4f;
	}

	.axis-score {
		font-size: 1.1em;
		font-weight: 600;
		color: #1e90ff;
	}

	.axis-stat.challenging .axis-score {
		color: #dc143c;
	}

	.personal-mistake {
		background: #fff5ee;
		border-left: 4px solid #ff8c00;
	}

	.correct-choice {
		border: 2px solid #32cd32;
	}

	.your-choice {
		border: 2px solid #ff6347;
	}

	.no-mistakes {
		text-align: center;
		font-size: 1.2em;
		color: #228b22;
		font-weight: 600;
		padding: 30px;
	}
</style>
