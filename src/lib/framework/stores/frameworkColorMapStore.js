/**
 * Framework color map store
 * Manages aggregated test results and user's color confusion map
 */

import { writable, derived } from 'svelte/store';
import { loadUserColorMap } from '$lib/framework/api/loadUserColorMap.js';

function createColorMapStore() {
	const { subscribe, set, update } = writable({
		testResults: [],
		isLoading: false,
		lastUpdated: null,
		error: null
	});

	return {
		subscribe,

		/**
		 * Load all test results from PocketBase
		 */
		load: async () => {
			update((state) => ({ ...state, isLoading: true, error: null }));
			try {
				const results = await loadUserColorMap();
				set({
					testResults: results,
					isLoading: false,
					lastUpdated: Date.now(),
					error: null
				});
				return results;
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message || 'Failed to load color map'
				}));
				throw error;
			}
		},

		/**
		 * Add a new test result
		 */
		addResult: (result) => {
			update((state) => ({
				...state,
				testResults: [result, ...state.testResults],
				lastUpdated: Date.now()
			}));
		},

		/**
		 * Update an existing result
		 */
		updateResult: (id, updates) => {
			update((state) => ({
				...state,
				testResults: state.testResults.map((r) => (r.id === id ? { ...r, ...updates } : r)),
				lastUpdated: Date.now()
			}));
		},

		/**
		 * Remove a result
		 */
		removeResult: (id) => {
			update((state) => ({
				...state,
				testResults: state.testResults.filter((r) => r.id !== id),
				lastUpdated: Date.now()
			}));
		},

		/**
		 * Clear all results
		 */
		clear: () => {
			set({
				testResults: [],
				isLoading: false,
				lastUpdated: null,
				error: null
			});
		}
	};
}

export const frameworkColorMapStore = createColorMapStore();

/**
 * Derived store: Get all unique colors tested
 */
export const testedColors = derived(frameworkColorMapStore, ($colorMap) => {
	const colors = new Set();
	$colorMap.testResults.forEach((result) => {
		colors.add(result.reference_hex);
		colors.add(result.option1_hex);
		colors.add(result.option2_hex);
	});
	return Array.from(colors);
});

/**
 * Derived store: Get confusion pairs (colors the user said were the same)
 */
export const confusionPairs = derived(frameworkColorMapStore, ($colorMap) => {
	return $colorMap.testResults
		.filter((result) => result.user_response === 'no_difference')
		.map((result) => ({
			color1: result.option1_hex,
			color2: result.option2_hex,
			timestamp: result.created
		}));
});

/**
 * Derived store: Get test statistics
 */
export const testStats = derived(frameworkColorMapStore, ($colorMap) => {
	const total = $colorMap.testResults.length;
	const confusions = $colorMap.testResults.filter(
		(r) => r.user_response === 'no_difference'
	).length;
	const distinctions = total - confusions;

	return {
		totalTests: total,
		confusions,
		distinctions,
		confusionRate: total > 0 ? (confusions / total) * 100 : 0
	};
});
