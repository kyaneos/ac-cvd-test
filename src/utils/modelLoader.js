/**
 * Animal Crossing 3D Model Loader
 * Loads the authentic AC cat model and applies texture swapping for expressions
 */

import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

export class ACModelLoader {
	constructor() {
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.model = null;
		this.mixer = null;
		this.animations = [];
		this.currentAnimation = null;
		this.clock = new THREE.Clock();
		this.currentEyeTexture = 0;
		this.currentMouthTexture = 0;
		this.baseEyeTexture = 0;
		this.baseMouthTexture = 0;
		this.lastBlinkTime = 0;
		this.blinkDuration = 150; // Faster blink
		this.nextBlinkTime = Date.now() + 5000; // First blink in 5 seconds
		this.blinkPhase = 0; // Track blink animation phase
		this.isBlinking = false;
		this.currentMood = 'neutral';
		this.isSpeaking = false;
		this.speakingStartTime = 0;
		this.debugLogged = false;
		this.kneeDebugLogged = false;
		this.speakingDebugLogged = false;
		this.lastAppliedMouthTexture = -1; // Track last applied mouth texture to prevent loops
		this.size = 'normal'; // Store size for scaling
		this.textures = {
			eyes: [],
			mouths: [],
			body: null,
			ears: null,
			cloth: null
		};
		this.isLoaded = false;
		this.applyingTextures = false; // Initialize the flag
		this.textureUpdateScheduled = false; // Prevent multiple texture updates per frame

		// Texture configuration system - standardized transformations
		this.textureConfig = {
			// polygon0 = eyes
			polygon0: { flipH: true, rotation: Math.PI },
			// polygon1 = mouth
			polygon1: { flipH: true, rotation: Math.PI },
			// polygon2 = body (back of head, arms, legs)
			polygon2: { flipH: true, rotation: Math.PI },
			// polygon3 = cloth/torso
			polygon3: { flipH: true, rotation: Math.PI },
			// polygon4 = ears
			polygon4: { flipH: true, rotation: Math.PI }
		};
	}

	async init(container, size = 'normal') {
		this.size = size;
		// Set up Three.js scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xffffff); // White background like AC save screens

		// Camera setup - adjusted for larger model
		this.camera = new THREE.PerspectiveCamera(
			45,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		this.camera.position.set(0, 3, 12); // Further back and higher to see larger model

		// Renderer setup
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		// Add lighting - brighter for better visibility
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 5, 5);
		directionalLight.castShadow = true;
		this.scene.add(directionalLight);

		// Add fill light to brighten shadows
		const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
		fillLight.position.set(-5, 0, -5);
		this.scene.add(fillLight);

		container.appendChild(this.renderer.domElement);

		// Load textures and model
		await this.loadTextures();
		await this.loadModel();

		this.isLoaded = true;
		this.animate();
	}

	// Helper function to apply standard texture transformations
	applyTextureTransform(texture, config) {
		if (!texture || !config) return;

		if (config.flipH) {
			texture.wrapS = THREE.RepeatWrapping;
			texture.repeat.x = -1; // Flip horizontally
			texture.offset.x = 1;
		}

		if (config.rotation !== undefined) {
			texture.rotation = config.rotation;
			texture.center.set(0.5, 0.5); // Set rotation center
		}
	}

