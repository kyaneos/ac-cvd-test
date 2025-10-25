/**
 * Get and update user settings
 */

import pb from '$lib/pocketbase.js';

/**
 * Get user settings, create if doesn't exist
 * @returns {Promise<Object>} User settings record
 */
export async function getUserSettings() {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Try to fetch existing settings
		const records = await pb.collection('colorvision_settings').getFullList({
			filter: `user = "${user.id}"`
		});

		if (records.length > 0) {
			return records[0];
		}

		// Create default settings if none exist
		const newSettings = await pb.collection('colorvision_settings').create({
			user: user.id,
			preferences: {}
		});

		return newSettings;
	} catch (error) {
		console.error('Error getting user settings:', error);
		throw error;
	}
}

/**
 * Update user settings (supports both preferences and bayesian_state)
 * @param {Object} updates - Object with preferences and/or bayesian_state
 * @returns {Promise<Object>} Updated settings record
 */
export async function updateUserSettings(updates) {
	try {
		const user = pb.authStore.model;
		if (!user) {
			throw new Error('User not authenticated');
		}

		const settings = await getUserSettings();

		// Build update object - only include fields that are provided
		const updateData = {};
		if (updates.preferences !== undefined) {
			updateData.preferences = updates.preferences;
		}
		if (updates.bayesian_state !== undefined) {
			updateData.bayesian_state = updates.bayesian_state;
		}

		const updated = await pb.collection('colorvision_settings').update(settings.id, updateData);

		return updated;
	} catch (error) {
		console.error('Error updating user settings:', error);
		throw error;
	}
}
