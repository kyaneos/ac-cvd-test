/**
 * Update an existing test result (for retests)
 */

import pb from '$lib/pocketbase.js';

/**
 * Update a test result
 * @param {string} recordId - ID of the test record to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export async function updateTestResult(recordId, updates) {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		const record = await pb.collection('colorvision_tests').update(recordId, updates);
		return record;
	} catch (error) {
		console.error('Error updating test result:', error);
		throw error;
	}
}

/**
 * Delete a test result
 * @param {string} recordId - ID of the test record to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTestResult(recordId) {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		await pb.collection('colorvision_tests').delete(recordId);
		return true;
	} catch (error) {
		console.error('Error deleting test result:', error);
		throw error;
	}
}
