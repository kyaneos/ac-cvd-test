/**
 * Severity Calibration Utility
 * Multi-stage calibration to test all CVD pain points
 */

import blinder from 'color-blind';
import { hexToRgb, rgbToHex } from './colorSpace.js';
import { getTestingProfile } from './colorblindnessProfiles.js';

/**
 * Blend a color between original and fully-simulated based on severity
 * @param {string} originalHex - Original hex color
 * @param {string} simulatedHex - Fully simulated hex color
 * @param {number} severity - Severity level (0.0-1.0)
 * @returns {string} Blended hex color
 */
export function blendBySeverity(originalHex, simulatedHex, severity) {
	const orig = hexToRgb(originalHex);
	const sim = hexToRgb(simulatedHex);

	return rgbToHex(
		Math.round(orig.r * (1 - severity) + sim.r * severity),
		Math.round(orig.g * (1 - severity) + sim.g * severity),
		Math.round(orig.b * (1 - severity) + sim.b * severity)
	);
}

/**
 * Generate multi-stage calibration for all pain points of a CVD type
 * @param {string} cvdType - Type of CVD
 * @returns {Array} Array of calibration stages
 */
export function generateCalibrationStages(cvdType) {
	const profile = getTestingProfile(cvdType);

	if (!profile || !profile.priorityRanges) {
		// Fallback for types without priority ranges
		return [
			{
				referenceColor: '#FF0000',
				fullySimulated: blinder[cvdType]?.('#FF0000') || '#00FF00',
				stageName: 'Default',
				label: 'Color Discrimination'
			}
		];
	}

	// Map each priority range to a calibration stage
	return profile.priorityRanges.map((range) => {
		// Pick first two colors from the range as test pair
		const referenceColor = range.colors[0];
		const fullySimulated = blinder[cvdType]?.(referenceColor) || range.colors[1];

		return {
			referenceColor,
			fullySimulated,
			stageName: range.name,
			label: getColorLabel(referenceColor)
		};
	});
}

/**
 * Calculate overall severity from multi-stage results
 * @param {Array} stageResults - Array of {stageName, severity} objects
 * @returns {number} Average severity across all stages
 */
export function calculateOverallSeverity(stageResults) {
	if (!stageResults || stageResults.length === 0) {
		return 0.6; // Default fallback
	}

	const sum = stageResults.reduce((total, result) => total + result.severity, 0);
	return sum / stageResults.length;
}

/**
 * Get human-readable label for a hex color
 * @param {string} hex - Hex color code
 * @returns {string} Color label
 */
export function getColorLabel(hex) {
	const rgb = hexToRgb(hex);
	const { r, g, b } = rgb;

	// Simple color name detection
	if (r > 200 && g < 100 && b < 100) return 'Red';
	if (g > 200 && r < 100 && b < 100) return 'Green';
	if (b > 200 && r < 100 && g < 100) return 'Blue';
	if (r > 200 && g > 200 && b < 100) return 'Yellow';
	if (r > 200 && b > 200 && g < 100) return 'Magenta';
	if (g > 200 && b > 200 && r < 100) return 'Cyan';
	if (r > 200 && g > 100 && g < 200 && b < 100) return 'Orange';
	if (r > 100 && g < 100 && b > 100) return 'Purple';
	if (r > 100 && g > 50 && g < 100 && b < 50) return 'Brown';
	if (r < 50 && g < 50 && b < 50) return 'Black';
	if (r > 200 && g > 200 && b > 200) return 'White';
	if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'Gray';

	return 'Color';
}

/**
 * Generate 5 calibration trials with graduated difficulty
 * @param {string} cvdType - Type of CVD
 * @returns {Array} Array of calibration trials
 * @deprecated Use generateCalibrationStages() for multi-stage calibration
 */
export function generateCalibrationTrials(cvdType) {
	// Reference colors that are highly confusable for each CVD type
	const references = {
		deuteranomaly: '#FF0000', // Red (confuses with green)
		protanomaly: '#FF0000', // Red (confuses with brown/green)
		tritanomaly: '#0000FF', // Blue (confuses with green)
		deuteranopia: '#FF0000',
		protanopia: '#FF0000',
		tritanopia: '#0000FF',
		achromatomaly: '#FF0000', // Test saturation
		achromatopsia: '#808080', // Test brightness only
		normal: '#FF0000' // Shouldn't matter for normal vision
	};

	const comparisonColors = {
		deuteranomaly: '#00FF00', // Green
		protanomaly: '#8B4513', // SaddleBrown
		tritanomaly: '#00FF00', // Green
		deuteranopia: '#00FF00',
		protanopia: '#8B4513',
		tritanopia: '#00FF00',
		achromatomaly: '#CC6666', // Desaturated red
		achromatopsia: '#999999', // Similar brightness
		normal: '#00FF00'
	};

	const ref = references[cvdType] || references.deuteranomaly;
	const comparison = comparisonColors[cvdType] || comparisonColors.deuteranomaly;

	// For normal color vision simulation, use the comparison color
	// For CVD, simulate the reference color
	const simFull = cvdType === 'normal' ? comparison : blinder[cvdType]?.(ref) || ref;

	// Generate 5 trials with increasing severity
	return [0.2, 0.4, 0.6, 0.8, 1.0].map((severity) => ({
		reference: ref,
		comparison: blendBySeverity(ref, simFull, severity),
		severity,
		cvdType
	}));
}

/**
 * Estimate user's severity based on calibration responses
 * @param {Array} results - Array of {severity, userSaidSame} objects
 * @returns {number} Estimated severity (0.0-1.0)
 */
export function estimateSeverity(results) {
	// Find the first severity level where user said "same"
	const sorted = results.sort((a, b) => a.severity - b.severity);
	const threshold = sorted.find((r) => r.userSaidSame);

	if (!threshold) {
		// User could distinguish all levels - very mild CVD
		return 0.1;
	}

	if (threshold.severity <= 0.2) {
		// User confused even at 20% - very severe CVD
		return 0.9;
	}

	// Return the threshold severity as the estimate
	return threshold.severity;
}