	async loadTextures() {
		const textureLoader = new THREE.TextureLoader();

		// Load Rover eye textures (e.0.png through e.7.png)
		for (let i = 0; i <= 7; i++) {
			const eyeTexture = await textureLoader.loadAsync(`/assets/models/Rover/e.${i}.png`);
			eyeTexture.flipY = false; // AC models don't need Y-flip
			// Apply BOTH horizontal flip AND rotation as requested
			eyeTexture.wrapS = THREE.RepeatWrapping;
			eyeTexture.repeat.x = -1; // Flip horizontally
			eyeTexture.offset.x = 1;
			eyeTexture.rotation = Math.PI; // Rotate 180 degrees
			eyeTexture.center.set(0.5, 0.5); // Set rotation center
			this.textures.eyes.push(eyeTexture);
		}

		// Load Rover mouth textures (m.0.png through m.5.png)
		for (let i = 0; i <= 5; i++) {
			const mouthTexture = await textureLoader.loadAsync(`/assets/models/Rover/m.${i}.png`);
			mouthTexture.flipY = false;
			// Apply BOTH horizontal flip AND rotation as requested
			mouthTexture.wrapS = THREE.RepeatWrapping;
			mouthTexture.repeat.x = -1; // Flip horizontally
			mouthTexture.offset.x = 1;
			mouthTexture.rotation = Math.PI; // Rotate 180 degrees
			mouthTexture.center.set(0.5, 0.5); // Set rotation center
			this.textures.mouths.push(mouthTexture);
		}

		// Load Rover body textures (covers back of head/arms/legs)
		this.textures.body = await textureLoader.loadAsync(`/assets/models/Rover/b0.png`);
		this.textures.body.flipY = false;
		// Apply horizontal flip, 180° rotation, plus additional 180° for arms/legs
		this.textures.body.wrapS = THREE.RepeatWrapping;
		this.textures.body.repeat.x = -1; // Flip horizontally
		this.textures.body.offset.x = 1;
		this.textures.body.rotation = Math.PI; // Rotate 180 degrees
		this.textures.body.center.set(0.5, 0.5); // Set rotation center

		// Load Rover ear textures
		this.textures.ears = await textureLoader.loadAsync(`/assets/models/Rover/b1.png`);
		this.textures.ears.flipY = false;
		// Apply BOTH horizontal flip AND rotation to ears as well
		this.textures.ears.wrapS = THREE.RepeatWrapping;
		this.textures.ears.repeat.x = -1; // Flip horizontally
		this.textures.ears.offset.x = 1;
		this.textures.ears.rotation = Math.PI; // Rotate 180 degrees
		this.textures.ears.center.set(0.5, 0.5); // Set rotation center

		this.textures.cloth = await textureLoader.loadAsync(`/assets/models/Rover/w.png`);
		this.textures.cloth.flipY = false;
		// Apply BOTH horizontal flip AND rotation to clothing (shirt)
		this.textures.cloth.wrapS = THREE.RepeatWrapping;
		this.textures.cloth.repeat.x = -1; // Flip horizontally
		this.textures.cloth.offset.x = 1;
		this.textures.cloth.rotation = Math.PI; // Rotate 180 degrees
		this.textures.cloth.center.set(0.5, 0.5); // Set rotation center
	}

	async loadModel() {
		const loader = new ColladaLoader();

		try {
			const collada = await loader.loadAsync('/assets/models/Rover/xct.dae');
			this.model = collada.scene;

			// Scale and position the model appropriately
			const scale = this.size === 'small' ? 3.0 : 3.5; // Slightly bigger small scale
			this.model.scale.setScalar(scale);
			this.model.position.set(0, -0.5, 0); // Center position, raised more to show full character
			this.model.rotation.y = 0; // Face forward (not backwards)

			// Apply initial textures
			this.applyTextures();

			// Check for animations in the loaded model
			if (collada.animations && collada.animations.length > 0) {
				console.log('Found animations:', collada.animations.length);
				this.animations = collada.animations;

				// Create animation mixer
				this.mixer = new THREE.AnimationMixer(this.model);

				// Play the first animation if available
				if (this.animations.length > 0) {
					this.currentAnimation = this.mixer.clipAction(this.animations[0]);
					this.currentAnimation.setLoop(THREE.LoopRepeat);
					this.currentAnimation.play();
					console.log('Started animation:', this.animations[0].name);
				}
			} else {
				console.log('No animations found in model, using basic idle animation');
			}

			this.scene.add(this.model);
			console.log('Successfully loaded Collada model');
		} catch (error) {
			console.error('Failed to load Collada model:', error);
			// Fallback to a simple geometry if model fails to load
			this.createFallbackModel();
		}
	}

