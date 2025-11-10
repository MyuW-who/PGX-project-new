// Audit Log page script: renders mock data, filters, and reuses header behaviors

// --- Session helpers (reuse pattern from adminpage.js) ---
function getCurrentUser() {
	try {
		const sessionData = sessionStorage.getItem('currentUser');
		return sessionData ? JSON.parse(sessionData) : null;
	} catch (error) {
		console.error('Error reading current user:', error);
		return null;
	}
}

function checkAuthentication() {
	const currentUser = getCurrentUser();
	if (!currentUser) {
		// If not authenticated, navigate to login via IPC if available
		try { window.electronAPI?.navigate('login'); } catch (_) {}
		return false;
	}
	return true;
}

function updateUserDisplay() {
	const currentUser = getCurrentUser();
	if (!currentUser) return;
	const dropdownBtn = document.getElementById('dropdownBtn');
	if (dropdownBtn) {
		dropdownBtn.innerHTML = `
			<i class="fa fa-user-circle"></i> ${currentUser.username} (${currentUser.role}) <i class="fa fa-caret-down"></i>
		`;
	}
}

// --- DOM refs ---
const dropdownBtn = document.getElementById('dropdownBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const themeToggle = document.getElementById('themeToggle');
const langToggle = document.getElementById('langToggle');
const logoutBtn = document.getElementById('logout');

// Settings popup
const settingsPopup = document.getElementById('settingsPopup');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const cancelSettings = document.getElementById('cancelSettings');
const settingsBtn = document.getElementById('settingsBtn');

// Filters and list
const filterUser = document.getElementById('filterUser');
const filterAction = document.getElementById('filterAction');
const filterTime = document.getElementById('filterTime');
const searchInput = document.getElementById('searchInput');
const auditList = document.getElementById('auditList');
const auditCount = document.getElementById('auditCount');
const emptyState = document.getElementById('emptyState');


// --- Dropdown & theme/lang handlers ---
dropdownBtn?.addEventListener('click', (e) => {
	e.stopPropagation();
	dropdownMenu?.classList.toggle('show');
});
dropdownMenu?.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => dropdownMenu?.classList.remove('show'));



langToggle?.addEventListener('click', () => {
	const current = langToggle.textContent.trim();
	langToggle.textContent = current === 'TH' ? 'EN' : 'TH';
});

logoutBtn?.addEventListener('click', () => {
	const confirmed = confirm('คุณต้องการออกจากระบบหรือไม่?');
	if (!confirmed) return;
	try {
		localStorage.removeItem('userSession');
		sessionStorage.clear();
	} finally {
		window.electronAPI?.navigate('login');
	}
});

// Settings popup wires
settingsBtn?.addEventListener('click', (e) => { e.preventDefault(); settingsPopup.style.display = 'flex'; dropdownMenu?.classList.remove('show'); });
closeSettings?.addEventListener('click', () => { settingsPopup.style.display = 'none'; });
cancelSettings?.addEventListener('click', () => { settingsPopup.style.display = 'none'; });
saveSettings?.addEventListener('click', () => {
	const theme = document.getElementById('themeSetting').value;
	if (theme === 'dark') { document.body.classList.add('dark'); document.body.classList.remove('dark-theme'); }
	else { document.body.classList.remove('dark'); document.body.classList.remove('dark-theme'); }
	settingsPopup.style.display = 'none';
});
settingsPopup?.addEventListener('click', (e) => { if (e.target === settingsPopup) settingsPopup.style.display = 'none'; });

// --- Mock data ---
// REMOVED: Using real database instead
// const MOCK_LOGS = [...]

const actionMeta = {
	'create':       { icon: 'fa-circle-plus',  color: '#10b981', status: 'status-success', label: 'created' },
	'updated':      { icon: 'fa-pen-to-square',color: '#3b82f6', status: 'status-info',    label: 'updated' },
	'update':       { icon: 'fa-pen-to-square',color: '#3b82f6', status: 'status-info',    label: 'updated' },
	'moved':        { icon: 'fa-person-walking-arrow-right', color: '#f59e0b', status: 'status-warning', label: 'moved' },
	'delete':       { icon: 'fa-trash',        color: '#ef4444', status: 'status-danger',  label: 'deleted' },
	'deleted':      { icon: 'fa-trash',        color: '#ef4444', status: 'status-danger',  label: 'deleted' },
	'role-update':  { icon: 'fa-user-gear',    color: '#a855f7', status: 'status-info',    label: 'updated roles' },
	'role-updated': { icon: 'fa-user-gear',    color: '#a855f7', status: 'status-info',    label: 'updated roles' },
	'invited':      { icon: 'fa-paper-plane',  color: '#14b8a6', status: 'status-success', label: 'invited' },
	'login':        { icon: 'fa-right-to-bracket', color: '#22c55e', status: 'status-success', label: 'signed in' },
	'logout':       { icon: 'fa-right-from-bracket', color: '#ef4444', status: 'status-danger', label: 'signed out' },
};

