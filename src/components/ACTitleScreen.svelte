<script>
	import { onMount } from 'svelte';
	import { soundManager } from '../utils/soundEffects.js';
	import { wiiSounds } from '../utils/wiiSounds.js';

	let { onStartTest = () => {}, class: className = '' } = $props();

	let titleMusicPlaying = false;
	let titleMusicAudio = null;
	let showContent = $state(false);
	let showStartButton = $state(false);
	let fadeOut = $state(false);
	let showBlackScreen = $state(false);

	onMount(async () => {
		// Reset state variables
		fadeOut = false;
		showBlackScreen = false;
		showContent = false;
		showStartButton = false;

		// Initialize sounds immediately on title screen
		try {
			await soundManager.initialize();
			await wiiSounds.init();
		} catch (error) {
			console.log('Sound initialization failed:', error);
		}

		// Start the title sequence
		setTimeout(() => {
			playTitleMusic();
			showContent = true;

			// Show start button after content loads
			setTimeout(() => {
				showStartButton = true;
			}, 1500);
		}, 500);
	});

	async function playTitleMusic() {
		if (titleMusicPlaying || titleMusicAudio) return;

		try {
			titleMusicAudio = new Audio('/assets/sounds/title.mp3');
			titleMusicAudio.volume = 0.0;
			titleMusicAudio.loop = true;

			await titleMusicAudio.play();
			titleMusicPlaying = true;

			// Gentle fade-in for title music
			const fadeIn = setInterval(() => {
				if (titleMusicAudio && titleMusicAudio.volume < 0.25) {
					titleMusicAudio.volume += 0.01;
				} else {
					clearInterval(fadeIn);
				}
			}, 50);
		} catch (error) {
			// This is expected - browsers block autoplay until user interaction
			// Music will play when user clicks start button
			titleMusicPlaying = false;
		}
	}

	function stopTitleMusic() {
		if (titleMusicAudio) {
			titleMusicAudio.pause();
			titleMusicAudio = null;
			titleMusicPlaying = false;
		}
	}

	async function handleStartClick() {
		wiiSounds.play('decide'); // START SFX moved from Wii Loading to Title Screen

		// Start fade out
		fadeOut = true;

		// Stop music
		stopTitleMusic();

		// Wait for fade out (500ms)
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Show black screen
		showBlackScreen = true;

		// Wait 4 seconds on black screen (longer to account for transition)
		await new Promise((resolve) => setTimeout(resolve, 4000));

		// Hide black screen to allow app fade-in
		showBlackScreen = false;

		// Call the parent's start test function (which will fade in the app)
		onStartTest();
	}

	// Expose function for external control
	export function restartTitleMusic() {
		playTitleMusic();
	}
</script>

{#if showBlackScreen}
	<div class="black-screen"></div>
{:else}
	<div class="title-screen {className}" class:fade-out={fadeOut}>
		<!-- AC-style background -->
		<div class="village-background"></div>

		{#if showContent}
			<!-- Use color vision title.png directly -->
			<div class="title-logo-container ac-fade-in">
				<img
					src="/assets/textures/color vision title.png"
					alt="Animal Crossing Color Vision"
					class="color-vision-title"
				/>
			</div>

			<!-- Start instruction -->
			{#if showStartButton}
				<div
					class="start-section ac-fade-in-delayed"
					onclick={handleStartClick}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && handleStartClick()}
				>
					<div class="press-instruction">Press START</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.title-screen {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		background: linear-gradient(135deg, #87ceeb 0%, #98fb98 50%, #f0e68c 100%);
		overflow: hidden;
		transition: opacity 0.5s ease-out;
	}

	.title-screen.fade-out {
		opacity: 0;
	}

	.black-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #000;
		z-index: 1000;
	}

	.village-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/assets/textures/title background.webp');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.title-logo-container {
		position: relative;
		z-index: 2;
		margin-bottom: 60px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.color-vision-title {
		max-width: 500px;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
	}

	.start-section {
		position: relative;
		z-index: 2;
		text-align: center;
		cursor: pointer;
	}

	.press-instruction {
		font-size: 32px;
		font-weight: bold;
		color: #ffff00;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
		font-family: 'Nunito', 'Comic Sans MS', sans-serif;
		animation: pulse 2s infinite ease-in-out;
	}

	/* Animations */
	.ac-fade-in {
		animation: ac-fade-in 1s ease-out;
	}

	.ac-fade-in-delayed {
		animation: ac-fade-in 1s ease-out 0.5s both;
	}

	@keyframes ac-fade-in {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.05);
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.color-vision-title {
			max-width: 400px;
		}

		.press-instruction {
			font-size: 28px;
		}
	}

	@media (max-width: 480px) {
		.color-vision-title {
			max-width: 300px;
		}

		.press-instruction {
			font-size: 24px;
		}
	}
</style>
