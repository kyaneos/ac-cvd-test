/**
 * Data Manager for Ember's Color Vision Test Results
 * Handles localStorage persistence and CSV export functionality
 */

const STORAGE_KEY = 'ember_color_vision_results';
const USER_KEY = 'ember_user_settings';

export class DataManager {
	constructor() {
		this.sessionData = {
			startTime: null,
			endTime: null,
			results: [],
			totalQuestions: 0,
			correctAnswers: 0,
			averageDifficulty: 0,
			categoriesAnalysis: {},
			userAgent: navigator.userAgent,
			timestamp: null
		};
	}

	// Initialize new session
	startSession(totalQuestions = 0) {
		this.sessionData = {
			startTime: new Date().toISOString(),
			endTime: null,
			results: [],
			totalQuestions,
			correctAnswers: 0,
			averageDifficulty: 0,
			categoriesAnalysis: {},
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			version: '1.0.0'
		};

		console.log('New color vision test session started');
	}

	// Add single test result
	addResult(testResult) {
		const enrichedResult = {
			...testResult,
			timestamp: new Date().toISOString(),
			roundNumber: this.sessionData.results.length + 1
		};

		this.sessionData.results.push(enrichedResult);
		this.updateAnalytics();
		this.saveToLocalStorage();
	}

	// Complete session
	endSession() {
		this.sessionData.endTime = new Date().toISOString();
		this.updateAnalytics();
		this.saveToLocalStorage();

		console.log('Color vision test session completed', this.sessionData);
	}

	// Update analytics calculations
	updateAnalytics() {
		const results = this.sessionData.results;
		if (results.length === 0) return;

		// Basic statistics
		this.sessionData.correctAnswers = results.filter((r) => r.isCorrect).length;
		this.sessionData.totalQuestions = results.length;

		// Average difficulty
		const totalDifficulty = results.reduce((sum, r) => sum + (r.difficulty || 1), 0);
		this.sessionData.averageDifficulty = totalDifficulty / results.length;

		// Category analysis
		const categories = {};
		results.forEach((result) => {
			const category = result.category || 'unknown';
			if (!categories[category]) {
				categories[category] = { total: 0, correct: 0, accuracy: 0 };
			}
			categories[category].total++;
			if (result.isCorrect) {
				categories[category].correct++;
			}
			categories[category].accuracy =
				(categories[category].correct / categories[category].total) * 100;
		});

		this.sessionData.categoriesAnalysis = categories;
	}

	// Save to localStorage
	saveToLocalStorage() {
		try {
			const existingData = this.getAllStoredResults();
			const newData = [...existingData, { ...this.sessionData }];

			localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
			console.log('Session data saved to localStorage');
		} catch (error) {
			console.error('Failed to save to localStorage:', error);
		}
	}

