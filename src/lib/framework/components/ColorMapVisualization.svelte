<script>
	import { onMount } from 'svelte';
	import pb from '$lib/pocketbase.js';
	import { BayesianColorVisionModel } from '$lib/framework/colorTesting/bayesianInference.js';

	// State
	let loading = $state(true);
	let error = $state('');
	let bayesianModel = $state(null);
	let allTestedPairs = $state([]);
	let stats = $state(null);
	let interpretation = $state(null);
	let userCVDType = $state('');
	let showHelpInfo = $state(false);

	onMount(async () => {
		await loadColorMap();
	});

	async function loadColorMap() {
		loading = true;
		error = '';

		try {
			const user = pb.authStore.model;
			if (!user) {
				error = 'Not authenticated';
				return;
			}

			userCVDType = user.colorblindness_type || 'deuteranomaly';

			// Load Bayesian state from PocketBase
			const settings = await pb.collection('colorvision_settings').getFullList({
				filter: `user = "${user.id}"`
			});

			if (settings.length === 0 || !settings[0].bayesian_state) {
				error =
					'No test data available yet. Complete at least 5 tests to see your color confusion map.';
				return;
			}

			// Reconstruct Bayesian model
			const model = new BayesianColorVisionModel(userCVDType);
			model.importState(settings[0].bayesian_state);
			bayesianModel = model;

			// Get ALL tested pairs (research-backed: show everything)
			const testedPairs = model.getTestedPairs();
			allTestedPairs = testedPairs.sort((a, b) => b.confusionProb - a.confusionProb);

			// Calculate stats based on research thresholds
			const totalPairsTested = testedPairs.length;
			const severePairs = testedPairs.filter((p) => p.confusionProb >= 0.7).length;
			const moderatePairs = testedPairs.filter(
				(p) => p.confusionProb >= 0.4 && p.confusionProb < 0.7
			).length;
			const mildPairs = testedPairs.filter(
				(p) => p.confusionProb >= 0.2 && p.confusionProb < 0.4
			).length;
			const normalPairs = testedPairs.filter((p) => p.confusionProb < 0.2).length;

			// Calculate overall severity
			const avgConfusion =
				testedPairs.reduce((sum, p) => sum + p.confusionProb, 0) / totalPairsTested;

			// Determine severity level and interpretation
			let severityLevel, severityColor, message, comparison;

			if (avgConfusion < 0.2) {
				severityLevel = 'Excellent';
				severityColor = '#28a745';
				message = 'Your color discrimination is excellent! No significant confusion detected.';
				comparison = `This suggests normal color vision. Typical ${userCVDType} would show 60-90% confusion on red-green pairs.`;
			} else if (avgConfusion < 0.4) {
				severityLevel = 'Good (Mild Deficiency)';
				severityColor = '#ffc107';
				message = 'You show mild difficulty with some color pairs.';
				comparison = `This suggests mild ${userCVDType}. Colors are mostly distinguishable but some pairs require careful attention.`;
			} else if (avgConfusion < 0.7) {
				severityLevel = 'Moderate Deficiency';
				severityColor = '#ff8c00';
				message = 'You show moderate difficulty distinguishing certain color pairs.';
				comparison = `This is consistent with moderate ${userCVDType}. Many red-green pairs are confusable.`;
			} else {
				severityLevel = 'Significant Deficiency';
				severityColor = '#dc3545';
				message = 'You show significant difficulty with color discrimination.';
				comparison = `This suggests strong ${userCVDType}. Most red-green pairs are highly confusable.`;
			}

			interpretation = {
				severityLevel,
				severityColor,
				message,
				comparison,
				avgConfusion
			};

			stats = {
				totalPairsTested,
				severePairs,
				moderatePairs,
				mildPairs,
				normalPairs,
				avgConfusion
			};
		} catch (e) {
			error = e.message || 'Failed to load color map';
			console.error('Error loading color map:', e);
		} finally {
			loading = false;
		}
	}

	// Helper: Convert hex to hue (0-360)
	function hexToHue(hex) {
		const r = parseInt(hex.slice(1, 3), 16) / 255;
		const g = parseInt(hex.slice(3, 5), 16) / 255;
		const b = parseInt(hex.slice(5, 7), 16) / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		if (delta === 0) return 0;

		let hue = 0;
		if (max === r) {
			hue = 60 * (((g - b) / delta) % 6);
		} else if (max === g) {
			hue = 60 * ((b - r) / delta + 2);
		} else {
			hue = 60 * ((r - g) / delta + 4);
		}

		return hue < 0 ? hue + 360 : hue;
	}

	// Calculate position on hue wheel
	function getWheelPosition(hex, radius, centerX, centerY) {
		const hue = hexToHue(hex);
		const angle = (hue - 90) * (Math.PI / 180); // -90 to start at top
		return {
			x: centerX + radius * Math.cos(angle),
			y: centerY + radius * Math.sin(angle)
		};
	}
