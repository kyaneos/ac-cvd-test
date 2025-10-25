<script>
	import ColorTest from './components/ColorTest.svelte';
	import AdaptiveColorTest from './components/AdaptiveColorTest.svelte';
	import ColorMap from './components/ColorMap.svelte';
	import Results from './components/Results.svelte';
	import InfoCard from './components/InfoCard.svelte';
	import ACTitleScreen from './components/ACTitleScreen.svelte';
	import WiiLoadScreen from './components/WiiLoadScreen.svelte';
	import { onMount } from 'svelte';
	import { autoSoundInit } from './utils/autoSoundInit.js';
	import { wiiSounds } from './utils/wiiSounds.js';
	import { stopAllAnimalese } from './utils/soundEffects.js';
	import { adaptiveTestState } from './lib/stores.js';

	let currentView = $state('wii-load'); // Start with Wii load screen - using rune
	let useAdaptiveTest = $state(true); // Default to adaptive test
	let testResults = $state([]);
	let adaptiveResults = $state([]);
	let sessionData = $state(null);
	let showResults = $state(false);
	let titleScreenComponent = $state(null);
	let fadeInApp = $state(false);
	let fadeToBlack = $state(false);

	onMount(async () => {
		// Initialize auto sound system when app loads
		autoSoundInit.init();
		// Initialize Wii sounds for UI - CRITICAL for hover sounds throughout app
		await wiiSounds.init();
		console.log('App: Wii sounds initialized for entire app');

		// Load adaptive test results if they exist
		adaptiveTestState.subscribe((state) => {
			if (state.testResults && state.testResults.length > 0) {
				adaptiveResults = state.testResults;
				console.log('App: Loaded adaptive results from store:', adaptiveResults.length);
			}
		});
	});

	function handleTestComplete(event) {
		if (useAdaptiveTest) {
			adaptiveResults = event.detail.results || [];
			sessionData = event.detail.sessionData || null;
			// Also save to store for persistence
			adaptiveTestState.update((state) => ({
				...state,
				testResults: adaptiveResults
			}));
		} else {
			testResults = event.detail.results || [];
			sessionData = event.detail.sessionData || null;
		}
		showResults = true;
		currentView = 'results';
	}

	async function resetTest() {
		// Play return to title sound
		wiiSounds.play('returnTitle');

		// Start fade to black
		fadeToBlack = true;

		// Wait for fade
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Reset state
		testResults = [];
		sessionData = null;
		showResults = false;
		currentView = 'start';

		// Remove fade
		fadeToBlack = false;

		// Restart title music when returning to start screen
		setTimeout(() => {
			if (titleScreenComponent && titleScreenComponent.restartTitleMusic) {
				titleScreenComponent.restartTitleMusic();
			}
		}, 500);
	}

	function startTest() {
		switchTab('test');
		// Trigger fade in animation
		fadeInApp = true;
	}

	function handleWiiLoadComplete() {
		currentView = 'start';
	}

	function switchTab(newView) {
		// Stop all sounds before switching tabs
		console.log('App: switchTab called, stopping all sounds before switching to', newView);
		stopAllAnimalese();
		wiiSounds.stopAll(); // Stop any playing UI sounds
		currentView = newView;
	}

	function toggleTestMode() {
		wiiSounds.play('select');
		useAdaptiveTest = !useAdaptiveTest;
		console.log('App: Switched to', useAdaptiveTest ? 'Adaptive' : 'Classic', 'test mode');

		// If currently on test view, reset to start fresh with new mode
		if (currentView === 'test') {
			// Reset test state when switching modes
			testResults = [];
			adaptiveResults = [];
			sessionData = null;
			showResults = false;

			// Clear adaptive state if switching away from adaptive
			if (!useAdaptiveTest) {
				adaptiveTestState.update((state) => ({
					...state,
					bayesianState: null,
					testResults: [],
					gameStarted: false
				}));
			}

			// Stay on test tab but restart
			setTimeout(() => {
				switchTab('test');
			}, 100);
		}
	}
</script>

<main
	class:fade-in-app={fadeInApp}
	class:title-loading={currentView === 'start' || currentView === 'wii-load'}
