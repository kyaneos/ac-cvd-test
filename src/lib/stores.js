/**
 * Svelte stores for state persistence across the color vision test app
 * Using Svelte 5 compatible stores pattern
 */

import { writable } from 'svelte/store';

// Test progress state for persistence between tab switches
export const testProgress = writable({
	currentRound: 0,
	gameStarted: false,
	dialogueIndex: 0,
	dialogueSet: 'intro',
	characterMood: 'neutral',
	results: [],
	sessionStartTime: null,
	lastSaveTime: null
});

// UI state for various components
export const uiState = writable({
	roverIsSpeaking: false,
	currentView: 'wii-load',
	fadeInApp: false,
	soundsInitialized: false
});

// User preferences and settings
export const userPreferences = writable({
	soundEnabled: true,
	textSpeed: 25, // AC-accurate 25ms per character
	skipIntro: false,
	lastCompletedTest: null
});

// Color test session data for detailed analytics
export const sessionData = writable({
	startTime: null,
	endTime: null,
	totalQuestions: 0,
	correctAnswers: 0,
	averageResponseTime: 0,
	difficultyBreakdown: {},
	colorConfusionPatterns: []
});

// Adaptive test persistent state with localStorage
function createAdaptiveTestStore() {
	// Load from localStorage on initialization
	const stored =
		typeof localStorage !== 'undefined' ? localStorage.getItem('adaptiveTestState') : null;
	const initialState = stored
		? JSON.parse(stored)
		: {
				bayesianState: null,
				testResults: [],
				currentStats: {
					questionsAsked: 0,
					confidenceLevel: 0,
					isReliable: false,
					explorationMode: false,
					axesExplored: 0,
					totalAxes: 0
				},
				assessmentPhase: 'intro',
				gameStarted: false,
				isActive: false,
				characterName: '?????', // Add character name to persistent state
				currentDialogueIndex: 0,
				currentDialogueSet: 'intro',
				characterMood: 'neutral'
			};

	const { subscribe, set, update } = writable(initialState);

	return {
		subscribe,
		set: (value) => {
			set(value);
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('adaptiveTestState', JSON.stringify(value));
			}
		},
		update: (updater) => {
			update((state) => {
				const newState = updater(state);
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem('adaptiveTestState', JSON.stringify(newState));
				}
				return newState;
			});
		},
		reset: () => {
			const resetState = {
				bayesianState: null,
				testResults: [],
				currentStats: {
					questionsAsked: 0,
					confidenceLevel: 0,
					isReliable: false,
					explorationMode: false,
					axesExplored: 0,
					totalAxes: 0
				},
				assessmentPhase: 'intro',
				gameStarted: false,
				isActive: false,
				characterName: '?????',
				currentDialogueIndex: 0,
				currentDialogueSet: 'intro',
				characterMood: 'neutral'
			};
			set(resetState);
		}
	};
}

export const adaptiveTestState = createAdaptiveTestStore();

// Helper functions for managing test state
export const testStateHelpers = {
	saveProgress: (progress) => {
		testProgress.update((state) => ({
			...state,
			...progress,
			lastSaveTime: Date.now()
		}));
	},

	resetProgress: () => {
		testProgress.set({
			currentRound: 0,
			gameStarted: false,
			dialogueIndex: 0,
			dialogueSet: 'intro',
			characterMood: 'neutral',
			results: [],
			sessionStartTime: null,
			lastSaveTime: null
		});
	},

	getCurrentState: () => {
		let currentState;
		testProgress.subscribe((state) => {
			currentState = state;
		})();
		return currentState;
	}
};

// Audio state management
export const audioState = writable({
	titleMusicPlaying: false,
	animalesesPlaying: [],
	sfxEnabled: true,
	musicEnabled: true,
	volume: {
		master: 0.5,
		sfx: 0.3,
		music: 0.25,
		voice: 0.25
	}
});

// Color Map specific state for sliders and interactions
export const colorMapState = writable({
	sliderValues: {
		red: 0,
		green: 0,
		blue: 0
	},
	isDragging: false,
	lastInteraction: null,
	previewColor: '#000000',
	comparisonEnabled: false
});

// Development and debug state (can be removed in production)
export const debugState = writable({
	showConsole: false,
	logLevel: 'info',
	performanceMetrics: {},
	modelLoadTime: null,
	audioLoadTime: null
});
