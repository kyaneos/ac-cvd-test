/**
 * Find adjacent/neighboring colors in color space
 * Used for "test adjacent colors" feature
 */

import { hexToRgb, rgbToHex, rgbDistance } from './colorSpace.js';

/**
 * Generate a grid of colors around a reference color
 * @param {string} referenceHex - Center color
 * @param {number} gridSize - Number of colors in each direction (default 5)
 * @param {number} step - RGB step size (default 15)
 * @returns {Array<string>} Array of hex colors
 */
export function getAdjacentColorGrid(referenceHex, gridSize = 5, step = 15) {
	const rgb = hexToRgb(referenceHex);
	const adjacent = [];
	const halfGrid = Math.floor(gridSize / 2);

	// Generate grid in RGB space
	for (let rOffset = -halfGrid; rOffset <= halfGrid; rOffset++) {
		for (let gOffset = -halfGrid; gOffset <= halfGrid; gOffset++) {
			for (let bOffset = -halfGrid; bOffset <= halfGrid; bOffset++) {
				// Skip the center color itself
				if (rOffset === 0 && gOffset === 0 && bOffset === 0) continue;

				const r = Math.max(0, Math.min(255, rgb.r + rOffset * step));
				const g = Math.max(0, Math.min(255, rgb.g + gOffset * step));
				const b = Math.max(0, Math.min(255, rgb.b + bOffset * step));

				adjacent.push(rgbToHex(r, g, b));
			}
		}
	}

	return adjacent;
}

/**
 * Get N closest colors to a reference color
 * @param {string} referenceHex - Reference color
 * @param {number} count - Number of adjacent colors to return
 * @param {number} maxStep - Maximum RGB step size
 * @returns {Array<string>} Array of hex colors sorted by distance
 */
export function getNearestColors(referenceHex, count = 10, maxStep = 30) {
	const grid = getAdjacentColorGrid(referenceHex, 5, maxStep / 2);
	const rgb = hexToRgb(referenceHex);

	// Calculate distances and sort
	const withDistances = grid.map((hex) => ({
		hex,
		distance: rgbDistance(rgb, hexToRgb(hex))
	}));

	withDistances.sort((a, b) => a.distance - b.distance);

	return withDistances.slice(0, count).map((item) => item.hex);
}

/**
 * Get colors along each RGB axis
 * @param {string} referenceHex - Reference color
 * @param {number} steps - Number of steps in each direction
 * @param {number} stepSize - RGB step size
 * @returns {Object} Object with r, g, b arrays of colors
 */
export function getAxisColors(referenceHex, steps = 5, stepSize = 10) {
	const rgb = hexToRgb(referenceHex);

	const axes = {
		r: [],
		g: [],
		b: []
	};

	// Red axis
	for (let i = -steps; i <= steps; i++) {
		if (i === 0) continue;
		const r = Math.max(0, Math.min(255, rgb.r + i * stepSize));
		axes.r.push(rgbToHex(r, rgb.g, rgb.b));
	}

	// Green axis
	for (let i = -steps; i <= steps; i++) {
		if (i === 0) continue;
		const g = Math.max(0, Math.min(255, rgb.g + i * stepSize));
		axes.g.push(rgbToHex(rgb.r, g, rgb.b));
	}

	// Blue axis
	for (let i = -steps; i <= steps; i++) {
		if (i === 0) continue;
		const b = Math.max(0, Math.min(255, rgb.b + i * stepSize));
		axes.b.push(rgbToHex(rgb.r, rgb.g, b));
	}

	return axes;
}

/**
 * Generate colors that are perceptually similar to reference
 * Good for finding confusion points
 * @param {string} referenceHex
 * @param {number} count
 * @param {number} similarityThreshold - Max distance (default 20)
 * @returns {Array<string>} Array of similar hex colors
 */
export function getSimilarColors(referenceHex, count = 20, similarityThreshold = 20) {
	const rgb = hexToRgb(referenceHex);
	const similar = [];

	// Generate random colors within threshold
	let attempts = 0;
	const maxAttempts = count * 50; // Prevent infinite loop

	while (similar.length < count && attempts < maxAttempts) {
		attempts++;

		const r = Math.max(0, Math.min(255, rgb.r + (Math.random() - 0.5) * similarityThreshold * 2));
		const g = Math.max(0, Math.min(255, rgb.g + (Math.random() - 0.5) * similarityThreshold * 2));
		const b = Math.max(0, Math.min(255, rgb.b + (Math.random() - 0.5) * similarityThreshold * 2));

		const candidateRgb = { r, g, b };
		const distance = rgbDistance(rgb, candidateRgb);

		if (distance > 0 && distance <= similarityThreshold) {
			const hex = rgbToHex(r, g, b);
			if (!similar.includes(hex)) {
				similar.push(hex);
			}
		}
	}

	return similar;
}
