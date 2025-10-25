<script>
	import { onMount } from 'svelte';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import { BayesianColorVisionModel } from '$lib/framework/colorTesting/bayesianInference.js';
	import { simulateCVD } from '../../../utils/colorSimulation.js';
	import pb from '$lib/pocketbase.js';

	let auth = $derived($frameworkAuthStore);

	// Helper function to simulate colorblindness for all CVD types
	function simulateColorblindness(r, g, b, cvdType, strength) {
		const hex = rgbToHex(r, g, b);
		// Convert strength from 0-100 to severity 0-1
		const severity = strength / 100;
		const simulated = simulateCVD(hex, cvdType, severity);
		return hexToRgb(simulated);
	}

	// State
	let selectedHue = $state(0); // 0-360
	let selectedSaturation = $state(100); // 0-100
	let selectedLightness = $state(50); // 0-100
	let simulationStrength = $state(0); // 0-100 (0 = true colors, 100 = full simulation)
	let showOnlyTestedColors = $state(false);
	let bayesianModel = $state(null);
	let testedPairs = $state([]);
	let userCVDType = $state('deuteranomaly');

	// Canvas refs
	let canvasElement = $state(null);
	let hueSliderElement = $state(null);
	let isDraggingCanvas = $state(false);
	let isDraggingHue = $state(false);

	// Derived current hex
	let currentHex = $derived.by(() => {
		return hslToHex(selectedHue, selectedSaturation, selectedLightness);
	});

	// Derived simulated hex
	let simulatedHex = $derived.by(() => {
		if (simulationStrength === 0) return currentHex;

		const rgb = hexToRgb(currentHex);
		const simulated = simulateColorblindness(rgb.r, rgb.g, rgb.b, userCVDType, simulationStrength);

		// Blend between original and simulated based on strength
		const factor = simulationStrength / 100;
		const blendedR = Math.round(rgb.r * (1 - factor) + simulated.r * factor);
		const blendedG = Math.round(rgb.g * (1 - factor) + simulated.g * factor);
		const blendedB = Math.round(rgb.b * (1 - factor) + simulated.b * factor);

		return rgbToHex(blendedR, blendedG, blendedB);
	});

	onMount(async () => {
		await loadUserData();
		drawCanvas();
		drawHueSlider();
	});

	async function loadUserData() {
		try {
			const user = pb.authStore.model;
			if (!user) return;

			userCVDType = user.colorblindness_type || 'deuteranomaly';

			// Load Bayesian model for tested pairs
			const settings = await pb.collection('colorvision_settings').getFullList({
				filter: `user = "${user.id}"`
			});

			if (settings.length > 0 && settings[0].bayesian_state) {
				const model = new BayesianColorVisionModel(userCVDType);
				model.importState(settings[0].bayesian_state);
				bayesianModel = model;
				testedPairs = model.getTestedPairs();
			}
		} catch (e) {
			console.error('Error loading user data:', e);
		}
	}

	function drawCanvas() {
		if (!canvasElement) return;

		const ctx = canvasElement.getContext('2d');
		const width = canvasElement.width;
		const height = canvasElement.height;

		// If showing only tested colors, collect all tested hex values
		let testedHexSet = new Set();
		if (showOnlyTestedColors && testedPairs.length > 0) {
			testedPairs.forEach((pair) => {
				testedHexSet.add(pair.color1.toLowerCase());
				testedHexSet.add(pair.color2.toLowerCase());
			});
		}

		// Draw saturation (x) × lightness (y) gradient for current hue
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const saturation = (x / width) * 100;
				const lightness = 100 - (y / height) * 100; // Invert y (top = light, bottom = dark)

				let hex = hslToHex(selectedHue, saturation, lightness);

				// If showing only tested colors, check if this color is tested
				if (showOnlyTestedColors && testedHexSet.size > 0) {
					// Check if current hex is close to any tested color
					const isNearTested = Array.from(testedHexSet).some((testedHex) => {
						return colorDistance(hex, testedHex) < 30; // Threshold for "nearby"
					});

					if (!isNearTested) {
						// Gray out untested colors
						ctx.fillStyle = '#e0e0e0';
						ctx.fillRect(x, y, 1, 1);
						continue;
					}
				}

				// Apply simulation if strength > 0
				if (simulationStrength > 0) {
					const rgb = hexToRgb(hex);
					const simulated = simulateColorblindness(
						rgb.r,
						rgb.g,
						rgb.b,
						userCVDType,
						simulationStrength
					);
					const factor = simulationStrength / 100;
					const blendedR = Math.round(rgb.r * (1 - factor) + simulated.r * factor);
					const blendedG = Math.round(rgb.g * (1 - factor) + simulated.g * factor);
					const blendedB = Math.round(rgb.b * (1 - factor) + simulated.b * factor);
					hex = rgbToHex(blendedR, blendedG, blendedB);
				}

				ctx.fillStyle = hex;
				ctx.fillRect(x, y, 1, 1);
			}
		}

		// Draw tested color markers
		if (showOnlyTestedColors && testedPairs.length > 0) {
			testedPairs.forEach((pair) => {
				// Draw dots for color1 and color2
				[pair.color1, pair.color2].forEach((hexColor) => {
					const hsl = hexToHsl(hexColor);
					if (Math.abs(hsl.h - selectedHue) < 15) {
						// Only show if hue is close
						const x = (hsl.s / 100) * width;
						const y = (1 - hsl.l / 100) * height;

						ctx.beginPath();
						ctx.arc(x, y, 5, 0, 2 * Math.PI);
						ctx.fillStyle = 'white';
						ctx.fill();
						ctx.strokeStyle = 'black';
						ctx.lineWidth = 2;
						ctx.stroke();
					}
				});
			});
		}
	}

	// Calculate color distance (simple RGB Euclidean distance)
	function colorDistance(hex1, hex2) {
		const rgb1 = hexToRgb(hex1);
		const rgb2 = hexToRgb(hex2);
		return Math.sqrt(
			Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
		);
	}

	function drawHueSlider() {
		if (!hueSliderElement) return;

		const ctx = hueSliderElement.getContext('2d');
		const width = hueSliderElement.width;
		const height = hueSliderElement.height;

		// Draw hue gradient
		for (let x = 0; x < width; x++) {
			const hue = (x / width) * 360;
			const hex = hslToHex(hue, 100, 50);
			ctx.fillStyle = hex;
			ctx.fillRect(x, 0, 1, height);
		}
	}

	function handleCanvasMouseDown(e) {
		isDraggingCanvas = true;
		updateCanvasPosition(e);
	}

	function handleCanvasMouseMove(e) {
		if (!isDraggingCanvas) return;
		updateCanvasPosition(e);
	}

	function handleCanvasMouseUp() {
		isDraggingCanvas = false;
	}

	function updateCanvasPosition(e) {
		if (!canvasElement) return;

		const rect = canvasElement.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

		selectedSaturation = (x / rect.width) * 100;
		selectedLightness = 100 - (y / rect.height) * 100;
	}

	function handleHueMouseDown(e) {
		isDraggingHue = true;
		updateHuePosition(e);
	}

	function handleHueMouseMove(e) {
		if (!isDraggingHue) return;
		updateHuePosition(e);
	}

	function handleHueMouseUp() {
		isDraggingHue = false;
	}

	function updateHuePosition(e) {
		if (!hueSliderElement) return;

		const rect = hueSliderElement.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

		selectedHue = (x / rect.width) * 360;
		drawCanvas(); // Redraw canvas when hue changes
	}

	// Reactive effects
	$effect(() => {
		// Redraw when simulation strength or tested pairs toggle changes
		if (canvasElement) {
			drawCanvas();
		}
	});

	// Helper functions
	function hslToHex(h, s, l) {
		s /= 100;
		l /= 100;
		const k = (n) => (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		const r = Math.round(255 * f(0));
		const g = Math.round(255 * f(8));
		const b = Math.round(255 * f(4));
		return rgbToHex(r, g, b);
	}

	function rgbToHex(r, g, b) {
		return (
			'#' +
			[r, g, b]
				.map((x) => {
					const hex = x.toString(16);
					return hex.length === 1 ? '0' + hex : hex;
				})
				.join('')
		);
	}

	function hexToRgb(hex) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: { r: 0, g: 0, b: 0 };
	}

	function hexToHsl(hex) {
		const rgb = hexToRgb(hex);
		const r = rgb.r / 255;
		const g = rgb.g / 255;
		const b = rgb.b / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (delta !== 0) {
			s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

			if (max === r) {
				h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
			} else if (max === g) {
				h = ((b - r) / delta + 2) / 6;
			} else {
				h = ((r - g) / delta + 4) / 6;
			}
		}

		return {
			h: h * 360,
			s: s * 100,
			l: l * 100
		};
	}
