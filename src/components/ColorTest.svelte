<script>
	import { createEventDispatcher } from 'svelte';
	import { simulateDeuteranomaly } from '../utils/colorSimulation.js';
	import {
		initializeSounds,
		playRoverSpeech,
		playDialogueCharacter,
		playButtonClick,
		playCorrectAnswer,
		playIncorrectAnswer,
		playTestStart
	} from '../utils/soundEffects.js';
	import { wiiSounds } from '../utils/wiiSounds.js';
	import { dataManager } from '../utils/dataManager.js';
	import RoverModel from './RoverModel.svelte';
	import ACDialogue from './ACDialogue.svelte';
	import { testProgress, testStateHelpers } from '../lib/stores.js';
	import { onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();

	let currentRound = $state(0);
	let testResults = $state([]);
	let isTestComplete = $state(false);
	let showFeedback = $state(false);
	let lastAnswer = $state(null);
	let currentDialogue = $state(''); // Reactive state for dialogue text
	let isTyping = $state(false);
	let showOptions = $state(false);
	let characterMood = $state('neutral');
	let waitingForClick = $state(false);
	let gameStarted = $state(false);
	let currentDialogueIndex = $state(0);
	let currentDialogueSet = $state('intro');
	let roverIsSpeaking = $state(false); // Shared speaking state for Rover model
	let characterName = $state('?????'); // Starts as ????? until Rover introduces himself
	let showDialogue = $state(true); // Control dialogue visibility for animations

	// Exhaustive color test suite for deuteranomaly (red-green colorblindness)
	const testColors = [
		// Easy Level - High Contrast
		{
			reference: '#FF0000',
			options: ['#00FF00', '#FF0000'],
			correct: 1,
			difficulty: 1,
			category: 'red-green-basic'
		},
		{
			reference: '#00FF00',
			options: ['#FF0000', '#00FF00'],
			correct: 1,
			difficulty: 1,
			category: 'green-red-basic'
		},
		{
			reference: '#0066CC',
			options: ['#CC6600', '#0066CC'],
			correct: 1,
			difficulty: 1,
			category: 'blue-orange-basic'
		},
		{
			reference: '#FFFF00',
			options: ['#FF00FF', '#FFFF00'],
			correct: 1,
			difficulty: 1,
			category: 'yellow-magenta-basic'
		},

		// Medium Level - Red/Green Distinctions
		{
			reference: '#FF6B6B',
			options: ['#6BFF6B', '#FF6B6B'],
			correct: 1,
			difficulty: 2,
			category: 'red-green-medium'
		},
		{
			reference: '#8FBC8F',
			options: ['#BC8F8F', '#8FBC8F'],
			correct: 1,
			difficulty: 2,
			category: 'green-red-medium'
		},
		{
			reference: '#FF4500',
			options: ['#45FF00', '#FF4500'],
			correct: 1,
			difficulty: 2,
			category: 'orange-green-medium'
		},
		{
			reference: '#32CD32',
			options: ['#CD3232', '#32CD32'],
			correct: 1,
			difficulty: 2,
			category: 'lime-red-medium'
		},

		// Hard Level - Subtle Differences
		{
			reference: '#B22222',
			options: ['#22B222', '#B22222'],
			correct: 1,
			difficulty: 3,
			category: 'dark-red-green'
		},
		{
			reference: '#228B22',
			options: ['#8B2222', '#228B22'],
			correct: 1,
			difficulty: 3,
			category: 'forest-green-red'
		},
		{
			reference: '#DC143C',
			options: ['#14DC3C', '#DC143C'],
			correct: 1,
			difficulty: 3,
			category: 'crimson-green'
		},
		{
			reference: '#9ACD32',
			options: ['#CD329A', '#9ACD32'],
			correct: 1,
			difficulty: 3,
			category: 'yellow-green-magenta'
		},

		// Expert Level - Deuteranomaly Specific Confusions
		{
			reference: '#800000',
			options: ['#008000', '#800000'],
			correct: 1,
			difficulty: 4,
			category: 'maroon-green'
		},
		{
			reference: '#556B2F',
			options: ['#6B2F55', '#556B2F'],
			correct: 1,
			difficulty: 4,
			category: 'olive-brown'
		},
		{
			reference: '#A0522D',
			options: ['#52A02D', '#A0522D'],
			correct: 1,
			difficulty: 4,
			category: 'sienna-green'
		},
		{
			reference: '#6B8E23',
			options: ['#8E236B', '#6B8E23'],
			correct: 1,
			difficulty: 4,
			category: 'olive-drab-purple'
		},

		// Very Hard Level - Extremely Subtle
		{
			reference: '#8B4513',
			options: ['#45138B', '#8B4513'],
			correct: 1,
			difficulty: 5,
			category: 'saddle-brown-blue'
		},
		{
			reference: '#2E8B57',
			options: ['#8B572E', '#2E8B57'],
			correct: 1,
			difficulty: 5,
			category: 'sea-green-brown'
		},
		{
			reference: '#B8860B',
			options: ['#860BB8', '#B8860B'],
			correct: 1,
			difficulty: 5,
			category: 'dark-golden-purple'
		},
		{
			reference: '#CD853F',
			options: ['#853FCD', '#CD853F'],
			correct: 1,
			difficulty: 5,
			category: 'peru-purple'
		},

		// Additional Challenging Pairs
		{
			reference: '#F0E68C',
			options: ['#E68CF0', '#F0E68C'],
			correct: 1,
			difficulty: 3,
			category: 'khaki-light-purple'
		},
		{
			reference: '#DDA0DD',
			options: ['#A0DDDD', '#DDA0DD'],
			correct: 1,
			difficulty: 3,
			category: 'plum-light-blue'
		},
		{
			reference: '#D2691E',
			options: ['#691ED2', '#D2691E'],
			correct: 1,
			difficulty: 4,
			category: 'chocolate-purple'
		},
		{
			reference: '#FF7F50',
			options: ['#7F50FF', '#FF7F50'],
			correct: 1,
			difficulty: 4,
			category: 'coral-purple'
		},

		// Color Confusion Patterns
		{
			reference: '#87CEEB',
			options: ['#CEEB87', '#87CEEB'],
			correct: 1,
			difficulty: 2,
			category: 'sky-blue-light-green'
		},
		{
			reference: '#F4A460',
			options: ['#A460F4', '#F4A460'],
			correct: 1,
			difficulty: 3,
			category: 'sandy-brown-purple'
		},
		{
			reference: '#DA70D6',
			options: ['#70D6DA', '#DA70D6'],
			correct: 1,
			difficulty: 3,
			category: 'orchid-turquoise'
		},
		{
			reference: '#98FB98',
			options: ['#FB9898', '#98FB98'],
			correct: 1,
			difficulty: 2,
			category: 'pale-green-pink'
		},

		// Advanced Deuteranomaly Tests
		{
			reference: '#ADFF2F',
			options: ['#FF2FAD', '#ADFF2F'],
			correct: 1,
			difficulty: 4,
			category: 'green-yellow-pink'
		},
		{
			reference: '#FF69B4',
			options: ['#69B4FF', '#FF69B4'],
			correct: 1,
			difficulty: 3,
			category: 'hot-pink-blue'
		},
		{
			reference: '#00CED1',
			options: ['#CED100', '#00CED1'],
			correct: 1,
			difficulty: 3,
			category: 'dark-turquoise-yellow'
		},
		{
			reference: '#FFB6C1',
			options: ['#B6C1FF', '#FFB6C1'],
			correct: 1,
			difficulty: 2,
			category: 'light-pink-blue'
		},

		// Extreme Difficulty - Nearly Identical to Deuteranomaly Vision
		{
			reference: '#C0392B',
			options: ['#39C02B', '#C0392B'],
			correct: 1,
			difficulty: 5,
			category: 'extreme-red-green-1'
		},
		{
			reference: '#27AE60',
			options: ['#AE6027', '#27AE60'],
			correct: 1,
			difficulty: 5,
			category: 'extreme-green-brown-1'
		},
		{
			reference: '#E74C3C',
			options: ['#4CE73C', '#E74C3C'],
			correct: 1,
			difficulty: 5,
			category: 'extreme-red-green-2'
		},
		{
			reference: '#2ECC71',
			options: ['#CC712E', '#2ECC71'],
			correct: 1,
			difficulty: 5,
			category: 'extreme-green-orange-2'
		},

		// Pastel Challenges
		{
			reference: '#F8BBD9',
			options: ['#BBF8D9', '#F8BBD9'],
			correct: 1,
			difficulty: 3,
			category: 'pastel-pink-green'
		},
		{
			reference: '#E8F8F5',
			options: ['#F8F5E8', '#E8F8F5'],
			correct: 1,
			difficulty: 4,
			category: 'very-light-mint-cream'
		},
		{
			reference: '#FDEBD0',
			options: ['#D0FDEB', '#FDEBD0'],
			correct: 1,
			difficulty: 4,
			category: 'papaya-whip-honeydew'
		},
		{
			reference: '#E6E6FA',
			options: ['#FAE6E6', '#E6E6FA'],
			correct: 1,
			difficulty: 3,
			category: 'lavender-misty-rose'
		},

		// Dark/Muted Challenges
		{
			reference: '#2C3E50',
			options: ['#3E502C', '#2C3E50'],
			correct: 1,
			difficulty: 5,
			category: 'dark-blue-green'
		},
		{
			reference: '#34495E',
			options: ['#49345E', '#34495E'],
			correct: 1,
			difficulty: 5,
			category: 'dark-slate-purple'
		},
		{
			reference: '#1ABC9C',
			options: ['#BC1A9C', '#1ABC9C'],
			correct: 1,
			difficulty: 4,
			category: 'turquoise-magenta'
		},
		{
			reference: '#16A085',
			options: ['#A01685', '#16A085'],
			correct: 1,
			difficulty: 4,
			category: 'light-sea-green-purple'
		},

		// Final Extreme Tests
		{
			reference: '#7F8C8D',
			options: ['#8C7F8D', '#7F8C8D'],
			correct: 1,
			difficulty: 5,
			category: 'gray-variations-1'
		},
		{
			reference: '#95A5A6',
			options: ['#A595A6', '#95A5A6'],
			correct: 1,
			difficulty: 5,
			category: 'gray-variations-2'
		},
		{
			reference: '#BDC3C7',
			options: ['#C3BDC7', '#BDC3C7'],
			correct: 1,
			difficulty: 5,
			category: 'light-gray-variations-1'
		},
		{
			reference: '#D5DBDB',
			options: ['#DBD5DB', '#D5DBDB'],
			correct: 1,
			difficulty: 5,
			category: 'light-gray-variations-2'
		},

		// Color Temperature Challenges
		{
			reference: '#F39C12',
			options: ['#12F39C', '#F39C12'],
			correct: 1,
			difficulty: 3,
			category: 'orange-green-temperature'
		},
		{
			reference: '#E67E22',
			options: ['#22E67E', '#E67E22'],
			correct: 1,
			difficulty: 3,
			category: 'carrot-green-temperature'
		},
		{
			reference: '#D35400',
			options: ['#00D354', '#D35400'],
			correct: 1,
			difficulty: 4,
			category: 'pumpkin-green-temperature'
		},
		{
			reference: '#CA6F1E',
			options: ['#1ECA6F', '#CA6F1E'],
			correct: 1,
			difficulty: 4,
			category: 'chocolate-green-temperature'
		},

		// Final Ultimate Challenge
		{
			reference: '#922B21',
			options: ['#2B9221', '#922B21'],
			correct: 1,
			difficulty: 5,
			category: 'ultimate-red-green'
		},
		{
			reference: '#229B21',
			options: ['#9B2122', '#229B21'],
			correct: 1,
			difficulty: 5,
			category: 'ultimate-green-red'
		}
	];

	let currentTest = $derived(testColors[currentRound]);
	let progress = $derived((currentRound / testColors.length) * 100);

	const dialogues = {
		intro: [
			'Well hey there! Always nice to meet someone new!',
			"Name's Rover - I do a lot of traveling, you know.",
			'Say, want to help me with something interesting?',
			"I'm curious about how different people see colors!",
			'Mind if I ask you a few questions about colors while we chat?'
		],
		questions: [
			'So, which of these two colors looks more like this one to you?',
			'What do you think? Which one matches better?',
			"I'm really curious - which color looks closer to you?",
			'This is fascinating! Which one would you pick?',
			'Always trust a smiling cat, right? Which looks right to you?',
			'Let me ask you this - which color seems most similar?',
			"From your perspective, which one's the better match?",
			"I find color perception so intriguing! What's your take?",
			'Take your time - which one catches your eye as the match?',
			'Color vision is amazing! Which option looks right to you?',
			'Trust your instincts - which color feels like the right choice?',
			'Every perspective is valuable! Which one would you choose?',
			'This is so interesting to learn about! Your thoughts?',
			'I love exploring how we see differently - which matches?',
			'Take a good look - which color seems most similar to you?'
		],
		correct: [
			"Nice choice! You've got a good eye for this stuff!",
			"Excellent! That's exactly what I was thinking too!",
			"You're pretty good at this! Color vision is neat, isn't it?",
			'Perfect! Thanks for helping me out with this!',
			'Great pick! I love learning about how people see things!',
			"Spot on! You're really getting the hang of this!",
			'Wonderful! Your color perception is quite sharp!',
			"That's right! I'm impressed by your accuracy!",
			"Fantastic choice! You've got great visual skills!",
			'Brilliant! That match was absolutely perfect!',
			"Outstanding! You're doing really well with these!",
			"Superb! I can tell you're paying close attention!",
			'Marvelous! Your eye for detail is impressive!',
			'Terrific! That was exactly the right selection!',
			"Amazing! You're making this look easy!"
		],
		incorrect: [
			"Interesting choice! Colors can be tricky sometimes, can't they?",
			"Huh, that's different from what I expected! But that's the point!",
			'No worries - everyone sees colors a bit differently!',
			"That's perfectly fine! This is all about understanding differences!",
			"Thanks for being honest! That's really helpful to know!",
			'Fascinating! That shows me how unique your perception is!',
			'No problem at all! Color vision varies from person to person!',
			"That's actually really valuable information! Don't worry about it!",
			'Perfectly understandable! These can be quite challenging!',
			"That's okay! This is all about learning how you see things!",
			"Not to worry! Everyone's visual experience is different!",
			"That's totally fine! You're helping me understand your perspective!",
			'No stress! These color comparisons can be surprisingly difficult!',
			"That's alright! The important thing is your honest response!",
			"Don't worry about it! This is about discovery, not getting it 'right'!"
		],
		complete: [
			'Well, that was really enlightening! Thanks for your help!',
			'I learned a lot about how you see the world - how cool is that?',
			"Colors are amazing, aren't they? Everyone experiences them differently!",
			'This was fun! Hope you learned something about yourself too!',
			'What a fantastic journey through color perception! Thank you!',
			'That was absolutely fascinating! Your responses tell quite a story!',
			'Wonderful! I feel like I understand your visual world much better now!',
			"How exciting! Every person's color experience is truly unique!",
			'That was incredibly insightful! Thanks for sharing your perspective!',
			'Amazing! I love discovering how differently we all see colors!',
			'What an adventure! Your color vision is really interesting!',
			'Brilliant! This kind of exploration always makes me happy!',
			"Fantastic work! You've helped me learn so much about perception!",
			'That was delightful! Color vision research is endlessly fascinating!'
		]
	};

	let typewriterActive = false;
	let currentTypewriterText = '';
	let lastQuestionStartTime = 0;

	async function typewriterEffect(text) {
		currentDialogue = '';
		isTyping = true;
		console.log('TypewriterEffect started, setting isTyping = true');
		waitingForClick = false;
		showOptions = false;
		typewriterActive = true;
		currentTypewriterText = text;

		for (let i = 0; i < text.length; i++) {
			if (!typewriterActive) break; // Allow skipping

			currentDialogue = text.slice(0, i + 1);

			// Play authentic character-based Animalese (based on animalese.js algorithm)
			const char = text[i];
			if (char && char !== ' ') {
				// Play sound for each letter, creating authentic AC speech
				playDialogueCharacter(char, characterMood);
			}

			// AC-authentic timing: slower for better readability
			await new Promise((resolve) => setTimeout(resolve, 65));
		}

		isTyping = false;
		console.log('TypewriterEffect ended, setting isTyping = false');
		waitingForClick = true;
		typewriterActive = false;
	}

	function skipToEndOfCurrentDialogue() {
		typewriterActive = false;
		currentDialogue = currentTypewriterText;
		isTyping = false;
		waitingForClick = true;
	}

	async function startGame() {
		await initializeSounds(); // Initialize sounds when user interacts
		dataManager.startSession(testColors.length); // Initialize data tracking
		characterMood = 'neutral';
		currentDialogueSet = 'intro';
		currentDialogueIndex = 0;
		gameStarted = false;

		// Enhanced title transition: Show Rover alone for 3 seconds before dialogue (accounting for longer black screen)
		setTimeout(() => {
			typewriterEffect(dialogues.intro[0]);
		}, 3000);
	}

	function handleDialogueClick() {
		console.log(
			'handleDialogueClick called, isTyping:',
			isTyping,
			'waitingForClick:',
			waitingForClick
		);
		playButtonClick();

		if (isTyping) {
			// Click-to-skip: complete the current dialogue immediately
			skipToEndOfCurrentDialogue();
			return;
		}

		if (currentDialogueSet === 'intro') {
			currentDialogueIndex++;
			// After Rover introduces himself (dialogue index 1: "Name's Rover - I do a lot of traveling, you know.")
			if (currentDialogueIndex === 2) {
				characterName = 'Rover';
			}
			// After user agrees to help (after "Say, want to help me with something interesting?")
			if (currentDialogueIndex === 3) {
				console.log('ColorTest: User agreed to help, setting mood to excited');
				characterMood = 'excited';
			}
			if (currentDialogueIndex >= dialogues.intro.length) {
				// Intro complete, start first question
				currentDialogueSet = 'question';
				currentDialogueIndex = 0;
				gameStarted = true;
				console.log('ColorTest: Setting mood to thinking (first question)');
				characterMood = 'thinking';

				// Save state at this major transition
				testStateHelpers.saveProgress({
					currentRound,
					gameStarted,
					dialogueIndex: currentDialogueIndex,
					dialogueSet: currentDialogueSet,
					characterMood,
					characterName,
					results: testResults
				});

				playTestStart();
				typewriterEffect(dialogues.questions[0]);
				// Color picker will show only after user clicks (handled in handleDialogueClick)
			} else {
				typewriterEffect(dialogues.intro[currentDialogueIndex]);
			}
		} else if (currentDialogueSet === 'feedback') {
			// After feedback, move to next question or complete
			if (currentRound >= testColors.length) {
				currentDialogueSet = 'complete';
				currentDialogueIndex = 0;
				console.log('ColorTest: Setting mood to celebrate (test complete)');
				characterMood = 'celebrate';
				typewriterEffect(dialogues.complete[0]);
			} else {
				currentDialogueSet = 'question';
				console.log('ColorTest: Setting mood to thinking (next question)');
				characterMood = 'thinking';

				// Save state when moving to next question
				testStateHelpers.saveProgress({
					currentRound,
					gameStarted,
					dialogueIndex: currentDialogueIndex,
					dialogueSet: currentDialogueSet,
					characterMood,
					characterName,
					results: testResults
				});

				const questionIndex = Math.min(currentRound, dialogues.questions.length - 1);
				typewriterEffect(dialogues.questions[questionIndex]);
				// Color picker will show only after user clicks (handled in handleDialogueClick)
			}
		} else if (currentDialogueSet === 'question' && !isTyping && waitingForClick) {
			// User clicked after question finished typing - show color picker
			showDialogue = false; // Hide dialogue first
			setTimeout(() => {
				showOptions = true; // Then show color picker
				lastQuestionStartTime = Date.now();
			}, 300); // Wait for dialogue fade out
		} else if (currentDialogueSet === 'complete') {
			currentDialogueIndex++;
			if (currentDialogueIndex >= dialogues.complete.length) {
				// Test truly complete
				dataManager.endSession(); // Finalize data tracking
				isTestComplete = true;
				dispatch('complete', {
					results: testResults,
					sessionData: dataManager.getCurrentSession()
				});
			} else {
				typewriterEffect(dialogues.complete[currentDialogueIndex]);
			}
		}

		waitingForClick = false;
	}

	async function showNextQuestion() {
		const questionIndex = Math.floor(Math.random() * dialogues.questions.length);
		await typewriterEffect(dialogues.questions[questionIndex]);
	}

	async function selectColor(index) {
		if (showFeedback || isTyping || !showOptions) return;

		playButtonClick();

		// Sequence: Hide color picker → Show dialogue with feedback
		showOptions = false; // Hide color picker first
		setTimeout(() => {
			showDialogue = true; // Then show dialogue back
		}, 200); // Wait for color picker to slide down

		const isCorrect = index === currentTest.correct;
		lastAnswer = { index, isCorrect };
		showFeedback = true;

		const newMood = isCorrect ? 'excited' : 'encouraging';
		console.log('ColorTest: Changing character mood to', newMood);
		characterMood = newMood;

		// Play feedback sound
		if (isCorrect) {
			playCorrectAnswer();
		} else {
			playIncorrectAnswer();
		}

		// Record result in both local array and data manager
		const result = {
			...currentTest,
			selected: index,
			correct: isCorrect,
			timestamp: Date.now(),
			userChoice: index,
			correctChoice: currentTest.correct,
			isCorrect,
			referenceColor: currentTest.reference,
			options: currentTest.options,
			responseTime: Date.now() - (lastQuestionStartTime || Date.now())
		};

		testResults.push(result);
		dataManager.addResult(result);

		// Save progress after answering question
		testStateHelpers.saveProgress({
			currentRound,
			gameStarted,
			dialogueIndex: currentDialogueIndex,
			dialogueSet: currentDialogueSet,
			characterMood,
			characterName,
			results: testResults
		});

		// Move to next question preparation
		currentRound++;
		showFeedback = false;
		lastAnswer = null;

		// Set up feedback dialogue system
		currentDialogueSet = 'feedback';
		const feedbackArray = isCorrect ? dialogues.correct : dialogues.incorrect;
		const feedbackIndex = Math.floor(Math.random() * feedbackArray.length);
		typewriterEffect(feedbackArray[feedbackIndex]);
	}

	async function completeTest() {
		isTestComplete = true;
		characterMood = 'celebrate';

		for (const line of dialogues.complete) {
			await typewriterEffect(line);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		// Save final completion state
		testStateHelpers.saveProgress({
			currentRound,
			gameStarted,
			dialogueIndex: currentDialogueIndex,
			dialogueSet: currentDialogueSet,
			characterMood,
			characterName,
			results: testResults,
			isTestComplete: true
		});

		dispatch('complete', { results: testResults });
	}

	function resetTest() {
		currentRound = 0;
		testResults = [];
		isTestComplete = false;
		showFeedback = false;
		lastAnswer = null;
		characterMood = 'neutral';
		characterName = '?????'; // Reset character name

		// Clear saved state when resetting
		testStateHelpers.clearProgress();

		startGame();
	}

	onMount(() => {
		// Try to restore saved state
		const savedState = testStateHelpers.getCurrentState();
		if (savedState && savedState.gameStarted) {
			console.log('ColorTest: Restoring saved state:', savedState);
			currentRound = savedState.currentRound;
			currentDialogueSet = savedState.dialogueSet;
			currentDialogueIndex = savedState.dialogueIndex;
			characterMood = savedState.characterMood;
			characterName = savedState.characterName || '?????'; // Restore character name or default to ?????
			testResults = savedState.results || [];
			gameStarted = savedState.gameStarted;

			// Resume from where we left off
			if (currentDialogueSet === 'intro') {
				if (currentDialogueIndex < dialogues.intro.length) {
					typewriterEffect(dialogues.intro[currentDialogueIndex]);
				} else {
					// Intro complete, show first question
					currentDialogueSet = 'question';
					currentDialogueIndex = 0;
					characterMood = 'thinking';
					typewriterEffect(dialogues.questions[0]);
					// Animate dialogue collapse and show color options
					setTimeout(() => {
						dialogueCollapsed = true;
						setTimeout(() => {
							showOptions = true;
							lastQuestionStartTime = Date.now();
						}, 300); // Wait for collapse animation to complete
					}, 1000);
				}
			} else if (currentDialogueSet === 'question') {
				characterMood = 'thinking';
				const questionIndex = Math.min(currentRound, dialogues.questions.length - 1);
				typewriterEffect(dialogues.questions[questionIndex]);
				// Color picker will show only after user clicks (handled in handleDialogueClick)
			} else if (currentDialogueSet === 'complete') {
				characterMood = 'celebrate';
				typewriterEffect(dialogues.complete[currentDialogueIndex]);
			}
		} else {
			startGame();
		}
	});

	onDestroy(() => {
		// Save current state when leaving
		testStateHelpers.saveProgress({
			currentRound,
			gameStarted,
			dialogueIndex: currentDialogueIndex,
			dialogueSet: currentDialogueSet,
			characterMood,
			characterName,
			results: testResults
		});
	});
</script>

<div class="game-container">
	<div class="character-area">
		<RoverModel mood={characterMood} isSpeaking={roverIsSpeaking} />
	</div>

	{#if showDialogue}
		<ACDialogue
			character={characterName}
			text={currentDialogue}
			externalControl={true}
			{isTyping}
			{waitingForClick}
			autoPlay={false}
			showTail={true}
			mood={characterMood}
			class="dialogue-animated"
			onSpeakingChange={(speaking) => {
				console.log('ColorTest: ACDialogue speaking changed to', speaking);
				roverIsSpeaking = speaking;
			}}
			onTextComplete={() => {}}
			onclick={handleDialogueClick}
		>
			{#snippet children()}{/snippet}
		</ACDialogue>
	{/if}

	{#if !isTestComplete && currentRound < testColors.length && showOptions}
		<div class="color-display" class:slide-up={showOptions}>
			<div class="reference-section">
				<div class="color-label">This color:</div>
				<div class="color-bubble" style="background-color: {currentTest.reference}">
					<div class="bubble-shine"></div>
				</div>
			</div>

			<div class="arrow">→</div>

			<div class="options-section">
				<div class="color-label">Which matches?</div>
				<div class="color-options">
					{#each currentTest.options as color, index}
						<button
							class="color-choice"
							class:selected={showFeedback && lastAnswer?.index === index}
							class:correct={showFeedback && index === currentTest.correct}
							class:incorrect={showFeedback &&
								lastAnswer?.index === index &&
								!lastAnswer?.isCorrect}
							style="background-color: {color}"
							onclick={() => selectColor(index)}
							onmouseenter={() => wiiSounds.play('hover')}
							disabled={showFeedback || isTyping}
						>
							<div class="bubble-shine"></div>
							<span class="choice-label">{index === 0 ? 'A' : 'B'}</span>
							{#if showFeedback && index === currentTest.correct}
								<span class="result-icon">⭕</span>
							{:else if showFeedback && lastAnswer?.index === index && !lastAnswer?.isCorrect}
								<span class="result-icon">❌</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if isTestComplete && showOptions}
		<div class="completion-area">
			<div class="score-display">
				<div class="score-bubble">
					<div class="score-text">
						{testResults.filter((r) => r.correct).length}/{testColors.length}
					</div>
					<div class="score-label">Correct!</div>
				</div>
			</div>
			<button
				class="play-again-button"
				onclick={() => {
					playButtonClick();
					resetTest();
				}}
				onmouseenter={() => wiiSounds.play('hover')}
			>
				Play Again!
			</button>
		</div>
	{/if}

	<div class="progress-counter">
		Question {currentRound + 1} of {testColors.length}
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
	@import url('../styles/sprites.css');

	:global(*) {
		font-family: 'Nunito', sans-serif;
	}
	.game-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		min-height: 600px;
		background: #ffffff;
		position: relative;
		border-radius: 8px;
		overflow: hidden; /* Prevent elements from going outside container */
	}

	.character-area {
		text-align: center;
		margin-bottom: 40px; /* Increased spacing to prevent dialogue overlap */
		padding-top: 20px; /* Add top padding to push Rover higher */
	}

	/* Character animations */

	@keyframes idle {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}

	@keyframes jump {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px) scale(1.1);
		}
	}

	@keyframes nod {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(-10deg);
		}
		75% {
			transform: rotate(10deg);
		}
	}

	@keyframes dance {
		0%,
		100% {
			transform: rotate(0deg) scale(1);
		}
		25% {
			transform: rotate(-15deg) scale(1.1);
		}
		75% {
			transform: rotate(15deg) scale(1.1);
		}
	}

	/* Old dialogue CSS removed - now using ACDialogue component */

	.color-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 30px;
		background: rgba(255, 255, 255, 0.9);
		padding: 30px;
		border-radius: 20px;
		border: 3px solid #d2691e;
		margin-bottom: 20px;
	}

	.reference-section,
	.options-section {
		text-align: center;
	}

	.color-label {
		font-size: 14px;
		color: #8b4513;
		margin-bottom: 10px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.color-bubble {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		border: 4px solid #fff;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
		position: relative;
		overflow: hidden;
		/* Ensure no AC texture interference */
		background-image: none !important;
	}

	.bubble-shine {
		position: absolute;
		top: 10%;
		left: 10%;
		width: 30%;
		height: 30%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
		border-radius: 50%;
	}

	.arrow {
		font-size: 30px;
		color: #8b4513;
		font-weight: bold;
	}

	.color-options {
		display: flex;
		gap: 20px;
	}

	.color-choice {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 4px solid #fff;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		/* Ensure no AC texture interference */
		background-image: none !important;
	}

	.color-choice:hover:not(:disabled) {
		transform: translateY(-5px) scale(1.1);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
	}

	.color-choice:disabled {
		cursor: not-allowed;
	}

	.color-choice.correct {
		border-color: #4caf50;
		border-width: 6px;
		animation: correctPulse 0.5s ease;
	}

	.color-choice.incorrect {
		border-color: #ff6b6b;
		border-width: 6px;
		animation: incorrectShake 0.5s ease;
	}

	@keyframes correctPulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
	}

	@keyframes incorrectShake {
		0%,
		100% {
			transform: translateX(0) rotate(0deg);
		}
		25% {
			transform: translateX(-5px) rotate(-5deg);
		}
		75% {
			transform: translateX(5px) rotate(5deg);
		}
	}

	.choice-label {
		position: absolute;
		bottom: 5px;
		right: 5px;
		background: rgba(255, 255, 255, 0.9);
		color: #333;
		font-weight: 800;
		font-size: 14px;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid #333;
	}

	.result-icon {
		position: absolute;
		top: -15px;
		right: -15px;
		font-size: 30px;
		animation: popIn 0.3s ease;
	}

	@keyframes popIn {
		0% {
			transform: scale(0);
		}
		80% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	.completion-area {
		text-align: center;
		padding: 30px;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 20px;
		border: 3px solid #d2691e;
	}

	.score-display {
		margin-bottom: 30px;
	}

	.score-bubble {
		display: inline-block;
		background: linear-gradient(135deg, #ffd700, #ffa500);
		padding: 30px;
		border-radius: 50%;
		border: 5px solid #fff;
		box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
	}

	.score-text {
		font-size: 48px;
		font-weight: 800;
		color: #fff;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.score-label {
		font-size: 18px;
		color: #fff;
		font-weight: 700;
		margin-top: 5px;
	}

	.play-again-button {
		background: linear-gradient(135deg, #4caf50, #45b7d1);
		color: white;
		border: none;
		padding: 15px 40px;
		border-radius: 30px;
		font-size: 20px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
		border: 3px solid #fff;
	}

	.play-again-button:hover {
		transform: translateY(-3px) scale(1.05);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
	}

	.progress-counter {
		position: fixed;
		bottom: 20px; /* Keep at bottom */
		left: 20px; /* Position on very left of screen, aligned with info card button */
		background: #fff8f0;
		z-index: 100;
		padding: 8px 16px;
		border-radius: 20px;
		border: 2px solid #d2691e;
		font-weight: 700;
		color: #8b4513;
		font-size: 14px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Dialogue fade animations */
	:global(.dialogue-animated) {
		transition:
			opacity 0.3s ease-out,
			transform 0.3s ease-out;
	}

	/* Color picker position and animations */
	.color-display {
		position: absolute;
		top: 75%; /* Move up slightly to prevent bottom cutoff */
		left: 50%;
		transform: translate(-50%, 100px); /* Start below, centered */
		opacity: 0;
		animation: slide-up-into-place 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		z-index: 10;
	}

	@keyframes slide-up-into-place {
		0% {
			transform: translate(-50%, 100px); /* Start below, centered */
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -30%); /* Final position, centered and up */
			opacity: 1;
		}
	}

	/* Color picker slide-down and fade out */
	.color-display:not(.slide-up) {
		animation: slide-down-out 0.3s ease-in forwards;
	}

	@keyframes slide-down-out {
		0% {
			transform: translate(-50%, -30%); /* Start from final position, centered */
			opacity: 1;
		}
		100% {
			transform: translate(-50%, 100px); /* Slide back down, centered */
			opacity: 0;
		}
	}
</style>
