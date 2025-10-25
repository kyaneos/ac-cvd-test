/**
 * Adaptive Bayesian Color Vision Assessment System
 *
 * This system uses Bayesian inference to adaptively assess color vision deficiencies,
 * specifically targeting deuteranomaly (red-green colorblindness). It dynamically
 * generates color pairs based on user responses to efficiently map color confusion patterns.
 */

class BayesianColorAssessment {
	constructor() {
		// Core parameters for deuteranomaly assessment
		this.confusionMatrix = new Map(); // Tracks which color pairs are confused
		this.responseHistory = [];
		this.confidenceThreshold = 0.85; // Stop test when we're 85% confident
		this.minQuestions = 8; // Minimum questions before considering stopping
		this.maxQuestions = 25; // Maximum questions to prevent endless testing
		this.severityEstimate = 0.5; // Current estimated severity (0=none, 1=severe)
		this.confidenceLevel = 0.0; // How confident we are in our assessment

		// Color confusion patterns for deuteranomaly + comprehensive color mapping
		this.confusionAxes = [
			{ name: 'red-green-primary', weight: 3.0 },
			{ name: 'red-brown', weight: 2.5 },
			{ name: 'green-yellow', weight: 2.0 },
			{ name: 'orange-green', weight: 1.8 },
			{ name: 'brown-variations', weight: 2.2 },
			{ name: 'pink-gray', weight: 1.5 },
			{ name: 'blue-purple', weight: 1.2 },
			{ name: 'yellow-orange', weight: 1.4 },
			{ name: 'dark-colors', weight: 1.3 },
			{ name: 'pastel-colors', weight: 1.1 },
			{ name: 'control', weight: 0.8 }
		];

		// Exploration mode settings
		this.explorationMode = false;
		this.explorationWeight = 2.0; // Boost for unexplored regions

		// Prior belief distribution (beta distribution parameters)
		this.priorAlpha = 2; // Prior successes
		this.priorBeta = 2; // Prior failures

		// Current posterior belief
		this.posteriorAlpha = this.priorAlpha;
		this.posteriorBeta = this.priorBeta;

		this.initializeColorSpace();
	}

