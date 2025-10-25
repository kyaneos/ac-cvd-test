<script>
	import { onMount, onDestroy } from 'svelte';
	import { playDialogueCharacter, soundManager } from '../utils/soundEffects.js';
	import { wiiSounds } from '../utils/wiiSounds.js';

	let {
		text = '',
		character = 'Rover',
		children,
		showTail = true,
		autoPlay = false,
		externalControl = false,
		isTyping = false,
		waitingForClick = false,
		speed = 25,
		delay = 1000,
		onTextComplete = () => {},
		onclick = null,
		class: className = '',
		onSpeakingChange = null, // Callback for when speaking state changes
		mood = 'neutral',
		...props
	} = $props();

	let displayedText = $state('');
	let currentIndex = $state(0);
	let internalIsTyping = $state(false);
	let showArrow = $state(false);
	let typingTimeout = null;
	let mounted = $state(false);

	// Extract text from children if no text prop provided
	let actualText = $derived(text || '');

	// Use external control when provided (for ColorTest), otherwise internal
	let actualIsTyping = $derived(externalControl ? isTyping : internalIsTyping);
	let actualWaitingForClick = $derived(externalControl ? waitingForClick : showArrow);

	// Update external component when speaking state changes
	$effect(() => {
		if (onSpeakingChange) {
			console.log('ACDialogue: Speaking state changed to', actualIsTyping);
			onSpeakingChange(actualIsTyping);
		}
	});

	onMount(() => {
		mounted = true;
		// Play dialogue bubble sound when component mounts
		wiiSounds.play('dialogueBubble');
		if (autoPlay) {
			startTyping();
		}
	});

	onDestroy(() => {
		if (typingTimeout) clearTimeout(typingTimeout);
	});

	function startTyping() {
		if (internalIsTyping) return;

		// Initialize sound system for animalese
		initializeSounds();

		internalIsTyping = true;
		currentIndex = 0;
		displayedText = '';
		showArrow = false;

		const typewriter = () => {
			if (currentIndex < actualText.length) {
				displayedText += actualText.charAt(currentIndex);

				// Play authentic AC animalese sound for letters using soundEffects.js
				const currentChar = actualText.charAt(currentIndex);
				if (currentChar.match(/[a-zA-Z]/i)) {
					playDialogueCharacter(currentChar, mood);
				}

				currentIndex++;
				typingTimeout = setTimeout(typewriter, speed);
			} else {
				// Typing complete
				internalIsTyping = false;
				showArrow = true;
				onTextComplete();
			}
		};

		typingTimeout = setTimeout(typewriter, delay);
	}

	// Initialize sound system when dialogue starts typing
	function initializeSounds() {
		soundManager.autoInitialize();
		wiiSounds.init();
	}

	// Function to highlight "Rover" in blue in dialogue text
	function highlightRoverName(text) {
		return text.replace(
			/\bRover\b/g,
			'<span style="color: #1F44C4; font-weight: bold;">Rover</span>'
		);
	}

	function skipToEnd() {
		if (internalIsTyping) {
			if (typingTimeout) clearTimeout(typingTimeout);
			displayedText = actualText;
			currentIndex = actualText.length;
			internalIsTyping = false;
			showArrow = true;
			onTextComplete();
		}
	}
</script>

<!-- SVG filters for the gooey effect -->
<svg
	xmlns="http://www.w3.org/2000/svg"
	version="1.1"
	style="position: absolute; width: 0; height: 0;"
>
	<defs>
		<filter id="fancy-goo">
			<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
			<feColorMatrix
				in="blur"
				mode="matrix"
				values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
				result="goo"
			/>
			<feComposite in="SourceGraphic" in2="goo" operator="atop" />
		</filter>
	</defs>
</svg>

