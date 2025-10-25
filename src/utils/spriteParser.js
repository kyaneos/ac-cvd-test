/**
 * Animal Crossing Sprite Sheet Parser
 * Comprehensive coordinate mappings for all AC texture files
 */

/**
 * Title Screen Sprites (title.png)
 * Based on actual sprite sheet analysis - corrected coordinates
 */
export const TITLE_SPRITES = {
	// Individual text elements (top section)
	animal_text_top: { x: 0, y: 0, width: 430, height: 60 }, // Top left "Animal" text
	crossing_text_top: { x: 0, y: 60, width: 430, height: 60 }, // Top left "Crossing" text

	// Complete wooden logos (adjusted to exclude ESRB/copyright elements)
	wooden_logo_with_text: { x: 460, y: 0, width: 280, height: 160 }, // Top right complete logo (cropped)
	wooden_logo_bottom: { x: 460, y: 200, width: 280, height: 160 }, // Bottom right complete logo (cropped)

	// Empty wooden sign for custom text
	empty_wooden_sign: { x: 0, y: 200, width: 380, height: 180 }, // Bottom left empty sign

	// Subtitle panels
	city_folk_panel: { x: 0, y: 480, width: 320, height: 60 }, // Bottom left panel
	city_folk_panel_right: { x: 460, y: 480, width: 320, height: 60 } // Bottom right panel
};

/**
 * Cursor Sprites (cursor.png)
 * 2-column layout, numbered left to right, top to bottom
 */
export const CURSOR_SPRITES = {
	default: { x: 0, y: 96, width: 48, height: 48 }, // 7th panel - pointing finger
	click: { x: 48, y: 160, width: 48, height: 48 }, // 12th panel - clicking hand
	scroll_hover: { x: 0, y: 224, width: 48, height: 48 }, // 15th panel - scroll hover
	scroll_grab: { x: 0, y: 192, width: 48, height: 48 } // 13th panel - scroll grab
};

/**
 * Emotion Effects (emotion_effects.png)
 * Various emotion indicators and effects
 */
export const EMOTION_SPRITES = {
	heart: { x: 0, y: 0, width: 48, height: 48 }, // Top left heart
	question: { x: 350, y: 100, width: 48, height: 48 }, // Center right question mark
	surprise: { x: 0, y: 200, width: 80, height: 60 }, // Bottom left surprise burst
	exclamation: { x: 200, y: 200, width: 32, height: 48 } // Bottom center exclamation
};

/**
 * Error Screen (error_screen.png)
 * Resetti and error elements
 */
export const ERROR_SPRITES = {
	resetti: { x: 200, y: 0, width: 150, height: 200 } // Second panel - Mr. Resetti
};

/**
 * HUD Elements (hud.png)
 * Interface backgrounds and counters
 */
export const HUD_SPRITES = {
	counter_background: { x: 100, y: 50, width: 120, height: 40 }, // Center left background for counters

	// Legacy button elements (keeping for compatibility)
	button_normal: { x: 10, y: 10, width: 80, height: 20 },
	button_hover: { x: 10, y: 35, width: 80, height: 20 },
	button_pressed: { x: 10, y: 60, width: 80, height: 20 }
};

/**
 * Keyboard Elements (keyboard.png)
 * Buttons and interface elements
 */
export const KEYBOARD_SPRITES = {
	// Button types
	button_grey: { x: 250, y: 0, width: 60, height: 30 }, // Grey rounded button
	button_white: { x: 320, y: 0, width: 60, height: 30 }, // White rounded button
	button_large_grey: { x: 75, y: 55, width: 150, height: 30 }, // Large grey button
	button_small_grey: { x: 0, y: 55, width: 60, height: 30 }, // Small grey button

	// Special elements
	keyboard_grid: { x: 0, y: 0, width: 40, height: 30 }, // Small keyboard grid icon
	text_field: { x: 65, y: 0, width: 180, height: 30 } // Text input field
};

/**
 * Loading Animation (loading.png)
 * Bus movement frames
 */
