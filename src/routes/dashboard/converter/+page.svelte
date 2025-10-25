<script>
	import { onMount } from 'svelte';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import { simulateCVD } from '../../../utils/colorSimulation.js';

	let auth = $derived($frameworkAuthStore);

	// Helper function to simulate colorblindness for all CVD types
	function simulateColorblindness(r, g, b, cvdType, strength) {
		const hex = rgbToHex(r, g, b);
		// Convert strength from 0-100 to severity 0-1
		const severity = strength / 100;
		const simulated = simulateCVD(hex, cvdType, severity);
		return hexToRgb(simulated);
	}

	// Upload state
	let fileInput = $state(null);
	let uploadedImage = $state(null);
	let originalCanvas = $state(null);
	let simulatedCanvas = $state(null);
	let filename = $state('');
	let isDragging = $state(false);

	// Processing state
	let isProcessing = $state(false);
	let processingProgress = $state(0);

	// Simulation controls
	let simulationStrength = $state(100);
	let userCVDType = $state('deuteranomaly');

	// Comparison state
	let sliderPosition = $state(50);

	// Zoom state
	let zoomLevel = $state(1);

	// Derived
	let canExport = $derived(uploadedImage && !isProcessing);
	let hasImage = $derived(uploadedImage !== null);

	onMount(() => {
		const user = auth.user;
		if (user) {
			userCVDType = user.colorblindness_type || 'deuteranomaly';
		}
	});

	// Drag and drop handlers
	function handleDragOver(e) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e) {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFileSelect(e) {
		const files = e.target.files;
		if (files.length > 0) {
			handleFile(files[0]);
		}
	}

	async function handleFile(file) {
		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please upload an image file (JPG, PNG, GIF, WebP)');
			return;
		}

		filename = file.name;

		// Read file as data URL
		const reader = new FileReader();
		reader.onload = async (e) => {
			const img = new Image();
			img.onload = async () => {
				console.log('📸 Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
				uploadedImage = img;
				// Wait for DOM to update and canvases to be mounted
				await sleep(50);
				await loadImageToCanvases();
				await processImage();
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	async function loadImageToCanvases() {
		if (!uploadedImage) return;

		const width = uploadedImage.naturalWidth;
		const height = uploadedImage.naturalHeight;

		console.log('🖼️  Setting canvas dimensions:', width, 'x', height);

		// Create/update canvases
		if (originalCanvas) {
			originalCanvas.width = width;
			originalCanvas.height = height;
			console.log('✓ Original canvas set to:', originalCanvas.width, 'x', originalCanvas.height);
			const ctx = originalCanvas.getContext('2d', { willReadFrequently: true });
			ctx.drawImage(uploadedImage, 0, 0);
			console.log('✓ Original canvas drawn');
		}

		if (simulatedCanvas) {
			simulatedCanvas.width = width;
			simulatedCanvas.height = height;
			console.log('✓ Simulated canvas set to:', simulatedCanvas.width, 'x', simulatedCanvas.height);
			const ctx = simulatedCanvas.getContext('2d', { willReadFrequently: true });
			ctx.drawImage(uploadedImage, 0, 0);
			console.log('✓ Simulated canvas drawn');
		}
	}

	async function processImage() {
		if (!simulatedCanvas || !uploadedImage || !originalCanvas) return;

		console.log(
			'🎨 Starting image processing...',
			simulatedCanvas.width,
			'x',
			simulatedCanvas.height
		);
		isProcessing = true;
		processingProgress = 0;

		// Small delay to ensure UI updates
		await sleep(10);

		// Get original image data (not the already-simulated data!)
		const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
		const originalImageData = originalCtx.getImageData(
			0,
			0,
			originalCanvas.width,
			originalCanvas.height
		);

		const ctx = simulatedCanvas.getContext('2d', { willReadFrequently: true });
		const imageData = ctx.createImageData(originalCanvas.width, originalCanvas.height);
		const pixels = imageData.data;
		const originalPixels = originalImageData.data;

		const totalPixels = pixels.length / 4;
		const chunkSize = 50000;
		let lastProgressUpdate = 0;

		console.log(
			`📊 Processing ${totalPixels.toLocaleString()} pixels (${((totalPixels * 4) / 1024 / 1024).toFixed(2)} MB)`
		);

		for (let i = 0; i < totalPixels; i++) {
			const idx = i * 4;
			// Read from ORIGINAL pixels
			const r = originalPixels[idx];
			const g = originalPixels[idx + 1];
			const b = originalPixels[idx + 2];

			// Apply CVD simulation with current strength
			const simulated = simulateColorblindness(r, g, b, userCVDType, simulationStrength);

			// Write to simulated canvas
			pixels[idx] = simulated.r;
			pixels[idx + 1] = simulated.g;
			pixels[idx + 2] = simulated.b;
			pixels[idx + 3] = originalPixels[idx + 3]; // Preserve alpha

			// Update progress less frequently (every 5%)
			if (i % chunkSize === 0) {
				const currentProgress = Math.round((i / totalPixels) * 100);
				if (currentProgress - lastProgressUpdate >= 5 || currentProgress === 0) {
					processingProgress = currentProgress;
					lastProgressUpdate = currentProgress;
					console.log(`⏳ Progress: ${currentProgress}%`);
					await sleep(0);
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
		processingProgress = 100;
		console.log('✅ Processing complete!');
		isProcessing = false;
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function zoomIn() {
		zoomLevel = Math.min(zoomLevel + 0.25, 4);
	}

	function zoomOut() {
		zoomLevel = Math.max(zoomLevel - 0.25, 0.25);
	}

	function resetZoom() {
		zoomLevel = 1;
	}

	function fitToContainer() {
		// This will be implemented to fit image to container
		zoomLevel = 1;
	}

	function exportImage() {
		if (!simulatedCanvas) return;

		simulatedCanvas.toBlob((blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const baseName = filename.replace(/\.[^/.]+$/, '');
			a.download = `${baseName}_cvd_simulated.png`;
			a.click();
			URL.revokeObjectURL(url);
		}, 'image/png');
	}

	function handleNewImage() {
		uploadedImage = null;
		filename = '';
		sliderPosition = 50;
		zoomLevel = 1;
		processingProgress = 0;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Color conversion helpers
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

	// Watch simulation strength changes (only when user adjusts slider)
	let previousStrength = $state(100);
	$effect(() => {
		if (hasImage && !isProcessing && simulationStrength !== previousStrength) {
			console.log(`🎚️  Strength changed: ${previousStrength}% → ${simulationStrength}%`);
			previousStrength = simulationStrength;
			processImage();
		}
	});
</script>

<div class="converter-page">
	<h1>Image Converter</h1>
	<p class="page-description">
		Upload an image to see how it appears with {userCVDType}
	</p>

	{#if !hasImage}
		<!-- Upload Zone -->
		<div
			class="upload-zone"
			class:drag-over={isDragging}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={() => fileInput?.click()}
		>
			<div class="upload-prompt">
				<p class="upload-title">Drag & drop an image here</p>
				<p class="upload-subtitle">or click to browse</p>
				<span class="upload-note">Supports JPG, PNG, GIF, WebP • No size limit</span>
			</div>
			<input
				type="file"
				accept="image/*"
				bind:this={fileInput}
				onchange={handleFileSelect}
				style="display: none"
			/>
		</div>
	{:else}
		<!-- Image Display -->
		<div class="image-section">
			<div class="image-display-container">
				<div class="zoom-wrapper" style="transform: scale({zoomLevel}); transform-origin: center;">
					<!-- Simulated image (bottom layer) -->
					<canvas bind:this={simulatedCanvas} class="simulated-canvas"></canvas>

					<!-- Original image overlay (top layer, clipped) -->
					<div class="original-overlay" style="clip-path: inset(0 {100 - sliderPosition}% 0 0);">
						<canvas bind:this={originalCanvas} class="original-canvas"></canvas>
					</div>

					<!-- Divider line -->
					<div class="slider-divider" style="left: {sliderPosition}%;"></div>
				</div>
			</div>

			<!-- Slider control -->
			<div class="slider-control">
				<input
					type="range"
					class="comparison-slider"
					bind:value={sliderPosition}
					min="0"
					max="100"
					step="1"
				/>
				<div class="slider-labels">
					<span>Simulated</span>
					<span>Original</span>
				</div>
			</div>

			<!-- Controls Panel -->
			<div class="controls-panel">
				<div class="control-group">
					<label>Simulation Strength: {simulationStrength}%</label>
					<input
						type="range"
						bind:value={simulationStrength}
						min="0"
						max="100"
						step="1"
						disabled={isProcessing}
						class="strength-slider"
					/>
					<div class="slider-labels">
						<span>True Colors</span>
						<span>Full Simulation</span>
					</div>
				</div>

				<div class="control-row">
					<div class="zoom-controls">
						<span class="control-label">Zoom:</span>
						<button onclick={zoomOut} disabled={zoomLevel <= 0.25}>-</button>
						<button onclick={resetZoom}>100%</button>
						<button onclick={zoomIn} disabled={zoomLevel >= 4}>+</button>
						<button onclick={fitToContainer}>Fit</button>
					</div>

					<div class="action-buttons">
						<button class="secondary-btn" onclick={handleNewImage}> New Image </button>
						<button class="export-btn" onclick={exportImage} disabled={!canExport}>
							Download Simulated Image
						</button>
					</div>
				</div>
			</div>

			<!-- Progress Bar -->
			{#if isProcessing}
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {processingProgress}%;"></div>
					</div>
					<p class="progress-text">Processing... {processingProgress}%</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.converter-page {
		max-width: 1200px;
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
		margin-bottom: 40px;
	}

	/* Upload Zone */
	.upload-zone {
		border: 3px dashed #cccccc;
		border-radius: 8px;
		padding: 80px 40px;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s;
		background: #fafafa;
	}

	.upload-zone:hover,
	.upload-zone.drag-over {
		border-color: #000000;
		background: #f0f0f0;
	}

	.upload-prompt {
		pointer-events: none;
	}

	.upload-title {
		font-size: 24px;
		color: #000000;
		margin: 0 0 10px 0;
	}

	.upload-subtitle {
		font-size: 18px;
		color: #666666;
		margin: 0 0 20px 0;
	}

	.upload-note {
		font-size: 14px;
		color: #999999;
	}

	/* Image Display */
	.image-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.image-display-container {
		position: relative;
		width: 100%;
		max-height: 600px;
		overflow: auto;
		border: 3px solid #000000;
		border-radius: 8px;
		background: #f0f0f0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.zoom-wrapper {
		position: relative;
		display: inline-block;
		transition: transform 0.2s;
	}

	.simulated-canvas,
	.original-canvas {
		display: block;
	}

	.original-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.slider-divider {
		position: absolute;
		top: 0;
		width: 3px;
		height: 100%;
		background: white;
		box-shadow:
			0 0 0 1px black,
			0 2px 8px rgba(0, 0, 0, 0.3);
		pointer-events: none;
		transform: translateX(-50%);
	}

	/* Slider Control */
	.slider-control {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.comparison-slider {
		width: 100%;
		height: 8px;
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(90deg, #0066ff, #ff6600);
		border-radius: 4px;
		outline: none;
	}

	.comparison-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #000000;
		cursor: pointer;
		border-radius: 50%;
	}

	.comparison-slider::-moz-range-thumb {
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

	/* Controls Panel */
	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 20px;
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

	.strength-slider {
		width: 100%;
		height: 8px;
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(90deg, #28a745, #ffc107, #ff8c00, #ff0000);
		border-radius: 4px;
		outline: none;
	}

	.strength-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #000000;
		cursor: pointer;
		border-radius: 50%;
	}

	.strength-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #000000;
		cursor: pointer;
		border-radius: 50%;
		border: none;
	}

	.strength-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.control-label {
		font-weight: bold;
		color: #333333;
		font-size: 14px;
	}

	.zoom-controls button {
		padding: 8px 16px;
		font-family: 'Average', serif;
		font-size: 14px;
		background: #ffffff;
		color: #000000;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.zoom-controls button:hover:not(:disabled) {
		background: #000000;
		color: #ffffff;
	}

	.zoom-controls button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-buttons {
		display: flex;
		gap: 10px;
	}

	.secondary-btn,
	.export-btn {
		padding: 12px 24px;
		font-family: 'Average', serif;
		font-size: 16px;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.secondary-btn {
		background: #ffffff;
		color: #000000;
	}

	.secondary-btn:hover {
		background: #f0f0f0;
	}

	.export-btn {
		background: #000000;
		color: #ffffff;
	}

	.export-btn:hover:not(:disabled) {
		background: #333333;
	}

	.export-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Progress Bar */
	.progress-container {
		text-align: center;
	}

	.progress-bar {
		width: 100%;
		height: 20px;
		background: #e0e0e0;
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 10px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #28a745, #0066ff);
		transition: width 0.3s;
	}

	.progress-text {
		color: #666666;
		font-size: 14px;
		margin: 0;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.converter-page {
			padding: 15px;
		}

		h1 {
			font-size: 24px;
		}

		.upload-zone {
			padding: 60px 20px;
		}

		.upload-title {
			font-size: 20px;
		}

		.upload-subtitle {
			font-size: 16px;
		}

		.control-row {
			flex-direction: column;
			align-items: stretch;
		}

		.zoom-controls {
			justify-content: center;
		}

		.action-buttons {
			width: 100%;
		}

		.secondary-btn,
		.export-btn {
			flex: 1;
		}
	}
</style>