</script>

<svelte:window
	onmousemove={(e) => {
		handleCanvasMouseMove(e);
		handleHueMouseMove(e);
	}}
	onmouseup={() => {
		handleCanvasMouseUp();
		handleHueMouseUp();
	}}
/>

<div class="hex-page">
	<h1>Interactive Color Map</h1>
	<p class="page-description">
		Explore the full color spectrum and see how colors appear with {userCVDType}
	</p>

	<!-- Controls -->
	<div class="controls">
		<div class="control-group">
			<label for="simulation-slider">
				Simulation Strength: {simulationStrength}%
			</label>
			<input
				type="range"
				id="simulation-slider"
				bind:value={simulationStrength}
				min="0"
				max="100"
				step="1"
				class="slider"
			/>
			<div class="slider-labels">
				<span>True Colors</span>
				<span>As You See Them</span>
			</div>
		</div>

		<div class="control-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={showOnlyTestedColors} />
				Show only tested colors
			</label>
			{#if !bayesianModel || testedPairs.length === 0}
				<span class="help-text">Complete at least 5 tests to enable this feature</span>
			{/if}
		</div>
	</div>

	<!-- Main Color Canvas -->
	<div class="canvas-container">
		<canvas
			bind:this={canvasElement}
			width="600"
			height="400"
			class="color-canvas"
			onmousedown={handleCanvasMouseDown}
		></canvas>

		<!-- Canvas cursor -->
		<div
			class="canvas-cursor"
			style="left: {selectedSaturation}%; top: {100 - selectedLightness}%;"
		></div>

		<!-- Hex value tooltip -->
		<div class="hex-tooltip" style="left: {selectedSaturation}%; top: {100 - selectedLightness}%;">
			{simulatedHex}
		</div>
	</div>

	<!-- Hue Slider -->
	<div class="hue-slider-container">
		<canvas
			bind:this={hueSliderElement}
			width="600"
			height="30"
			class="hue-slider"
			onmousedown={handleHueMouseDown}
		></canvas>

		<!-- Hue cursor -->
		<div class="hue-cursor" style="left: {(selectedHue / 360) * 100}%;"></div>
	</div>

	<!-- Color Display -->
	<div class="color-display-section">
		<div class="color-swatch-large" style="background: {simulatedHex};"></div>
		<div class="hex-display">
			<span class="hex-label">Selected Color</span>
			<span class="hex-value">{simulatedHex}</span>
			{#if simulationStrength > 0}
				<span class="hex-original">Original: {currentHex}</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.hex-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family: 'Average', serif;
	}

	h1 {
		font-size: 32px;
		margin-bottom: 10px;
		color: #000000;
		text-align: center;
	}

	.page-description {
		text-align: center;
		color: #666666;
		margin-bottom: 30px;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 30px;
		padding: 20px;
		background: #f9f9f9;
		border-radius: 8px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.control-group label {
		font-weight: bold;
		color: #333333;
		font-size: 14px;
	}

	.slider {
		width: 100%;
		height: 8px;
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(90deg, #28a745, #ffc107, #ff8c00, #ff0000);
		border-radius: 4px;
		outline: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #000000;
		cursor: pointer;
		border-radius: 50%;
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #000000;
		cursor: pointer;
		border-radius: 50%;
		border: none;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: #666666;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		font-weight: normal;
	}

	.checkbox-label input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.canvas-container {
		position: relative;
		width: 100%;
		max-width: 600px;
		margin: 0 auto 20px;
		border: 3px solid #000000;
		border-radius: 8px;
		overflow: hidden;
	}

	.color-canvas {
		width: 100%;
		height: auto;
		display: block;
		cursor: crosshair;
	}

	.canvas-cursor {
		position: absolute;
		width: 20px;
		height: 20px;
		border: 3px solid white;
		border-radius: 50%;
		pointer-events: none;
		transform: translate(-50%, -50%);
		box-shadow:
			0 0 0 1px black,
			0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.hex-tooltip {
		position: absolute;
		background: rgba(0, 0, 0, 0.85);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 14px;
		font-family: 'Courier New', monospace;
		pointer-events: none;
		transform: translate(-50%, calc(-100% - 15px));
		white-space: nowrap;
		font-weight: bold;
	}

	.hue-slider-container {
		position: relative;
		width: 100%;
		max-width: 600px;
		margin: 0 auto 30px;
		border: 3px solid #000000;
		border-radius: 8px;
		overflow: hidden;
	}

	.hue-slider {
		width: 100%;
		height: 30px;
		display: block;
		cursor: pointer;
	}

	.hue-cursor {
		position: absolute;
		top: 50%;
		width: 4px;
		height: 100%;
		background: white;
		pointer-events: none;
		transform: translate(-50%, -50%);
		box-shadow: 0 0 0 1px black;
	}

	.color-display-section {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 30px;
		background: #f9f9f9;
		border-radius: 8px;
		justify-content: center;
	}

	.color-swatch-large {
		width: 120px;
		height: 120px;
		border: 3px solid #000000;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.hex-display {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.hex-label {
		font-size: 14px;
		color: #666666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.hex-value {
		font-size: 32px;
		font-family: 'Courier New', monospace;
		font-weight: bold;
		color: #000000;
	}

	.hex-original {
		font-size: 14px;
		font-family: 'Courier New', monospace;
		color: #999999;
	}

	.help-text {
		font-size: 12px;
		color: #999999;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.hex-page {
			padding: 15px;
		}

		h1 {
			font-size: 24px;
		}

		.canvas-container {
			border-width: 2px;
		}

		.hue-slider-container {
			border-width: 2px;
		}

		.color-display-section {
			flex-direction: column;
			padding: 20px;
		}

		.color-swatch-large {
			width: 100px;
			height: 100px;
		}

		.hex-value {
			font-size: 24px;
		}
	}
</style>
