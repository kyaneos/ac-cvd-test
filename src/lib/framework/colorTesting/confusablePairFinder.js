/**
 * Find confusable color pairs using colorblind simulation
 * Uses the color-blind library to identify colors that appear similar
 * to people with specific types of colorblindness
 */

import blinder from 'color-blind';
import { hexToRgb, rgbToHex, rgbDistance } from './colorSpace.js';

/**
 * Find a color that simulates similarly to the reference color
 * This creates pairs that SHOULD be confusable for the given colorblindness type
 *
 * @param {string} referenceHex - The reference color
 * @param {string} colorblindnessType - Type of colorblindness
 * @param {number} searchRadius - RGB search radius (default 40)
 * @param {number} similarityThreshold - How similar simulations should be (default 15)
 * @returns {string|null} A color that simulates similarly, or null if none found
 */
export function findConfusableColor(
	referenceHex,
	colorblindnessType,
	searchRadius = 40,
	similarityThreshold = 15
) {
	if (colorblindnessType === 'normal' || !blinder[colorblindnessType]) {
		return null;
	}

	// Get simulation of reference color
	const referenceSimulated = blinder[colorblindnessType](referenceHex);
	const referenceSimRgb = hexToRgb(referenceSimulated);
	const referenceRgb = hexToRgb(referenceHex);

	let bestCandidate = null;
	let bestDistance = Infinity;
	const maxAttempts = 200;

	// Search for colors that simulate similarly but are actually different
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		// Generate random variation within search radius
		const candidateRgb = {
			r: Math.max(0, Math.min(255, referenceRgb.r + (Math.random() - 0.5) * searchRadius * 2)),
			g: Math.max(0, Math.min(255, referenceRgb.g + (Math.random() - 0.5) * searchRadius * 2)),
			b: Math.max(0, Math.min(255, referenceRgb.b + (Math.random() - 0.5) * searchRadius * 2))
		};

		const candidateHex = rgbToHex(candidateRgb.r, candidateRgb.g, candidateRgb.b);

		// Skip if identical to reference
		if (candidateHex === referenceHex) continue;

		// Simulate how candidate appears
		const candidateSimulated = blinder[colorblindnessType](candidateHex);
		const candidateSimRgb = hexToRgb(candidateSimulated);

		// Calculate distance between simulated colors
		const simulatedDistance = rgbDistance(referenceSimRgb, candidateSimRgb);

		// Check if simulations are similar (confusable)
		if (simulatedDistance < similarityThreshold) {
			// Also check actual color distance (should be reasonably different)
			const actualDistance = rgbDistance(referenceRgb, candidateRgb);

			// We want colors that are different in reality but similar in simulation
			if (actualDistance > 10 && simulatedDistance < bestDistance) {
				bestDistance = simulatedDistance;
				bestCandidate = candidateHex;
			}
		}
	}

	return bestCandidate;
}

/**
 * Generate multiple confusable colors for a reference color
 * Useful for creating a set of test options
 *
 * @param {string} referenceHex - The reference color
 * @param {string} colorblindnessType - Type of colorblindness
 * @param {number} count - Number of confusable colors to find
 * @returns {Array<string>} Array of confusable hex colors
 */
export function findMultipleConfusableColors(referenceHex, colorblindnessType, count = 5) {
	const confusableColors = [];
	const maxAttempts = count * 10;
	let attempts = 0;

	while (confusableColors.length < count && attempts < maxAttempts) {
		attempts++;

		// Vary search parameters to get diverse results
		const searchRadius = 30 + Math.random() * 40;
		const similarityThreshold = 10 + Math.random() * 10;

		const candidate = findConfusableColor(
			referenceHex,
			colorblindnessType,
			searchRadius,
			similarityThreshold
		);

		if (candidate && !confusableColors.includes(candidate)) {
			confusableColors.push(candidate);
		}
	}

	return confusableColors;
}

/**
 * Calculate confusion probability between two colors based on simulation
 * Returns a value between 0 (clearly different) and 1 (identical when simulated)
 *
 * @param {string} color1Hex
 * @param {string} color2Hex
 * @param {string} colorblindnessType
 * @returns {number} Confusion probability (0-1)
 */
export function calculateConfusionProbability(color1Hex, color2Hex, colorblindnessType) {
	if (colorblindnessType === 'normal' || !blinder[colorblindnessType]) {
		// For normal vision, only identical colors are confusable
		return color1Hex === color2Hex ? 1.0 : 0.0;
	}

	// Simulate both colors
	const sim1 = blinder[colorblindnessType](color1Hex);
	const sim2 = blinder[colorblindnessType](color2Hex);

	// Calculate distance between simulations
	const sim1Rgb = hexToRgb(sim1);
	const sim2Rgb = hexToRgb(sim2);
	const distance = rgbDistance(sim1Rgb, sim2Rgb);

	// Convert distance to probability (using sigmoid-like function)
	// Distance 0 = probability 1.0 (identical)
	// Distance 50+ = probability ~0 (clearly different)
	const k = 0.1; // steepness parameter
	const probability = Math.exp(-k * distance);

	return probability;
}

/**
 * Check if a color pair is likely confusable based on simulation
 *
 * @param {string} color1Hex
 * @param {string} color2Hex
 * @param {string} colorblindnessType
 * @param {number} threshold - Probability threshold (default 0.7)
 * @returns {boolean} True if likely confusable
 */
export function areColorsLikelyConfusable(
	color1Hex,
	color2Hex,
	colorblindnessType,
	threshold = 0.7
) {
	const probability = calculateConfusionProbability(color1Hex, color2Hex, colorblindnessType);
	return probability >= threshold;
}

/**
 * Build a confusion matrix for a set of colors
 * Returns pairwise confusion probabilities based on simulation
 *
 * @param {Array<string>} colors - Array of hex colors
 * @param {string} colorblindnessType
 * @returns {Map<string, Map<string, number>>} Nested map of confusion probabilities
 */
export function buildConfusionMatrix(colors, colorblindnessType) {
	const matrix = new Map();

	colors.forEach((color1) => {
		const row = new Map();
		colors.forEach((color2) => {
			const probability = calculateConfusionProbability(color1, color2, colorblindnessType);
			row.set(color2, probability);
		});
		matrix.set(color1, row);
	});

	return matrix;
}
