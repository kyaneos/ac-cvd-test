/**
 * Save a color test result to PocketBase
 */

import pb from '$lib/pocketbase.js';

/**
 * Save a single color discrimination test result
 * @param {Object} testData
 * @param {string} testData.reference_hex - The reference color shown
 * @param {string} testData.color1_hex - First color presented
 * @param {string} testData.color2_hex - Second color presented
 * @param {string} testData.referencePosition - Which color is the reference: 'color1' | 'color2'
 * @param {string} testData.user_response - User's response: 'same' | 'color1' | 'color2'
 * @param {number} testData.response_time_ms - Time taken to respond (optional)
 * @param {number} testData.expected_confusion_prob - Bayesian prior probability (optional)
 * @returns {Promise<Object>} Created test record
 */
export async function saveTestResult(testData) {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Calculate is_correct
		// Correct if: user said "different" (color1 or color2) AND identified the correct position
		const isCorrect =
			testData.user_response !== 'same' && testData.user_response === testData.referencePosition;

		const record = await pb.collection('colorvision_tests').create({
			user: user.id,
			reference_hex: testData.reference_hex,
			color1_hex: testData.color1_hex,
			color2_hex: testData.color2_hex,
			user_response: testData.user_response, // 'same' | 'color1' | 'color2'
			is_correct: isCorrect,
			response_time_ms: testData.response_time_ms || null,
			expected_confusion_prob: testData.expected_confusion_prob || null,
			test_type: 'discrimination' // Always "discrimination" for framework
		});

		return record;
	} catch (error) {
		console.error('Error saving test result:', error);
		throw error;
	}
}
