# 🌈 Ember's Color Vision Test

An Animal Crossing-inspired color vision test webapp for testing deuteranomaly colorblindness, featuring authentic AC assets and scientific color analysis.

## 🎯 Purpose

This webapp helps test for deuteranomaly (red-green colorblindness) in a fun, interactive way using Rover from Animal Crossing as your guide. Built as an anniversary gift, it combines scientific accuracy with authentic Animal Crossing charm.

## ✨ Features

### 🐱 Authentic Animal Crossing Experience

- **3D Rover Character** - Authentic model with expression changes
- **Real AC Assets** - Original game textures, sounds, and UI elements
- **Animalese Speech** - Character voice with mood-based variations
- **Click-to-Advance Dialogue** - Just like the real games!

### 🔬 Advanced Adaptive Testing System

- **Bayesian Inference Engine** - Smart question selection using information gain calculations
- **Exploration Mode** - Comprehensive color mapping with "Switch it up!" button
- **Live Confidence Tracking** - Real-time assessment confidence with credible intervals
- **11 Color Confusion Axes** - Tests red-green, browns, pastels, dark colors, and more
- **No Auto-Termination** - Continue testing indefinitely for maximum precision
- **Deuteranomaly Focus** - Specialized algorithms for red-green color vision assessment

### 🎵 Immersive Audio

- **Haptic Feedback** - Button clicks, hovers, and UI interactions
- **Event Sounds** - Test start, completion, and progress tracking
- **Authentic AC Audio** - Real sound effects from City Folk

## 🚀 Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:5173`

4. **Begin Test**
   Click "Start Test" to begin your color vision adventure with Rover!

## 🎮 How to Use

### Classic Test Mode:

1. **Meet Rover** - Click through his friendly introduction
2. **Take the Test** - Compare colors and select which one matches best
3. **Get Results** - See your color vision profile and analysis
4. **Explore Insights** - Check the color map to understand your perception

### NEW: Adaptive Testing Mode:

1. **Smart Assessment** - Each question is chosen by Bayesian algorithms
2. **Switch It Up!** - Toggle exploration mode to map all color regions
3. **Live Confidence** - Watch your assessment confidence build in real-time
4. **Infinite Testing** - Continue as long as you want for maximum precision
5. **Love Letter & Technical Tabs** - Personal message + detailed algorithm info

## 🛠️ Tech Stack

- **Frontend**: Svelte 5 (runes syntax)
- **3D Graphics**: Three.js with Collada loader
- **Styling**: Tailwind CSS 4 + custom AC themes
- **Assets**: Authentic Animal Crossing City Folk resources
- **Audio**: Web Audio API for haptic feedback and speech

## 🧠 Advanced Features

### Bayesian Adaptive Engine

- **Information Gain Optimization** - Each question maximizes learning potential
- **Beta Distribution Modeling** - Tracks confusion patterns with mathematical precision
- **Entropy Reduction** - Minimizes uncertainty with each response
- **Weighted Axis System** - Prioritizes high-importance color regions

### Exploration System

- **Comprehensive Mapping** - "Switch it up!" explores all 11 color confusion axes
- **Unexplored Region Detection** - Automatically finds gaps in color assessment
- **Balanced Coverage** - Ensures thorough evaluation across color spectrum
- **Dynamic Mode Switching** - Toggle between focused and exploratory testing

### Real-Time Analytics

- **Live Confidence Meter** - Bottom-left progress tracking with reliability badge
- **Credible Intervals** - Statistical confidence bounds for assessment accuracy
- **Session Persistence** - Detailed logging of all responses and timing data
- **Axis-Specific Analysis** - Per-category breakdown of color confusion patterns

## 📁 Project Structure