	createFallbackModel() {
		// Create a 2D sprite plane using authentic AC Rover texture
		console.log('Creating fallback 2D sprite model');
		const geometry = new THREE.PlaneGeometry(2, 2);

		// Load Rover sprite texture as fallback
		const textureLoader = new THREE.TextureLoader();
		const roverTexture = textureLoader.load(
			'/assets/sprites/rover-texture.png',
			(texture) => {
				console.log('Fallback Rover texture loaded successfully');
			},
			undefined,
			(error) => {
				console.log('Could not load Rover texture, using colored plane');
			}
		);

		const material = new THREE.MeshLambertMaterial({
			map: roverTexture,
			transparent: true,
			side: THREE.DoubleSide
		});

		this.model = new THREE.Mesh(geometry, material);
		this.model.position.set(0, 0, 0);
		this.scene.add(this.model);
	}

	applyTextures() {
		if (!this.model) return;

		// Prevent repeated applications during animations
		if (this.applyingTextures) {
			return;
		}
		this.applyingTextures = true;

		// Apply textures to different parts of the model
		this.model.traverse((child) => {
			// Type cast and check if it's a mesh with material
			if (child.type === 'Mesh' || child.type === 'SkinnedMesh') {
				const mesh = child; // Cast to mesh type
				// console.log(`Found mesh: ${mesh.name}, material: ${mesh.material?.name}`);

				if (mesh.material) {
					// Handle material arrays (multiple materials)
					const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

					materials.forEach((material, index) => {
						// Safely check for name properties with proper null checks
						const childName =
							mesh.name && typeof mesh.name === 'string' ? mesh.name.toLowerCase() : '';
						const materialName =
							material.name && typeof material.name === 'string' ? material.name.toLowerCase() : '';

						// console.log(`Processing material ${index}: child="${childName}", material="${materialName}"`);

						try {
							// SkinnedMesh texture application
							// console.log(`Applying texture to SkinnedMesh: ${childName || 'unnamed'}`);

							// Map different textures to different polygon parts
							let selectedTexture = this.textures.body; // Default

							// Polygon mapping based on AC model structure and user feedback
							if (childName === 'polygon0') {
								// Eyes - default wide open (e.0), expressions (e.3-e.7), blinking (e.1-e.2)
								selectedTexture = this.textures.eyes[this.currentEyeTexture] || this.textures.body;
								// console.log('Applied eye texture to polygon0 (eyes)');
							} else if (childName === 'polygon1') {
								// Mouth - normal closed (m.0), speaking (m.1-m.2), sad variations (m.3-m.5)
								selectedTexture =
									this.textures.mouths[this.currentMouthTexture] || this.textures.body;
								// console.log('Applied mouth texture to polygon1 (mouth)');
							} else if (childName === 'polygon2') {
								// Back of head/arms/legs - use b0.png
								selectedTexture = this.textures.body;
								// console.log('Applied body texture to polygon2 (back of head/arms/legs)');
							} else if (childName === 'polygon3') {
								// Torso/clothing - use w.png
								selectedTexture = this.textures.cloth;
								// console.log('Applied cloth texture to polygon3 (torso/clothing)');
							} else if (childName === 'polygon4') {
								// Likely ears - use b1.png
								selectedTexture = this.textures.ears || this.textures.body;
								// console.log('Applied ear texture to polygon4 (ears)');
							} else {
								// Default fallback
								selectedTexture = this.textures.body;
								console.log(`Applied default body texture to ${childName}`);
							}

							// Apply the selected texture
							material.map = selectedTexture;
							material.needsUpdate = true;

							// Fix shiny/glossy appearance - make materials more matte like Animal Crossing
							material.color.setHex(0xffffff);
							material.transparent = false;
							material.opacity = 1.0;

							// Remove shininess and make more matte like AC
							if (material.shininess !== undefined) material.shininess = 0;
							if (material.specular !== undefined) material.specular.setHex(0x000000);
							if (material.roughness !== undefined) material.roughness = 1.0;
							if (material.metalness !== undefined) material.metalness = 0.0;

							// Ensure proper shading for rounded appearance
							material.flatShading = false; // Use smooth shading to help with polygon seams
						} catch (error) {
							console.log('Error applying texture to mesh part:', error);
						}
					});
				}
			}
		});

		// Reset flag after application
		this.applyingTextures = false;
	}

