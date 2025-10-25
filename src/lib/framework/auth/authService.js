/**
 * Authentication service layer
 * Handles user authentication operations with PocketBase
 */

import pb from '$lib/pocketbase.js';

export const authService = {
	/**
	 * Register a new user with colorblindness type
	 * @param {string} email
	 * @param {string} password
	 * @param {string} passwordConfirm
	 * @param {string} colorblindnessType - e.g. 'deuteranomaly', 'protanomaly', 'tritanomaly', 'normal'
	 * @returns {Promise<Object>} Created user record
	 */
	async register(email, password, passwordConfirm, colorblindnessType) {
		try {
			const data = {
				email,
				password,
				passwordConfirm,
				colorblindness_type: colorblindnessType,
				emailVisibility: true
			};

			const record = await pb.collection('colorvision_users').create(data);

			// Auto-login after registration
			await pb.collection('colorvision_users').authWithPassword(email, password);

			return record;
		} catch (error) {
			console.error('Registration error:', error);
			throw error;
		}
	},

	/**
	 * Login with email and password
	 * @param {string} email
	 * @param {string} password
	 * @returns {Promise<Object>} Auth data with token and user record
	 */
	async login(email, password) {
		try {
			const authData = await pb.collection('colorvision_users').authWithPassword(email, password);
			return authData;
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	},

	/**
	 * Logout current user
	 */
	logout() {
		pb.authStore.clear();
	},

	/**
	 * Check if user is authenticated
	 * @returns {boolean}
	 */
	isAuthenticated() {
		return pb.authStore.isValid;
	},

	/**
	 * Get current user record
	 * @returns {Object|null} Current user or null
	 */
	getCurrentUser() {
		return pb.authStore.model;
	},

	/**
	 * Get current auth token
	 * @returns {string|null}
	 */
	getToken() {
		return pb.authStore.token;
	},

	/**
	 * Refresh authentication
	 * @returns {Promise<Object>} Refreshed auth data
	 */
	async refresh() {
		try {
			const authData = await pb.collection('colorvision_users').authRefresh();
			return authData;
		} catch (error) {
			console.error('Refresh error:', error);
			throw error;
		}
	},

	/**
	 * Subscribe to auth state changes
	 * @param {Function} callback - Called when auth state changes
	 * @returns {Function} Unsubscribe function
	 */
	onAuthChange(callback) {
		return pb.authStore.onChange((token, model) => {
			callback({ token, user: model });
		});
	}
};