>
	{#if currentView !== 'start' && currentView !== 'wii-load'}
		<header>
			<h1>Color Vision Test</h1>
			<nav>
				<button
					class:active={currentView === 'test'}
					onmouseenter={() => wiiSounds.play('hover')}
					onclick={() => {
						wiiSounds.play('select');
						switchTab('test');
					}}
				>
					{useAdaptiveTest ? '🧠 Adaptive Test' : '📊 Classic Test'}
				</button>
				<button
					class:active={currentView === 'map'}
					onmouseenter={() => wiiSounds.play('hover')}
					onclick={() => {
						wiiSounds.play('select');
						switchTab('map');
					}}
				>
					Color Map
				</button>
				{#if showResults}
					<button
						class:active={currentView === 'results'}
						onmouseenter={() => wiiSounds.play('hover')}
						onclick={() => {
							wiiSounds.play('select');
							switchTab('results');
						}}
					>
						Results
					</button>
				{/if}
				<button
					onmouseenter={() => wiiSounds.play('hover')}
					onclick={() => {
						resetTest();
					}}
					class="restart-button"
				>
					<span class="ac-icon star-icon"></span> Start Over
				</button>
			</nav>
		</header>
	{/if}

	<div class="content">
		{#if currentView === 'wii-load'}
			<WiiLoadScreen onStart={handleWiiLoadComplete} />
		{:else if currentView === 'start'}
			<ACTitleScreen bind:this={titleScreenComponent} onStartTest={startTest} />
		{:else if currentView === 'test'}
			{#if useAdaptiveTest}
				<AdaptiveColorTest on:complete={handleTestComplete} />
			{:else}
				<ColorTest on:complete={handleTestComplete} />
			{/if}
		{:else if currentView === 'map'}
			<ColorMap testResults={useAdaptiveTest ? adaptiveResults : testResults} />
		{:else if currentView === 'results'}
			<Results
				testResults={useAdaptiveTest ? adaptiveResults : testResults}
				{sessionData}
				on:reset={resetTest}
			/>
		{/if}
	</div>

	{#if currentView !== 'start' && currentView !== 'wii-load'}
		<InfoCard />

		<!-- Hidden toggle button in bottom right -->
		<button
			onmouseenter={() => wiiSounds.play('hover')}
			onclick={() => {
				toggleTestMode();
			}}
			class="hidden-toggle"
			title={useAdaptiveTest ? 'Switch to Classic Test' : 'Switch to Adaptive Test'}
		>
			{useAdaptiveTest ? 'A' : 'C'}
		</button>
	{/if}

	{#if fadeToBlack}
		<div class="fade-to-black"></div>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		background: #ffffff;
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		background: #ffffff;
		min-height: 100vh;
	}

	/* Only apply fade effect to content views, not title/loading screens */
	main.title-loading {
		opacity: 1 !important;
	}

	main:not(.title-loading) {
		opacity: 0;
		transition: opacity 0.8s ease-in;
	}

	main.fade-in-app:not(.title-loading) {
		opacity: 1;
	}

	header {
		text-align: center;
		margin-bottom: 40px;
	}

	h1 {
		color: #333;
		margin-bottom: 30px;
	}

	nav {
		display: flex;
		justify-content: center;
		gap: 10px;
	}

	button {
		padding: 10px 20px;
		border: 2px solid #ddd;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s;
		font-size: 16px;
	}

	button:hover {
		background: #f0f0f0;
	}

	button.active {
		background: #4caf50;
		color: white;
		border-color: #4caf50;
	}

	.hidden-toggle {
		position: fixed;
		bottom: 80px;
		right: 80px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(135, 206, 235, 0.3);
		border: 1px solid rgba(95, 158, 160, 0.5);
		color: #2f4f4f;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 999;
		opacity: 0.4;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hidden-toggle:hover {
		background: rgba(95, 158, 160, 0.8);
		color: white;
		opacity: 1;
		transform: scale(1.1);
		border-color: #5f9ea0;
	}

	.restart-button {
		background: #ffa07a;
		border-color: #ff8c69;
	}

	.restart-button:hover {
		background: #ff8c69;
	}

	.content {
		background: #ffffff;
		padding: 0;
		min-height: 500px;
	}

	.fade-to-black {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #000;
		z-index: 9999;
		animation: fadeIn 0.5s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