export const LOADING_SPRITES = {
	bus_frame_1: { x: 0, y: 0, width: 100, height: 40 }, // Frame 1
	bus_frame_2: { x: 100, y: 0, width: 100, height: 40 }, // Frame 2
	bus_frame_3: { x: 0, y: 40, width: 100, height: 40 }, // Frame 3
	bus_frame_4: { x: 100, y: 40, width: 100, height: 40 } // Frame 4
};

/**
 * Text Interface Elements (text.png)
 * Font characters, dialogue elements, and UI components
 */
export const TEXT_SPRITES = {
	// Font characters (top of sprite sheet)
	font_caps: { x: 0, y: 0, width: 320, height: 16 }, // First line - uppercase letters
	font_lowercase: { x: 0, y: 16, width: 320, height: 16 }, // Second line - lowercase letters
	font_numbers: { x: 0, y: 32, width: 320, height: 16 }, // Third line - numbers
	font_punctuation: { x: 0, y: 80, width: 320, height: 16 }, // Sixth line - punctuation & symbols

	// Dialogue containers and elements
	dialogue_option_box: { x: 0, y: 96, width: 80, height: 32 }, // Yellow container on left
	blue_triangle_marker: { x: 100, y: 96, width: 16, height: 16 }, // Blue continue triangles
	green_slider: { x: 120, y: 96, width: 100, height: 16 }, // Green progress slider

	// Other colored containers (right side)
	red_container: { x: 240, y: 96, width: 60, height: 32 },
	blue_container: { x: 240, y: 130, width: 60, height: 32 },

	// Main dialogue cloud (bottom) - adjusted to exclude character portrait area
	dialogue_bubble: { x: 40, y: 128, width: 280, height: 80 }, // White cloud speech bubble (cropped)

	// Character portrait container (left side of dialogue)
	character_portrait_box: { x: 0, y: 96, width: 32, height: 32 }, // Small character icon area

	// Legacy 9-slice elements (for compatibility)
	dialogue_corner_tl: { x: 0, y: 128, width: 32, height: 32 },
	dialogue_corner_tr: { x: 288, y: 128, width: 32, height: 32 },
	dialogue_corner_bl: { x: 0, y: 176, width: 32, height: 32 },
	dialogue_corner_br: { x: 288, y: 176, width: 32, height: 32 },
	dialogue_center: { x: 32, y: 152, width: 32, height: 32 }
};

/**
 * Generate CSS background-position for sprite
 * @param {Object} sprite - Sprite coordinates
 * @param {number} spriteSheetWidth - Total width of sprite sheet
 * @param {number} spriteSheetHeight - Total height of sprite sheet
 * @returns {string} CSS background-position value
 */
export function getSpritePosition(sprite, spriteSheetWidth, spriteSheetHeight) {
	const percentX = (sprite.x / (spriteSheetWidth - sprite.width)) * 100;
	const percentY = (sprite.y / (spriteSheetHeight - sprite.height)) * 100;
	return `${percentX}% ${percentY}%`;
}

/**
 * Generate CSS background-size for sprite
 * @param {Object} sprite - Sprite coordinates
 * @param {number} spriteSheetWidth - Total width of sprite sheet
 * @param {number} spriteSheetHeight - Total height of sprite sheet
 * @returns {string} CSS background-size value
 */
export function getSpriteSize(sprite, spriteSheetWidth, spriteSheetHeight) {
	const scaleX = spriteSheetWidth / sprite.width;
	const scaleY = spriteSheetHeight / sprite.height;
	return `${scaleX * 100}% ${scaleY * 100}%`;
}

/**
 * Sprite Collection Registry
 * Maps texture types to their sprite collections
 */
const SPRITE_COLLECTIONS = {
	title: TITLE_SPRITES,
	cursor: CURSOR_SPRITES,
	emotion: EMOTION_SPRITES,
	error: ERROR_SPRITES,
	hud: HUD_SPRITES,
	keyboard: KEYBOARD_SPRITES,
	loading: LOADING_SPRITES,
	text: TEXT_SPRITES
};

/**
 * Texture Sheet Dimensions
 * Actual dimensions of each texture file
 */
const TEXTURE_DIMENSIONS = {
	title: { width: 800, height: 600 },
	cursor: { width: 96, height: 288 },
	emotion: { width: 450, height: 350 },
	error: { width: 400, height: 200 },
	hud: { width: 400, height: 200 },
	keyboard: { width: 400, height: 500 },
	loading: { width: 200, height: 80 },
	text: { width: 320, height: 208 }
};