function timeAgo(iso) {
	const d = new Date(iso);
	const diff = Date.now() - d.getTime();
	const s = Math.floor(diff / 1000);
	if (s < 60) return 'ไม่กี่วินาทีที่แล้ว';
	const m = Math.floor(s / 60);
	if (m < 60) return `${m} นาทีที่แล้ว`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
	const dd = Math.floor(h / 24);
	if (dd === 1) return 'เมื่อวานนี้';
	return `${dd} วันที่แล้ว`;
}

function initials(name) {
	const match = String(name || '?').match(/\b([A-Za-zก-๙])/g) || [];
	const chars = (match[0] || name?.[0] || '?').toUpperCase() + (match[1] || '').toUpperCase();
	return chars.slice(0, 2);
}

function pickAvatarClass(name) {
	const idx = (name?.charCodeAt(0) || 65) % 4; // 0..3
	return `fallback-${idx + 1}`;
}

let logs = [];

async function loadAuditLogs(filters = {}) {
	try {
		logs = await window.electronAPI.fetchAuditLogs(filters);
		console.log('📋 Loaded audit logs:', logs.length);
		return logs;
	} catch (err) {
		console.error('❌ Error loading audit logs:', err);
		logs = [];
		return [];
	}
}

async function populateFilters() {
	try {
		const users = await window.electronAPI.getAuditUsers();
		filterUser.innerHTML = '<option value="all">All</option>' + 
			users.map(u => `<option value="${u}">${u}</option>`).join('');
	} catch (err) {
		console.error('❌ Error loading users:', err);
		filterUser.innerHTML = '<option value="all">All</option>';
	}
}

// Calculate time range based on filter selection
function getTimeRange(filterValue) {
	const now = new Date();
	let startDate = null;

	switch (filterValue) {
		case 'today':
			startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			break;
		case 'yesterday':
			startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
			const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
		case '7days':
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case '30days':
			startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		case '90days':
			startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
			break;
		default:
			return { startDate: null, endDate: null };
	}

	return { startDate: startDate ? startDate.toISOString() : null, endDate: null };
}

async function applyFilters() {
	const fUser = filterUser.value;
	const fAction = filterAction.value;
	const fTime = filterTime.value;
	const query = searchInput.value.trim().toLowerCase();

	// Get time range
	const timeRange = getTimeRange(fTime);

	// Build filter object for backend
	const filters = {
		username: fUser !== 'all' ? fUser : null,
		action: fAction !== 'all' ? fAction : null,
		search: query || null,
		startDate: timeRange.startDate,
		endDate: timeRange.endDate,
		limit: 100,
		offset: 0
	};

	// Fetch filtered data from database
	await loadAuditLogs(filters);
	renderList(logs);
}

function renderList(items) {
	auditList.innerHTML = items.map(item => {
		const meta = actionMeta[item.action] || actionMeta['update'];
		const avClass = pickAvatarClass(item.username);
		const actLabel = meta.label || item.action;
		
		// Determine target display text
		let targetText = item.description || '';
		if (!targetText && item.table_name) {
			targetText = `${item.table_name} (ID: ${item.record_id})`;
		}
		if (!targetText) {
			targetText = item.record_id || 'System';
		}
		
		return `
			<li class="audit-item" data-id="${item.id}">
				<div class="avatar ${avClass}">${initials(item.username)}</div>
				<div class="audit-content">
					<div class="audit-line">
						<i class="fa ${meta.icon} action-icon" style="color:${meta.color}"></i>
						<span class="actor">${item.username}</span>
						<span class="action">${actLabel}</span>
						<span class="target">${targetText}</span>
					</div>
					<div class="audit-meta">
						<span class="status-dot ${meta.status}"></span>
						${timeAgo(item.created_at)}
					</div>
				</div>
				<div class="chevron"><i class="fa fa-angle-right"></i></div>
			</li>`;
	}).join('');

	auditCount.textContent = `${items.length} items`;
	emptyState.style.display = items.length ? 'none' : 'grid';
}

// Wire filters
filterUser?.addEventListener('change', applyFilters);
filterAction?.addEventListener('change', applyFilters);
filterTime?.addEventListener('change', applyFilters);
searchInput?.addEventListener('input', applyFilters);

// Init
document.addEventListener('DOMContentLoaded', async () => {
	if (!checkAuthentication()) return; // ensure login first
	updateUserDisplay();
	await populateFilters();
	await applyFilters();
});

