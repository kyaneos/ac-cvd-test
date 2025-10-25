/**
 * Sound effects utility for Animal Crossing-style audio
 * Place your downloaded AC sound files in /public/assets/sounds/
 */

class SoundManager {
	constructor() {
		this.sounds = {};
		this.initialized = false;
		this.enabled = true;
		this.voiceSounds = {}; // For Rover's Voice_Kiza sounds
		this.autoInitialized = false;
		this.activeAudioInstances = new Set(); // Track active audio for cleanup
	}

	async initialize() {
		if (this.initialized) return;

		try {
			// Core UI sounds
			await this.loadSound(
				'button_decide',
				'/assets/sounds/Sound Effects/UI and System/UI_Decide.wav'
			);
			await this.loadSound(
				'button_cancel',
				'/assets/sounds/Sound Effects/UI and System/UI_Cancel.wav'
			);
			await this.loadSound(
				'button_hover',
				'/assets/sounds/Sound Effects/UI and System/UI_Check_Small.wav'
			);
			await this.loadSound(
				'menu_open',
				'/assets/sounds/Sound Effects/UI and System/UI_Cmn_Open.wav'
			);
			await this.loadSound(
				'menu_close',
				'/assets/sounds/Sound Effects/UI and System/UI_Cmn_Close.wav'
			);
			await this.loadSound('invalid', '/assets/sounds/Sound Effects/UI and System/UI_Invalid.wav');

			// Load Rover's authentic Voice_Kiza Animalese sounds
			const roverVoiceSounds = [
				'a',
				'e',
				'i',
				'o',
				'u', // Vowels
				'ka',
				'ki',
				'ku',
				'ke',
				'ko', // Common consonants
				'na',
				'ni',
				'nu',
				'ne',
				'no',
				'ma',
				'mi',
				'mu',
				'me',
				'mo',
				'ha',
				'hi',
				'hu',
				'he',
				'ho',
				'ra',
				'ri',
				'ru',
				're',
				'ro',
				'sa',
				'si',
				'su',
				'se',
				'so',
				'wa',
				'wo',
				'ya',
				'yo',
				'yu'
			];

			for (const sound of roverVoiceSounds) {
				await this.loadVoiceSound(sound, `/assets/sounds/Voices/Voice_Kiza_Kana_${sound}.wav`);
			}

			// Test feedback sounds
			await this.loadSound(
				'correct_answer',
				'/assets/sounds/Sound Effects/Emotions/Manpu_03_Happy_OneShot00.wav'
			);
			await this.loadSound(
				'incorrect_answer',
				'/assets/sounds/Sound Effects/Emotions/Manpu_09_Komari.wav'
			);

			// Event sounds
			await this.loadSound(
				'test_start',
				'/assets/sounds/Sound Effects/UI and System/Event_Quest_Start.wav'
			);
			await this.loadSound(
				'test_complete',
				'/assets/sounds/Sound Effects/UI and System/Event_Quest_Finish.wav'
			);
			await this.loadSound(
				'progress_count',
				'/assets/sounds/Sound Effects/UI and System/UI_CountUp.wav'
			);

			console.log('Sound system with authentic Rover voice initialized successfully');
			this.initialized = true;
		} catch (error) {
			console.log('Some sound files could not be loaded, continuing silently:', error);
			this.initialized = true; // Still mark as initialized to prevent repeated attempts
		}
	}

	async loadSound(name, path) {
		try {
			const audio = new Audio(path);
			audio.preload = 'auto';
			this.sounds[name] = audio;
		} catch (error) {
			console.log(`Could not load sound: ${name}`);
		}
	}

	async loadVoiceSound(name, path) {
		try {
			const audio = new Audio(path);
			audio.preload = 'auto';
			this.voiceSounds[name] = audio;
		} catch (error) {
			console.log(`Could not load voice sound: ${name}`);
		}
	}

	async autoInitialize() {
		if (this.autoInitialized || this.initialized) return;

		// Auto-initialize on first user interaction
		try {
			await this.initialize();
			this.autoInitialized = true;
			console.log('Sound system auto-initialized on user interaction');
		} catch (error) {
			console.log('Auto-initialization failed:', error);
		}
	}