/**
 * Generate complete CSS sprite properties
 * @param {string} spriteName - Name of sprite
 * @param {string} textureType - 'title', 'cursor', 'emotion', 'error', 'hud', 'keyboard', 'loading', or 'text'
 * @returns {Object} CSS properties object
 */
export function generateSpriteCSS(spriteName, textureType = 'hud') {
	const sprites = SPRITE_COLLECTIONS[textureType];
	if (!sprites) {
		console.warn(`Texture type "${textureType}" not found`);
		return {};
	}

	const sprite = sprites[spriteName];
	if (!sprite) {
		console.warn(`Sprite "${spriteName}" not found in ${textureType} sprites`);
		return {};
	}

	const dimensions = TEXTURE_DIMENSIONS[textureType];
	const texturePath = `/assets/textures/${textureType === 'emotion' ? 'emotion effects' : textureType}.png`;

	return {
		'background-image': `url('${texturePath}')`,
		'background-position': `-${sprite.x}px -${sprite.y}px`,
		'background-size': `${dimensions.width}px ${dimensions.height}px`,
		'background-repeat': 'no-repeat',
		width: `${sprite.width}px`,
		height: `${sprite.height}px`,
		'image-rendering': 'pixelated'
	};
}

/**
 * Create a sprite element with proper AC styling
 * @param {string} spriteName - Name of sprite
 * @param {string} textureType - Texture type
 * @param {string} className - Additional CSS class
 * @returns {HTMLElement} Styled sprite element
 */
export function createSpriteElement(spriteName, textureType, className = '') {
	const element = document.createElement('div');
	element.className = `ac-sprite ${className}`;
	const styles = generateSpriteCSS(spriteName, textureType);
	Object.assign(element.style, styles);
	return element;
}

/**
 * Apply sprite styling to DOM element
 * @param {HTMLElement} element - Target DOM element
 * @param {string} spriteName - Name of sprite
 * @param {string} textureType - 'hud' or 'text'
 */
export function applySpriteToElement(element, spriteName, textureType = 'hud') {
	const styles = generateSpriteCSS(spriteName, textureType);
	Object.assign(element.style, styles);
}

/**
 * Create 9-slice border element for dialogue boxes
 * @param {string} containerSelector - CSS selector for container
 * @param {string} textureType - 'hud' or 'text'
 */
export function create9SliceBorder(containerSelector, textureType = 'text') {
	const container = document.querySelector(containerSelector);
	if (!container) return;

	// Clear any existing border elements to prevent duplication
	container
		.querySelectorAll(
			'.slice-corner_tl, .slice-corner_tr, .slice-corner_bl, .slice-corner_br, .slice-edge_top, .slice-edge_bottom, .slice-edge_left, .slice-edge_right, .slice-center'
		)
		.forEach((el) => el.remove());

	// Use CSS-only approach with single background image
	container.style.backgroundImage = "url('/assets/textures/text.png')";
	container.style.backgroundPosition = '0px -160px'; // Position to dialogue box area
	container.style.backgroundSize = '320px 288px';
	container.style.backgroundRepeat = 'no-repeat';
	container.style.borderImageSource = "url('/assets/textures/text.png')";
	container.style.borderImageSlice = '32 32 32 32'; // 32px slices from each side
	container.style.borderImageWidth = '32px 32px 32px 32px';
	container.style.borderImageRepeat = 'stretch';
	container.style.borderWidth = '32px';
	container.style.borderStyle = 'solid';

	// Add speech tail if needed
	if (container.querySelector('.dialogue-content')) {
		const tail = document.createElement('div');
		tail.className = 'dialogue-tail-sprite';
		tail.style.cssText = `
      position: absolute;
      bottom: -24px;
      left: 50px;
      background-image: url('/assets/textures/text.png');
      background-position: -16px -256px;
      background-size: 320px 288px;
      background-repeat: no-repeat;
      width: 32px;
      height: 24px;
      z-index: 1;
    `;
		container.appendChild(tail);
	}
}