```
/src/
├── components/
│   ├── ColorTest.svelte          # Original color testing interface
│   ├── AdaptiveColorTest.svelte  # NEW: Bayesian adaptive testing system
│   ├── ColorMap.svelte           # Visualization component
│   ├── Results.svelte            # Analysis and results
│   ├── RoverModel.svelte         # 3D character component
│   ├── ACDialogue.svelte         # Animated dialogue system
│   └── InfoCard.svelte           # Love Letter + Technical tabs
├── utils/
│   ├── adaptiveBayesian.js       # NEW: Bayesian inference engine
│   ├── colorSimulation.js        # Scientific algorithms
│   ├── modelLoader.js            # 3D model management
│   ├── soundEffects.js           # Audio system
│   └── dataManager.js            # Session data tracking
├── lib/
│   └── stores.js                 # Svelte state management
├── styles/
│   └── sprites.css               # Legacy sprite classes
└── app.css                       # AC-themed styling

/public/assets/
├── models/                   # 3D models and textures
├── sounds/                   # AC sound effects
├── textures/                 # UI elements and dialogue boxes
└── sprites/                  # 2D character images
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code
npm run format
```

## 🎨 Customization

### Adding Anniversary Content

Edit `/src/components/InfoCard.svelte` to add personal anniversary messages or memories.

### Character Selection

The system uses Rover by default, but you can modify `/src/utils/modelLoader.js` to use different AC character models from the assets folder.

### Sound Preferences

Audio can be controlled in `/src/utils/soundEffects.js` - adjust volumes or disable specific sound types.

## 🧪 Testing Notes

The application has been extensively tested for:

- ✅ 3D model loading (Collada DAE format)
- ✅ Asset path resolution
- ✅ Sound system functionality
- ✅ Dialogue interaction flow
- ✅ Color display accuracy
- ✅ Cross-browser compatibility

## 📚 Scientific Background

### Adaptive Testing Theory

The system uses advanced Bayesian inference for optimal color vision assessment:

- **jsQUEST Algorithm** - Adaptive psychometric testing methodology
- **Beta-Binomial Models** - Posterior belief tracking for each color axis
- **Information Theory** - Entropy-based question selection optimization
- **Credible Interval Estimation** - Statistical confidence quantification

### Color Vision Science

Builds on scientifically accurate deuteranomaly simulation:

- **RGB to LMS Conversion** - Cone-based color space transformation
- **L-cone and M-cone Confusion** - Deuteranomaly-specific modeling
- **11-Axis Color Space** - Comprehensive confusion pattern mapping
- **Brown Region Analysis** - Specialized testing for challenging color areas

### Test Methodology

- **Adaptive Question Selection** - AI-driven test optimization
- **Exploration vs Exploitation** - Balance between targeted and comprehensive testing
- **No Termination Limit** - Infinite precision capability
- **Real-Time Confidence Tracking** - Live assessment reliability monitoring

## 🎯 Browser Support

- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+
- **Requires**: WebGL support for 3D models
- **Audio**: Web Audio API support for sound effects

## 🐛 Troubleshooting

### Common Issues

**3D Model Not Loading**

- Check browser WebGL support
- Verify `/public/assets/models/` folder exists
- Falls back to 2D sprites automatically

**No Audio**

- Browser may block autoplay - user interaction enables audio
- Check `/public/assets/sounds/` folder structure
- Audio gracefully degrades if files missing

**Colors Look Wrong**

- Ensure color profile calibration
- Test in different lighting conditions
- Use sRGB color space for accuracy

### Getting Help

Check the `DEVELOPMENT_LOG.md` for detailed implementation notes and troubleshooting steps.

## 📝 License

This project uses authentic Animal Crossing assets for educational and personal use. Original game content belongs to Nintendo.

## 💝 Credits

- **Animal Crossing Assets**: Nintendo (City Folk)
- **Rover Character Info**: [Nookipedia](https://nookipedia.com/wiki/Rover)
- **Color Science**: Based on research by Brettel et al. and Machado et al.
- **Adaptive Testing**: Inspired by jsQUEST and Bayesian psychometric methods
- **Bayesian Inference**: Information gain optimization using entropy reduction
- **Built with love** for understanding color vision through intelligent testing

## 💕 For Ember

Made with all my love for our special anniversary. Here's to understanding each other better, one color at a time! 🌈✨

_"Always trust a smiling cat!"_ - Rover 🐱