	// Get all stored results
	getAllStoredResults() {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Failed to load from localStorage:', error);
			return [];
		}
	}

	// Get current session
	getCurrentSession() {
		return this.sessionData;
	}

	// Export to CSV
	exportToCSV() {
		const results = this.sessionData.results;
		if (results.length === 0) {
			console.warn('No results to export');
			return null;
		}

		// CSV Headers
		const headers = [
			'Round',
			'Reference Color',
			'Option 1',
			'Option 2',
			'User Choice',
			'Correct Choice',
			'Is Correct',
			'Difficulty Level',
			'Category',
			'Response Time (ms)',
			'Timestamp'
		];

		// CSV Rows
		const rows = results.map((result) => [
			result.roundNumber || '',
			result.referenceColor || '',
			result.options?.[0] || '',
			result.options?.[1] || '',
			result.userChoice !== undefined ? result.options?.[result.userChoice] || '' : '',
			result.correctChoice !== undefined ? result.options?.[result.correctChoice] || '' : '',
			result.isCorrect ? 'Yes' : 'No',
			result.difficulty || '',
			result.category || '',
			result.responseTime || '',
			result.timestamp || ''
		]);

		// Combine headers and rows
		const csvContent = [
			headers.join(','),
			...rows.map((row) =>
				row
					.map((field) => (typeof field === 'string' && field.includes(',') ? `"${field}"` : field))
					.join(',')
			)
		].join('\n');

		// Add session summary at the end
		const summary = [
			'',
			'--- Session Summary ---',
			`Total Questions,${this.sessionData.totalQuestions}`,
			`Correct Answers,${this.sessionData.correctAnswers}`,
			`Accuracy,${((this.sessionData.correctAnswers / this.sessionData.totalQuestions) * 100).toFixed(1)}%`,
			`Average Difficulty,${this.sessionData.averageDifficulty.toFixed(2)}`,
			`Start Time,${this.sessionData.startTime}`,
			`End Time,${this.sessionData.endTime}`,
			`Total Duration,${this.getSessionDuration()}`
		];

		const finalCSV = csvContent + '\n' + summary.join('\n');

		return finalCSV;
	}

	// Download CSV file
	downloadCSV(filename = null) {
		const csv = this.exportToCSV();
		if (!csv) return false;

		const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
		const defaultFilename = `ember-color-vision-test-${timestamp}.csv`;
		const finalFilename = filename || defaultFilename;

		try {
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');

			if (link.download !== undefined) {
				const url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', finalFilename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				console.log(`CSV exported successfully as ${finalFilename}`);
				return true;
			}
		} catch (error) {
			console.error('Failed to download CSV:', error);
			return false;
		}

		return false;
	}

	// Export to JSON
	exportToJSON() {
		return JSON.stringify(this.sessionData, null, 2);
	}

	// Download JSON file
	downloadJSON(filename = null) {
		const json = this.exportToJSON();
		const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
		const defaultFilename = `ember-color-vision-test-${timestamp}.json`;
		const finalFilename = filename || defaultFilename;

		try {
			const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
			const link = document.createElement('a');

			if (link.download !== undefined) {
				const url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', finalFilename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				console.log(`JSON exported successfully as ${finalFilename}`);
				return true;
			}
		} catch (error) {
			console.error('Failed to download JSON:', error);
			return false;
		}

		return false;
	}

	// Get session duration
	getSessionDuration() {
		if (!this.sessionData.startTime || !this.sessionData.endTime) {
			return 'In progress';
		}

		const start = new Date(this.sessionData.startTime);
		const end = new Date(this.sessionData.endTime);
		const durationMs = end - start;
		const minutes = Math.floor(durationMs / 60000);
		const seconds = Math.floor((durationMs % 60000) / 1000);

		return `${minutes}m ${seconds}s`;
	}

	// Clear all stored data
	clearAllData() {
		try {
			localStorage.removeItem(STORAGE_KEY);
			localStorage.removeItem(USER_KEY);
			console.log('All stored data cleared');
			return true;
		} catch (error) {
			console.error('Failed to clear stored data:', error);
			return false;
		}
	}

	// Get analytics summary
	getAnalyticsSummary() {
		const allResults = this.getAllStoredResults();
		if (allResults.length === 0) return null;

		const totalSessions = allResults.length;
		let totalQuestions = 0;
		let totalCorrect = 0;
		const allCategories = {};

		allResults.forEach((session) => {
			totalQuestions += session.totalQuestions || 0;
			totalCorrect += session.correctAnswers || 0;

			Object.entries(session.categoriesAnalysis || {}).forEach(([category, data]) => {
				if (!allCategories[category]) {
					allCategories[category] = { total: 0, correct: 0 };
				}
				allCategories[category].total += data.total;
				allCategories[category].correct += data.correct;
			});
		});

		// Calculate category accuracies
		Object.keys(allCategories).forEach((category) => {
			const data = allCategories[category];
			data.accuracy = (data.correct / data.total) * 100;
		});

		return {
			totalSessions,
			totalQuestions,
			totalCorrect,
			overallAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
			categoriesAnalysis: allCategories,
			lastSessionDate: allResults[allResults.length - 1]?.startTime
		};
	}
}

// Create singleton instance
export const dataManager = new DataManager();
