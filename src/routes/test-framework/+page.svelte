<script>
	import { onMount } from 'svelte';
	import blinder from 'color-blind';
	import { hexToRgb } from '$lib/framework/colorTesting/colorSpace.js';
	import { findConfusableColor } from '$lib/framework/colorTesting/confusablePairFinder.js';
	import { BayesianColorVisionModel } from '$lib/framework/colorTesting/bayesianInference.js';

	let testResults = $state({
		colorBlindLibrary: 'Not tested',
		colorSpace: 'Not tested',
		confusablePair: 'Not tested',
		bayesianModel: 'Not tested'
	});

	onMount(() => {
		runTests();
	});

	function runTests() {
		// Test 1: color-blind library
		try {
			const original = '#FF0000';
			const simulated = blinder.deuteranomaly(original);
			testResults.colorBlindLibrary = `✅ Works! ${original} → ${simulated}`;
		} catch (e) {
			testResults.colorBlindLibrary = `❌ Error: ${e.message}`;
		}

		// Test 2: colorSpace utilities
		try {
			const rgb = hexToRgb('#FF5733');
			testResults.colorSpace = `✅ Works! Parsed RGB: ${JSON.stringify(rgb)}`;
		} catch (e) {
			testResults.colorSpace = `❌ Error: ${e.message}`;
		}

		// Test 3: confusablePairFinder
		try {
			const confusable = findConfusableColor('#FF0000', 'deuteranomaly', 40, 15);
			testResults.confusablePair = confusable
				? `✅ Works! Found confusable: ${confusable}`
				: '⚠️ No confusable color found (this is okay)';
		} catch (e) {
			testResults.confusablePair = `❌ Error: ${e.message}`;
		}

		// Test 4: Bayesian model
		try {
			const model = new BayesianColorVisionModel('deuteranomaly');
			const prob = model.getConfusionProbability('#FF0000', '#FF1010');
			testResults.bayesianModel = `✅ Works! Confusion prob: ${prob.toFixed(3)}`;
		} catch (e) {
			testResults.bayesianModel = `❌ Error: ${e.message}`;
		}
	}
</script>

<div class="container">
	<h1>Framework Test Suite</h1>

	<div class="test">
		<h3>1. color-blind Library</h3>
		<p>{testResults.colorBlindLibrary}</p>
	</div>

	<div class="test">
		<h3>2. Color Space Utilities</h3>
		<p>{testResults.colorSpace}</p>
	</div>

	<div class="test">
		<h3>3. Confusable Pair Finder</h3>
		<p>{testResults.confusablePair}</p>
	</div>

	<div class="test">
		<h3>4. Bayesian Model</h3>
		<p>{testResults.bayesianModel}</p>
	</div>

	<div class="success">
		{#if Object.values(testResults).every((r) => r.includes('✅') || r.includes('⚠️'))}
			<h2>🎉 All Core Systems Working!</h2>
		{:else}
			<h2>⚠️ Some Systems Have Issues</h2>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 40px auto;
		padding: 20px;
		font-family: 'Average', serif;
	}

	h1 {
		text-align: center;
		margin-bottom: 40px;
	}

	.test {
		background: #f5f5f5;
		padding: 20px;
		margin-bottom: 20px;
		border-radius: 8px;
		border: 2px solid #ddd;
	}

	.test h3 {
		margin-top: 0;
	}

	.test p {
		margin-bottom: 0;
		font-family: 'Courier New', monospace;
	}

	.success {
		text-align: center;
		padding: 30px;
		margin-top: 40px;
		background: #e8f5e9;
		border-radius: 8px;
	}
</style>
