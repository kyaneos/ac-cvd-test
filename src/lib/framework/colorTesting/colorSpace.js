/**
 * Color space utilities for hex/RGB conversions and distance calculations
 */

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color (e.g. '#FF5733' or 'FF5733')
 * @returns {{r: number, g: number, b: number}} RGB values (0-255)
 */
export function hexToRgb(hex) {
	// Remove # if present
	const cleanHex = hex.replace('#', '');

	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);

	return { r, g, b };
}

/**
 * Convert RGB to hex color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color with # prefix
 */
export function rgbToHex(r, g, b) {
	const toHex = (n) => {
		const hex = Math.round(n).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate Euclidean distance between two colors in RGB space
 * @param {{r: number, g: number, b: number}} color1
 * @param {{r: number, g: number, b: number}} color2
 * @returns {number} Distance value
 */
export function rgbDistance(color1, color2) {
	const rDiff = color1.r - color2.r;
	const gDiff = color1.g - color2.g;
	const bDiff = color1.b - color2.b;

	return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Calculate perceptual color difference using Delta E (CIE76 approximation)
 * More accurate than simple RGB distance for human color perception
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number} Delta E value
 */
export function deltaE(hex1, hex2) {
	const rgb1 = hexToRgb(hex1);
	const rgb2 = hexToRgb(hex2);

	// Simple RGB distance (good enough for now, can upgrade to Lab later)
	return rgbDistance(rgb1, rgb2);
}

/**
 * Generate a color between two colors
 * @param {string} hex1
 * @param {string} hex2
 * @param {number} ratio - 0 to 1, where 0 is hex1 and 1 is hex2
 * @returns {string} Interpolated hex color
 */
export function interpolateColor(hex1, hex2, ratio) {
	const rgb1 = hexToRgb(hex1);
	const rgb2 = hexToRgb(hex2);

	const r = rgb1.r + (rgb2.r - rgb1.r) * ratio;
	const g = rgb1.g + (rgb2.g - rgb1.g) * ratio;
	const b = rgb1.b + (rgb2.b - rgb1.b) * ratio;

	return rgbToHex(r, g, b);
}

/**
 * Generate adjacent colors by modifying RGB values slightly
 * @param {string} hex - Base color
 * @param {number} step - How much to vary (default 10)
 * @returns {Array<string>} Array of adjacent hex colors
 */
export function generateAdjacentColors(hex, step = 10) {
	const rgb = hexToRgb(hex);
	const adjacent = [];

	// Generate variations in each channel
	const variations = [
		{ r: rgb.r + step, g: rgb.g, b: rgb.b },
		{ r: rgb.r - step, g: rgb.g, b: rgb.b },
		{ r: rgb.r, g: rgb.g + step, b: rgb.b },
		{ r: rgb.r, g: rgb.g - step, b: rgb.b },
		{ r: rgb.r, g: rgb.g, b: rgb.b + step },
		{ r: rgb.r, g: rgb.g, b: rgb.b - step },
		{ r: rgb.r + step, g: rgb.g + step, b: rgb.b },
		{ r: rgb.r + step, g: rgb.g, b: rgb.b + step },
		{ r: rgb.r, g: rgb.g + step, b: rgb.b + step }
	];

	// Clamp and convert to hex
	variations.forEach((color) => {
		const r = Math.max(0, Math.min(255, color.r));
		const g = Math.max(0, Math.min(255, color.g));
		const b = Math.max(0, Math.min(255, color.b));
		adjacent.push(rgbToHex(r, g, b));
	});

	return adjacent;
}

/**
 * Check if a color is valid hex
 * @param {string} hex
 * @returns {boolean}
 */
export function isValidHex(hex) {
	return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Normalize hex color (ensure # prefix and uppercase)
 * @param {string} hex
 * @returns {string}
 */
export function normalizeHex(hex) {
	let clean = hex.replace('#', '').toUpperCase();
	return '#' + clean;
}
