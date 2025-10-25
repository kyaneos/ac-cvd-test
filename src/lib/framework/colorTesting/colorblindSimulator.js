/**
 * Colorblind simulation utilities
 * Uses the color-blind npm package (https://github.com/skratchdot/color-blind)
 * Based on daltonize algorithms from mudcu.be
 *
 * This helps generate realistic test colors by simulating how colors
 * appear to people with different types of colorblindness
 */

import blinder from 'color-blind';
import { hexToRgb, rgbToHex } from './colorSpace.js';

/**
 * Simulate how a color appears to someone with colorblindness
 * @param {string} hex - Original hex color
 * @param {string} type - Colorblindness type
 * @returns {string} Simulated hex color
 */
export function simulateColorblindness(hex, type) {
	if (type === 'normal' || !blinder[type]) {
		return hex;
	}

	// Use the color-blind library
	return blinder[type](hex);
}

/**
 * Check if two colors are confusable for a given colorblindness type
 * @param {string} hex1
 * @param {string} hex2
 * @param {string} type - Colorblindness type
 * @param {number} threshold - Similarity threshold (default 10)
 * @returns {boolean} True if colors are likely confusable
 */
export function areColorsConfusable(hex1, hex2, type, threshold = 10) {
	const sim1 = simulateColorblindness(hex1, type);
	const sim2 = simulateColorblindness(hex2, type);

	const rgb1 = hexToRgb(sim1);
	const rgb2 = hexToRgb(sim2);

	// Calculate Euclidean distance
	const distance = Math.sqrt(
		Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2)
	);

	return distance < threshold;
}

/**
 * Generate a color pair that should be confusable for the given type
 * Useful for creating realistic test scenarios
 * @param {string} baseColor - Starting color
 * @param {string} type - Colorblindness type
 * @returns {{original: string, confusable: string}} Color pair
 */
export function generateConfusablePair(baseColor, type) {
	const rgb = hexToRgb(baseColor);

	// Try different variations until we find one that's confusable when simulated
	for (let attempts = 0; attempts < 100; attempts++) {
		const variation = {
			r: Math.max(0, Math.min(255, rgb.r + (Math.random() - 0.5) * 60)),
			g: Math.max(0, Math.min(255, rgb.g + (Math.random() - 0.5) * 60)),
			b: Math.max(0, Math.min(255, rgb.b + (Math.random() - 0.5) * 60))
		};

		const variantHex = rgbToHex(variation.r, variation.g, variation.b);

		// Check if they're confusable but different
		if (variantHex !== baseColor && areColorsConfusable(baseColor, variantHex, type, 15)) {
			return {
				original: baseColor,
				confusable: variantHex
			};
		}
	}

	// Fallback if no confusable pair found
	return {
		original: baseColor,
		confusable: baseColor
	};
}

/**
 * Get all supported colorblindness types
 * @returns {Array<string>}
 */
export function getSupportedTypes() {
	return [
		'protanomaly',
		'protanopia',
		'deuteranomaly',
		'deuteranopia',
		'tritanomaly',
		'tritanopia',
		'achromatomaly',
		'achromatopsia'
	];
}