	// Change expression by swapping textures
	setExpression(mood = 'neutral') {
		this.currentMood = mood;

		// Updated expressions with correct eye mappings from user
		const expressions = {
			neutral: { eyes: 0, mouth: 0, animationSpeed: 1.0, canBlink: true },
			happy: { eyes: 5, mouth: 1, animationSpeed: 1.2, canBlink: false }, // Eyes closed
			excited: { eyes: 7, mouth: 2, animationSpeed: 1.5, canBlink: false }, // Eyes closed
			thinking: { eyes: 0, mouth: 0, animationSpeed: 0.8, canBlink: true },
			surprised: { eyes: 6, mouth: 3, animationSpeed: 0.5, canBlink: true },
			sad: { eyes: 4, mouth: 4, animationSpeed: 0.7, canBlink: true },
			encouraging: { eyes: 5, mouth: 1, animationSpeed: 1.1, canBlink: false }, // Eyes closed
			celebrate: { eyes: 5, mouth: 2, animationSpeed: 1.8, canBlink: false } // Eyes closed
		};

		const expression = expressions[mood] || expressions.neutral;
		const oldEye = this.currentEyeTexture;
		const oldMouth = this.currentMouthTexture;

		this.baseEyeTexture = Math.min(expression.eyes, this.textures.eyes.length - 1);
		this.baseMouthTexture = Math.min(expression.mouth, this.textures.mouths.length - 1);
		this.canBlink = expression.canBlink;

		// Set current textures if not blinking
		if (!this.isBlinking) {
			this.currentEyeTexture = this.baseEyeTexture;
		}
		if (!this.isSpeaking) {
			this.currentMouthTexture = this.baseMouthTexture;
		}

		// Only apply textures if they actually changed
		if (oldEye !== this.currentEyeTexture || oldMouth !== this.currentMouthTexture) {
			this.applyTextures();
		}

		// Adjust animation speed based on mood
		if (this.currentAnimation) {
			this.currentAnimation.timeScale = expression.animationSpeed;
		}
	}

	// Method to play specific animation by name or index
	playAnimation(nameOrIndex = 0) {
		if (!this.mixer || this.animations.length === 0) return;

		// Stop current animation
		if (this.currentAnimation) {
			this.currentAnimation.stop();
		}

		// Find animation by name or index
		let animation;
		if (typeof nameOrIndex === 'string') {
			animation = this.animations.find((anim) =>
				anim.name.toLowerCase().includes(nameOrIndex.toLowerCase())
			);
		} else {
			animation = this.animations[Math.min(nameOrIndex, this.animations.length - 1)];
		}

		if (animation) {
			this.currentAnimation = this.mixer.clipAction(animation);
			this.currentAnimation.setLoop(THREE.LoopRepeat);
			this.currentAnimation.play();
			console.log('Playing animation:', animation.name);
		}
	}