	initializeColorSpace() {
		// Define comprehensive color space for deuteranomaly assessment + general color mapping
		this.colorPairs = [
			// High-confusion pairs for deuteranomaly
			{
				reference: '#FF0000',
				options: ['#8FBC8F', '#FF0000'],
				correct: 1,
				difficulty: 5,
				axis: 'red-green-primary'
			},
			{
				reference: '#00FF00',
				options: ['#FF6B6B', '#00FF00'],
				correct: 1,
				difficulty: 5,
				axis: 'red-green-primary'
			},
			{
				reference: '#DC143C',
				options: ['#14DC3C', '#DC143C'],
				correct: 1,
				difficulty: 4,
				axis: 'red-green-primary'
			},
			{
				reference: '#32CD32',
				options: ['#CD3232', '#32CD32'],
				correct: 1,
				difficulty: 4,
				axis: 'red-green-primary'
			},

			// Red-brown confusions
			{
				reference: '#8B4513',
				options: ['#228B22', '#8B4513'],
				correct: 1,
				difficulty: 4,
				axis: 'red-brown'
			},
			{
				reference: '#A0522D',
				options: ['#52A02D', '#A0522D'],
				correct: 1,
				difficulty: 3,
				axis: 'red-brown'
			},
			{
				reference: '#CD853F',
				options: ['#853FCD', '#CD853F'],
				correct: 1,
				difficulty: 3,
				axis: 'red-brown'
			},

			// Brown variations (comprehensive brown mapping)
			{
				reference: '#8B4513',
				options: ['#4B4B8D', '#8B4513'],
				correct: 1,
				difficulty: 3,
				axis: 'brown-variations'
			},
			{
				reference: '#D2691E',
				options: ['#691ED2', '#D2691E'],
				correct: 1,
				difficulty: 3,
				axis: 'brown-variations'
			},
			{
				reference: '#A0522D',
				options: ['#522DA0', '#A0522D'],
				correct: 1,
				difficulty: 4,
				axis: 'brown-variations'
			},
			{
				reference: '#8B4513',
				options: ['#13458B', '#8B4513'],
				correct: 1,
				difficulty: 4,
				axis: 'brown-variations'
			},
			{
				reference: '#CD853F',
				options: ['#3F85CD', '#CD853F'],
				correct: 1,
				difficulty: 2,
				axis: 'brown-variations'
			},

			// Green-yellow confusions
			{
				reference: '#ADFF2F',
				options: ['#FF2FAD', '#ADFF2F'],
				correct: 1,
				difficulty: 4,
				axis: 'green-yellow'
			},
			{
				reference: '#9ACD32',
				options: ['#CD329A', '#9ACD32'],
				correct: 1,
				difficulty: 3,
				axis: 'green-yellow'
			},
			{
				reference: '#32CD32',
				options: ['#CD32CD', '#32CD32'],
				correct: 1,
				difficulty: 3,
				axis: 'green-yellow'
			},

			// Orange-green confusions
			{
				reference: '#FF4500',
				options: ['#45FF00', '#FF4500'],
				correct: 1,
				difficulty: 3,
				axis: 'orange-green'
			},
			{
				reference: '#FF8C00',
				options: ['#8CFF00', '#FF8C00'],
				correct: 1,
				difficulty: 2,
				axis: 'orange-green'
			},

			// Yellow-orange spectrum
			{
				reference: '#FFD700',
				options: ['#D700FF', '#FFD700'],
				correct: 1,
				difficulty: 2,
				axis: 'yellow-orange'
			},
			{
				reference: '#FFA500',
				options: ['#A500FF', '#FFA500'],
				correct: 1,
				difficulty: 2,
				axis: 'yellow-orange'
			},
			{
				reference: '#FF8C00',
				options: ['#8C00FF', '#FF8C00'],
				correct: 1,
				difficulty: 3,
				axis: 'yellow-orange'
			},

			// Pink-gray spectrum
			{
				reference: '#FFC0CB',
				options: ['#C0C0C0', '#FFC0CB'],
				correct: 1,
				difficulty: 3,
				axis: 'pink-gray'
			},
			{
				reference: '#FFB6C1',
				options: ['#B6C1FF', '#FFB6C1'],
				correct: 1,
				difficulty: 2,
				axis: 'pink-gray'
			},

			// Blue-purple spectrum
			{
				reference: '#0000FF',
				options: ['#8A2BE2', '#0000FF'],
				correct: 1,
				difficulty: 2,
				axis: 'blue-purple'
			},
			{
				reference: '#4169E1',
				options: ['#E14169', '#4169E1'],
				correct: 1,
				difficulty: 2,
				axis: 'blue-purple'
			},

			// Dark colors (challenging for everyone)
			{
				reference: '#2F4F4F',
				options: ['#4F2F4F', '#2F4F4F'],
				correct: 1,
				difficulty: 4,
				axis: 'dark-colors'
			},
			{
				reference: '#556B2F',
				options: ['#6B2F55', '#556B2F'],
				correct: 1,
				difficulty: 4,
				axis: 'dark-colors'
			},
			{
				reference: '#800000',
				options: ['#008000', '#800000'],
				correct: 1,
				difficulty: 5,
				axis: 'dark-colors'
			},

			// Pastel colors
			{
				reference: '#F0E68C',
				options: ['#E68CF0', '#F0E68C'],
				correct: 1,
				difficulty: 2,
				axis: 'pastel-colors'
			},
			{
				reference: '#DDA0DD',
				options: ['#A0DDDD', '#DDA0DD'],
				correct: 1,
				difficulty: 2,
				axis: 'pastel-colors'
			},
			{
				reference: '#F8BBD9',
				options: ['#BBF8D9', '#F8BBD9'],
				correct: 1,
				difficulty: 3,
				axis: 'pastel-colors'
			},

			// Control pairs (should be easy for everyone)
			{
				reference: '#0000FF',
				options: ['#FFFF00', '#0000FF'],
				correct: 1,
				difficulty: 1,
				axis: 'control'
			},
			{
				reference: '#FFFFFF',
				options: ['#000000', '#FFFFFF'],
				correct: 1,
				difficulty: 1,
				axis: 'control'
			},
			{
				reference: '#FF00FF',
				options: ['#00FFFF', '#FF00FF'],
				correct: 1,
				difficulty: 1,
				axis: 'control'
			}
		];

		// Initialize confusion matrix
		this.confusionAxes.forEach((axis) => {
			this.confusionMatrix.set(axis.name, {
				correct: 0,
				incorrect: 0,
				weight: axis.weight,
				posteriorAlpha: this.priorAlpha,
				posteriorBeta: this.priorBeta
			});
		});
	}

