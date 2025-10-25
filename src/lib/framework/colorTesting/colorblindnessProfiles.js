/**
 * Colorblindness profiles with default testing focus areas
 * Defines which color regions are most important to test for each type
 */

export const colorblindnessTypes = [
	{ value: 'deuteranomaly', label: 'Deuteranomaly (Green-Weak)' },
	{ value: 'protanomaly', label: 'Protanomaly (Red-Weak)' },
	{ value: 'tritanomaly', label: 'Tritanomaly (Blue-Weak)' },
	{ value: 'deuteranopia', label: 'Deuteranopia (No Green)' },
	{ value: 'protanopia', label: 'Protanopia (No Red)' },
	{ value: 'tritanopia', label: 'Tritanopia (No Blue)' },
	{ value: 'achromatopsia', label: 'Achromatopsia (No Color)' },
	{ value: 'achromatomaly', label: 'Achromatomaly (Partial Monochromacy)' },
	{ value: 'normal', label: 'Normal Vision' }
];

/**
 * Testing profiles for each colorblindness type
 * Defines priority color ranges to test
 */
export const testingProfiles = {
	deuteranomaly: {
		name: 'Deuteranomaly',
		description: 'Green-weak color vision',
		priorityRanges: [
			{ name: 'Mid-reds and greens', colors: ['#FF0000', '#00FF00', '#808000', '#FF6600'] },
			{ name: 'Blue-greens and grays', colors: ['#008080', '#808080', '#00FFFF', '#666666'] },
			{ name: 'Pinks and light grays', colors: ['#FFC0CB', '#FFB6C1', '#D3D3D3', '#C0C0C0'] },
			{ name: 'Purples and blues', colors: ['#800080', '#0000FF', '#4B0082', '#8A2BE2'] },
			{ name: 'Browns, oranges, greens', colors: ['#A52A2A', '#FF8C00', '#228B22', '#8B4513'] }
		]
	},
	protanomaly: {
		name: 'Protanomaly',
		description: 'Red-weak color vision',
		priorityRanges: [
			{ name: 'Reds and dark greens', colors: ['#FF0000', '#8B0000', '#006400', '#228B22'] },
			{ name: 'Orange and brown', colors: ['#FF8C00', '#FFA500', '#A52A2A', '#8B4513'] },
			{ name: 'Red-purple and blue', colors: ['#C71585', '#8B008B', '#0000FF', '#4169E1'] },
			{ name: 'Pink and light gray', colors: ['#FFC0CB', '#FFB6C1', '#D3D3D3', '#DCDCDC'] },
			{ name: 'Yellow-green and cyan', colors: ['#9ACD32', '#ADFF2F', '#00FFFF', '#00CED1'] }
		]
	},
	tritanomaly: {
		name: 'Tritanomaly',
		description: 'Blue-weak color vision',
		priorityRanges: [
			{ name: 'Blues and greens', colors: ['#0000FF', '#00FF00', '#008080', '#00FFFF'] },
			{ name: 'Yellow and violet', colors: ['#FFFF00', '#FFD700', '#8A2BE2', '#9400D3'] },
			{ name: 'Blue-green and gray', colors: ['#20B2AA', '#48D1CC', '#808080', '#A9A9A9'] },
			{ name: 'Orange and pink', colors: ['#FF8C00', '#FFA500', '#FFC0CB', '#FF69B4'] },
			{ name: 'Light blue and white', colors: ['#87CEEB', '#ADD8E6', '#F0F0F0', '#FFFFFF'] }
		]
	},
	deuteranopia: {
		name: 'Deuteranopia',
		description: 'No green perception',
		priorityRanges: [
			{ name: 'All reds and greens', colors: ['#FF0000', '#00FF00', '#FFFF00', '#FF6600'] },
			{ name: 'Browns and greens', colors: ['#A52A2A', '#8B4513', '#228B22', '#006400'] },
			{ name: 'Purples and blues', colors: ['#800080', '#0000FF', '#8A2BE2', '#4169E1'] },
			{ name: 'Gray spectrum', colors: ['#404040', '#808080', '#C0C0C0', '#E0E0E0'] }
		]
	},
	protanopia: {
		name: 'Protanopia',
		description: 'No red perception',
		priorityRanges: [
			{ name: 'All reds', colors: ['#FF0000', '#8B0000', '#DC143C', '#B22222'] },
			{ name: 'Reds and greens', colors: ['#FF0000', '#00FF00', '#808000', '#FF8C00'] },
			{ name: 'Orange and yellow', colors: ['#FF8C00', '#FFA500', '#FFFF00', '#FFD700'] },
			{ name: 'Pink and gray', colors: ['#FFC0CB', '#FFB6C1', '#D3D3D3', '#DCDCDC'] }
		]
	},
	tritanopia: {
		name: 'Tritanopia',
		description: 'No blue perception',
		priorityRanges: [
			{ name: 'All blues', colors: ['#0000FF', '#0000CD', '#4169E1', '#1E90FF'] },
			{ name: 'Blues and yellows', colors: ['#0000FF', '#FFFF00', '#00FFFF', '#FFD700'] },
			{ name: 'Violets and greens', colors: ['#8A2BE2', '#9400D3', '#00FF00', '#32CD32'] },
			{ name: 'Cyan and pink', colors: ['#00FFFF', '#00CED1', '#FFC0CB', '#FF69B4'] }
		]
	},
	achromatopsia: {
		name: 'Achromatopsia',
		description: 'No color perception',
		priorityRanges: [
			{ name: 'Full grayscale', colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'] },
			{ name: 'Brightness levels', colors: ['#1A1A1A', '#333333', '#666666', '#999999', '#CCCCCC'] }
		]
	},
	achromatomaly: {
		name: 'Achromatomaly',
		description: 'Partial monochromacy - reduced color perception',
		priorityRanges: [
			{
				name: 'Saturated vs desaturated reds',
				colors: ['#FF0000', '#8B0000', '#CD5C5C', '#F08080']
			},
			{
				name: 'Saturated vs desaturated greens',
				colors: ['#00FF00', '#228B22', '#90EE90', '#98FB98']
			},
			{
				name: 'Saturated vs desaturated blues',
				colors: ['#0000FF', '#00008B', '#87CEEB', '#ADD8E6']
			},
			{
				name: 'High vs medium saturation',
				colors: ['#FF1493', '#DB7093', '#FFA500', '#FFDAB9']
			},
			{
				name: 'Brightness levels',
				colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF']
			}
		]
	},
	normal: {
		name: 'Normal Vision',
		description: 'Full color perception',
		priorityRanges: [
			{ name: 'Primary colors', colors: ['#FF0000', '#00FF00', '#0000FF'] },
			{ name: 'Secondary colors', colors: ['#FFFF00', '#FF00FF', '#00FFFF'] },
			{ name: 'Earth tones', colors: ['#A52A2A', '#8B4513', '#D2691E', '#CD853F'] },
			{ name: 'Pastels', colors: ['#FFB6C1', '#E0BBE4', '#B4E7CE', '#FFF4E6'] }
		]
	}
};

/**
 * Get testing profile for a colorblindness type
 * @param {string} type - Colorblindness type
 * @returns {Object} Testing profile
 */
export function getTestingProfile(type) {
	return testingProfiles[type] || testingProfiles.normal;
}

/**
 * Get all priority colors for a given type (flattened)
 * @param {string} type - Colorblindness type
 * @returns {Array<string>} Array of hex colors
 */
export function getPriorityColors(type) {
	const profile = getTestingProfile(type);
	return profile.priorityRanges.flatMap((range) => range.colors);
}
