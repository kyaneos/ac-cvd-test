/**
 * Color vision simulation utilities for deuteranomaly
 * Deuteranomaly affects the green cones in the eye, making it harder to distinguish red-green colors
 */

/**
 * Convert RGB to LMS color space
 * LMS represents the response of the three types of cones in the human eye
 */
function rgbToLms(r, g, b) {
	// Normalize RGB values
	r = r / 255;
	g = g / 255;
	b = b / 255;

	// Apply gamma correction
	r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
	g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
	b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

	// Convert to LMS using Hunt-Pointer-Estevez matrix
	const l = 0.31399 * r + 0.63951 * g + 0.04649 * b;
	const m = 0.15537 * r + 0.75789 * g + 0.0867 * b;
	const s = 0.01775 * r + 0.10944 * g + 0.87256 * b;

	return [l, m, s];
}

/**
 * Convert LMS back to RGB color space
 */
function lmsToRgb(l, m, s) {
	// Inverse Hunt-Pointer-Estevez matrix
	let r = 5.47221 * l - 4.64196 * m + 0.16963 * s;
	let g = -1.12524 * l + 2.29317 * m - 0.16793 * s;
	let b = 0.0298 * l - 0.19318 * m + 1.16364 * s;

	// Reverse gamma correction
	r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
	g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
	b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

	// Clamp and denormalize
	r = Math.max(0, Math.min(1, r)) * 255;
	g = Math.max(0, Math.min(1, g)) * 255;
	b = Math.max(0, Math.min(1, b)) * 255;

	return [Math.round(r), Math.round(g), Math.round(b)];
}

/**
 * Simulate color vision deficiency for any type
 * @param {string} hexColor - Hex color string
 * @param {string} cvdType - Type of CVD (deuteranomaly, protanomaly, tritanomaly, etc.)
 * @param {number} severity - Severity of the condition (0-1, where 1 is complete dichromacy)
 * @returns {string} Simulated hex color
 */
export function simulateCVD(hexColor, cvdType, severity = 0.6) {
	// Parse hex color
	const r = parseInt(hexColor.slice(1, 3), 16);
	const g = parseInt(hexColor.slice(3, 5), 16);
	const b = parseInt(hexColor.slice(5, 7), 16);

	// Convert to LMS
	const [l, m, s] = rgbToLms(r, g, b);

	let simulatedL, simulatedM, simulatedS;

	// Apply CVD-specific simulation
	switch (cvdType) {
		case 'protanomaly':
		case 'protanopia':
			// Protanomaly: affects L (long wavelength) cones
			// L cone response shifts toward M cone
			simulatedL = (1 - severity) * l + severity * m;
			simulatedM = m;
			simulatedS = s;
			break;

		case 'deuteranomaly':
		case 'deuteranopia':
			// Deuteranomaly: affects M (medium wavelength) cones
			// M cone response shifts toward L cone
			simulatedL = l;
			simulatedM = (1 - severity) * m + severity * l;
			simulatedS = s;
			break;

		case 'tritanomaly':
		case 'tritanopia':
			// Tritanomaly: affects S (short wavelength) cones
			// S cone response shifts toward M cone (simplified)
			simulatedL = l;
			simulatedM = m;
			simulatedS = (1 - severity) * s + severity * (m * 0.5);
			break;

		case 'achromatomaly': {
			// Achromatomaly: partial loss of all color vision
			// Blend toward grayscale based on severity
			const gray = l * 0.299 + m * 0.587 + s * 0.114;
			simulatedL = (1 - severity) * l + severity * gray;
			simulatedM = (1 - severity) * m + severity * gray;
			simulatedS = (1 - severity) * s + severity * gray;
			break;
		}

		case 'achromatopsia': {
			// Achromatopsia: complete loss of color vision (grayscale)
			const grayValue = l * 0.299 + m * 0.587 + s * 0.114;
			simulatedL = grayValue;
			simulatedM = grayValue;
			simulatedS = grayValue;
			break;
		}

		case 'normal':
		default:
			// No simulation needed
			simulatedL = l;
			simulatedM = m;
			simulatedS = s;
			break;
	}

	// Convert back to RGB
	const [simR, simG, simB] = lmsToRgb(simulatedL, simulatedM, simulatedS);

	// Convert to hex
	const toHex = (n) => n.toString(16).padStart(2, '0');
	return `#${toHex(simR)}${toHex(simG)}${toHex(simB)}`;
}

