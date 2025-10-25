/**
 * Auto Sound Initialization System
 * Automatically initializes sound system on first user interaction
 */

import { soundManager } from './soundEffects.js';

class AutoSoundInitializer {
	constructor() {
		this.hasInitialized = false;
		this.listeners = [];
	}

	init() {
		if (this.hasInitialized) return;

		// List of user interaction events that can trigger sound initialization
		const triggerEvents = ['click', 'touchstart', 'keydown', 'mousedown'];

		// Create bound handler to avoid memory leaks
		const boundHandler = this.handleUserInteraction.bind(this);

		// Add listeners to document for all trigger events
		triggerEvents.forEach((eventType) => {
			document.addEventListener(eventType, boundHandler, {
				once: true, // Auto-remove after first trigger
				passive: true,
				capture: true // Ensure we catch events early
			});
			this.listeners.push({ eventType, handler: boundHandler });
		});

		console.log(
			'Auto sound initialization system ready - will initialize on first user interaction'
		);
	}

	async handleUserInteraction(event) {
		if (this.hasInitialized) return;

		console.log(`Initializing sounds on user ${event.type} interaction`);

		try {
			await soundManager.initialize();
			this.hasInitialized = true;
			this.cleanup();
			console.log('Sound system successfully auto-initialized');
		} catch (error) {
			console.log('Auto sound initialization failed:', error);
			// Don't set hasInitialized to true so we can try again
		}
	}

	cleanup() {
		// Remove any remaining event listeners
		this.listeners.forEach(({ eventType, handler }) => {
			document.removeEventListener(eventType, handler, true);
		});
		this.listeners = [];
	}

	// Manual initialization method for components that want to trigger sounds immediately
	async forceInitialize() {
		if (this.hasInitialized) return true;

		try {
			await soundManager.initialize();
			this.hasInitialized = true;
			this.cleanup();
			return true;
		} catch (error) {
			console.log('Force sound initialization failed:', error);
			return false;
		}
	}
}

// Global instance
export const autoSoundInit = new AutoSoundInitializer();

// Auto-initialize when module loads (but not the sounds themselves)
if (typeof document !== 'undefined') {
	// Check if document is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => autoSoundInit.init());
	} else {
		// Document already loaded, initialize immediately
		autoSoundInit.init();
	}
}

// Export convenience methods
export const initAutoSounds = () => autoSoundInit.init();
export const forceInitializeSounds = () => autoSoundInit.forceInitialize();
