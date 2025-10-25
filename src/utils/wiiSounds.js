// Wii UI Sound Effects Manager

class WiiSoundManager {
	constructor() {
		this.sounds = {};
		this.initialized = false;
	}

	async init() {
		if (this.initialized) return;

		try {
			// Preload all Wii UI sounds with correct paths
			this.sounds.delete = new Audio(
				'/assets/sounds/Sound Effects/UI and System/UI_Delete_Small.wav'
			);
			this.sounds.wait = new Audio('/assets/sounds/Sound Effects/UI and System/UI_Wait.wav');
			this.sounds.select = new Audio('/assets/sounds/Sound Effects/UI and System/UI_Select.wav');
			this.sounds.decide = new Audio(
				'/assets/sounds/Sound Effects/UI and System/UI_Decide_Title.wav'
			);
			this.sounds.back = new Audio('/assets/sounds/Sound Effects/UI and System/UI_Page_Back.wav');
			this.sounds.next = new Audio('/assets/sounds/Sound Effects/UI and System/UI_Page_Next.wav');
			this.sounds.scroll = new Audio(
				'/assets/sounds/Sound Effects/UI and System/UI_Scroll_Fast.wav'
			);
			this.sounds.hover = new Audio(
				'/assets/sounds/Sound Effects/UI and System/UI_Interior_Cursor.wav'
			);
			this.sounds.returnTitle = new Audio(
				'/assets/sounds/Sound Effects/UI and System/UI_Return_Title.wav'
			);
			this.sounds.dialogueBubble = new Audio(
				'/assets/sounds/Sound Effects/UI and System/UI_Phone_Start_3.wav'
			);

			// Set default volumes
			Object.values(this.sounds).forEach((sound) => {
				sound.volume = 0.6;
			});

			// Make hover sound louder
			if (this.sounds.hover) {
				this.sounds.hover.volume = 0.9;
			}

			// Loop the wait sound
			this.sounds.wait.loop = true;

			this.initialized = true;
		} catch (error) {
			console.log('Wii sounds initialization failed:', error);
		}
	}

	async play(soundName) {
		console.log('WiiSounds: play called for', soundName, 'initialized:', this.initialized);
		if (!this.initialized) {
			console.log('WiiSounds: Not initialized, attempting to init');
			await this.init();
		}
		if (!this.sounds[soundName]) {
			console.log('WiiSounds: Sound not found:', soundName);
			return;
		}

		try {
			// Clone and play for overlapping sounds
			const sound = this.sounds[soundName].cloneNode();
			sound.volume = this.sounds[soundName].volume;
			sound.play().catch((e) => console.log('WiiSounds: Play failed for', soundName, e));
		} catch (error) {
			// Fallback to direct play
			console.log('WiiSounds: Clone failed, trying direct play for', soundName);
			this.sounds[soundName].currentTime = 0;
			this.sounds[soundName]
				.play()
				.catch((e) => console.log('WiiSounds: Direct play failed for', soundName, e));
		}
	}

	playLoop(soundName) {
		if (!this.initialized || !this.sounds[soundName]) return;

		this.sounds[soundName].loop = true;
		this.sounds[soundName].play().catch(() => {});
	}

	stop(soundName) {
		if (!this.initialized || !this.sounds[soundName]) return;

		this.sounds[soundName].pause();
		this.sounds[soundName].currentTime = 0;
		this.sounds[soundName].loop = false;
	}

	stopAll() {
		Object.values(this.sounds).forEach((sound) => {
			sound.pause();
			sound.currentTime = 0;
			sound.loop = false;
		});
	}
}

export const wiiSounds = new WiiSoundManager();
