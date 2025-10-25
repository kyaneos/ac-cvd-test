<script>
	import { applySpriteToElement } from '../utils/spriteParser.js';
	import { playButtonClick } from '../utils/soundEffects.js';
	import { wiiSounds } from '../utils/wiiSounds.js';
	import { onMount } from 'svelte';

	let {
		children,
		onClick = () => {},
		disabled = false,
		variant = 'normal', // 'normal', 'hover', 'pressed'
		class: className = '',
		...props
	} = $props();

	let buttonRef;

	onMount(() => {
		if (buttonRef) {
			// Apply AC sprite styling to the button
			applySpriteToElement(buttonRef, 'button_normal', 'hud');

			// Add hover and active state listeners
			buttonRef.addEventListener('mouseenter', () => {
				if (!disabled) {
					applySpriteToElement(buttonRef, 'button_hover', 'hud');
					wiiSounds.play('hover');
				}
			});

			buttonRef.addEventListener('mouseleave', () => {
				if (!disabled) {
					applySpriteToElement(buttonRef, 'button_normal', 'hud');
				}
			});

			buttonRef.addEventListener('mousedown', () => {
				if (!disabled) {
					applySpriteToElement(buttonRef, 'button_pressed', 'hud');
				}
			});

			buttonRef.addEventListener('mouseup', () => {
				if (!disabled) {
					applySpriteToElement(buttonRef, 'button_hover', 'hud');
				}
			});
		}
	});
</script>

<button
	bind:this={buttonRef}
	class="ac-button ac-text {className}"
	class:disabled
	onclick={disabled
		? undefined
		: (e) => {
				playButtonClick();
				onClick(e);
			}}
	{...props}
>
	{@render children()}
</button>

<style>
	.ac-button {
		background-image: url('/assets/textures/hud.png') !important;
		background-repeat: no-repeat !important;
		border: none !important;
		cursor: pointer;
		transition: none; /* Disable default transitions for sprite changes */
		font-family: 'Nunito', 'Comic Sans MS', sans-serif;
		color: #2d4a3e !important;
		text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.8);
		font-weight: bold;
		font-size: 14px;
		padding: 8px 16px;
		box-shadow: none !important;
		border-radius: 0 !important;
	}

	.ac-button.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ac-button:focus {
		outline: 2px solid #4a90e2;
		outline-offset: 2px;
	}
</style>