	animate() {
		if (!this.isLoaded) return;

		requestAnimationFrame(() => this.animate());

		// Update animation mixer if it exists
		if (this.mixer) {
			const delta = this.clock.getDelta();
			this.mixer.update(delta);
		} else if (this.model) {
			// Look for bones in the model for proper head-only animation
			const time = Date.now() * 0.001;
			const headBobFreq = time * Math.PI * 1.7; // 1 cycle per second

			// Find bones for advanced animations - including ALL segments
			let headBone = null;
			let earBone = null;
			let mouthBone = null;
			let rightArm1 = null,
				rightArm2 = null,
				rightHand = null;
			let leftArm1 = null,
				leftArm2 = null,
				leftHand = null;
			let rightLeg1 = null,
				rightLeg2 = null,
				rightLeg3 = null;
			let leftLeg1 = null,
				leftLeg2 = null,
				leftLeg3 = null;
			let foundBones = [];

			this.model.traverse((child) => {
				if (child.type === 'Bone') {
					foundBones.push(child);
					const boneName = child.name.toLowerCase();

					if (boneName.includes('head')) {
						headBone = child;
					} else if (boneName.includes('feel')) {
						earBone = child; // 'feel' = ears in AC
					} else if (boneName === 'rarm1') {
						rightArm1 = child; // Right upper arm
					} else if (boneName === 'rarm2') {
						rightArm2 = child; // Right forearm
					} else if (boneName === 'rhand') {
						rightHand = child; // Right hand
					} else if (boneName === 'larm1') {
						leftArm1 = child; // Left upper arm
					} else if (boneName === 'larm2') {
						leftArm2 = child; // Left forearm
					} else if (boneName === 'lhand') {
						leftHand = child; // Left hand
					} else if (boneName === 'mouth') {
						mouthBone = child; // Mouth bone for speaking animation
					} else if (boneName === 'rfoot1') {
						rightLeg1 = child; // Right upper leg
					} else if (boneName === 'rfoot2') {
						rightLeg2 = child; // Right knee
					} else if (boneName === 'rfoot3') {
						rightLeg3 = child; // Right foot
					} else if (boneName === 'lfoot1') {
						leftLeg1 = child; // Left upper leg
					} else if (boneName === 'lfoot2') {
						leftLeg2 = child; // Left knee
					} else if (boneName === 'lfoot3') {
						leftLeg3 = child; // Left foot
					}
				}
			});

			// Animation values with AC-accurate timing
			// X axis = side-to-side (swivel), Y axis = up/down (nod), Z axis = side-to-side (tilt)
			const headSwivel = Math.sin(headBobFreq) * 0; // Subtle swivel
			const headNod = Math.sin((headBobFreq + 1.1) * 1) * 0.05; // Subtle up/down nod
			const headTilt = Math.sin(headBobFreq * 1) * 0.06; //Head tilt

			// 1. HEAD BOBBING (correct axes)
			if (headBone) {
				headBone.rotation.x = headSwivel; // X = side-to-side swivel
				headBone.rotation.y = headNod; // Y = up/down nod
				headBone.rotation.z = headTilt; // No tilt needed
			}

			// 2. EAR WIGGLE - try Z axis for wiggle motion
			if (earBone) {
				const earLag = headBobFreq - 0.3; // Slight delay behind head
				const earWiggle = Math.sin(earLag) * 0.2; // Visible wiggle amplitude
				earBone.rotation.z = earWiggle; // Z axis for side-to-side wiggle
			}

			// 3. ARM MOVEMENT - Slightly more outward, ensure no thick Y rotations
			// RIGHT ARM (upper arm, forearm, hand)
			if (rightArm1) {
				const armSwing = -Math.sin(headBobFreq) * 0.02;
				// Mirror the left arm X rotation (positive instead of negative)
				rightArm1.rotation.x = 1.2 + armSwing; // Mirrored from left arm
				rightArm1.rotation.y = 0; // Ensure no Y rotation making arms thick
				rightArm1.rotation.z = 2.0; // Slightly more outward than 2.2
			}
			if (rightArm2) {
				const forearmBend = Math.sin(headBobFreq * 0.5) * 0.05; // Subtle forearm movement
				rightArm2.rotation.x = forearmBend;
				rightArm2.rotation.y = 0; // Ensure no thick Y rotations
			}
			if (rightHand) {
				const handSway = Math.sin(headBobFreq * 0.8) * 0.03; // Gentle hand movement
				rightHand.rotation.z = handSway;
			}

			// LEFT ARM (upper arm, forearm, hand)
			if (leftArm1) {
				const armSwing = Math.sin(headBobFreq) * 0.02;
				// Keep the previous X rotation from last iteration
				leftArm1.rotation.x = -1.2 + armSwing; // Original from previous iteration
				leftArm1.rotation.y = 0; // Ensure no Y rotation making arms thick
				leftArm1.rotation.z = -2.0; // Slightly more outward than -2.2
			}
			if (leftArm2) {
				const forearmBend = -Math.sin(headBobFreq * 0.5) * 0.05; // Subtle forearm movement
				leftArm2.rotation.x = forearmBend;
			}
			if (leftHand) {
				const handSway = -Math.sin(headBobFreq * 0.8) * 0.03; // Gentle hand movement
				leftHand.rotation.z = handSway;
			}

			// 4. KNEE BEND - Y-axis bending with 0.5x head bob frequency and subtle vertical movement
			const kneeBendFreq = headBobFreq * 0.5; // Half the head bob frequency
			const kneeBend = Math.sin(kneeBendFreq) * 0.15; // More subtle knee bending motion
			const verticalDip = Math.abs(Math.sin(kneeBendFreq)) * 0.05; // Much more subtle dip (0.8 units)

			// Debug knee bone detection once
			if (!this.kneeDebugLogged) {
				console.log('=== KNEE BONE DEBUG ===');
				console.log('All leg bones found:');
				console.log('  rightLeg1:', rightLeg1?.name || 'not found');
				console.log('  rightLeg2:', rightLeg2?.name || 'not found');
				console.log('  rightLeg3:', rightLeg3?.name || 'not found');
				console.log('  leftLeg1:', leftLeg1?.name || 'not found');
				console.log('  leftLeg2:', leftLeg2?.name || 'not found');
				console.log('  leftLeg3:', leftLeg3?.name || 'not found');
				this.kneeDebugLogged = true;
			}

			if (rightLeg2) {
				// Right knee - X axis for natural knee bending (forward/back)
				rightLeg2.rotation.y = Math.abs(kneeBend); // X axis rotation for natural knee bend
			}
			if (leftLeg2) {
				// Left knee - X axis for natural knee bending (forward/back)
				leftLeg2.rotation.y = Math.abs(kneeBend * 1.3); // X axis with slight offset for natural variation
			}

			// Apply vertical movement to simulate actual knee bending
			if (this.model) {
				// Base position -2, then add dip (more negative = lower)
				this.model.position.y = -1.5 + verticalDip; // Start at -2, go lower when knees bend
			}

			// 5. MOUTH MOVEMENT when speaking - debug and improve
			if (!this.speakingDebugLogged) {
				console.log('=== SPEAKING DEBUG ===');
				console.log('  isSpeaking:', this.isSpeaking);
				console.log('  mouthBone:', mouthBone?.name || 'not found');
				console.log('  currentMood:', this.currentMood);
				this.speakingDebugLogged = true;
			}

			if (this.isSpeaking) {
				// Update mouth textures based on mood (this should work even without mouth bone)
				this.updateSpeakingMouth();

				// Also animate mouth bone if available
				if (mouthBone) {
					const speakTime = (Date.now() - this.speakingStartTime) * 0.001;
					const mouthMove = Math.sin(speakTime * 10) * 0.02; // Fast mouth movement
					mouthBone.rotation.x = mouthMove;
				}
			}

			// Keep body position stable but allow vertical dip
			// Removed - position is now set by knee bend animation

			// Handle blinking animation
			this.handleBlinking();

			// Debug once
			if (!this.debugLogged) {
				console.log('=== Advanced Rover Animation Debug ===');
				console.log('Animation bones found:');
				console.log('  Head bone:', headBone?.name || 'not found');
				console.log('  Ear bone:', earBone?.name || 'not found');
				console.log(
					'  Right arm segments:',
					rightArm1?.name || 'none',
					rightArm2?.name || 'none',
					rightHand?.name || 'none'
				);
				console.log(
					'  Left arm segments:',
					leftArm1?.name || 'none',
					leftArm2?.name || 'none',
					leftHand?.name || 'none'
				);

				const rightArmComplete = rightArm1 && rightArm2 && rightHand;
				const leftArmComplete = leftArm1 && leftArm2 && leftHand;

				if (headBone && earBone && rightArmComplete && leftArmComplete) {
					console.log('🎉 Complete animation system with full arm segments ready!');
				} else {
					console.log('⚠️ Some animation components missing');
				}
				this.debugLogged = true;
			}
		}

		this.renderer.render(this.scene, this.camera);
	}