	play(soundName, volume = 0.3) {
		// Auto-initialize if not already done
		if (!this.initialized && !this.autoInitialized) {
			this.autoInitialize();
		}

		if (!this.initialized || !this.enabled || !this.sounds[soundName]) {
			return; // Silently fail if sound not available
		}

		try {
			const audio = this.sounds[soundName].cloneNode();
			audio.volume = Math.min(volume, 0.5); // Cap volume to prevent harsh sounds
			audio.play().catch(() => {
				// Auto-play might be blocked, that's okay
			});
		} catch (error) {
			// Silent failure
		}
	}

	// Authentic AC Animalese speech using Voice_Kiza for Rover
	// Based on animalese.js algorithm for proper character-to-sound mapping
	playAnimalese(character = '', mood = 'neutral', pitch = 1.0) {
		// Auto-initialize if not already done
		if (!this.initialized && !this.autoInitialized) {
			this.autoInitialize();
		}

		if (!this.initialized || !this.enabled || Object.keys(this.voiceSounds).length === 0) {
			return;
		}

		try {
			let soundKey = '';

			if (character && character.length > 0) {
				// Convert character to appropriate Japanese syllable sound (animalese.js approach)
				const char = character.toLowerCase();

				// Map English letters to Japanese syllables for authentic AC sound
				const letterToSyllable = {
					a: 'a',
					b: 'ba',
					c: 'ka',
					d: 'da',
					e: 'e',
					f: 'ha',
					g: 'ga',
					h: 'ha',
					i: 'i',
					j: 'ja',
					k: 'ka',
					l: 'ra',
					m: 'ma',
					n: 'na',
					o: 'o',
					p: 'pa',
					q: 'ku',
					r: 'ra',
					s: 'sa',
					t: 'ta',
					u: 'u',
					v: 'ba',
					w: 'wa',
					x: 'ku',
					y: 'ya',
					z: 'za'
				};

				soundKey = letterToSyllable[char] || 'a'; // Fallback to 'a' sound
			} else {
				// Fallback to common vowel sounds if no character provided
				const voiceOptions = ['a', 'e', 'i', 'o', 'u'];
				soundKey = voiceOptions[Math.floor(Math.random() * voiceOptions.length)];
			}

			if (this.voiceSounds[soundKey]) {
				const audio = this.voiceSounds[soundKey].cloneNode();
				audio.volume = 0.25; // Authentic AC volume level

				// Apply mood-based pitch variations (more subtle for authenticity)
				let moodPitch = pitch;
				switch (mood) {
					case 'happy':
					case 'excited':
						moodPitch *= 1.08; // Subtle happiness boost
						break;
					case 'sad':
					case 'encouraging':
						moodPitch *= 0.94; // Gentle lowering
						break;
					case 'surprised':
						moodPitch *= 1.12; // Noticeable surprise
						break;
					case 'thinking':
						moodPitch *= 0.96; // Contemplative lowering
						break;
				}

				audio.playbackRate = Math.max(0.85, Math.min(1.25, moodPitch));

				// Track audio instance for cleanup
				this.activeAudioInstances.add(audio);

				// Store handler for cleanup
				const endedHandler = () => {
					this.activeAudioInstances.delete(audio);
				};
				audio._endedHandler = endedHandler;
				audio.addEventListener('ended', endedHandler);

				audio.play().catch(() => {
					// Auto-play might be blocked, remove from tracking
					this.activeAudioInstances.delete(audio);
				});
			}
		} catch (error) {
			// Silent failure
		}
	}

	// Advanced text-to-Animalese conversion with character-by-character mapping
	// Based on animalese.js algorithm for authentic AC speech generation
	playTextAsAnimalese(text, mood = 'neutral') {
		if (!text || !this.initialized || !this.enabled) return;

		// Convert text to uppercase and filter for letters only (like animalese.js)
		const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');

		if (cleanText.length === 0) return;

		// AC-authentic timing: 0.075 seconds per character (based on animalese.js)
		const letterDuration = 75; // milliseconds

		// Process each character individually for authentic speech
		for (let i = 0; i < cleanText.length; i++) {
			setTimeout(() => {
				const character = cleanText[i];
				this.playAnimalese(character, mood, 1.0);
			}, i * letterDuration);
		}
	}

