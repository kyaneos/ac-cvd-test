/**
 * Authentication store for framework
 * Tracks user authentication state and syncs with PocketBase
 */

import { writable } from 'svelte/store';
import { authService } from '$lib/framework/auth/authService.js';

function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: authService.getCurrentUser(),
		isAuthenticated: authService.isAuthenticated(),
		isLoading: false,
		error: null
	});

	// Listen for auth changes from PocketBase
	authService.onAuthChange(({ user }) => {
		update((state) => ({
			...state,
			user,
			isAuthenticated: !!user,
			error: null
		}));
	});

	return {
		subscribe,

		/**
		 * Login user
		 */
		login: async (email, password) => {
			update((state) => ({ ...state, isLoading: true, error: null }));
			try {
				const authData = await authService.login(email, password);
				update((state) => ({
					...state,
					user: authData.record,
					isAuthenticated: true,
					isLoading: false,
					error: null
				}));
				return authData;
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message || 'Login failed'
				}));
				throw error;
			}
		},

		/**
		 * Register new user
		 */
		register: async (email, password, passwordConfirm, colorblindnessType) => {
			update((state) => ({ ...state, isLoading: true, error: null }));
			try {
				const user = await authService.register(
					email,
					password,
					passwordConfirm,
					colorblindnessType
				);
				update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null
				}));
				return user;
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message || 'Registration failed'
				}));
				throw error;
			}
		},

		/**
		 * Logout user
		 */
		logout: () => {
			authService.logout();
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: null
			});
		},

		/**
		 * Refresh authentication
		 */
		refresh: async () => {
			try {
				const authData = await authService.refresh();
				update((state) => ({
					...state,
					user: authData.record,
					isAuthenticated: true
				}));
				return authData;
			} catch (error) {
				update((state) => ({
					...state,
					user: null,
					isAuthenticated: false,
					error: error.message || 'Session expired'
				}));
				throw error;
			}
		},

		/**
		 * Clear error
		 */
		clearError: () => {
			update((state) => ({ ...state, error: null }));
		}
	};
}

export const frameworkAuthStore = createAuthStore();
