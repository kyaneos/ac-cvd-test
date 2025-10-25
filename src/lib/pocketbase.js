/**
 * PocketBase client singleton
 * Provides a single instance of the PocketBase client for the entire application
 */

import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase('https://sciminds.cloud');

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false);

export default pb;