/**
 * Simulate deuteranomaly (red-green color blindness) - legacy function
 * @param {string} hexColor - Hex color string
 * @param {number} severity - Severity of the condition (0-1, where 1 is complete deuteranopia)
 * @returns {string} Simulated hex color
 */
export function simulateDeuteranomaly(hexColor, severity = 0.6) {
	return simulateCVD(hexColor, 'deuteranomaly', severity);
}

/**
 * Calculate color difference using Delta E CIE 2000
 * This gives us a perceptual difference between colors
 */
export function calculateColorDifference(color1, color2) {
	// Simplified color difference calculation
	const r1 = parseInt(color1.slice(1, 3), 16);
	const g1 = parseInt(color1.slice(3, 5), 16);
	const b1 = parseInt(color1.slice(5, 7), 16);

	const r2 = parseInt(color2.slice(1, 3), 16);
	const g2 = parseInt(color2.slice(3, 5), 16);
	const b2 = parseInt(color2.slice(5, 7), 16);

	// Euclidean distance in RGB space (simplified)
	const dr = r1 - r2;
	const dg = g1 - g2;
	const db = b1 - b2;

	return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Generate a color confusion matrix for deuteranomaly
 */
export function generateConfusionColors() {
	return {
		hardToDistinguish: [
			{ normal: '#FF0000', confused: '#00FF00', label: 'Red vs Green' },
			{ normal: '#FF6B6B', confused: '#6BFF6B', label: 'Light Red vs Light Green' },
			{ normal: '#8B4513', confused: '#556B2F', label: 'Brown vs Dark Green' },
			{ normal: '#FF69B4', confused: '#98FB98', label: 'Pink vs Pale Green' },
			{ normal: '#DC143C', confused: '#228B22', label: 'Crimson vs Forest Green' }
		],
		easierToDistinguish: [
			{ color1: '#0000FF', color2: '#FFFF00', label: 'Blue vs Yellow' },
			{ color1: '#FF00FF', color2: '#00FFFF', label: 'Magenta vs Cyan' },
			{ color1: '#000000', color2: '#FFFFFF', label: 'Black vs White' }
		]
	};
}

/**
 * Analyze test results to determine confusion patterns
 */
export function analyzeResults(testResults) {
	const categories = {};

	testResults.forEach((result) => {
		if (!categories[result.category]) {
			categories[result.category] = {
				total: 0,
				correct: 0,
				accuracy: 0
			};
		}

		categories[result.category].total++;
		if (result.correct) {
			categories[result.category].correct++;
		}
	});

	// Calculate accuracy for each category
	Object.keys(categories).forEach((cat) => {
		categories[cat].accuracy = (categories[cat].correct / categories[cat].total) * 100;
	});

	return {
		overall: {
			total: testResults.length,
			correct: testResults.filter((r) => r.correct).length,
			accuracy: (testResults.filter((r) => r.correct).length / testResults.length) * 100
		},
		byCategory: categories,
		confusionAreas: identifyConfusionAreas(categories)
	};
}

/**
 * Identify specific areas of color confusion
 */
function identifyConfusionAreas(categories) {
	const areas = [];

	Object.entries(categories).forEach(([category, data]) => {
		if (data.accuracy < 50) {
			areas.push({
				category,
				severity: 'High',
				accuracy: data.accuracy,
				recommendation: getRecommendation(category)
			});
		} else if (data.accuracy < 75) {
			areas.push({
				category,
				severity: 'Moderate',
				accuracy: data.accuracy,
				recommendation: getRecommendation(category)
			});
		}
	});

	return areas;
}

/**
 * Get recommendations based on confusion areas
 */
function getRecommendation(category) {
	const recommendations = {
		'red-green': 'Consider using blue/yellow distinctions or patterns in addition to color',
		'red-orange': 'Use brightness/darkness variations to enhance distinction',
		green: 'Add texture or shape cues when green is important for identification',
		'red-pink': 'Use cooler colors (blues/purples) for better contrast',
		'orange-pink': 'Consider using symbols or labels for critical distinctions'
	};

	return recommendations[category] || 'Use multiple visual cues beyond color alone';
}
