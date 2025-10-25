<script>
	import { onMount, onDestroy } from 'svelte';
	import { ACModelLoader } from '../utils/modelLoader.js';

	let { mood = 'neutral', isSpeaking = false, size = 'normal' } = $props();

	let container;
	let modelLoader;
	let lastMood = mood; // Initialize with current mood
	let lastSpeaking = isSpeaking; // Initialize with current speaking state

	onMount(async () => {
		modelLoader = new ACModelLoader();
		try {
			await modelLoader.init(container, size);
			modelLoader.setExpression(mood);
		} catch (error) {
			console.error('Failed to initialize 3D model:', error);
		}
	});

	onDestroy(() => {
		if (modelLoader) {
			modelLoader.dispose();
		}
	});

	// React to mood changes - only when actually changed
	$effect(() => {
		console.log(
			'RoverModel: Mood effect triggered - modelLoader:',
			!!modelLoader,
			'isLoaded:',
			modelLoader?.isLoaded,
			'mood:',
			mood,
			'lastMood:',
			lastMood
		);
		if (modelLoader && modelLoader.isLoaded && mood !== lastMood) {
			console.log('RoverModel: Mood changed from', lastMood, 'to', mood);
			lastMood = mood;
			console.log('RoverModel: Calling modelLoader.setExpression(' + mood + ')');
			modelLoader.setExpression(mood);
		}
	});

	// React to speaking changes - only when actually changed
	$effect(() => {
		console.log(
			'RoverModel: Effect triggered - modelLoader:',
			!!modelLoader,
			'isLoaded:',
			modelLoader?.isLoaded,
			'isSpeaking:',
			isSpeaking,
			'lastSpeaking:',
			lastSpeaking
		);
		if (modelLoader && modelLoader.isLoaded && isSpeaking !== lastSpeaking) {
			console.log('RoverModel: Speaking changed from', lastSpeaking, 'to', isSpeaking);
			lastSpeaking = isSpeaking;
			if (isSpeaking) {
				console.log('RoverModel: Calling modelLoader.startSpeaking()');
				modelLoader.startSpeaking();
			} else {
				console.log('RoverModel: Calling modelLoader.stopSpeaking()');
				modelLoader.stopSpeaking();
			}
		} else if (!modelLoader || !modelLoader.isLoaded) {
			console.log('RoverModel: Model not loaded yet, isSpeaking:', isSpeaking);
		}
	});
</script>

<div class="rover-wrapper">
	<div class="model-container" class:small={size === 'small'} bind:this={container}></div>
	<div class="rover-shadow" class:small={size === 'small'}></div>
</div>

<style>
	.rover-wrapper {
		position: relative;
		display: inline-block;
	}

	.model-container {
		width: 200px;
		height: 350px; /* Increased height even more for full visibility */
		border-radius: 8px;
		overflow: visible; /* Changed from hidden to visible */
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		margin: 0 auto;
		display: block;
		position: relative;
		/* Ensure no clipping by parent containers */
		z-index: 1;
	}

	.model-container.small {
		width: 150px;
		height: 250px;
	}

	.model-container :global(canvas) {
		border-radius: 8px;
	}

	.rover-shadow {
		position: absolute;
		bottom: -7px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 30px;
		background: radial-gradient(
			ellipse at center,
			rgba(0, 0, 0, 0.4) 0%,
			rgba(0, 0, 0, 0.2) 50%,
			transparent 80%
		);
		border-radius: 50%;
		pointer-events: none;
		z-index: 1;
		opacity: 0.8;
	}

	.rover-shadow.small {
		width: 84px;
		height: 50px;
		z-index: 1;
		background: radial-gradient(
			ellipse at center,
			rgba(0, 0, 0, 0.4) 0%,
			rgba(0, 0, 0, 0.2) 50%,
			transparent 80%
		);
		border-radius: 50%;
		pointer-events: none;
		z-index: 1;
		opacity: 0.8;
		left: 50%;
		transform: translateX(-50%);
	}
</style>