	// Handle automatic blinking with proper sequence
	handleBlinking() {
		const currentTime = Date.now();

		// Only blink if this mood allows blinking
		if (!this.canBlink) {
			this.isBlinking = false;
			return;
		}

		if (!this.isBlinking && currentTime > this.nextBlinkTime) {
			// Start blinking sequence
			this.isBlinking = true;
			this.blinkPhase = 0;
			this.lastBlinkTime = currentTime;

			// Blink sequence: default → e.1 → e.2 → e.1 → default
			const blinkSequence = () => {
				const phases = [
					1, // e.1 (partially closed)
					2, // e.2 (more closed)
					1, // e.1 (partially closed again)
					this.baseEyeTexture // back to default
				];

				if (this.blinkPhase < phases.length) {
					this.currentEyeTexture = phases[this.blinkPhase];
					this.blinkPhase++;
					// Apply textures only once after texture change
					this.scheduleTextureUpdate();

					// Continue sequence
					setTimeout(blinkSequence, 50); // 50ms per phase
				} else {
					// Blink complete
					this.isBlinking = false;
					this.currentEyeTexture = this.baseEyeTexture;
					this.scheduleTextureUpdate();

					// Schedule next blink in 5 seconds
					this.nextBlinkTime = currentTime + 5000;
				}
			};

			blinkSequence();
		}
	}

