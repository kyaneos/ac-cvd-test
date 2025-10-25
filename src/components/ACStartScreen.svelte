<script>
	import { onMount } from 'svelte';
	import { playTestStart } from '../utils/soundEffects.js';
	import ACButton from './ACButton.svelte';
	import ACDialogue from './ACDialogue.svelte';
	import RoverModel from './RoverModel.svelte';

	let { onStartTest = () => {}, class: className = '' } = $props();

	let showWelcome = true;
	let titleMusicPlaying = false;
	let roverMood = $state('neutral');

	onMount(() => {
		// Show welcome message and play title music
		setTimeout(() => {
			playTitleMusic();
			roverMood = 'excited';
		}, 1000);
	});

	async function playTitleMusic() {
		if (titleMusicPlaying) return;

		try {
			titleMusicPlaying = true;
			// Play AC title music if available
			const titleMusic = new Audio('/assets/sounds/title.mp3');
			titleMusic.volume = 0.3;
			titleMusic.loop = false;

			titleMusic.play().catch(() => {
				console.log('Title music not available or auto-play blocked');
			});

			// Fade out after 8 seconds
			setTimeout(() => {
				if (titleMusic) {
					const fadeOut = setInterval(() => {
						if (titleMusic.volume > 0.05) {
							titleMusic.volume -= 0.05;
						} else {
							titleMusic.pause();
							clearInterval(fadeOut);
						}
					}, 200);
				}
			}, 8000);
		} catch (_error) {
			console.log('Could not play title music');
		}
	}

	function handleStartClick() {
		roverMood = 'encouraging';
		playTestStart();

		// Small delay for sound effect
		setTimeout(() => {
			onStartTest();
		}, 300);
	}

	function handleSkipIntro() {
		showWelcome = false;
		roverMood = 'neutral';
	}
</script>

<div class="start-screen {className}">
	<!-- AC-style background with subtle pattern -->
	<div class="ac-background"></div>

	<!-- Title Section -->
	<header class="title-section">
		<h1 class="ac-title">Color Vision Test</h1>
		<p class="ac-subtitle">An Animal Crossing Experience</p>
		<div class="ac-icon ac-icon-star title-star"></div>
	</header>

	<!-- Main Content Area -->
	<div class="main-content">
		<!-- Rover Character Section -->
		<div class="rover-section">
			<RoverModel mood={roverMood} size="large" />
		</div>

		<!-- Welcome Dialogue -->
		{#if showWelcome}
			<div class="welcome-section ac-fade-in">
				<ACDialogue
					character="Rover"
					text="Welcome, friend! I'm Rover, and I'll be your guide today. We're going to test your color vision with some fun activities! Don't worry - there are no wrong answers here. Just be yourself and trust what you see!"
					showTail={true}
				/>

				<div class="welcome-buttons">
					<ACButton onClick={handleStartClick}>
						Let's Begin! <div
							class="ac-icon ac-icon-heart"
							style="display: inline-block; margin-left: 8px;"
						></div>
					</ACButton>
					<ACButton onClick={handleSkipIntro} class="skip-button">Skip Introduction</ACButton>
				</div>
			</div>
		{:else}
			<!-- Quick Start Section -->
			<div class="quick-start ac-fade-in">
				<ACDialogue
					character="Rover"
					text="Ready to test your color perception? I'll show you some colors and we'll see how you perceive them!"
					showTail={true}
				/>

				<ACButton onClick={handleStartClick} class="start-main-button">
					Start Color Test <div
						class="ac-icon ac-icon-star"
						style="display: inline-block; margin-left: 8px;"
					></div>
				</ACButton>
			</div>
		{/if}
	</div>

	<!-- Footer Info -->
	<footer class="start-footer">
		<p class="ac-text-small">
			This test is designed to help understand deuteranomaly color perception
		</p>
		<div class="footer-icons">
			<div class="ac-icon ac-icon-bell"></div>
			<div class="ac-icon ac-icon-heart"></div>
			<div class="ac-icon ac-icon-star"></div>
		</div>
	</footer>
</div>

<style>
	.start-screen {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 20px;
		background: #ffffff;
		background-image:
			radial-gradient(circle at 25% 25%, rgba(74, 144, 226, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 75% 75%, rgba(255, 182, 193, 0.1) 0%, transparent 50%);
	}

	.ac-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/assets/textures/text.png');
		background-size: 320px 288px;
		background-repeat: repeat;
		opacity: 0.03;
		pointer-events: none;
	}

	.title-section {
		text-align: center;
		margin-bottom: 40px;
		position: relative;
		z-index: 2;
	}

	.ac-title {
		font-size: 3.5rem;
		font-weight: 800;
		color: #2d4a3e;
		text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
		margin: 0;
		font-family: 'Nunito', 'Comic Sans MS', sans-serif;
	}

	.ac-subtitle {
		font-size: 1.2rem;
		color: #666;
		margin: 10px 0 0 0;
		font-weight: 600;
	}

	.title-star {
		position: absolute;
		top: -10px;
		right: -30px;
		animation: ac-bounce 2s infinite ease-in-out;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 30px;
		max-width: 800px;
		width: 100%;
		position: relative;
		z-index: 2;
	}

	.rover-section {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
	}

	.welcome-section,
	.quick-start {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		text-align: center;
	}

	.welcome-text h2 {
		color: #2d4a3e;
		margin: 0 0 15px 0;
		font-size: 1.8rem;
	}

	.welcome-text p {
		margin: 0 0 12px 0;
		line-height: 1.6;
		color: #2d4a3e;
	}

	.rover-signature {
		font-style: italic;
		font-weight: bold;
		color: #4a90e2;
		margin-top: 15px !important;
		font-size: 1.1rem;
	}

	.welcome-buttons,
	.quick-start {
		display: flex;
		gap: 15px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.skip-button {
		opacity: 0.7;
	}

	.skip-button:hover {
		opacity: 1;
	}

	.start-main-button {
		font-size: 1.2rem;
		padding: 12px 24px;
	}

	.start-footer {
		position: absolute;
		bottom: 20px;
		text-align: center;
		color: #888;
		z-index: 2;
	}

	.start-footer p {
		margin: 0 0 10px 0;
	}

	.footer-icons {
		display: flex;
		gap: 12px;
		justify-content: center;
		opacity: 0.6;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.ac-title {
			font-size: 2.5rem;
		}

		.main-content {
			padding: 0 10px;
		}

		.welcome-buttons {
			flex-direction: column;
			align-items: center;
		}

		.title-star {
			display: none;
		}
	}

	/* Animations */
	@keyframes ac-bounce {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-10px) rotate(5deg);
		}
	}

	.ac-fade-in {
		animation: ac-fade-in 0.8s ease-in-out;
	}

	@keyframes ac-fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