	/**
	 * Toggle exploration mode for comprehensive color mapping
	 */
	toggleExplorationMode() {
		this.explorationMode = !this.explorationMode;
		console.log(`BayesianColorAssessment: Exploration mode ${this.explorationMode ? 'ON' : 'OFF'}`);
	}

	/**
	 * Select the next optimal color pair using Bayesian optimization or exploration
	 * In exploration mode: prioritizes unexplored regions for comprehensive mapping
	 * In focused mode: prioritizes pairs that will give us the most information about deuteranomaly
	 */
	selectNextColorPair() {
		console.log(
			`BayesianColorAssessment: Selecting next color pair (Exploration: ${this.explorationMode})`
		);

		if (this.explorationMode) {
			return this.selectExplorationPair();
		} else {
			return this.selectBayesianOptimalPair();
		}
	}

	/**
	 * Select pair for exploration mode - focuses on unexplored regions
	 */
	selectExplorationPair() {
		// Find least explored axes
		let leastExplored = [];
		let minObservations = Infinity;

		for (const [axisName, data] of this.confusionMatrix) {
			const observations = data.correct + data.incorrect;
			if (observations < minObservations) {
				minObservations = observations;
				leastExplored = [axisName];
			} else if (observations === minObservations) {
				leastExplored.push(axisName);
			}
		}

		// Select random pair from least explored axes
		const targetAxis = leastExplored[Math.floor(Math.random() * leastExplored.length)];
		const candidatePairs = this.colorPairs.filter((pair) => pair.axis === targetAxis);
		const selectedPair = candidatePairs[Math.floor(Math.random() * candidatePairs.length)];

		console.log(`Exploration mode: Selected ${targetAxis} with ${minObservations} observations`);
		return selectedPair;
	}

	/**
	 * Select Bayesian optimal pair for targeted assessment
	 */
	selectBayesianOptimalPair() {
		// Calculate information gain for each possible color pair
		let bestPair = null;
		let maxInformationGain = -1;

		for (const pair of this.colorPairs) {
			const informationGain = this.calculateInformationGain(pair);

			if (informationGain > maxInformationGain) {
				maxInformationGain = informationGain;
				bestPair = pair;
			}
		}

		console.log(
			`Bayesian mode: Selected ${bestPair.axis} with gain: ${maxInformationGain.toFixed(3)}`
		);
		return bestPair;
	}

	/**
	 * Calculate expected information gain for a color pair
	 * Uses entropy reduction to measure how much we'd learn
	 */
	calculateInformationGain(pair) {
		const axisData = this.confusionMatrix.get(pair.axis);
		if (!axisData) return 0;

		// Current uncertainty (entropy) for this axis
		const currentEntropy = this.calculateEntropy(axisData.posteriorAlpha, axisData.posteriorBeta);

		// Expected entropy after observing correct response
		const correctAlpha = axisData.posteriorAlpha + 1;
		const correctBeta = axisData.posteriorBeta;
		const correctEntropy = this.calculateEntropy(correctAlpha, correctBeta);

		// Expected entropy after observing incorrect response
		const incorrectAlpha = axisData.posteriorAlpha;
		const incorrectBeta = axisData.posteriorBeta + 1;
		const incorrectEntropy = this.calculateEntropy(incorrectAlpha, incorrectBeta);

		// Probability of correct response (current belief)
		const pCorrect = correctAlpha / (correctAlpha + correctBeta);
		const pIncorrect = 1 - pCorrect;

		// Expected entropy after response
		const expectedEntropy = pCorrect * correctEntropy + pIncorrect * incorrectEntropy;

		// Information gain = reduction in entropy, weighted by axis importance
		const informationGain = (currentEntropy - expectedEntropy) * axisData.weight;

		// Bonus for untested pairs
		const testCount = axisData.correct + axisData.incorrect;
		const explorationBonus = testCount === 0 ? 0.5 : Math.max(0, 0.2 - testCount * 0.05);

		return informationGain + explorationBonus;
	}

