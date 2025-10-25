<script>
	import { createEventDispatcher } from 'svelte';
	import { BayesianColorAssessment } from '../utils/adaptiveBayesian.js';
	import {
		initializeSounds,
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
	import { testStateHelpers, adaptiveTestState } from '../lib/stores.js';
	import { onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();

	// Adaptive testing engine
	let bayesianAssessment = new BayesianColorAssessment();

	// Core state
	let currentTest = $state(null);
	let testResults = $state([]);
	let isTestComplete = $state(false);
	let showFeedback = $state(false);
	let lastAnswer = $state(null);
	let currentDialogue = $state('');
	let isTyping = $state(false);
	let showOptions = $state(false);
	let characterMood = $state('neutral');
	let waitingForClick = $state(false);
	let gameStarted = $state(false);
	let currentDialogueIndex = $state(0);
	let currentDialogueSet = $state('intro');
	let roverIsSpeaking = $state(false);
	let characterName = $state('?????');
	let showDialogue = $state(true);
	let lastQuestionStartTime = 0;

	// Adaptive-specific state
	let currentStats = $state({
		questionsAsked: 0,
		confidenceLevel: 0,
		isReliable: false,
		explorationMode: false,
		axesExplored: 0,
		totalAxes: 0
	});
	let assessmentPhase = $state('intro'); // 'intro' | 'testing' | 'complete'

	// Simplified dialogue system for adaptive testing (technical details moved to info card)
	const dialogues = {
		intro: [
			'Well hey there! Always nice to meet someone new!',
			"Name's Rover - I do a lot of traveling, you know.",
			"I've been working on something pretty exciting lately...",
			"It's a smart color vision assessment that learns as we go!",
			'Each answer you give helps the system get smarter about what to ask next!',
			'Want to help me try it out? The more questions you answer, the better it gets!'
		],
		firstQuestion: [
			'Great! This system will learn from each response you give.',
			'The algorithm gets smarter with every answer - pretty neat, right?',
			'Ready for your first question? Here we go!'
		],
		adaptiveQuestions: [
			'Interesting! The system is learning from that response.',
			"Based on your previous answers, here's what I want to try next:",
			'The algorithm picked this pair just for you:',
			"Perfect! That tells me a lot. Let's try this combination:",
			'The system is getting smarter about your color vision. How about this one:',
			"Great! Here's a pair that should be really helpful:",
			'This next question is picked specifically based on your answers:',
			'The system suggests this particular comparison:',
			"Wonderful! Let's try this color pair:",
			'Based on your pattern of responses, how about this one:'
		],
		adaptiveCorrect: [
			'Perfect! The system is learning about your color vision.',
			"Excellent! That's really helpful information.",
			'Great job! The algorithm is getting smarter.',
			'Spot on! This helps the system understand your vision better.',
			'Wonderful! The assessment is becoming more accurate.',
			'Brilliant! Each answer helps build a better picture.',
			'Outstanding! The system is getting more confident.',
			'Fantastic! That response was really informative.',
			'Superb! The system loves that kind of clear answer.',
			'Amazing! This helps the algorithm make better choices.'
		],
		adaptiveIncorrect: [
			"Interesting! That's exactly what the system needed to know.",
			'Great! Responses like this are super helpful for learning.',
			"That's valuable information! Color patterns are fascinating.",
			'Perfect! This tells the system a lot about how you see colors.',
			'Excellent! The algorithm can focus on similar areas now.',
			'This is great data! Every response helps the system learn.',
			'Wonderful! The system is mapping how you see different colors.',
			"That's really useful! The system is learning your patterns.",
			'Perfect! This helps the algorithm choose better questions.',
			'Brilliant! The system can make smarter choices now.'
		],
		confidenceBuilding: [
			"The system's confidence is growing! We're getting a really good picture.",
			'Excellent! The system is becoming more sure about your color vision.',
			"Perfect! We're gathering really useful data efficiently.",
			'The system is really happy with how helpful your responses are!'
		],
		reliable: [
			'Great news! The system has enough data to make reliable conclusions about your color vision.',
			'The algorithm is confident enough now to give you accurate results!',
			'Perfect! We have reliable data, but you can keep going if you want more precision.',
			'The system has learned enough to be confident, but more questions always help!'
		]
	};

	// Progress tracking
	let typewriterActive = false;
	let currentTypewriterText = '';

	async function typewriterEffect(text) {
		currentDialogue = '';
		isTyping = true;
		console.log('AdaptiveColorTest: TypewriterEffect started, setting isTyping = true');
		waitingForClick = false;
		showOptions = false;
		typewriterActive = true;
		currentTypewriterText = text;

		for (let i = 0; i < text.length; i++) {
			if (!typewriterActive) break;

			currentDialogue = text.slice(0, i + 1);

			const char = text[i];
			if (char && char !== ' ') {
				playDialogueCharacter(char, characterMood);
			}

			await new Promise((resolve) => setTimeout(resolve, 65));
		}

		isTyping = false;
		console.log('AdaptiveColorTest: TypewriterEffect ended, setting isTyping = false');
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
		await initializeSounds();
		dataManager.startSession('adaptive'); // Mark as adaptive test
		characterMood = 'neutral';
		currentDialogueSet = 'intro';
		currentDialogueIndex = 0;
		assessmentPhase = 'intro';
		gameStarted = false;

		setTimeout(() => {
			typewriterEffect(dialogues.intro[0]);
		}, 3000);
	}

	function handleDialogueClick() {
		console.log(
			'AdaptiveColorTest: handleDialogueClick called, isTyping:',
			isTyping,
			'waitingForClick:',
			waitingForClick
		);
		playButtonClick();

		if (isTyping) {
			skipToEndOfCurrentDialogue();
			return;
		}

		if (currentDialogueSet === 'intro') {
			currentDialogueIndex++;

			// After Rover introduces himself
			if (currentDialogueIndex === 2) {
				characterName = 'Rover';
				// Persist character name and dialogue progress
				adaptiveTestState.update((state) => ({
					...state,
					characterName: 'Rover',
					currentDialogueIndex,
					currentDialogueSet
				}));
			}

			// After user agrees to help with adaptive testing
			if (currentDialogueIndex === 5) {
				characterMood = 'excited';
			}

			if (currentDialogueIndex >= dialogues.intro.length) {
				// Intro complete, explain adaptive testing
				currentDialogueSet = 'firstQuestion';
				currentDialogueIndex = 0;
				characterMood = 'thinking';
				typewriterEffect(dialogues.firstQuestion[0]);
			} else {
				typewriterEffect(dialogues.intro[currentDialogueIndex]);
			}
		} else if (currentDialogueSet === 'firstQuestion') {
			currentDialogueIndex++;
			if (currentDialogueIndex >= dialogues.firstQuestion.length) {
				// Start adaptive testing
				assessmentPhase = 'testing';
				currentDialogueSet = 'question';
				gameStarted = true;
				playTestStart();
				startNextAdaptiveQuestion();
			} else {
				typewriterEffect(dialogues.firstQuestion[currentDialogueIndex]);
			}
		} else if (currentDialogueSet === 'question' && !isTyping && waitingForClick) {
			// User clicked after question finished typing - show color picker
			showDialogue = false;
			setTimeout(() => {
				showOptions = true;
				lastQuestionStartTime = Date.now();
			}, 300);
		} else if (currentDialogueSet === 'feedback') {
			// After feedback, always continue (no auto-termination)
			setTimeout(() => {
				startNextAdaptiveQuestion();
			}, 500);
		} else if (currentDialogueSet === 'complete') {
			currentDialogueIndex++;
			if (currentDialogueIndex >= dialogues.complete.length) {
				// Test truly complete
				dataManager.endSession();
				isTestComplete = true;
				const report = bayesianAssessment.generateReport();
				dispatch('complete', {
					results: testResults,
					adaptiveReport: report,
					sessionData: dataManager.getCurrentSession()
				});
			} else {
				typewriterEffect(dialogues.complete[currentDialogueIndex]);
			}
		}

		waitingForClick = false;
	}

	function switchUpTesting() {
		playButtonClick();
		bayesianAssessment.toggleExplorationMode();
		currentStats = bayesianAssessment.getCurrentStats();

		console.log('AdaptiveColorTest: Switched to exploration mode:', currentStats.explorationMode);
	}

	function startNextAdaptiveQuestion() {
		// Get next optimal color pair from Bayesian engine
		currentTest = bayesianAssessment.selectNextColorPair();
		currentStats = bayesianAssessment.getCurrentStats();

		console.log('AdaptiveColorTest: Next question selected:', currentTest);

		// Set dialogue state for question
		currentDialogueSet = 'question';
		showDialogue = true;
		showOptions = false;

		// Choose appropriate dialogue based on progress
		let questionDialogue;
		if (currentStats.questionsAsked === 0) {
			questionDialogue = "Let's start with this color comparison:";
		} else if (currentStats.isReliable && Math.random() < 0.3) {
			questionDialogue = getRandomDialogue(dialogues.reliable);
		} else if (currentStats.confidenceLevel > 0.7) {
			questionDialogue = getRandomDialogue(dialogues.confidenceBuilding);
		} else {
			questionDialogue = getRandomDialogue(dialogues.adaptiveQuestions);
		}

		characterMood = 'thinking';
		typewriterEffect(questionDialogue);
	}

	function getRandomDialogue(dialogueArray) {
		return dialogueArray[Math.floor(Math.random() * dialogueArray.length)];
	}

	async function selectColor(index) {
		if (showFeedback || isTyping || !showOptions) return;

		playButtonClick();

		// Hide color picker and show dialogue
		showOptions = false;
		setTimeout(() => {
			showDialogue = true;
		}, 200);

		const isCorrect = index === currentTest.correct;
		const responseTime = Date.now() - lastQuestionStartTime;
		lastAnswer = { index, isCorrect };
		showFeedback = true;

		// Play feedback sound
		if (isCorrect) {
			playCorrectAnswer();
			characterMood = 'excited';
		} else {
			playIncorrectAnswer();
			characterMood = 'encouraging';
		}

		// Update Bayesian assessment
		bayesianAssessment.updateBeliefs(currentTest, isCorrect, responseTime);
		currentStats = bayesianAssessment.getCurrentStats();

		// Record result
		const result = {
			...currentTest,
			selected: index,
			correct: isCorrect,
			timestamp: Date.now(),
			responseTime,
			bayesianStats: { ...currentStats }
		};

		testResults.push(result);
		dataManager.addResult(result);

		// Save adaptive test progress using proper serialization
		adaptiveTestState.update((state) => ({
			...state,
			bayesianState: bayesianAssessment.exportState(),
			testResults,
			currentStats,
			assessmentPhase,
			gameStarted
		}));

		console.log(
			'AdaptiveColorTest: Progress saved after question',
			currentStats.questionsAsked,
			'- Confidence:',
			Math.round(currentStats.confidenceLevel * 100) + '%'
		);

		// Choose feedback dialogue
		const feedbackArray = isCorrect ? dialogues.adaptiveCorrect : dialogues.adaptiveIncorrect;
		const feedback = getRandomDialogue(feedbackArray);

		currentDialogueSet = 'feedback';
		showFeedback = false;
		lastAnswer = null;

		typewriterEffect(feedback);
	}

	function completeAdaptiveTest() {
		assessmentPhase = 'complete';
		currentDialogueSet = 'complete';
		currentDialogueIndex = 0;
		characterMood = 'celebrate';

		console.log('AdaptiveColorTest: Test complete, generating report');
		const report = bayesianAssessment.generateReport();
		console.log('Adaptive Assessment Report:', report);

		typewriterEffect(dialogues.complete[0]);
	}

	function resetTest() {
		bayesianAssessment = new BayesianColorAssessment();
		testResults = [];
		currentStats = bayesianAssessment.getCurrentStats();
		assessmentPhase = 'intro';
		isTestComplete = false;
		showFeedback = false;
		lastAnswer = null;
		characterMood = 'neutral';
		characterName = '?????';
		gameStarted = false;
		currentDialogueIndex = 0;
		currentDialogueSet = 'intro';
		showDialogue = true;
		showOptions = false;

		// Clear adaptive test state when resetting
		adaptiveTestState.update((state) => ({
			...state,
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
			gameStarted: false
		}));
		startGame();
	}

	onMount(() => {
		// Try to restore saved adaptive state
		adaptiveTestState.subscribe((state) => {
			if (state.isActive && state.gameStarted && !gameStarted) {
				console.log(
					'AdaptiveColorTest: Restoring saved state with',
					state.bayesianState?.responseHistory?.length || 0,
					'responses'
				);

				// Restore character and dialogue state first
				characterName = state.characterName || 'Rover';
				characterMood = state.characterMood || 'neutral';
				currentDialogueIndex = state.currentDialogueIndex || 0;
				currentDialogueSet = state.currentDialogueSet || 'intro';
				assessmentPhase = state.assessmentPhase || 'intro';

				// If we have Bayesian state, restore the test
				if (state.bayesianState) {
					bayesianAssessment = new BayesianColorAssessment();
					bayesianAssessment.importState(state.bayesianState);

					testResults = state.testResults || [];
					gameStarted = true;
					currentStats = bayesianAssessment.getCurrentStats();

					console.log(
						'AdaptiveColorTest: Test state restored - Questions:',
						currentStats.questionsAsked,
						'Confidence:',
						Math.round(currentStats.confidenceLevel * 100) + '%'
					);

					// Continue testing where we left off
					if (currentStats.questionsAsked > 0) {
						startNextAdaptiveQuestion();
					}
				} else {
					// Restore dialogue progression without test data
					if (assessmentPhase === 'testing') {
						gameStarted = true;
						startNextAdaptiveQuestion();
					} else {
						// Continue from where dialogue left off
						startGame();
					}
				}

				return;
			}
		});

		// Start fresh if no saved state
		if (!gameStarted) {
			startGame();
		}
	});

	onDestroy(() => {
		// Save adaptive test state with all dialogue and character information
		adaptiveTestState.update((state) => ({
			...state,
			bayesianState: bayesianAssessment ? bayesianAssessment.exportState() : null,
			testResults,
			currentStats,
			assessmentPhase,
			gameStarted,
			isActive: gameStarted && !isTestComplete, // Keep active if test is ongoing
			characterName,
			characterMood,
			currentDialogueIndex,
			currentDialogueSet
		}));

		if (gameStarted) {
			console.log(
				'AdaptiveColorTest: Saved state -',
				currentStats.questionsAsked,
				'questions,',
				Math.round(currentStats.confidenceLevel * 100) + '% confidence'
			);
		}
	});
</script>

<div class="game-container">
	<div class="character-area">
		<RoverModel mood={characterMood} isSpeaking={roverIsSpeaking} />
	</div>

	<!-- Switch It Up Button -->
	{#if assessmentPhase === 'testing' && gameStarted}
		<div class="switch-up-button">
			<button
				class="switch-btn"
				class:exploration-mode={currentStats.explorationMode}
				onclick={switchUpTesting}
				onmouseenter={() => wiiSounds.play('hover')}
			>
				{currentStats.explorationMode ? '🎯 Focus Mode' : '🌈 Switch it up!'}
			</button>
		</div>
	{/if}

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
				console.log(
					'AdaptiveColorTest: ACDialogue speaking changed to',
					speaking,
					'roverIsSpeaking will be set to',
					speaking
				);
				roverIsSpeaking = speaking;
			}}
			onTextComplete={() => {}}
			onclick={handleDialogueClick}
		>
			{#snippet children()}{/snippet}
		</ACDialogue>
	{/if}

	{#if !isTestComplete && currentTest && showOptions && gameStarted}
		<div class="color-display">
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

	{#if isTestComplete}
		<div class="completion-area">
			<div class="adaptive-results">
				<h3>Adaptive Assessment Complete!</h3>
				<div class="result-summary">
					<div class="result-stat">
						<span class="result-label">Total Questions:</span>
						<span class="result-value">{currentStats.questionsAsked}</span>
					</div>
					<div class="result-stat">
						<span class="result-label">Final Confidence:</span>
						<span class="result-value">{Math.round(currentStats.confidenceLevel * 100)}%</span>
					</div>
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
				Try Again!
			</button>
		</div>
	{/if}

	<!-- Integrated Confidence Meter (bottom-left) -->
	<div class="progress-counter">
		<div class="counter-text">
			<span class="colors-matched">{currentStats.questionsAsked} Colors matched</span>
			<span class="confidence-level" class:reliable={currentStats.isReliable}>
				{Math.round(currentStats.confidenceLevel * 100)}% Confidence
			</span>
		</div>
		{#if currentStats.isReliable}
			<div class="reliable-badge">Reliable ✓</div>
		{/if}
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

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
		overflow: hidden;
	}

	.character-area {
		text-align: center;
		margin-bottom: 40px;
		padding-top: 20px;
	}

	/* Switch It Up Button */
	.switch-up-button {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 100;
	}

	.switch-btn {
		background: linear-gradient(135deg, #45b7d1, #96ceb4);
		color: white;
		border: none;
		padding: 12px 20px;
		border-radius: 25px;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border: 2px solid #fff;
	}

	.switch-btn:hover {
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	.switch-btn.exploration-mode {
		background: linear-gradient(135deg, #ff6b6b, #ff8e53);
	}

	/* Integrated Progress Counter (bottom-left) */
	.progress-counter {
		position: fixed;
		bottom: 20px;
		left: 20px;
		background: #fff8f0;
		z-index: 100;
		padding: 12px 16px;
		border-radius: 20px;
		border: 2px solid #d2691e;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 160px;
	}

	.counter-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.colors-matched {
		font-size: 14px;
		font-weight: 700;
		color: #8b4513;
	}

	.confidence-level {
		font-size: 12px;
		font-weight: 600;
		color: #2d2416;
	}

	.confidence-level.reliable {
		color: #4caf50;
		font-weight: 700;
	}

	.reliable-badge {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #4caf50;
		color: white;
		font-size: 10px;
		font-weight: 700;
		padding: 4px 8px;
		border-radius: 12px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
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
		top: 75%;
		left: 50%;
		transform: translate(-50%, 100px);
		opacity: 0;
		animation: slide-up-into-place 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		z-index: 10;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(8px);
		padding: 30px;
		border-radius: 20px;
		border: 3px solid #d2691e;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 30px;
	}

	@keyframes slide-up-into-place {
		0% {
			transform: translate(-50%, 100px);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -30%);
			opacity: 1;
		}
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
		backdrop-filter: blur(8px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.adaptive-results h3 {
		color: #8b4513;
		margin-bottom: 20px;
		font-size: 24px;
	}

	.result-summary {
		display: flex;
		justify-content: space-around;
		margin-bottom: 30px;
	}

	.result-stat {
		text-align: center;
	}

	.result-label {
		display: block;
		font-size: 14px;
		color: #8b4513;
		font-weight: 600;
		margin-bottom: 5px;
	}

	.result-value {
		display: block;
		font-size: 24px;
		color: #2d2416;
		font-weight: 800;
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

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.switch-up-button {
			position: relative;
			top: auto;
			right: auto;
			margin-bottom: 20px;
			width: 100%;
			text-align: center;
		}

		.progress-counter {
			position: relative;
			bottom: auto;
			left: auto;
			margin: 20px auto;
			text-align: center;
		}

		.color-display {
			width: 95%;
			padding: 20px;
			gap: 20px;
			flex-direction: column;
		}

		.color-options {
			justify-content: center;
		}
	}
</style>
