# Asset Integration Guide

## Files to Download from Spriters Resource

### 1. Character Sprites

**Location:** `/public/assets/sprites/`

- **Rover sprite sheet** - Look for "Special Villagers" section
- File should contain multiple poses/expressions in a grid layout

### 2. UI Textures

**Location:** `/public/assets/textures/`

- **Dialogue box texture** - Speech bubble background
- **Button textures** - For interactive elements
- **Progress bar textures** - For test progress
- **Background patterns** - Any decorative elements

### 3. Sound Effects

**Location:** `/public/assets/sounds/`

- **Voices/dialogue blips** - For typewriter text effect
- **Button sounds** - UI interaction feedback
- **Success/error sounds** - For test feedback

## Integration Steps (After Adding Assets)

### Step 1: Analyze Sprite Sheets

1. Open the Rover PNG in an image editor
2. Note the dimensions of individual sprites (usually 32x32 or 64x64)
3. Count how many sprites across and down
4. Update `/src/styles/sprites.css` with correct coordinates

### Step 2: Update Components

1. Import sprites.css in components
2. Replace emoji characters with sprite divs
3. Add appropriate CSS classes for different expressions

### Step 3: Test Integration

1. Run `npm run dev`
2. Check that sprites display correctly
3. Verify different expressions change appropriately
4. Test sound effects trigger

## Expected File Structure After Download

```
/public/assets/
├── sprites/
│   ├── rover.png (or similar name)
│   └── [other character sprites]
├── textures/
│   ├── dialogue-box.png
│   ├── button.png
│   └── [other UI elements]
└── sounds/
    ├── dialogue.wav (or .mp3)
    ├── button.wav
    └── [other sounds]
```

## Notes on Sprite Sheets

- Most AC sprites are arranged in grids (e.g., 4x4, 8x2)
- Each individual sprite is usually 32x32 or 64x64 pixels
- Expressions typically include: neutral, happy, surprised, sad, angry
- Some sheets may include walking animations or gesture poses
- Use image-rendering: pixelated in CSS to keep crisp pixel art

## CSS Sprite Positioning Formula

```css
.sprite-position {
	background-position: -(column * sprite_width) px - (row * sprite_height) px;
}
```

Example: For a 64x64 sprite in column 2, row 1 (0-indexed):

```css
background-position: -128px -64px;
```