	// Animation speed control
	static MOUTH_ANIMATION_SPEED = 80; // Global speed control in milliseconds

	// Update mouth texture while speaking
	updateSpeakingMouth() {
		if (!this.isSpeaking) return;

		const currentTime = Date.now();
		const speakDuration = currentTime - this.speakingStartTime;

		// Define mouth texture ranges for different moods
		const mouthTextureRanges = {
			neutral: [0, 1, 2], // m.0, m.1, m.2 - normal speaking
			thinking: [0, 1, 2], // m.0, m.1, m.2 - same as neutral
			excited: [0, 1, 2], // m.0, m.1, m.2 - wide excited mouth
			happy: [0, 1, 2], // m.0, m.1, m.2 - happy speaking
			encouraging: [0, 1, 2], // m.0, m.1, m.2 - encouraging
			celebrate: [0, 1, 2], // m.0, m.1, m.2 - celebratory
			surprised: [0, 1, 2], // m.0, m.1, m.2 - surprised speaking
			sad: [3, 4, 5], // m.3, m.4, m.5 - downturned mouth
			angry: [3, 4, 5], // m.3, m.4, m.5 - angry mouth
			disappointed: [3, 4, 5] // m.3, m.4, m.5 - disappointed
		};

		// Get appropriate texture range for current mood
		const textureRange = mouthTextureRanges[this.currentMood] || mouthTextureRanges['neutral'];
		const rangeSize = textureRange.length;

		// Calculate which texture in the range to use
		const cycleIndex = Math.floor(speakDuration / ACModelLoader.MOUTH_ANIMATION_SPEED) % rangeSize;
		const newMouthTexture = textureRange[cycleIndex];

		// Only update if texture actually changed AND not same as last applied
		if (
			this.currentMouthTexture !== newMouthTexture &&
			this.lastAppliedMouthTexture !== newMouthTexture
		) {
			console.log(
				'Updating mouth texture from',
				this.currentMouthTexture,
				'to',
				newMouthTexture,
				'for mood:',
				this.currentMood
			);
			this.currentMouthTexture = newMouthTexture;
			this.lastAppliedMouthTexture = newMouthTexture;
			this.scheduleTextureUpdate();
		}
	}

	// Start speaking animation
	startSpeaking() {
		console.log('StartSpeaking called - setting isSpeaking to true');
		this.isSpeaking = true;
		this.speakingStartTime = Date.now();
		this.lastAppliedMouthTexture = -1; // Reset to ensure mouth animation starts
	}

	// Stop speaking animation
	stopSpeaking() {
		console.log('StopSpeaking called - setting isSpeaking to false');
		this.isSpeaking = false;
		this.currentMouthTexture = this.baseMouthTexture;
		this.lastAppliedMouthTexture = -1; // Reset for next time
		this.scheduleTextureUpdate();
	}

	// Schedule texture update to prevent infinite loops
	scheduleTextureUpdate() {
		if (this.textureUpdateScheduled) return;
		this.textureUpdateScheduled = true;

		requestAnimationFrame(() => {
			this.applyTextures();
			this.textureUpdateScheduled = false;
		});
	}

	resize(width, height) {
		if (this.camera && this.renderer) {
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(width, height);
		}
	}

	dispose() {
		if (this.renderer) {
			this.renderer.dispose();
		}
		if (this.model) {
			this.scene.remove(this.model);
		}
	}
}

export default ACModelLoader;
