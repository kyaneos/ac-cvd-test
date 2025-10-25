<script>
	import { createEventDispatcher } from 'svelte';
	import { analyzeResults } from '../utils/colorSimulation.js';
	import { dataManager } from '../utils/dataManager.js';
	import ACButton from './ACButton.svelte';
	import ACDialogue from './ACDialogue.svelte';
	import RoverModel from './RoverModel.svelte';
	import { onMount } from 'svelte';
	import { wiiSounds } from '../utils/wiiSounds.js';

	const dispatch = createEventDispatcher();

	let { testResults = [], sessionData = null } = $props();

	let analysis = $derived(analyzeResults(testResults));
	let showDetails = $state(false);
	let celebrationMessage = $state('');

	const celebrationMessages = [
		'Fascinating results! You did quite well.',
		'These findings are quite interesting indeed.',
		'Thanks for taking the time to do this test.',
		'I hope this helps you understand colors better.',
		"Color perception is truly remarkable, isn't it?"
	];

	onMount(async () => {
		celebrationMessage =
			celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
		await wiiSounds.init();
	});

	function resetTest() {
		dispatch('reset');
	}

	function getScoreIcon(accuracy) {
		if (accuracy >= 80) return 'star-icon';
		if (accuracy >= 60) return 'star-icon';
		if (accuracy >= 40) return 'bell-icon';
		return 'circle-button';
	}

	// Export functions
	function exportCSV() {
		wiiSounds.play('select');
		const success = dataManager.downloadCSV();
		if (success) {
			celebrationMessage = 'Your results have been saved! Check your downloads folder.';
		} else {
			celebrationMessage = 'Sorry, there was an issue saving your results.';
		}
	}

	function exportJSON() {
		wiiSounds.play('select');
		const success = dataManager.downloadJSON();
		if (success) {
			celebrationMessage = 'Your detailed results have been saved as JSON!';
		} else {
			celebrationMessage = 'Sorry, there was an issue saving your results.';
		}
	}

	// Test by test results view
	function toggleDetails() {
		wiiSounds.play('select');
		showDetails = !showDetails;
	}

	function getCategoryColor(category) {
		const colors = {
			'red-green': '#FF6B6B',
			'red-orange': '#FFA07A',
			'blue-green': '#4ECDC4',
			green: '#95E77E',
			'red-pink': '#FF6B9D',
			'orange-pink': '#FFB6C1'
		};
		return colors[category] || '#999';
	}
</script>

