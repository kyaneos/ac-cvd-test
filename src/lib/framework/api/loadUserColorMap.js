/**
 * Load all color test results for the current user
 */

import pb from '$lib/pocketbase.js';

/**
 * Fetch all test results for the current user
 * @returns {Promise<Array>} Array of test records
 */
export async function loadUserColorMap() {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Fetch all tests for this user
		const records = await pb.collection('colorvision_tests').getFullList({
			filter: `user = "${user.id}"`,
			sort: '-created'
		});

		return records;
	} catch (error) {
		console.error('Error loading user color map:', error);
		throw error;
	}
}

/**
 * Fetch test results for a specific color (hex value)
 * @param {string} hexColor - Hex color to search for
 * @returns {Promise<Array>} Array of test records involving this color
 */
export async function loadTestsForColor(hexColor) {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		const records = await pb.collection('colorvision_tests').getFullList({
			filter: `user = "${user.id}" && (reference_hex = "${hexColor}" || option1_hex = "${hexColor}" || option2_hex = "${hexColor}")`,
			sort: '-created'
		});

		return records;
	} catch (error) {
		console.error('Error loading tests for color:', error);
		throw error;
	}
}