{#if mounted}
	<div
		class="dialogue {className}"
		{...props}
		onclick={externalControl ? onclick : skipToEnd}
		role="button"
		tabindex="0"
	>
		<div class="dialogue-blobs">
			<div class="dialogue-blob-top"></div>
			<div class="dialogue-blob-bottom"></div>
			<div class="dialogue-text">
				{#if externalControl}
					{@html highlightRoverName(text)}
				{:else if text}
					{@html highlightRoverName(displayedText)}
				{:else if children}
					{@render children()}
				{:else}
					<span style="opacity: 0.5">...</span>
				{/if}
			</div>
		</div>

		<div class="dialogue-character-wrap">
			<div class="dialogue-character">
				{character}
			</div>
		</div>

		{#if (externalControl ? actualWaitingForClick && !actualIsTyping : showArrow) && showTail}
			<svg
				class="arrow"
				width="45"
				height="25"
				viewBox="0 0 45 25"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M22.5 25C18.0184 25 7.59473 12.6404 1.55317 4.96431C-0.122281 2.83559 1.72264 -0.179893 4.39835 0.243337C10.2831 1.17415 18.2164 2.28736 22.5 2.28736C26.7836 2.28736 34.7169 1.17415 40.6017 0.243339C43.2774 -0.17989 45.1223 2.83559 43.4468 4.96431C37.4053 12.6404 26.9816 25 22.5 25Z"
					fill="#F1AE04"
				/>
			</svg>
		{/if}
	</div>
{:else}
	<!-- Fallback while mounting -->
	<div class="dialogue-fallback {className}" {...props}>
		{#if text}
			{text}
		{:else if children}
			{@render children()}
		{/if}
	</div>
{/if}

<style>
	.dialogue {
		position: relative;
		display: flex;
		min-height: 250px;
		height: 250px;
		min-width: 550px;
		width: 85%;
		max-width: 750px;
		margin: 20px auto;
		cursor: pointer;
		z-index: 5;
		pointer-events: all;
	}

	.dialogue-blobs {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: stretch;
		animation: blob-grow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0s 1 normal forwards;
		transform: scale(0);
	}

	.dialogue-blob-top,
	.dialogue-blob-bottom {
		filter: url('#fancy-goo');
	}

	.dialogue-blob-top {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 75%;
		background-color: #fdf8e3;
		border: none;
		border-radius: 40% 40% 30% 30% / 150% 150% 150% 150%;
		z-index: 1;
		animation: blob 1.5s cubic-bezier(0.37, 0, 0.63, 1) 0.3s infinite alternate;
		transform-origin: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.dialogue-blob-bottom {
		position: absolute;
		bottom: 0;
		left: 3%;
		width: 94%;
		height: 40%;
		background-color: #fdf8e3;
		border: none;
		border-radius: 5% 5% 20% 20% / 100% 100% 100% 100%;
		z-index: 1;
		animation: blob 1s infinite alternate cubic-bezier(0.37, 0, 0.63, 1);
		transform-origin: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.dialogue-character-wrap {
		position: absolute;
		top: -15px;
		left: 20px;
		z-index: 20;
		opacity: 0;
		animation:
			character 0.6s infinite alternate cubic-bezier(0.37, 0, 0.63, 1),
			show-nametag 0.3s ease-out 0.5s 1 normal forwards;
	}

	.dialogue-character {
		display: inline-block;
		margin-right: auto;
		padding: 0.5rem 2rem;
		font-family: 'Varela Round', 'Nunito', sans-serif;
		font-size: 2rem;
		color: #482016;
		background-color: #dd8530;
		border-radius: 30% / 100% 100% 120% 120%;
		transform: perspective(2rem) rotateX(1deg) rotateZ(-6deg) scale(1);
		animation: fade-character 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s 1 normal forwards;
	}

	.dialogue-text {
		position: absolute;
		top: 25%;
		left: 8%;
		right: 8%;
		bottom: 15%;
		padding: 1rem;
		font-family: 'Hind', 'Nunito', sans-serif;
		font-size: 1.8rem;
		line-height: 1.4em;
		color: #2d2416;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
		z-index: 20;
		display: block;
		overflow: visible;
		word-wrap: break-word;
		opacity: 0;
		animation: show-text 0.3s ease-out 0.8s 1 normal forwards;
	}

	.arrow {
		position: absolute;
		bottom: 0;
		left: 50%;
		opacity: 0;
		animation: arrow 0.6s cubic-bezier(0.37, 0, 0.63, 1) 0.5s infinite alternate;
	}

	.dialogue-fallback {
		background-color: #fdf8e3;
		border: 2px solid #dd8530;
		border-radius: 12px;
		padding: 20px 24px;
		margin: 16px auto;
		color: #807256;
		font-family: 'Nunito', sans-serif;
		font-weight: 600;
		line-height: 1.4;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		min-width: 280px;
		max-width: 600px;
	}

	.typing-cursor {
		color: #f1ae04;
		font-weight: bold;
		animation: blink 1s infinite;
	}

	.continue-prompt {
		color: #999;
		font-size: 0.8em;
		font-style: italic;
		margin-left: 10px;
	}

	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
		}
	}

	@keyframes blob {
		from {
			transform: rotate(0.3deg) scale(1);
		}
		to {
			transform: rotate(-0.3deg) scale(0.99);
		}
	}

	@keyframes character {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(3px);
		}
	}

	@keyframes blob-grow {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes show-nametag {
		0% {
			opacity: 0;
			transform: translateY(-10px) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes show-text {
		0% {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade-character {
		from {
			transform: perspective(2rem) rotateX(1deg) rotateZ(0deg) scale(0.8);
			opacity: 0;
		}
		to {
			transform: perspective(2rem) rotateX(1deg) rotateZ(-6deg) scale(1);
			opacity: 1;
		}
	}

	@keyframes arrow {
		from {
			transform: translateY(33%) translateX(-50%) scale(1);
			opacity: 1;
		}
		to {
			transform: translateY(50%) translateX(-50%) scale(0.9);
			opacity: 1;
		}
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.dialogue {
			min-width: 90%;
			width: 95%;
		}

		.dialogue-text {
			font-size: 2rem;
			padding: 0.8em 0.8em 1.6em 1.2em;
		}

		.dialogue-character {
			font-size: 1.6rem;
			padding: 0.4rem 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.dialogue {
			min-height: 150px;
		}

		.dialogue-text {
			font-size: 1.6rem;
			padding: 0.6em 0.6em 1.2em 1em;
		}

		.dialogue-character {
			font-size: 1.2rem;
			padding: 0.3rem 1rem;
		}
	}
</style>
