/**
 * Adaptive test selector using information gain
 * Chooses the next optimal color pair to test based on:
 * - Information gain (reduce uncertainty)
 * - Coverage (explore untested regions)
 * - Priority areas (focus on important color ranges)
 */

import { getPriorityColors } from './colorblindnessProfiles.js';
import { generateTrial } from './testGenerator.js';

/**
 * Adaptive test selection strategy
 */
export class AdaptiveTestSelector {
	constructor(bayesianModel, colorblindnessType) {
		this.model = bayesianModel;
		this.colorblindnessType = colorblindnessType;
		this.mode = 'balanced'; // 'explore', 'exploit', 'balanced'
	}

	/**
	 * Select next test trial using adaptive strategy
	 * @param {number} difficulty - Difficulty level 1-10
	 * @returns {Object} Trial object
	 */
	selectNextTrial(difficulty = 5) {
		if (this.mode === 'explore') {
			return this.selectExplorationTrial(difficulty);
		} else if (this.mode === 'exploit') {
			return this.selectExploitationTrial(difficulty);
		} else {
			return this.selectBalancedTrial(difficulty);
		}
	}

	/**
	 * Exploration mode: Test untested color regions
	 * ENHANCED: Add hotspot colors to priority pool
	 */
	selectExplorationTrial(difficulty) {
		const priorityColors = getPriorityColors(this.colorblindnessType);

		// ENHANCEMENT: Add hotspot colors to priority pool
		const hotspots = this.model.getConfusionHotspots(0.7, 3);
		const suggestedColors = this.model.suggestNextColors(priorityColors, 5);

		// Combine static priorities with dynamic hotspots
		const enhancedPool = [...new Set([...priorityColors, ...hotspots, ...suggestedColors])];

		// Find color with least testing
		const colorTestCounts = new Map();

		// Count how many times each color has been tested
		this.model.getTestedPairs().forEach((pair) => {
			colorTestCounts.set(pair.color1, (colorTestCounts.get(pair.color1) || 0) + 1);
			colorTestCounts.set(pair.color2, (colorTestCounts.get(pair.color2) || 0) + 1);
		});

		// Find least-tested color from enhanced pool
		let leastTestedColor = enhancedPool[0];
		let minCount = colorTestCounts.get(leastTestedColor) || 0;

		enhancedPool.forEach((color) => {
			const count = colorTestCounts.get(color) || 0;
			if (count < minCount) {
				minCount = count;
				leastTestedColor = color;
			}
		});

		// Generate trial for this color
		return generateTrial(leastTestedColor, this.colorblindnessType, difficulty);
	}

	/**
	 * Exploitation mode: Focus on uncertain pairs with high information gain
	 */
	selectExploitationTrial(difficulty) {
		const priorityColors = getPriorityColors(this.colorblindnessType);

		// Find pair with highest information gain among priority colors
		let bestColor = null;
		let maxInfoGain = -1;

		// Sample some priority colors to test
		const samplesToCheck = Math.min(10, priorityColors.length);
		for (let i = 0; i < samplesToCheck; i++) {
			const color = priorityColors[Math.floor(Math.random() * priorityColors.length)];

			// Generate potential trial
			const trial = generateTrial(color, this.colorblindnessType, difficulty);

			// Calculate information gain for this pair
			const infoGain = this.model.calculateInformationGain(trial.color1, trial.color2);

			if (infoGain > maxInfoGain) {
				maxInfoGain = infoGain;
				bestColor = color;
			}
		}

		// Generate trial for best color
		return generateTrial(bestColor || priorityColors[0], this.colorblindnessType, difficulty);
	}

	/**
	 * Balanced mode: Mix exploration and exploitation
	 */
	selectBalancedTrial(difficulty) {
		// 70% exploitation, 30% exploration
		if (Math.random() < 0.7) {
			return this.selectExploitationTrial(difficulty);
		} else {
			return this.selectExplorationTrial(difficulty);
		}
	}

	/**
	 * Switch testing mode
	 * @param {string} mode - 'explore', 'exploit', or 'balanced'
	 */
	setMode(mode) {
		if (['explore', 'exploit', 'balanced'].includes(mode)) {
			this.mode = mode;
		}
	}

	/**
	 * Get current testing statistics
	 */
	getStats() {
		const testedPairs = this.model.getTestedPairs();
		const confusedPairs = this.model.getConfusedPairs(0.7);

		// Calculate average uncertainty
		const avgUncertainty =
			testedPairs.length > 0
				? testedPairs.reduce((sum, p) => sum + p.uncertainty, 0) / testedPairs.length
				: 1.0;

		// Calculate coverage (unique colors tested)
		const uniqueColors = new Set();
		testedPairs.forEach((pair) => {
			uniqueColors.add(pair.color1);
			uniqueColors.add(pair.color2);
		});

		return {
			totalTests: this.model.testHistory.length,
			uniquePairsTested: testedPairs.length,
			uniqueColorsTested: uniqueColors.size,
			confirmedConfusions: confusedPairs.length,
			averageUncertainty: avgUncertainty,
			mode: this.mode
		};
	}

	/**
	 * Suggest optimal mode based on current state
	 */
	suggestMode() {
		const stats = this.getStats();

		// If very few tests, explore
		if (stats.totalTests < 20) {
			return 'explore';
		}

		// If high uncertainty, exploit to reduce it
		if (stats.averageUncertainty > 0.7) {
			return 'exploit';
		}

		// If low coverage, explore
		const priorityColors = getPriorityColors(this.colorblindnessType);
		const coverage = stats.uniqueColorsTested / priorityColors.length;
		if (coverage < 0.6) {
			return 'explore';
		}

		// Otherwise balanced
		return 'balanced';
	}
}