	/**
	 * Calculate entropy of a beta distribution
	 * Higher entropy = more uncertainty
	 */
	calculateEntropy(alpha, beta) {
		if (alpha <= 0 || beta <= 0) return 1;

		// Approximation of beta distribution entropy
		const total = alpha + beta;
		const p = alpha / total;

		if (p <= 0 || p >= 1) return 0;
		return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
	}

	/**
	 * Update beliefs based on user response
	 * Uses Bayesian updating to refine our model
	 */
	updateBeliefs(colorPair, isCorrect, responseTime) {
		console.log(
			`BayesianColorAssessment: Updating beliefs - ${colorPair.axis}, correct: ${isCorrect}`
		);

		// Record response
		this.responseHistory.push({
			colorPair,
			isCorrect,
			responseTime,
			timestamp: Date.now()
		});

		// Update axis-specific beliefs
		const axisData = this.confusionMatrix.get(colorPair.axis);
		if (axisData) {
			if (isCorrect) {
				axisData.correct += 1;
				axisData.posteriorAlpha += 1;
			} else {
				axisData.incorrect += 1;
				axisData.posteriorBeta += 1;
			}
		}

		// Update overall severity estimate
		this.updateSeverityEstimate();

		// Update confidence level
		this.updateConfidenceLevel();

		console.log(
			`Severity estimate: ${this.severityEstimate.toFixed(3)}, Confidence: ${this.confidenceLevel.toFixed(3)}`
		);
	}

	/**
	 * Update overall severity estimate using weighted average
	 */
	updateSeverityEstimate() {
		let weightedSum = 0;
		let totalWeight = 0;

		for (const [axisName, data] of this.confusionMatrix) {
			if (axisName === 'control') continue; // Skip control questions

			const total = data.correct + data.incorrect;
			if (total === 0) continue;

			// Error rate for this axis (1 = severe confusion, 0 = no confusion)
			const errorRate = data.incorrect / total;

			// Weight by axis importance and number of observations
			const weight = data.weight * Math.sqrt(total);

			weightedSum += errorRate * weight;
			totalWeight += weight;
		}

		this.severityEstimate = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
	}

	/**
	 * Calculate confidence level using credible intervals
	 */
	updateConfidenceLevel() {
		// Show gradual confidence from first answer, but mark as unreliable until minQuestions
		if (this.responseHistory.length === 0) {
			this.confidenceLevel = 0;
			return;
		}

		// Calculate confidence based on posterior distributions
		let minConfidence = 1.0;

		for (const [axisName, data] of this.confusionMatrix) {
			if (axisName === 'control') continue;

			const total = data.correct + data.incorrect;
			if (total === 0) {
				minConfidence = Math.min(minConfidence, 0);
				continue;
			}

			// Calculate credible interval width for this axis
			const intervalWidth = this.calculateCredibleIntervalWidth(
				data.posteriorAlpha,
				data.posteriorBeta
			);

			// Confidence = 1 - normalized interval width
			const confidence = Math.max(0, 1 - intervalWidth * 2); // Scale factor
			minConfidence = Math.min(minConfidence, confidence);
		}

		this.confidenceLevel = minConfidence;
	}

	/**
	 * Calculate 95% credible interval width for beta distribution
	 */
	calculateCredibleIntervalWidth(alpha, beta) {
		// Simple approximation - in practice would use beta inverse CDF
		const mean = alpha / (alpha + beta);
		const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
		const stdDev = Math.sqrt(variance);

		// Approximate 95% interval as ±2 standard deviations
		return Math.min(4 * stdDev, 1.0); // Clamp to [0, 1]
	}

