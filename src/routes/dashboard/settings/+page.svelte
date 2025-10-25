<script>
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import pb from '$lib/pocketbase.js';

	let auth = $derived($frameworkAuthStore);
	let severity = $state(auth.user?.cvd_severity || 0.6);
	let severityKnown = $state(auth.user?.cvd_severity != null);
	let saving = $state(false);
	let saveMessage = $state('');

	async function saveSeverity() {
		saving = true;
		saveMessage = '';

		try {
			const severityValue = severityKnown ? severity : null;

			await pb.collection('colorvision_users').update(auth.user.id, {
				cvd_severity: severityValue
			});

			// Update local auth store
			await frameworkAuthStore.refresh();

			saveMessage = 'Settings saved successfully!';
			setTimeout(() => {
				saveMessage = '';
			}, 3000);
		} catch (error) {
			console.error('Error saving severity:', error);
			saveMessage = 'Error saving settings. Please try again.';
		} finally {
			saving = false;
		}
	}

	// Reset severity to default when unchecking "I know my severity"
	$effect(() => {
		if (!severityKnown) {
			severity = 0.6;
		}
	});
</script>

<div class="settings-page">
	<h2>Settings</h2>

	<div class="settings-section">
		<h3>CVD Severity</h3>

		<label class="checkbox-label">
			<input type="checkbox" bind:checked={severityKnown} />
			I know my CVD severity from previous diagnosis
		</label>

		{#if severityKnown}
			<div class="severity-control">
				<label for="severity">
					Severity: <strong>{(severity * 100).toFixed(0)}%</strong>
				</label>

				<input type="range" id="severity" bind:value={severity} min="0" max="1" step="0.05" />

				<div class="severity-labels">
					<span>Mild (0%)</span>
					<span>Medium (50%)</span>
					<span>Severe (100%)</span>
				</div>

				<p class="help-text">
					Adjust this slider to match your diagnosed severity. This will improve the accuracy of
					initial color tests and visualization in the Image Converter.
				</p>
			</div>
		{:else}
			<p class="help-text">
				If you're unsure of your severity, leave this unchecked. The system will use a default
				medium severity (60%) and learn your actual perception through adaptive testing.
			</p>
		{/if}
	</div>

	<div class="save-section">
		<button class="save-btn" onclick={saveSeverity} disabled={saving}>
			{saving ? 'Saving...' : 'Save Settings'}
		</button>

		{#if saveMessage}
			<p class="save-message" class:error={saveMessage.includes('Error')}>
				{saveMessage}
			</p>
		{/if}
	</div>

	<div class="info-section">
		<h3>About Severity</h3>
		<ul>
			<li>
				<strong>Mild (0-40%):</strong> Slight difficulty distinguishing certain colors, mostly in specific
				lighting
			</li>
			<li>
				<strong>Medium (40-70%):</strong> Noticeable difficulty with problematic color pairs
			</li>
			<li>
				<strong>Severe (70-100%):</strong> Significant difficulty, approaching dichromacy
			</li>
		</ul>
	</div>
</div>

<style>
	.settings-page {
		max-width: 800px;
		margin: 0 auto;
	}

	h2 {
		font-size: 32px;
		margin-bottom: 30px;
		color: #000000;
		border-bottom: 3px solid #000000;
		padding-bottom: 10px;
	}

	h3 {
		font-size: 20px;
		margin-bottom: 15px;
		color: #000000;
	}

	.settings-section {
		background: #f9f9f9;
		border: 2px solid #000000;
		border-radius: 8px;
		padding: 25px;
		margin-bottom: 25px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 16px;
		cursor: pointer;
		margin-bottom: 20px;
	}

	.checkbox-label input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.severity-control {
		margin-top: 20px;
		padding: 20px;
		background: #ffffff;
		border: 1px solid #cccccc;
		border-radius: 4px;
	}

	.severity-control label {
		display: block;
		font-size: 18px;
		margin-bottom: 15px;
		color: #000000;
	}

	.severity-control strong {
		color: #cc0000;
	}

	input[type='range'] {
		width: 100%;
		height: 8px;
		background: linear-gradient(to right, #90ee90, #ffd700, #ff6347);
		border-radius: 4px;
		outline: none;
		margin-bottom: 10px;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 24px;
		height: 24px;
		background: #000000;
		border: 3px solid #ffffff;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input[type='range']::-moz-range-thumb {
		width: 24px;
		height: 24px;
		background: #000000;
		border: 3px solid #ffffff;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.severity-labels {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: #666666;
		margin-bottom: 15px;
	}

	.help-text {
		font-size: 14px;
		color: #666666;
		line-height: 1.6;
		margin: 0;
	}

	.save-section {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: 25px;
	}

	.save-btn {
		padding: 15px 40px;
		font-family: 'Average', serif;
		font-size: 18px;
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.save-btn:hover:not(:disabled) {
		background: #ffffff;
		color: #000000;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.save-message {
		font-size: 16px;
		color: #228b22;
		margin: 0;
	}

	.save-message.error {
		color: #cc0000;
	}

	.info-section {
		background: #f0f0f0;
		border-left: 4px solid #000000;
		padding: 20px;
		border-radius: 4px;
	}

	.info-section ul {
		margin: 10px 0 0 0;
		padding-left: 20px;
	}

	.info-section li {
		margin-bottom: 10px;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.settings-page {
			padding: 0;
		}

		h2 {
			font-size: 24px;
		}

		.settings-section {
			padding: 20px;
		}

		.save-section {
			flex-direction: column;
			align-items: flex-start;
		}

		.save-btn {
			width: 100%;
		}
	}
</style>
