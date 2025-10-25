<script>
	let {
		progress = 0, // 0-100
		showIcon = false,
		iconType = 'star', // 'bell', 'star', 'heart'
		class: className = '',
		...props
	} = $props();

	// Ensure progress is within bounds
	$: validProgress = Math.max(0, Math.min(100, progress));
</script>

<div class="ac-progress-wrapper {className}" {...props}>
	{#if showIcon}
		<div class="ac-icon ac-icon-{iconType}"></div>
	{/if}

	<div class="ac-progress-container">
		<div class="ac-progress-fill" style="width: {validProgress}%"></div>
	</div>

	{#if showIcon}
		<div class="progress-text ac-text-small">
			{Math.round(validProgress)}%
		</div>
	{/if}
</div>

<style>
	.ac-progress-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ac-progress-container {
		background-image: url('/assets/textures/hud.png') !important;
		background-position: -140px 0px !important;
		background-size: 512px 256px !important;
		background-repeat: no-repeat !important;
		width: 200px;
		height: 16px;
		position: relative;

		/* Fallback styling */
		background-color: #e0e0e0;
		border: 1px solid #ccc;
		border-radius: 8px;
	}

	.ac-progress-fill {
		background-image: url('/assets/textures/hud.png') !important;
		background-position: -140px -16px !important;
		background-size: 512px 256px !important;
		background-repeat: no-repeat !important;
		height: 16px;
		transition: width 0.3s ease;

		/* Fallback styling */
		background-color: #4caf50;
		border-radius: 7px;
	}

	.ac-icon {
		background-image: url('/assets/textures/hud.png') !important;
		background-repeat: no-repeat !important;
		background-size: 512px 256px !important;
		width: 24px;
		height: 24px;
		display: inline-block;
		flex-shrink: 0;
	}

	.ac-icon-bell {
		background-position: -360px 0px !important;
	}

	.ac-icon-star {
		background-position: -384px 0px !important;
	}

	.ac-icon-heart {
		background-position: -408px 0px !important;
	}

	.progress-text {
		font-family: 'Nunito', 'Comic Sans MS', sans-serif;
		font-size: 12px;
		font-weight: bold;
		color: #2d4a3e;
		text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.6);
		flex-shrink: 0;
		min-width: 30px;
		text-align: right;
	}
</style>
