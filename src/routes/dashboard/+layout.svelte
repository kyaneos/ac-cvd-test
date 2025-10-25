<script>
	import { frameworkAuthStore } from '$lib/framework/stores/frameworkAuthStore.js';
	import { goto, beforeNavigate } from '$app/navigation';
	import { page } from '$app/stores';

	let auth = $derived($frameworkAuthStore);

	// Auth guard - redirect to login if not authenticated
	$effect(() => {
		if (!auth.isAuthenticated) {
			goto('/auth/login');
		}
	});

	// Navigation guard - warn if leaving test page with active session
	beforeNavigate(({ from, to, cancel }) => {
		const activeTest = localStorage.getItem('activeTestSession');

		// Only block if leaving the test page with an active test
		if (
			activeTest === 'true' &&
			from?.url.pathname === '/dashboard/test' &&
			to?.url.pathname !== '/dashboard/test'
		) {
			const confirmLeave = confirm(
				'You have an active test session. Your progress is saved, but you should end the test properly.\n\nDo you want to leave anyway?'
			);

			if (!confirmLeave) {
				cancel();
			} else {
				// User chose to leave - clear the flag
				localStorage.removeItem('activeTestSession');
			}
		}
	});

	async function handleLogout() {
		await frameworkAuthStore.logout();
		goto('/auth/login');
	}

	let currentPath = $derived($page.url.pathname);
</script>

{#if auth.isAuthenticated}
	<div class="dashboard">
		<nav class="dashboard-nav">
			<div class="nav-left">
				<h1>Color Vision Test</h1>
				<div class="user-info">
					{auth.user?.email}
					{#if auth.user?.colorblindness_type}
						<span class="type-badge">{auth.user.colorblindness_type}</span>
					{/if}
				</div>
			</div>

			<div class="nav-tabs">
				<a href="/dashboard/test" class:active={currentPath === '/dashboard/test'}> Test </a>
				<a href="/dashboard/results" class:active={currentPath === '/dashboard/results'}>
					Results
				</a>
				<a href="/dashboard/hex" class:active={currentPath === '/dashboard/hex'}> Color Map </a>
				<a href="/dashboard/converter" class:active={currentPath === '/dashboard/converter'}>
					Converter
				</a>
				<a href="/dashboard/settings" class:active={currentPath === '/dashboard/settings'}>
					Settings
				</a>
				<button class="logout-btn" onclick={handleLogout}> Logout </button>
			</div>
		</nav>

		<main class="dashboard-content">
			<slot />
		</main>
	</div>
{/if}

<style>
	.dashboard {
		min-height: 100vh;
		font-family: 'Average', serif;
		background: #ffffff;
	}

	.dashboard-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 40px;
		border-bottom: 3px solid #000000;
		background: #ffffff;
	}

	.nav-left h1 {
		margin: 0 0 8px 0;
		font-size: 24px;
		color: #000000;
	}

	.user-info {
		font-size: 14px;
		color: #666666;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.type-badge {
		padding: 4px 10px;
		background: #f0f0f0;
		border: 1px solid #cccccc;
		border-radius: 12px;
		font-size: 12px;
		color: #333333;
	}

	.nav-tabs {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.nav-tabs a {
		padding: 12px 24px;
		text-decoration: none;
		color: #000000;
		border: 2px solid #000000;
		border-radius: 4px;
		font-size: 16px;
		background: #ffffff;
		transition: all 0.2s;
	}

	.nav-tabs a:hover {
		background: #f0f0f0;
		transform: translateY(-2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.nav-tabs a.active {
		background: #000000;
		color: #ffffff;
	}

	.logout-btn {
		padding: 12px 24px;
		font-family: 'Average', serif;
		font-size: 16px;
		background: #ffffff;
		color: #cc0000;
		border: 2px solid #cc0000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: #cc0000;
		color: #ffffff;
		transform: translateY(-2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.dashboard-content {
		padding: 40px;
		max-width: 1400px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.dashboard-nav {
			flex-direction: column;
			gap: 20px;
			align-items: flex-start;
		}

		.nav-tabs {
			flex-wrap: wrap;
			width: 100%;
		}

		.nav-tabs a,
		.logout-btn {
			flex: 1;
			text-align: center;
		}

		.dashboard-content {
			padding: 20px;
		}
	}
</style>
