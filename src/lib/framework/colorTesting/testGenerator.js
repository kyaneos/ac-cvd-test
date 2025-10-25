/**
 * Generate color discrimination test trials
 * Uses simulation-based confusable pairs to test actual discrimination ability
 */

import { getPriorityColors } from './colorblindnessProfiles.js';
import { generateAdjacentColors, hexToRgb, rgbToHex, interpolateColor } from './colorSpace.js';
import { findConfusableColor, calculateConfusionProbability } from './confusablePairFinder.js';

/**
 * Generate a simulation-based discrimination trial
 * Presents two colors that SHOULD be confusable based on colorblind simulation
 * User must determine if they can distinguish them
 *
 * @param {string} referenceColor - The reference hex color
 * @param {string} colorblindnessType - User's colorblindness type
 * @param {number} difficulty - Difficulty level 1-10 (affects search parameters)
 * @returns {Object} Trial data with reference and comparison color
 */
export function generateTrial(referenceColor, colorblindnessType, difficulty = 5) {
	// Adjust search parameters based on difficulty
	// Higher difficulty = tighter similarity threshold
	const searchRadius = 60 - difficulty * 3; // 57 at easy, 30 at hard
	const similarityThreshold = 5 + difficulty * 1.5; // 6.5 at easy, 20 at hard

	// Find a color that simulates similarly
	let confusableColor = findConfusableColor(
		referenceColor,
		colorblindnessType,
		searchRadius,
		similarityThreshold
	);

	// ENHANCED FALLBACK: Try relaxed parameters before giving up
	if (!confusableColor) {
		console.log(`⚠️  No confusable pair found with strict params, trying relaxed...`);

		// Attempt 1: 50% larger search space, 30% more lenient
		confusableColor = findConfusableColor(
			referenceColor,
			colorblindnessType,
			searchRadius * 1.5,
			similarityThreshold * 1.3
		);
	}

	// Attempt 2: Very relaxed params
	if (!confusableColor) {
		console.log(`⚠️  Still no match, trying very relaxed params...`);

		confusableColor = findConfusableColor(
			referenceColor,
			colorblindnessType,
			100, // Very large search radius
			50 // Very lenient similarity
		);
	}

	// Last resort: random fallback
	const comparisonColor = confusableColor || generateFallbackColor(referenceColor, difficulty);

	if (!confusableColor) {
		console.warn(`❌ No confusable pair found for ${referenceColor}, using random fallback`);
	}

	// Calculate expected confusion probability based on simulation
	const expectedConfusionProb = calculateConfusionProbability(
		referenceColor,
		comparisonColor,
		colorblindnessType
	);

	// Randomly position which side has which color
	const referenceOnLeft = Math.random() > 0.5;

	return {
		reference: referenceColor,
		color1: referenceOnLeft ? referenceColor : comparisonColor,
		color2: referenceOnLeft ? comparisonColor : referenceColor,
		referencePosition: referenceOnLeft ? 'color1' : 'color2',
		expectedConfusionProb, // Bayesian prior based on simulation
		difficulty,
		testType: 'discrimination' // User answers: 'same' or 'color1' or 'color2'
	};
}

/**
 * Fallback: Generate a different color when simulation fails to find confusable pair
 */
function generateFallbackColor(referenceColor, difficulty) {
	const rgb = hexToRgb(referenceColor);
	const step = 60 - difficulty * 4; // Varies from 56 to 20

	const variantRgb = {
		r: Math.max(0, Math.min(255, rgb.r + (Math.random() - 0.5) * step * 2)),
		g: Math.max(0, Math.min(255, rgb.g + (Math.random() - 0.5) * step * 2)),
		b: Math.max(0, Math.min(255, rgb.b + (Math.random() - 0.5) * step * 2))
	};

	return rgbToHex(variantRgb.r, variantRgb.g, variantRgb.b);
}

/**
 * Generate a random color from priority colors for the user's type
 * @param {string} colorblindnessType
 * @returns {string} Hex color
 */
export function getRandomPriorityColor(colorblindnessType) {
	const priorityColors = getPriorityColors(colorblindnessType);
	return priorityColors[Math.floor(Math.random() * priorityColors.length)];
}

/**
 * Generate a batch of test trials
 * @param {string} colorblindnessType
 * @param {number} count - Number of trials to generate
 * @param {number} difficulty - Difficulty level 1-10
 * @returns {Array<Object>} Array of trial objects
 */
export function generateTrialBatch(colorblindnessType, count = 10, difficulty = 5) {
	const trials = [];

	for (let i = 0; i < count; i++) {
		const referenceColor = getRandomPriorityColor(colorblindnessType);
		trials.push(generateTrial(referenceColor, colorblindnessType, difficulty));
	}

	return trials;
}

/**
 * Generate trials for a specific color region
 * @param {string} baseColor - Base hex color for the region
 * @param {number} count - Number of trials
 * @param {number} difficulty - Difficulty level
 * @returns {Array<Object>} Array of trial objects
 */
export function generateTrialsForColorRegion(baseColor, count = 5, difficulty = 5) {
	const trials = [];
	const adjacent = generateAdjacentColors(baseColor, 20);

	for (let i = 0; i < count; i++) {
		// Use base color or adjacent color as reference
		const referenceColor = i === 0 ? baseColor : adjacent[i % adjacent.length];
		trials.push(generateTrial(referenceColor, 'normal', difficulty));
	}

	return trials;
}

/**
 * Generate trials that explore the space between two colors
 * Useful for finding exact confusion points
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @param {number} steps - Number of intermediate colors to test
 * @returns {Array<Object>} Array of trial objects
 */
export function generateGradientTrials(color1, color2, steps = 5) {
	const trials = [];

	for (let i = 0; i <= steps; i++) {
		const ratio = i / steps;
		const referenceColor = interpolateColor(color1, color2, ratio);
		trials.push(generateTrial(referenceColor, 'normal', 7)); // Medium-high difficulty
	}

	return trials;
}
