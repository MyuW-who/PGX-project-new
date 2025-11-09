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
// Filters and list
const filterUser = document.getElementById('filterUser');
const filterAction = document.getElementById('filterAction');
const searchInput = document.getElementById('searchInput');
const auditList = document.getElementById('auditList');
const auditCount = document.getElementById('auditCount');
const emptyState = document.getElementById('emptyState');


// --- Mock data ---
const MOCK_LOGS = [
	{ id: 1,  actor: 'admin1', action: 'updated',      target: 'admin1',        at: nowMinus({ minutes: 3 }),               group: 'user' },
		{ id: 2,  actor: 'admin1', action: 'moved',        target: 'ห้องประชุมใหญ่', at: nowMinus({ minutes: 5 }),               group: 'room' },
		{ id: 3,  actor: 'admin1', action: 'moved',        target: 'ฝ่ายสนับสนุน',   at: nowMinus({ minutes: 7 }),               group: 'room' },
	{ id: 4,  actor: 'admin1', action: 'updated',      target: 'admin2',        at: nowMinus({ minutes: 10 }),              group: 'user' },
	{ id: 5,  actor: 'admin2', action: 'updated',      target: 'ห้องเรียน',       at: nowMinus({ hours: 1, minutes: 20 }),    group: 'room' },
	{ id: 6,  actor: 'admin3', action: 'updated',      target: 'admin3',        at: nowMinus({ days: 1, hours: 2 }),        group: 'user' },
	{ id: 7,  actor: 'admin2', action: 'role-updated', target: 'admin4',        at: nowMinus({ days: 2, hours: 1 }),        group: 'user' },
	{ id: 8,  actor: 'admin4', action: 'invited',      target: 'Qm8bcDwa',      at: nowMinus({ days: 2, hours: 2 }),        group: 'invite' },
		{ id: 9,  actor: 'admin5', action: 'moved',        target: 'โซนทำงานรวม',   at: nowMinus({ days: 3, hours: 3 }),        group: 'room' },
	{ id: 10, actor: 'admin1', action: 'login',        target: 'System',        at: nowMinus({ hours: 4 }),                 group: 'auth' },
];

function nowMinus({ minutes = 0, hours = 0, days = 0 }) {
	const d = new Date();
	if (minutes) d.setMinutes(d.getMinutes() - minutes);
	if (hours) d.setHours(d.getHours() - hours);
	if (days) d.setDate(d.getDate() - days);
	return d.toISOString();
}

const actionMeta = {
	'created':      { icon: 'fa-circle-plus',  color: '#10b981', status: 'status-success', label: 'created' },
	'updated':      { icon: 'fa-pen-to-square',color: '#3b82f6', status: 'status-info',    label: 'updated' },
	'moved':        { icon: 'fa-person-walking-arrow-right', color: '#f59e0b', status: 'status-warning', label: 'moved' },
	'deleted':      { icon: 'fa-trash',        color: '#ef4444', status: 'status-danger',  label: 'deleted' },
	'role-updated': { icon: 'fa-user-gear',    color: '#a855f7', status: 'status-info',    label: 'updated roles' },
	'invited':      { icon: 'fa-paper-plane',  color: '#14b8a6', status: 'status-success', label: 'invited' },
	'login':        { icon: 'fa-right-to-bracket', color: '#22c55e', status: 'status-success', label: 'signed in' },
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

let logs = [...MOCK_LOGS];

function populateFilters() {
	const users = Array.from(new Set(logs.map(l => l.actor)));
	filterUser.innerHTML = '<option value="all">All</option>' + users.map(u => `<option value="${u}">${u}</option>`).join('');
}

function applyFilters() {
	const fUser = filterUser.value;
	const fAction = filterAction.value;
	const query = searchInput.value.trim().toLowerCase();

	const filtered = logs.filter(l => {
		if (fUser !== 'all' && l.actor !== fUser) return false;
		if (fAction !== 'all' && l.action !== fAction) return false;
		if (query) {
			const hay = `${l.actor} ${l.action} ${l.target}`.toLowerCase();
			if (!hay.includes(query)) return false;
		}
		return true;
	});

	renderList(filtered);
}

function renderList(items) {
	auditList.innerHTML = items.map(item => {
		const meta = actionMeta[item.action] || actionMeta.updated;
		const avClass = pickAvatarClass(item.actor);
		const actLabel = meta.label || item.action;
		return `
			<li class="audit-item" data-id="${item.id}">
				<div class="avatar ${avClass}">${initials(item.actor)}</div>
				<div class="audit-content">
					<div class="audit-line">
						<i class="fa ${meta.icon} action-icon" style="color:${meta.color}"></i>
						<span class="actor">${item.actor}</span>
						<span class="action">${actLabel}</span>
						<span class="target">${item.target}</span>
					</div>
					<div class="audit-meta">
						<span class="status-dot ${meta.status}"></span>
						${timeAgo(item.at)}
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
searchInput?.addEventListener('input', applyFilters);

// Init
document.addEventListener('DOMContentLoaded', () => {
	// Initialize user profile (authentication, dropdown, settings, logout)
	if (!initializeUserProfile()) return;
	
	populateFilters();
	applyFilters();
});