	/**
	 * Check if we have enough data for reliable conclusions
	 * Note: This no longer auto-terminates, just indicates reliability
	 */
	hasReliableData() {
		const questionCount = this.responseHistory.length;

		// Need minimum questions for any reliability
		if (questionCount < this.minQuestions) {
			return false;
		}

		// Consider reliable if we're confident enough
		return this.confidenceLevel >= this.confidenceThreshold;
	}

	/**
	 * Generate assessment report
	 */
	generateReport() {
		const totalQuestions = this.responseHistory.length;
		const correctAnswers = this.responseHistory.filter((r) => r.isCorrect).length;
		const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

		// Classify severity
		let severityLabel = 'Normal';
		if (this.severityEstimate > 0.7) severityLabel = 'Severe Deuteranomaly';
		else if (this.severityEstimate > 0.4) severityLabel = 'Moderate Deuteranomaly';
		else if (this.severityEstimate > 0.15) severityLabel = 'Mild Deuteranomaly';

		// Generate per-axis breakdown
		const axisBreakdown = {};
		for (const [axisName, data] of this.confusionMatrix) {
			const total = data.correct + data.incorrect;
			if (total > 0) {
				axisBreakdown[axisName] = {
					accuracy: data.correct / total,
					total: total,
					errorRate: data.incorrect / total
				};
			}
		}

		return {
			totalQuestions,
			accuracy,
			severityEstimate: this.severityEstimate,
			severityLabel,
			confidenceLevel: this.confidenceLevel,
			axisBreakdown,
			responseHistory: this.responseHistory,
			recommendation: this.generateRecommendation()
		};
	}

	/**
	 * Generate personalized recommendation
	 */
	generateRecommendation() {
		if (this.severityEstimate < 0.1) {
			return 'Your color vision appears normal! You show no significant signs of deuteranomaly.';
		} else if (this.severityEstimate < 0.3) {
			return "You may have mild deuteranomaly (red-green color vision difference). This typically doesn't affect daily life significantly.";
		} else if (this.severityEstimate < 0.6) {
			return 'You likely have moderate deuteranomaly. You may notice some difficulty distinguishing certain reds and greens.';
		} else {
			return 'You show signs of significant deuteranomaly. Consider consulting an eye care professional for a comprehensive color vision assessment.';
		}
	}

	/**
	 * Get current test statistics for UI display
	 */
	getCurrentStats() {
		return {
			questionsAsked: this.responseHistory.length,
			confidenceLevel: this.confidenceLevel,
			confidenceThreshold: this.confidenceThreshold,
			severityEstimate: this.severityEstimate,
			isReliable: this.hasReliableData(),
			explorationMode: this.explorationMode,
			axesExplored: Array.from(this.confusionMatrix.keys()).filter(
				(axis) =>
					this.confusionMatrix.get(axis).correct + this.confusionMatrix.get(axis).incorrect > 0
			).length,
			totalAxes: this.confusionAxes.length
		};
	}

	/**
	 * Export state for persistence
	 */
	exportState() {
		return {
			responseHistory: this.responseHistory,
			confidenceLevel: this.confidenceLevel,
			severityEstimate: this.severityEstimate,
			explorationMode: this.explorationMode,
			confusionMatrixData: Array.from(this.confusionMatrix.entries()),
			posteriorAlpha: this.posteriorAlpha,
			posteriorBeta: this.posteriorBeta
		};
	}

	/**
	 * Import state from persistence
	 */
	importState(state) {
		if (!state) return;

		this.responseHistory = state.responseHistory || [];
		this.confidenceLevel = state.confidenceLevel || 0;
		this.severityEstimate = state.severityEstimate || 0.5;
		this.explorationMode = state.explorationMode || false;
		this.posteriorAlpha = state.posteriorAlpha || this.priorAlpha;
		this.posteriorBeta = state.posteriorBeta || this.priorBeta;

		// Restore confusion matrix
		if (state.confusionMatrixData) {
			this.confusionMatrix.clear();
			state.confusionMatrixData.forEach(([key, value]) => {
				this.confusionMatrix.set(key, value);
			});
		}

		console.log(
			'BayesianColorAssessment: State imported, questions:',
			this.responseHistory.length,
			'confidence:',
			this.confidenceLevel
		);
	}
}

export { BayesianColorAssessment };
