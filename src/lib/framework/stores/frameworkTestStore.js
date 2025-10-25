/**
 * Framework test session store with Bayesian model integration
 * Manages current testing session state and adaptive learning
 */

import { writable } from 'svelte/store';
import { BayesianColorVisionModel } from '$lib/framework/colorTesting/bayesianInference.js';
import { AdaptiveTestSelector } from '$lib/framework/colorTesting/adaptiveTestSelector.js';
import { saveTestResult } from '$lib/framework/api/saveTestResult.js';
import { getUserSettings, updateUserSettings } from '$lib/framework/api/getUserSettings.js';

function createTestStore() {
	const { subscribe, set, update } = writable({
		isActive: false,
		currentTrial: null,
		trialHistory: [],
		sessionStartTime: null,
		colorblindnessType: null,
		difficulty: 5,
		bayesianModel: null,
		adaptiveSelector: null,
		testMode: 'balanced' // 'explore', 'exploit', 'balanced'
	});

	return {
		subscribe,

		/**
		 * Start a new test session with Bayesian model
		 */
		startSession: async (colorblindnessType, difficulty = 5, userSeverity = null) => {
			// Use provided severity, or default to 0.6 (medium)
			const severity = userSeverity ?? 0.6;

			// Create Bayesian model with user's severity
			const bayesianModel = new BayesianColorVisionModel(colorblindnessType, severity);

			// Try to load previous Bayesian state from PocketBase
			try {
				const settings = await getUserSettings();
				if (settings.bayesian_state) {
					bayesianModel.importState(settings.bayesian_state);
					console.log('Loaded previous Bayesian state');
				}
			} catch (error) {
				console.warn('Could not load previous Bayesian state:', error);
			}

			// Create adaptive selector
			const adaptiveSelector = new AdaptiveTestSelector(bayesianModel, colorblindnessType);

			set({
				isActive: true,
				currentTrial: null,
				trialHistory: [],
				sessionStartTime: Date.now(),
				colorblindnessType,
				difficulty,
				bayesianModel,
				adaptiveSelector,
				testMode: 'balanced'
			});
		},

		/**
		 * Get next trial using adaptive selection
		 */
		getNextTrial: () => {
			let trial = null;
			update((state) => {
				if (state.adaptiveSelector) {
					trial = state.adaptiveSelector.selectNextTrial(state.difficulty);
					if (trial) {
						trial.startTime = Date.now(); // Add start time for response time tracking
					} else {
						console.error('selectNextTrial returned null!', {
							hasSelector: !!state.adaptiveSelector,
							difficulty: state.difficulty,
							colorblindnessType: state.colorblindnessType
						});
					}
				} else {
					console.error('No adaptiveSelector in state!');
				}
				return {
					...state,
					currentTrial: trial
				};
			});
			return trial;
		},

		/**
		 * Record a trial response and update Bayesian model
		 */
		recordResponse: async (response) => {
			let savedResult = null;
			let currentState = null;

			// Get current state
			update((state) => {
				currentState = state;
				return state;
			});

			if (!currentState.currentTrial || !currentState.bayesianModel) {
				return null;
			}

			const responseTime = Date.now() - (currentState.currentTrial.startTime || Date.now());

			// Update Bayesian model
			currentState.bayesianModel.updateFromResponse(currentState.currentTrial, response);

			// Save to PocketBase (async, but don't block store update)
			try {
				savedResult = await saveTestResult({
					reference_hex: currentState.currentTrial.reference,
					color1_hex: currentState.currentTrial.color1,
					color2_hex: currentState.currentTrial.color2,
					referencePosition: currentState.currentTrial.referencePosition,
					user_response: response,
					response_time_ms: responseTime,
					expected_confusion_prob: currentState.currentTrial.expectedConfusionProb
				});
			} catch (error) {
				console.error('Failed to save test result:', error);
			}

			// Save Bayesian state periodically (every 5 tests) - don't await
			const totalTests = currentState.bayesianModel.testHistory.length;
			if (totalTests % 5 === 0) {
				updateUserSettings({
					bayesian_state: currentState.bayesianModel.exportState()
				})
					.then(() => {
						console.log('Saved Bayesian state');
					})
					.catch((error) => {
						console.warn('Could not save Bayesian state:', error);
					});
			}

			// Update store with new trial history
			update((state) => ({
				...state,
				trialHistory: [
					...state.trialHistory,
					{
						...state.currentTrial,
						userResponse: response,
						timestamp: Date.now(),
						responseTime,
						savedResult
					}
				],
				currentTrial: null
			}));

			return savedResult;
		},

		/**
		 * Change test mode (explore/exploit/balanced)
		 */
		setTestMode: (mode) => {
			update((state) => {
				if (state.adaptiveSelector) {
					state.adaptiveSelector.setMode(mode);
				}
				return {
					...state,
					testMode: mode
				};
			});
		},

		/**
		 * Get current testing statistics
		 */
		getStats: () => {
			let stats = null;
			update((state) => {
				if (state.adaptiveSelector) {
					stats = state.adaptiveSelector.getStats();
				}
				return state;
			});
			return stats;
		},

		/**
		 * Get suggested mode based on current progress
		 */
		getSuggestedMode: () => {
			let suggested = 'balanced';
			update((state) => {
				if (state.adaptiveSelector) {
					suggested = state.adaptiveSelector.suggestMode();
				}
				return state;
			});
			return suggested;
		},

		/**
		 * End current session and save Bayesian state
		 */
		endSession: async () => {
			await update(async (state) => {
				// Save final Bayesian state
				if (state.bayesianModel) {
					try {
						await updateUserSettings({
							bayesian_state: state.bayesianModel.exportState()
						});
						console.log('Saved final Bayesian state');
					} catch (error) {
						console.warn('Could not save final Bayesian state:', error);
					}
				}

				return {
					...state,
					isActive: false,
					currentTrial: null
				};
			});
		},

		/**
		 * Reset store
		 */
		reset: () => {
			set({
				isActive: false,
				currentTrial: null,
				trialHistory: [],
				sessionStartTime: null,
				colorblindnessType: null,
				difficulty: 5,
				bayesianModel: null,
				adaptiveSelector: null,
				testMode: 'balanced'
			});
		}
	};
}

export const frameworkTestStore = createTestStore();