</script>

{#if loading}
	<div class="loading">
		<p>Loading your color confusion map...</p>
	</div>
{:else if error}
	<div class="empty-state">
		<p>{error}</p>
	</div>
{:else if stats && interpretation}
	<div class="color-map">
		<div class="map-header">
			<h3>Your Personal Color Confusion Map</h3>
			<p class="description">
				Based on {stats.totalPairsTested} tested color pairs using adaptive Bayesian analysis
			</p>
		</div>

		<!-- Interpretation Panel -->
		<div class="interpretation-panel" style="border-left-color: {interpretation.severityColor}">
			<div class="severity-badge" style="background: {interpretation.severityColor}">
				{interpretation.severityLevel}
			</div>
			<h4>{interpretation.message}</h4>
			<p class="comparison">{interpretation.comparison}</p>
			<div class="avg-confusion">
				Average confusion probability: <strong
					>{(interpretation.avgConfusion * 100).toFixed(1)}%</strong
				>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="stats-grid">
			<div class="stat-card severe">
				<div class="stat-value">{stats.severePairs}</div>
				<div class="stat-label">Severe (&gt;70%)</div>
			</div>
			<div class="stat-card moderate">
				<div class="stat-value">{stats.moderatePairs}</div>
				<div class="stat-label">Moderate (40-70%)</div>
			</div>
			<div class="stat-card mild">
				<div class="stat-value">{stats.mildPairs}</div>
				<div class="stat-label">Mild (20-40%)</div>
			</div>
			<div class="stat-card normal">
				<div class="stat-value">{stats.normalPairs}</div>
				<div class="stat-label">Normal (&lt;20%)</div>
			</div>
		</div>

		<!-- Hue Wheel Visualization -->
		<div class="visualization-section">
			<div class="section-header">
				<div>
					<h4>Confusion Axis Visualization</h4>
					<p class="section-note">
						Circular hue wheel showing confused color pairs (Farnsworth D-15 style)
					</p>
				</div>
				<button
					class="help-button"
					onclick={() => (showHelpInfo = !showHelpInfo)}
					aria-label="Toggle help information"
				>
					?
				</button>
			</div>

			{#if showHelpInfo}
				<div class="info-card">
					<h5>How to Read This Visualization</h5>

					<div class="info-section">
						<strong>What you're looking at:</strong>
						<p>
							This circular diagram shows which colors you have difficulty distinguishing from each
							other. Each dot represents a color you've been tested on, arranged around a color
							wheel.
						</p>
					</div>

					<div class="info-section">
						<strong>Understanding the lines:</strong>
						<p>
							Lines connect colors that you confused during testing. The thickness and color of each
							line shows how often you mixed them up:
						</p>
						<ul>
							<li>
								<span class="severity-indicator severe"></span> Red, thick lines = Severe confusion (&gt;70%)
							</li>
							<li>
								<span class="severity-indicator moderate"></span> Orange lines = Moderate confusion (40-70%)
							</li>
							<li>
								<span class="severity-indicator mild"></span> Yellow lines = Mild confusion (20-40%)
							</li>
						</ul>
					</div>

					<div class="info-section">
						<strong>Research background:</strong>
						<p>
							This visualization is inspired by the Farnsworth D-15 test, a clinical tool used since
							1947 to assess color vision deficiencies. The circular arrangement helps identify
							confusion patterns typical of different types of color blindness.
						</p>
					</div>

					<div class="info-section">
						<strong>What your results mean:</strong>
						<p>
							People with {userCVDType} typically confuse colors along specific axes (red-green, blue-yellow,
							etc.). Your personal confusion map shows which color pairs are most challenging for you
							specifically, helping you understand your unique color perception.
						</p>
					</div>
				</div>
			{/if}

			<svg class="hue-wheel" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
				<!-- Background circle -->
				<circle cx="200" cy="200" r="150" fill="none" stroke="#e0e0e0" stroke-width="2" />

				<!-- Hue segments (color wheel) -->
				{#each Array.from({ length: 360 }, (_, i) => i) as hue}
					{#if hue % 10 === 0}
						<line
							x1="200"
							y1="200"
							x2={200 + 150 * Math.cos(((hue - 90) * Math.PI) / 180)}
							y2={200 + 150 * Math.sin(((hue - 90) * Math.PI) / 180)}
							stroke="hsl({hue}, 80%, 60%)"
							stroke-width="3"
							opacity="0.3"
						/>
					{/if}
				{/each}

				<!-- Confusion links -->
				{#each allTestedPairs as pair}
					{@const pos1 = getWheelPosition(pair.color1, 150, 200, 200)}
					{@const pos2 = getWheelPosition(pair.color2, 150, 200, 200)}
					{@const strokeWidth = Math.max(1, pair.confusionProb * 8)}
					{@const opacity = Math.min(0.8, 0.3 + pair.confusionProb * 0.7)}
					<line
						x1={pos1.x}
						y1={pos1.y}
						x2={pos2.x}
						y2={pos2.y}
						stroke={pair.confusionProb > 0.7
							? '#ff0000'
							: pair.confusionProb > 0.4
								? '#ff8c00'
								: '#ffc107'}
						stroke-width={strokeWidth}
						{opacity}
					/>
				{/each}

				<!-- Color dots on wheel -->
				{#each allTestedPairs.flatMap((p) => [p.color1, p.color2]) as color}
					{@const pos = getWheelPosition(color, 150, 200, 200)}
					<circle cx={pos.x} cy={pos.y} r="5" fill={color} stroke="#000" stroke-width="1.5" />
				{/each}

				<!-- Center label -->
				<text
					x="200"
					y="200"
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="12"
					fill="#666"
				>
					Hue Wheel
				</text>
			</svg>

			<div class="legend">
				<div class="legend-item">
					<div class="legend-line severe"></div>
					<span>Severe (>70%)</span>
				</div>
				<div class="legend-item">
					<div class="legend-line moderate"></div>
					<span>Moderate (40-70%)</span>
				</div>
				<div class="legend-item">
					<div class="legend-line mild"></div>
					<span>Mild (20-40%)</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.loading,
	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #666666;
	}

	.color-map {
		font-family: 'Average', serif;
	}

	.map-header {
		text-align: center;
		margin-bottom: 30px;
	}

	.map-header h3 {
		font-size: 24px;
		margin: 0 0 10px 0;
		color: #000000;
	}

	.description {
		color: #666666;
		margin: 0;
		font-size: 14px;
	}

	.interpretation-panel {
		padding: 25px;
		background: #f9f9f9;
		border-left: 5px solid;
		border-radius: 4px;
		margin-bottom: 30px;
	}

	.severity-badge {
		display: inline-block;
		padding: 6px 16px;
		color: white;
		border-radius: 20px;
		font-weight: bold;
		font-size: 14px;
		margin-bottom: 15px;
	}

	.interpretation-panel h4 {
		font-size: 18px;
		margin: 0 0 10px 0;
		color: #000000;
	}

	.comparison {
		color: #666666;
		margin: 10px 0;
		line-height: 1.6;
	}

	.avg-confusion {
		margin-top: 15px;
		padding-top: 15px;
		border-top: 1px solid #e0e0e0;
		font-size: 14px;
		color: #666666;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 15px;
		margin-bottom: 40px;
	}

	.stat-card {
		padding: 20px;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		text-align: center;
	}

	.stat-card.severe {
		border-color: #dc3545;
	}
	.stat-card.moderate {
		border-color: #ff8c00;
	}
	.stat-card.mild {
		border-color: #ffc107;
	}
	.stat-card.normal {
		border-color: #28a745;
	}

	.stat-value {
		font-size: 32px;
		font-weight: bold;
		color: #000000;
		margin-bottom: 8px;
	}

	.stat-label {
		font-size: 11px;
		color: #666666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.visualization-section {
		margin: 40px 0;
		padding: 30px;
		background: #f9f9f9;
		border-radius: 8px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		margin-bottom: 20px;
	}

	.section-header > div {
		flex: 1;
	}

	.visualization-section h4 {
		font-size: 20px;
		margin: 0 0 10px 0;
		color: #000000;
		text-align: center;
	}

	.section-note {
		color: #666666;
		font-size: 14px;
		margin: 0;
		text-align: center;
	}

	.help-button {
		width: 28px;
		height: 28px;
		min-width: 28px;
		min-height: 28px;
		border-radius: 50%;
		background: #e8e8e8;
		color: #666666;
		border: 2px solid #cccccc;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Average', serif;
		padding: 0;
	}

	.help-button:hover {
		background: #d8d8d8;
		border-color: #999999;
	}

	.help-button:active {
		background: #cccccc;
		transform: scale(0.95);
	}

	.info-card {
		background: #ffffff;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.info-card h5 {
		font-size: 18px;
		margin: 0 0 20px 0;
		color: #000000;
		text-align: center;
	}

	.info-section {
		margin-bottom: 20px;
	}

	.info-section:last-child {
		margin-bottom: 0;
	}

	.info-section strong {
		display: block;
		color: #000000;
		margin-bottom: 8px;
		font-size: 15px;
	}

	.info-section p {
		color: #333333;
		line-height: 1.6;
		margin: 0 0 10px 0;
	}

	.info-section ul {
		margin: 10px 0 0 0;
		padding-left: 20px;
	}

	.info-section li {
		color: #333333;
		line-height: 1.8;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.severity-indicator {
		display: inline-block;
		width: 30px;
		height: 4px;
		border-radius: 2px;
	}

	.severity-indicator.severe {
		background: #ff0000;
	}

	.severity-indicator.moderate {
		background: #ff8c00;
	}

	.severity-indicator.mild {
		background: #ffc107;
	}

	.hue-wheel {
		max-width: 400px;
		width: 100%;
		height: auto;
		margin: 0 auto;
		display: block;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 20px;
		margin-top: 20px;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
	}

	.legend-line {
		width: 40px;
		height: 4px;
		border-radius: 2px;
	}

	.legend-line.severe {
		background: #ff0000;
	}
	.legend-line.moderate {
		background: #ff8c00;
	}
	.legend-line.mild {
		background: #ffc107;
	}

	@media (max-width: 768px) {
		.visualization-section {
			padding: 20px 10px;
		}

		.section-header {
			flex-direction: column;
			align-items: center;
		}

		.help-button {
			align-self: flex-end;
		}

		.info-card {
			padding: 15px;
		}

		.info-section strong {
			font-size: 14px;
		}

		.info-section p {
			font-size: 14px;
		}
	}
</style>