<div class="results-container">
	<div class="character-celebration">
		<RoverModel mood="happy" />
		<div class="speech-bubble">
			<p class="celebration-text">{celebrationMessage}</p>
			<p class="sub-text">- Rover</p>
		</div>
	</div>

	<div class="score-card">
		<h2 class="results-title">Your Color Vision Profile</h2>

		<div class="overall-score">
			<div class="score-circle">
				<div class="score-number">{Math.round(analysis.overall.accuracy)}%</div>
				<div class="score-label">Overall Accuracy</div>
			</div>
			<div class="score-details">
				<p class="detail-line">
					<span class="emoji">✅</span>
					{analysis.overall.correct} out of {analysis.overall.total} correct
				</p>
				<p class="detail-line">
					<span class="emoji">{getScoreEmoji(analysis.overall.accuracy)}</span>
					Great job!
				</p>
			</div>
		</div>

		<div class="category-breakdown">
			<h3 class="breakdown-title">Performance by Color Type</h3>
			<div class="categories">
				{#each Object.entries(analysis.byCategory) as [category, data]}
					<div class="category-card">
						<div class="category-icon" style="background-color: {getCategoryColor(category)}"></div>
						<div class="category-info">
							<div class="category-name">{category.replace('-', ' ')}</div>
							<div class="category-score">
								{Math.round(data.accuracy)}%
								<span class="small">({data.correct}/{data.total})</span>
							</div>
							<div class="accuracy-bar">
								<div
									class="accuracy-fill"
									style="width: {data.accuracy}%; background-color: {getCategoryColor(category)}"
								></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		{#if analysis.confusionAreas.length > 0}
			<div class="confusion-analysis">
				<h3 class="analysis-title">Color Confusion Areas</h3>
				<div class="confusion-cards">
					{#each analysis.confusionAreas as area}
						<div class="confusion-card" class:high={area.severity === 'High'}>
							<div class="severity-badge {area.severity.toLowerCase()}">
								{area.severity} Confusion
							</div>
							<div class="confusion-category">{area.category.replace('-', ' ')}</div>
							<div class="confusion-accuracy">{Math.round(area.accuracy)}% accuracy</div>
							<div class="recommendation">
								<span class="rec-icon">💡</span>
								{area.recommendation}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<button
			class="details-toggle"
			onmouseenter={() => wiiSounds.play('hover')}
			onclick={() => {
				wiiSounds.play('select');
				showDetails = !showDetails;
			}}
		>
			{showDetails ? 'Hide' : 'Show'} Detailed Results 📊
		</button>

		{#if showDetails}
			<div class="detailed-results">
				<h3 class="details-title">Test by Test Results</h3>
				<div class="test-list">
					{#each testResults as result, i}
						<div class="test-item">
							<span class="test-number">#{i + 1}</span>
							<div class="test-color" style="background-color: {result.reference}"></div>
							<span class="test-category">{result.category}</span>
							<span class="test-result">
								{#if result.correct}
									<span class="correct">✓ Correct</span>
								{:else}
									<span class="incorrect">✗ Missed</span>
								{/if}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="action-buttons">
			<ACButton onClick={resetTest} class="retry-button">Try Again</ACButton>

			<ACButton onClick={exportCSV} class="export-button">Export CSV</ACButton>

			<ACButton onClick={exportJSON} class="export-button">Export JSON</ACButton>

			<ACButton onClick={toggleDetails} class="details-button">
				{showDetails ? 'Hide' : 'Show'} Details
			</ACButton>
		</div>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
	@import url('../styles/sprites.css');

	.results-container {
		max-width: 800px;
		margin: 0 auto;
		font-family: 'Nunito', sans-serif;
		background: #ffffff;
		padding: 20px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
	}

	.character-celebration {
		text-align: center;
		margin-bottom: 30px;
		animation: fadeIn 0.5s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.character-sprite {
		animation: celebrate 1s ease-in-out infinite;
	}

	@keyframes celebrate {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
		}
		25% {
			transform: scale(1.1) rotate(-5deg);
		}
		75% {
			transform: scale(1.1) rotate(5deg);
		}
	}

	.speech-bubble {
		background: #fff;
		display: inline-block;
		padding: 15px 25px;
		border-radius: 20px;
		border: 3px solid #8b4513;
		margin-top: 15px;
		position: relative;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.celebration-text {
		color: #ff6b9d;
		font-size: 20px;
		font-weight: 700;
		margin: 0;
	}

	.sub-text {
		color: #8b4513;
		font-size: 14px;
		margin: 5px 0 0 0;
		font-style: italic;
	}

	.score-card {
		background: #fff;
		border-radius: 20px;
		padding: 30px;
		border: 3px solid #d2691e;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.results-title {
		text-align: center;
		color: #8b4513;
		font-size: 28px;
		margin-bottom: 30px;
		font-weight: 800;
	}

	.overall-score {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 40px;
		margin-bottom: 40px;
		padding: 25px;
		background: linear-gradient(135deg, #ffe5cc, #ffd4e5);
		border-radius: 20px;
	}

	.score-circle {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		background: #fff;
		border: 5px solid #ffb6c1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
	}

	.score-number {
		font-size: 36px;
		font-weight: 800;
		color: #ff6b9d;
	}

	.score-label {
		font-size: 14px;
		color: #666;
		font-weight: 600;
	}

	.score-details {
		text-align: left;
	}

	.detail-line {
		margin: 10px 0;
		font-size: 18px;
		color: #333;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.emoji {
		font-size: 24px;
	}

	.category-breakdown {
		margin-bottom: 30px;
	}

	.breakdown-title {
		color: #8b4513;
		font-size: 20px;
		margin-bottom: 20px;
		font-weight: 700;
	}

	.categories {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 15px;
	}

	.category-card {
		display: flex;
		align-items: center;
		gap: 15px;
		padding: 15px;
		background: #fff8f0;
		border-radius: 15px;
		border: 2px solid #ffe5cc;
	}

	.category-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.category-info {
		flex: 1;
	}

	.category-name {
		font-weight: 700;
		color: #666;
		text-transform: capitalize;
		font-size: 14px;
	}

	.category-score {
		font-size: 18px;
		font-weight: 700;
		color: #333;
		margin: 5px 0;
	}

	.small {
		font-size: 14px;
		color: #999;
	}

	.accuracy-bar {
		height: 8px;
		background: #e0e0e0;
		border-radius: 10px;
		overflow: hidden;
		margin-top: 5px;
	}

	.accuracy-fill {
		height: 100%;
		border-radius: 10px;
		transition: width 1s ease;
	}

	.confusion-analysis {
		margin-bottom: 30px;
	}

	.analysis-title {
		color: #8b4513;
		font-size: 20px;
		margin-bottom: 20px;
		font-weight: 700;
	}

	.confusion-cards {
		display: grid;
		gap: 15px;
	}

	.confusion-card {
		padding: 20px;
		background: #fff3e0;
		border-radius: 15px;
		border: 2px solid #ffb366;
		position: relative;
	}

	.confusion-card.high {
		background: #ffebee;
		border-color: #ff6b6b;
	}

	.severity-badge {
		position: absolute;
		top: -10px;
		right: 20px;
		background: #ffa500;
		color: white;
		padding: 5px 15px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 700;
	}

	.severity-badge.high {
		background: #ff6b6b;
	}

	.severity-badge.moderate {
		background: #ffa500;
	}

	.confusion-category {
		font-weight: 700;
		color: #333;
		text-transform: capitalize;
		margin-bottom: 5px;
	}

	.confusion-accuracy {
		color: #666;
		margin-bottom: 10px;
	}

	.recommendation {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		color: #555;
		font-size: 14px;
		line-height: 1.4;
	}

	.rec-icon {
		font-size: 18px;
	}

	.details-toggle {
		background: #e8f5e9;
		border: 2px solid #4caf50;
		color: #2e7d32;
		padding: 10px 20px;
		border-radius: 20px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s;
		margin: 20px 0;
		width: 100%;
	}

	.details-toggle:hover {
		background: #4caf50;
		color: white;
	}

	.detailed-results {
		margin-top: 20px;
		padding: 20px;
		background: #f5f5f5;
		border-radius: 15px;
	}

	.details-title {
		color: #666;
		font-size: 16px;
		margin-bottom: 15px;
		font-weight: 700;
	}

	.test-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.test-item {
		display: flex;
		align-items: center;
		gap: 15px;
		padding: 10px;
		background: white;
		border-radius: 10px;
	}

	.test-number {
		color: #999;
		font-weight: 700;
		font-size: 14px;
	}

	.test-color {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 2px solid #ddd;
	}

	.test-category {
		flex: 1;
		color: #666;
		font-size: 14px;
	}

	.correct {
		color: #4caf50;
		font-weight: 700;
	}

	.incorrect {
		color: #ff6b6b;
		font-weight: 700;
	}

	.action-buttons {
		display: flex;
		gap: 15px;
		margin-top: 30px;
	}

	.retry-button,
	.share-button {
		flex: 1;
		padding: 15px;
		border-radius: 20px;
		border: none;
		font-weight: 700;
		font-size: 16px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.retry-button {
		background: linear-gradient(135deg, #4ecdc4, #45b7d1);
		color: white;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
	}

	.share-button {
		background: linear-gradient(135deg, #ffb6c1, #ffa07a);
		color: white;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
	}

	.retry-button:hover,
	.share-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	}
</style>
