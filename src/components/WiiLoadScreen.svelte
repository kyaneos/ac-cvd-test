<script>
	import { onMount, onDestroy } from 'svelte';
	import { wiiSounds } from '../utils/wiiSounds.js';

	let { onStart = () => {} } = $props();

	let showLoading = $state(false);
	let loadingDots = $state('');
	let busFrame = $state(0);
	let loadingComplete = $state(false);
	let fadeOut = $state(false);

	let loadingInterval;
	let busInterval;

	async function handleStartClick() {
		// Fade to black first
		fadeOut = true;

		// Wait for fade
		await new Promise((resolve) => setTimeout(resolve, 500));

		showLoading = true;
		startLoadingAnimation();

		// Start wait sound
		wiiSounds.playLoop('wait');

		// Simulate loading time
		setTimeout(() => {
			loadingComplete = true;
			clearInterval(loadingInterval);
			clearInterval(busInterval);

			// Stop wait sound
			wiiSounds.stop('wait');

			// Small delay before transitioning
			setTimeout(() => {
				onStart();
			}, 500);
		}, 5000); // 5 seconds of loading
	}

	function startLoadingAnimation() {
		// Animate dots
		let dotCount = 0;
		loadingInterval = setInterval(() => {
			dotCount = (dotCount + 1) % 4;
			loadingDots = '.'.repeat(dotCount);
			// Play delete sound on each dot
			if (dotCount > 0) {
				wiiSounds.play('delete');
			}
		}, 500);

		// Animate bus
		busInterval = setInterval(() => {
			busFrame = (busFrame + 1) % 4;
		}, 400);
	}

	onMount(async () => {
		// Initialize Wii sounds
		await wiiSounds.init();
	});

	onDestroy(() => {
		if (loadingInterval) clearInterval(loadingInterval);
		if (busInterval) clearInterval(busInterval);
		wiiSounds.stopAll();
	});
</script>

{#if !showLoading}
	<!-- Start Screen - Wii Menu Style -->
	<div class="wii-start-screen" class:fade-out={fadeOut}>
		<div class="wii-container">
			<div class="wii-header">
				<h1 class="wii-title">Color Vision Test</h1>
				<p class="wii-subtitle">Wii Menu Electronic Manual</p>
			</div>

			<div class="wii-button-container">
				<button
					class="wii-start-button"
					onclick={handleStartClick}
					onmouseover={() => wiiSounds.play('select')}
				>
					Start
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- Loading Screen -->
	<div class="loading-screen">
		<div class="loading-text">
			Loading{loadingDots}
		</div>

		<!-- Bus Animation -->
		<div class="bus-container">
			<div class="bus-sprite frame-{busFrame}"></div>
		</div>
	</div>
{/if}

<style>
	/* Wii Start Screen Styles */
	.wii-start-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Segoe UI', 'Arial', sans-serif;
	}

	.wii-container {
		background: linear-gradient(to bottom, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%);
		border-radius: 20px;
		padding: 60px 80px;
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
		max-width: 600px;
		width: 90%;
		text-align: center;
		border: 2px solid #999;
	}

	.wii-header {
		margin-bottom: 50px;
	}

	.wii-title {
		font-size: 32px;
		color: #333;
		margin: 0 0 10px 0;
		font-weight: normal;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.wii-subtitle {
		font-size: 18px;
		color: #666;
		margin: 0;
	}

	.wii-button-container {
		display: flex;
		justify-content: center;
	}

	.wii-start-button {
		background: linear-gradient(to bottom, #fff 0%, #e0e0e0 100%);
		border: 2px solid #4a90e2;
		border-radius: 40px;
		padding: 15px 60px;
		font-size: 24px;
		color: #333;
		cursor: pointer;
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.wii-start-button:hover {
		background: linear-gradient(to bottom, #4a90e2 0%, #357abd 100%);
		color: white;
		transform: scale(1.05);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.wii-start-button:active {
		transform: scale(0.98);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	/* Loading Screen Styles */
	.loading-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-text {
		font-family: 'Segoe UI', 'Arial', sans-serif;
		font-size: 28px;
		color: #fff;
		letter-spacing: 2px;
	}

	/* Bus Animation */
	.bus-container {
		position: fixed;
		bottom: 30px;
		right: 30px;
	}

	.bus-sprite {
		width: 60px; /* Actual bus frame width (excluding border) */
		height: 30px; /* Actual bus frame height (excluding border) */
		background-image: url('/assets/textures/loading.png');
		background-size: 130px 66px; /* Slightly larger to account for borders */
		background-repeat: no-repeat;
		image-rendering: pixelated; /* Keep pixel art crisp */
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}

	.bus-sprite.frame-0 {
		background-position: -2px -2px; /* Top left: 1 smoke puff (skip border) */
	}

	.bus-sprite.frame-1 {
		background-position: -68px -2px; /* Top right: 2 smoke puffs (skip borders) */
	}

	.bus-sprite.frame-2 {
		background-position: -2px -34px; /* Bottom left: 3 smoke puffs (skip borders) */
	}

	.bus-sprite.frame-3 {
		background-position: -68px -34px; /* Bottom right: 4 smoke puffs (skip borders) */
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeToBlack {
		from {
			opacity: 1;
		}
		to {
			opacity: 1;
			background-color: #000;
		}
	}

	.wii-start-screen.fade-out {
		animation: fadeToBlack 0.5s ease-in forwards;
	}

	.wii-container {
		animation: fadeIn 0.5s ease-in;
	}

	.loading-text {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 1;
		}
	}
</style>
