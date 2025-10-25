<script>
	import { onMount } from 'svelte';
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import ColorMapVisualization from '$lib/framework/components/ColorMapVisualization.svelte';
	import { BayesianColorVisionModel } from '$lib/framework/colorTesting/bayesianInference.js';
	import pb from '$lib/pocketbase.js';

	let auth = $derived($frameworkAuthStore);
	let tests = $state([]);
	let loading = $state(true);
	let error = $state('');
	let stats = $state(null);
	let bayesianModel = $state(null);

	// Search and filter state
	let searchQuery = $state('');
	let responseFilter = $state('all'); // 'all', 'same', 'different'
	let correctnessFilter = $state('all'); // 'all', 'correct', 'incorrect'
	let dateRangeFilter = $state('all'); // 'all', 'today', 'week', 'month', 'custom'
	let customStartDate = $state('');
	let customEndDate = $state('');
	let sortBy = $state('recent'); // 'recent', 'oldest', 'response_time', 'confusion_prob', 'brightness', 'hue'
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Helper functions
	function getColorName(hex) {
		if (!hex) return '';

		const rgb = hexToRgb(hex);
		if (!rgb) return '';

		const { r, g, b } = rgb;

		// Use HSL for more accurate color classification
		const rNorm = r / 255;
		const gNorm = g / 255;
		const bNorm = b / 255;

		const max = Math.max(rNorm, gNorm, bNorm);
		const min = Math.min(rNorm, gNorm, bNorm);
		const delta = max - min;

		// Calculate lightness and saturation
		const lightness = (max + min) / 2;
		const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

		// Calculate hue (0-360)
		let hue = 0;
		if (delta !== 0) {
			if (max === rNorm) {
				hue = 60 * (((gNorm - bNorm) / delta) % 6);
			} else if (max === gNorm) {
				hue = 60 * ((bNorm - rNorm) / delta + 2);
			} else {
				hue = 60 * ((rNorm - gNorm) / delta + 4);
			}
		}
		if (hue < 0) hue += 360;

		// Achromatic colors (low saturation)
		if (saturation < 0.15) {
			if (lightness < 0.2) return 'black';
			if (lightness > 0.85) return 'white';
			return 'gray';
		}

		// Brown is dark orange/yellow
		if (hue >= 20 && hue < 50 && lightness < 0.5) {
			return 'brown';
		}

		// Hue-based color classification
		if (hue >= 345 || hue < 15) return 'red';
		if (hue >= 15 && hue < 45) return 'orange';
		if (hue >= 45 && hue < 70) return 'yellow';
		if (hue >= 70 && hue < 165) return 'green';
		if (hue >= 165 && hue < 200) return 'cyan'; // Cyan/turquoise range
		if (hue >= 200 && hue < 250) return 'blue';
		if (hue >= 250 && hue < 290) return 'purple';
		if (hue >= 290 && hue < 345) {
			// Pink vs purple distinction based on lightness
			return lightness > 0.6 ? 'pink' : 'purple';
		}

		return 'gray';
	}

	function hexToRgb(hex) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: null;
	}

	function calculateBrightness(hex) {
		const rgb = hexToRgb(hex);
		if (!rgb) return 0;
		return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
	}

	function calculateHue(hex) {
		const rgb = hexToRgb(hex);
		if (!rgb) return 0;
		const r = rgb.r / 255;
		const g = rgb.g / 255;
		const b = rgb.b / 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0;

		if (max !== min) {
			const d = max - min;
			switch (max) {
				case r:
					h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
					break;
				case g:
					h = ((b - r) / d + 2) / 6;
					break;
				case b:
					h = ((r - g) / d + 4) / 6;
					break;
			}
		}
		return h * 360;
	}

	function isWithinDateRange(dateString) {
		if (dateRangeFilter === 'all') return true;

		const testDate = new Date(dateString);
		const now = new Date();

		if (dateRangeFilter === 'today') {
			return testDate.toDateString() === now.toDateString();
		} else if (dateRangeFilter === 'week') {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return testDate >= weekAgo;
		} else if (dateRangeFilter === 'month') {
			const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			return testDate >= monthAgo;
		} else if (dateRangeFilter === 'custom') {
			if (customStartDate && customEndDate) {
				const start = new Date(customStartDate);
				const end = new Date(customEndDate);
				return testDate >= start && testDate <= end;
			}
		}

		return true;
	}

	// Filtered and paginated tests
	let filteredTests = $derived.by(() => {
		let filtered = tests;

		// Apply search filter - auto-detect hex code vs color name
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();

			// Check if query looks like a hex code
			const isHexQuery = query.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(query);

			if (isHexQuery) {
				// Search by hex code
				filtered = filtered.filter(
					(t) =>
						t.reference_hex?.toLowerCase().includes(query) ||
						t.color1_hex?.toLowerCase().includes(query) ||
						t.color2_hex?.toLowerCase().includes(query)
				);
			} else {
				// Search by color name (exact match)
				filtered = filtered.filter(
					(t) =>
						getColorName(t.reference_hex) === query ||
						getColorName(t.color1_hex) === query ||
						getColorName(t.color2_hex) === query
				);
			}
		}

		// Apply response type filter (same vs different)
		if (responseFilter === 'same') {
			filtered = filtered.filter((t) => t.user_response === 'same');
		} else if (responseFilter === 'different') {
			filtered = filtered.filter((t) => t.user_response !== 'same');
		}

		// Apply correctness filter
		if (correctnessFilter === 'correct') {
			filtered = filtered.filter((t) => t.is_correct === true);
		} else if (correctnessFilter === 'incorrect') {
			filtered = filtered.filter((t) => t.is_correct === false);
		}

		// Apply date range filter
		filtered = filtered.filter((t) => isWithinDateRange(t.created));

		// Apply sorting
		filtered = [...filtered].sort((a, b) => {
			if (sortBy === 'recent') {
				return new Date(b.created) - new Date(a.created);
			} else if (sortBy === 'oldest') {
				return new Date(a.created) - new Date(b.created);
			} else if (sortBy === 'response_time') {
				return (a.response_time_ms || 0) - (b.response_time_ms || 0);
			} else if (sortBy === 'confusion_prob') {
				return (b.expected_confusion_prob || 0) - (a.expected_confusion_prob || 0);
			} else if (sortBy === 'brightness') {
				return calculateBrightness(a.reference_hex) - calculateBrightness(b.reference_hex);
			} else if (sortBy === 'hue') {
				return calculateHue(a.reference_hex) - calculateHue(b.reference_hex);
			}
			return 0;
		});

		return filtered;
	});

	let totalPages = $derived(Math.ceil(filteredTests.length / itemsPerPage));
	let paginatedTests = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredTests.slice(startIndex, startIndex + itemsPerPage);
	});

	// Reset to page 1 when filters change
	$effect(() => {
		searchQuery;
		responseFilter;
		correctnessFilter;
		dateRangeFilter;
		sortBy;
		currentPage = 1;
	});

	onMount(async () => {
		await loadTests();
	});

	async function loadTests() {
		loading = true;
		error = '';
		try {
			const user = pb.authStore.model;
			if (!user) {
				error = 'Not authenticated';
				return;
			}

			// Load Bayesian model for confusion probabilities
			const settings = await pb.collection('colorvision_settings').getFullList({
				filter: `user = "${user.id}"`
			});

			if (settings.length > 0 && settings[0].bayesian_state) {
				const model = new BayesianColorVisionModel(user.colorblindness_type || 'deuteranomaly');
				model.importState(settings[0].bayesian_state);
				bayesianModel = model;
			}

			// Load all tests for this user
			const records = await pb.collection('colorvision_tests').getFullList({
				filter: `user = "${user.id}"`,
				sort: '-created'
			});

			tests = records;

			// Calculate basic stats
			const totalTests = records.length;
			const sameResponses = records.filter((r) => r.user_response === 'same').length;
			const differentResponses = totalTests - sameResponses;
			const correctResponses = records.filter((r) => r.is_correct === true).length;

			// Get unique colors tested
			const uniqueColors = new Set();
			records.forEach((r) => {
				if (r.reference_hex) uniqueColors.add(r.reference_hex);
				if (r.color1_hex) uniqueColors.add(r.color1_hex);
				if (r.color2_hex) uniqueColors.add(r.color2_hex);
			});

			stats = {
				totalTests,
				sameResponses,
				differentResponses,
				correctResponses,
				uniqueColors: uniqueColors.size
			};
		} catch (e) {
			error = e.message || 'Failed to load results';
			console.error('Error loading tests:', e);
		} finally {
			loading = false;
		}
	}

	function getConfusionProb(test) {
		if (!bayesianModel || !test.color1_hex || !test.color2_hex) return null;

		// Get confusion probability for the color pair
		try {
			return bayesianModel.getConfusionProbability(test.color1_hex, test.color2_hex);
		} catch (e) {
			return null;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleString();
	}

	function goToPage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function getColorSwatch(colorName) {
		const swatches = {
			red: '#ff0000',
			orange: '#ff8800',
			yellow: '#ffdd00',
			green: '#00aa00',
			cyan: '#00dddd',
			blue: '#0066ff',
			purple: '#8800ff',
			pink: '#ff66cc',
			brown: '#8b4513',
			gray: '#888888',
			black: '#000000',
			white: '#ffffff'
		};
		return swatches[colorName] || '#888888';
	}
</script>

<div class="results-page">
	<h1>Your Test Results</h1>

	{#if loading}
		<div class="loading">
			<p>Loading your results...</p>
		</div>
	{:else if error}
		<div class="error-box">
			<p>{error}</p>
		</div>
	{:else if tests.length === 0}
		<div class="empty-state">
			<h2>No tests completed yet</h2>
			<p>Head to the Test tab to start building your color vision map!</p>
			<a href="/dashboard/test" class="cta-btn">Start Testing</a>
		</div>
	{:else}
		<div class="stats-grid">
			<div class="stat-card">
				<h3>Total Tests</h3>
				<p class="stat-value">{stats.totalTests}</p>
			</div>

			<div class="stat-card">
				<h3>Unique Colors</h3>
				<p class="stat-value">{stats.uniqueColors}</p>
			</div>

			<div class="stat-card">
				<h3>"Same" Responses</h3>
				<p class="stat-value">{stats.sameResponses}</p>
				<p class="stat-note">Colors you couldn't distinguish</p>
			</div>

			<div class="stat-card">
				<h3>"Different" Responses</h3>
				<p class="stat-value">{stats.differentResponses}</p>
				<p class="stat-note">Colors you could distinguish</p>
			</div>

			<div class="stat-card">
				<h3>Correct Identifications</h3>
				<p class="stat-value">{stats.correctResponses}</p>
				<p class="stat-note">When different, identified correctly</p>
			</div>
		</div>

		<!-- Color Confusion Map -->
		<div class="section">
			<ColorMapVisualization />
		</div>

		<div class="section">
			<h2>Test History</h2>

			<!-- Search Box -->
			<div class="controls">
				<div class="search-box">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search by hex code (#FF0000) or click a color name below"
						class="search-input"
					/>
				</div>
			</div>

			<!-- Color Name Quick Filters -->
			<div class="color-tags">
				<span class="tag-label">Quick search:</span>
				{#each ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'gray', 'black', 'white'] as colorName}
					<button
						class="color-tag"
						class:active={searchQuery === colorName}
						onclick={() => (searchQuery = searchQuery === colorName ? '' : colorName)}
						style="border-color: {getColorSwatch(colorName)}"
					>
						<span class="color-swatch" style="background: {getColorSwatch(colorName)}"></span>
						{colorName}
					</button>
				{/each}
			</div>

			<!-- Filters Row -->
			<div class="controls">
				<div class="filter-group">
					<label for="response-filter">Response:</label>
					<select id="response-filter" bind:value={responseFilter} class="filter-select">
						<option value="all">All</option>
						<option value="same">Same Only</option>
						<option value="different">Different Only</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="correctness-filter">Correctness:</label>
					<select id="correctness-filter" bind:value={correctnessFilter} class="filter-select">
						<option value="all">All</option>
						<option value="correct">Correct Only</option>
						<option value="incorrect">Incorrect Only</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="date-filter">Date Range:</label>
					<select id="date-filter" bind:value={dateRangeFilter} class="filter-select">
						<option value="all">All Time</option>
						<option value="today">Today</option>
						<option value="week">Last 7 Days</option>
						<option value="month">Last 30 Days</option>
						<option value="custom">Custom Range</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="sort-by">Sort by:</label>
					<select id="sort-by" bind:value={sortBy} class="filter-select">
						<option value="recent">Most Recent</option>
						<option value="oldest">Oldest First</option>
						<option value="response_time">Response Time (Fast→Slow)</option>
						<option value="confusion_prob">Confusion Prob (High→Low)</option>
						<option value="brightness">Brightness (Dark→Light)</option>
						<option value="hue">Hue (Red→Violet)</option>
					</select>
				</div>
			</div>

			<!-- Custom Date Range -->
			{#if dateRangeFilter === 'custom'}
				<div class="controls custom-date">
					<div class="filter-group">
						<label for="start-date">Start Date:</label>
						<input type="date" id="start-date" bind:value={customStartDate} class="search-input" />
					</div>
					<div class="filter-group">
						<label for="end-date">End Date:</label>
						<input type="date" id="end-date" bind:value={customEndDate} class="search-input" />
					</div>
				</div>
			{/if}

			<p class="section-note">
				Showing {filteredTests.length} of {tests.length} tests
			</p>

			<div class="test-list">
				{#each paginatedTests as test}
					<div class="test-item">
						<div class="color-swatches">
							<div class="swatch-group">
								<span class="label">Reference:</span>
								<div
									class="swatch"
									style="background-color: {test.reference_hex};"
									title={test.reference_hex}
								></div>
								<span class="hex-code">{test.reference_hex}</span>
							</div>

							<div class="swatch-group">
								<span class="label">Color 1:</span>
								<div
									class="swatch"
									style="background-color: {test.color1_hex};"
									title={test.color1_hex}
								></div>
								<span class="hex-code">{test.color1_hex}</span>
							</div>

							<div class="swatch-group">
								<span class="label">Color 2:</span>
								<div
									class="swatch"
									style="background-color: {test.color2_hex};"
									title={test.color2_hex}
								></div>
								<span class="hex-code">{test.color2_hex}</span>
							</div>
						</div>

						<div class="test-details">
							<div class="detail-row">
								<strong>Response:</strong>
								<span class="response-badge response-{test.user_response}">
									{test.user_response}
								</span>
							</div>
							<div class="detail-row">
								<strong>Correct:</strong>
								<span class:correct={test.is_correct} class:incorrect={!test.is_correct}>
									{test.is_correct ? 'Yes' : 'No'}
								</span>
							</div>
							<div class="detail-row">
								<strong>Date:</strong>
								<span class="date">{formatDate(test.created)}</span>
							</div>
							{#if getConfusionProb(test) !== null}
								{@const confusionProb = getConfusionProb(test)}
								<div class="detail-row">
									<strong>Confusion:</strong>
									<div class="confusion-bar-container">
										<div class="confusion-bar">
											<div
												class="confusion-fill"
												class:severe-confusion={confusionProb >= 0.7}
												class:moderate-confusion={confusionProb >= 0.4 && confusionProb < 0.7}
												class:mild-confusion={confusionProb >= 0.2 && confusionProb < 0.4}
												class:normal-confusion={confusionProb < 0.2}
												style="width: {confusionProb * 100}%"
											></div>
										</div>
										<span class="confusion-percent">{(confusionProb * 100).toFixed(0)}%</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			{#if filteredTests.length === 0}
				<div class="no-results">
					<p>No tests match your search or filter criteria.</p>
				</div>
			{/if}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="pagination">
					<button
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
						class="page-btn"
					>
						Previous
					</button>

					<div class="page-numbers">
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
							{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
								<button
									onclick={() => goToPage(page)}
									class="page-btn"
									class:active={page === currentPage}
								>
									{page}
								</button>
							{:else if page === currentPage - 2 || page === currentPage + 2}
								<span class="page-ellipsis">...</span>
							{/if}
						{/each}
					</div>

					<button
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="page-btn"
					>
						Next
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.results-page {
		max-width: 1200px;
		margin: 0 auto;
		font-family: 'Average', serif;
	}

	h1 {
		font-size: 32px;
		margin-bottom: 40px;
		color: #000000;
		text-align: center;
	}

	h2 {
		font-size: 24px;
		margin-bottom: 20px;
		color: #000000;
	}

	.loading,
	.error-box,
	.empty-state {
		text-align: center;
		padding: 60px 20px;
	}

	.error-box {
		color: #cc0000;
		background: #ffeeee;
		border: 2px solid #cc0000;
		border-radius: 8px;
	}

	.empty-state h2 {
		margin-bottom: 10px;
	}

	.empty-state p {
		color: #666666;
		margin-bottom: 30px;
	}

	.cta-btn {
		display: inline-block;
		padding: 15px 40px;
		background: #000000;
		color: #ffffff;
		text-decoration: none;
		border-radius: 6px;
		font-size: 18px;
		transition: all 0.2s;
	}

	.cta-btn:hover {
		background: #333333;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 50px;
	}

	.stat-card {
		padding: 25px;
		background: #f9f9f9;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		text-align: center;
	}

	.stat-card h3 {
		font-size: 14px;
		color: #666666;
		margin: 0 0 10px 0;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.stat-value {
		font-size: 36px;
		font-weight: bold;
		color: #000000;
		margin: 10px 0;
	}

	.stat-note {
		font-size: 12px;
		color: #999999;
		margin: 5px 0 0 0;
	}

	.section {
		margin-bottom: 50px;
	}

	.section-note {
		color: #666666;
		margin-bottom: 20px;
	}

	.controls {
		display: flex;
		gap: 20px;
		margin-bottom: 20px;
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.search-box {
		flex: 1;
		min-width: 250px;
	}

	.search-input {
		width: 100%;
		padding: 12px 16px;
		font-family: 'Average', serif;
		font-size: 14px;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		transition: border-color 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #000000;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.filter-group label {
		font-size: 14px;
		color: #666666;
	}

	.filter-select {
		padding: 12px 16px;
		font-family: 'Average', serif;
		font-size: 14px;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.filter-select:focus {
		outline: none;
		border-color: #000000;
	}

	.custom-date {
		background: #f9f9f9;
		padding: 15px;
		border-radius: 4px;
		margin-top: 10px;
	}

	input[type='date'],
	input[type='number'] {
		padding: 12px 16px;
		font-family: 'Average', serif;
		font-size: 14px;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		width: 100%;
	}

	input[type='date']:focus,
	input[type='number']:focus {
		outline: none;
		border-color: #000000;
	}

	.color-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-top: 15px;
		margin-bottom: 20px;
		padding: 15px;
		background: #f9f9f9;
		border-radius: 4px;
	}

	.tag-label {
		font-size: 14px;
		color: #666666;
		font-weight: bold;
		margin-right: 5px;
	}

	.color-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-family: 'Average', serif;
		font-size: 13px;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: capitalize;
	}

	.color-tag:hover {
		transform: translateY(-2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.color-tag.active {
		background: #000000;
		color: #ffffff;
		border-color: #000000;
	}

	.color-swatch {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.2);
	}

	.test-list {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.test-item {
		padding: 20px;
		background: #ffffff;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		display: flex;
		gap: 30px;
		align-items: center;
	}

	.color-swatches {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}

	.swatch-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.label {
		font-size: 12px;
		color: #666666;
	}

	.swatch {
		width: 60px;
		height: 60px;
		border: 2px solid #000000;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.hex-code {
		font-family: 'Courier New', monospace;
		font-size: 11px;
		color: #333333;
	}

	.test-details {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
	}

	.detail-row {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.response-badge {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 13px;
	}

	.response-same {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffc107;
	}

	.response-color1,
	.response-color2 {
		background: #d1ecf1;
		color: #0c5460;
		border: 1px solid #17a2b8;
	}

	.correct {
		color: #28a745;
		font-weight: bold;
	}

	.incorrect {
		color: #dc3545;
	}

	.date {
		font-size: 13px;
		color: #666666;
	}

	.confusion-bar-container {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
	}

	.confusion-bar {
		flex: 1;
		height: 12px;
		background: #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
		max-width: 150px;
	}

	.confusion-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.severe-confusion {
		background: #ff0000;
	}

	.moderate-confusion {
		background: #ff8c00;
	}

	.mild-confusion {
		background: #ffc107;
	}

	.normal-confusion {
		background: #28a745;
	}

	.confusion-percent {
		font-size: 12px;
		font-weight: bold;
		min-width: 35px;
		text-align: right;
		color: #333333;
	}

	.more-note {
		text-align: center;
		color: #999999;
		font-style: italic;
		margin-top: 20px;
	}

	.no-results {
		text-align: center;
		padding: 40px 20px;
		color: #666666;
		font-style: italic;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		margin-top: 30px;
		flex-wrap: wrap;
	}

	.page-numbers {
		display: flex;
		gap: 5px;
		align-items: center;
	}

	.page-btn {
		padding: 8px 16px;
		font-family: 'Average', serif;
		font-size: 14px;
		background: white;
		color: #000000;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 45px;
	}

	.page-btn:hover:not(:disabled) {
		background: #f0f0f0;
		border-color: #000000;
	}

	.page-btn.active {
		background: #000000;
		color: #ffffff;
		border-color: #000000;
	}

	.page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.page-ellipsis {
		padding: 0 8px;
		color: #666666;
	}

	@media (max-width: 768px) {
		.test-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
