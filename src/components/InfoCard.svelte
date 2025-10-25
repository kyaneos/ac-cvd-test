<script>
	import { wiiSounds } from '../utils/wiiSounds.js';

	let isOpen = $state(false);
	let activeTab = $state('love'); // 'love' or 'technical'

	function toggleCard() {
		wiiSounds.play('select');
		isOpen = !isOpen;
	}

	function switchTab(tab) {
		wiiSounds.play('hover');
		activeTab = tab;
	}
</script>

<div class="info-card-container">
	<button class="info-toggle" onmouseenter={() => wiiSounds.play('hover')} onclick={toggleCard}>
		{isOpen ? '✖' : 'ℹ'}
	</button>

	{#if isOpen}
		<div class="info-card">
			<div class="card-header">
				<h3>About This App</h3>
				<button class="close-btn" onmouseenter={() => wiiSounds.play('hover')} onclick={toggleCard}
					>✖</button
				>
			</div>

			<div class="tab-container">
				<div class="tab-buttons">
					<button
						class="tab-btn"
						class:active={activeTab === 'love'}
						onclick={() => switchTab('love')}
						onmouseenter={() => wiiSounds.play('hover')}
					>
						💝 Love Letter
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'technical'}
						onclick={() => switchTab('technical')}
						onmouseenter={() => wiiSounds.play('hover')}
					>
						⚙️ Technical
					</button>
				</div>

				<div class="tab-content">
					{#if activeTab === 'love'}
						<div class="love-letter-tab">
							<div class="heart-header">💕</div>
							<h4>A Special Color Journey</h4>
							<p class="love-message">
								This adaptive color assessment was built with love to help understand your unique
								way of seeing colors. Each question is carefully chosen by an intelligent system
								that learns from your responses.
							</p>
							<p class="love-message">
								The "Switch it up!" button lets you explore the full spectrum of colors, building a
								comprehensive map of how you perceive the world.
							</p>
							<div class="love-signature">
								<em>Created with 💖 using Animal Crossing charm</em>
							</div>
						</div>
					{/if}

					{#if activeTab === 'technical'}
						<div class="technical-tab">
							<h4>🔬 Bayesian Adaptive Testing</h4>
							<p class="tech-explanation">
								This system uses advanced Bayesian inference to optimize color vision assessment:
							</p>
							<ul class="tech-list">
								<li>
									<strong>Adaptive Question Selection:</strong> Uses information gain calculations to
									choose the most informative color pairs
								</li>
								<li>
									<strong>Exploration Mode:</strong> Systematically maps unexplored color regions for
									comprehensive assessment
								</li>
								<li>
									<strong>Confidence Tracking:</strong> Real-time confidence intervals using beta distributions
								</li>
								<li>
									<strong>11 Color Axes:</strong> Tests red-green, brown variations, pastels, dark colors,
									and more
								</li>
								<li>
									<strong>No Auto-Termination:</strong> Continue testing indefinitely for maximum precision
								</li>
							</ul>

							<div class="algorithm-note">
								<h5>🧠 How It Works</h5>
								<p>
									The system maintains posterior belief distributions for each color confusion axis,
									updating them with every response using Bayesian updating. Information gain is
									calculated as entropy reduction, weighted by axis importance.
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.info-card-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
	}

	.info-toggle {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: #4a90e2;
		color: white;
		border: 2px solid #fff;
		font-size: 18px;
		cursor: pointer;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.info-toggle:hover {
		background: #357abd;
		transform: scale(1.1);
	}

	.info-card {
		position: absolute;
		bottom: 60px;
		right: 0;
		width: 400px;
		background: #ffffff;
		border: 2px solid #d2691e;
		border-radius: 12px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
		animation: slideUp 0.3s ease;
		overflow: hidden;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		border-bottom: 2px solid #d2691e;
		background: linear-gradient(135deg, #fdf8e3, #f5e6d3);
		border-radius: 0;
	}

	.card-header h3 {
		margin: 0;
		color: #8b4513;
		font-size: 18px;
		font-weight: 700;
		font-family: 'Nunito', sans-serif;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 16px;
		color: #999;
		cursor: pointer;
		padding: 5px;
		border-radius: 3px;
		transition: background 0.2s;
	}

	.close-btn:hover {
		background: #e0e0e0;
	}

	.tab-container {
		max-height: 450px;
		overflow: hidden;
	}

	.tab-buttons {
		display: flex;
		border-bottom: 2px solid #e0e0e0;
		background: #f8f8f8;
	}

	.tab-btn {
		flex: 1;
		padding: 12px 16px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		color: #666;
		transition: all 0.3s ease;
		border-bottom: 3px solid transparent;
	}

	.tab-btn:hover {
		background: #eeeeee;
		color: #333;
	}

	.tab-btn.active {
		color: #4a90e2;
		border-bottom-color: #4a90e2;
		background: #fff;
	}

	.tab-content {
		padding: 20px;
		max-height: 350px;
		overflow-y: auto;
	}

	/* Love Letter Tab Styles */
	.love-letter-tab {
		text-align: center;
	}

	.heart-header {
		font-size: 32px;
		margin-bottom: 15px;
		animation: heartbeat 2s ease-in-out infinite;
	}

	@keyframes heartbeat {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.love-letter-tab h4 {
		color: #ff6b9d;
		font-size: 16px;
		margin-bottom: 15px;
		font-weight: 700;
	}

	.love-message {
		color: #555;
		line-height: 1.6;
		margin-bottom: 15px;
		font-size: 14px;
		text-align: left;
	}

	.love-signature {
		margin-top: 20px;
		padding: 10px;
		background: #fff5f5;
		border-radius: 8px;
		border: 1px solid #ffe0e6;
		font-size: 13px;
		color: #ff6b9d;
	}

	/* Technical Tab Styles */
	.technical-tab h4 {
		color: #4a90e2;
		font-size: 16px;
		margin-bottom: 10px;
		font-weight: 700;
	}

	.tech-explanation {
		color: #555;
		margin-bottom: 15px;
		font-size: 14px;
		line-height: 1.5;
	}

	.tech-list {
		margin: 0 0 20px 0;
		padding-left: 0;
		list-style: none;
	}

	.tech-list li {
		margin-bottom: 12px;
		padding: 8px 12px;
		background: #f8f9fa;
		border-radius: 6px;
		border-left: 3px solid #4a90e2;
		font-size: 13px;
		line-height: 1.4;
		color: #555;
	}

	.tech-list strong {
		color: #333;
	}

	.algorithm-note {
		background: #e8f4fd;
		padding: 15px;
		border-radius: 8px;
		border: 1px solid #b3d9ff;
		margin-top: 15px;
	}

	.algorithm-note h5 {
		margin: 0 0 10px 0;
		color: #2c5282;
		font-size: 14px;
		font-weight: 700;
	}

	.algorithm-note p {
		margin: 0;
		color: #2c5282;
		font-size: 12px;
		line-height: 1.4;
	}

	/* Mobile responsive */
	@media (max-width: 450px) {
		.info-card {
			width: 320px;
			right: -10px;
		}

		.tab-content {
			padding: 15px;
			max-height: 300px;
		}

		.love-message,
		.tech-explanation {
			font-size: 13px;
		}

		.tech-list li {
			font-size: 12px;
			padding: 6px 10px;
		}
	}
</style>