	// Simplified version for typewriter effect during dialogue
	playDialogueCharacter(character, mood = 'neutral') {
		// Only play sound for actual letters, skip spaces and punctuation
		if (/[A-Za-z]/.test(character)) {
			// Stop any overlapping sounds if too many are playing
			if (this.activeAudioInstances.size > 5) {
				const firstAudio = this.activeAudioInstances.values().next().value;
				if (firstAudio) {
					firstAudio.pause();
					this.activeAudioInstances.delete(firstAudio);
				}
			}
			this.playAnimalese(character, mood, 1.0);
		}
	}

	// Stop all currently playing Animalese audio
	stopAllAnimalese() {
		console.log(
			'SoundManager: stopAllAnimalese called, tracking',
			this.activeAudioInstances.size,
			'active audio instances'
		);
		for (const audio of this.activeAudioInstances) {
			try {
				console.log('SoundManager: Stopping audio instance:', audio.src);
				audio.pause();
				audio.currentTime = 0;
				// Remove event listeners to prevent memory leaks
				audio.removeEventListener('ended', audio._endedHandler);
			} catch (error) {
				console.log('SoundManager: Error stopping audio:', error);
			}
		}
		this.activeAudioInstances.clear();
		console.log('SoundManager: All Animalese audio stopped and cleared');
	}

	// Generate speech based on Rover's personality (casual, friendly)
	playRoverSpeech(mood = 'neutral') {
		let pitch = 1.0; // Base pitch for Rover

		switch (mood) {
			case 'happy':
			case 'excited':
				pitch = 1.1; // Higher pitch when happy
				break;
			case 'sad':
			case 'encouraging':
				pitch = 0.95; // Lower pitch when sympathetic
				break;
			case 'thinking':
				pitch = 0.98; // Slightly lower when contemplative
				break;
			case 'surprised':
				pitch = 1.15; // Higher pitch when surprised
				break;
			default:
				pitch = 1.0; // Neutral pitch
		}

		this.playAnimalese(mood, pitch);
	}

	// Haptic UI sound effects
	playButtonClick() {
		this.play('button_decide', 0.3);
	}
	playButtonCancel() {
		this.play('button_cancel', 0.3);
	}
	playButtonHover() {
		this.play('button_hover', 0.15);
	}
	playMenuOpen() {
		this.play('menu_open', 0.25);
	}
	playMenuClose() {
		this.play('menu_close', 0.25);
	}
	playInvalid() {
		this.play('invalid', 0.2);
	}

	// Test feedback sounds
	playCorrectAnswer() {
		this.play('correct_answer', 0.4);
	}
	playIncorrectAnswer() {
		this.play('incorrect_answer', 0.3);
	}

	// Event sounds
	playTestStart() {
		this.play('test_start', 0.4);
	}
	playTestComplete() {
		this.play('test_complete', 0.4);
	}
	playProgressCount() {
		this.play('progress_count', 0.2);
	}
}

// Singleton instance
export const soundManager = new SoundManager();

// Export convenience functions (no auto-initialization)
export const initializeSounds = () => soundManager.initialize();
export const stopAllAnimalese = () => soundManager.stopAllAnimalese();
export const playRoverSpeech = (mood) => soundManager.playRoverSpeech(mood);
export const playTextAsAnimalese = (text, mood) => soundManager.playTextAsAnimalese(text, mood);
export const playDialogueCharacter = (character, mood) =>
	soundManager.playDialogueCharacter(character, mood);
export const playButtonClick = () => soundManager.playButtonClick();
export const playButtonHover = () => soundManager.playButtonHover();
export const playCorrectAnswer = () => soundManager.playCorrectAnswer();
export const playIncorrectAnswer = () => soundManager.playIncorrectAnswer();
export const playTestStart = () => soundManager.playTestStart();
export const playTestComplete = () => soundManager.playTestComplete();
