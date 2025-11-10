/* ============================================
   📋 AUDIT LOG PAGE
   ============================================
   Audit log display with filtering and search
   Uses userProfile.js for session management
   ============================================ */

// --- DOM refs ---
// Filters and list
const filterUser = document.getElementById('filterUser');
const filterAction = document.getElementById('filterAction');
const searchInput = document.getElementById('searchInput');
const auditList = document.getElementById('auditList');
const auditCount = document.getElementById('auditCount');
const emptyState = document.getElementById('emptyState');

// --- Real data from database ---
let logs = [];

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

// --- Load audit logs from database ---
async function loadAuditLogs() {
	try {
		const data = await window.electronAPI.fetchAuditLogs({});
		logs = data || [];
		console.log('✅ Loaded audit logs:', logs.length);
	} catch (err) {
		console.error('❌ Failed to load audit logs:', err);
		logs = [];
	}
}

async function populateFilters() {
	// Get unique users from audit logs
	try {
		const users = await window.electronAPI.getAuditUsers();
		filterUser.innerHTML = '<option value="all">All</option>' + 
			users.map(u => `<option value="${u}">${u}</option>`).join('');
	} catch (err) {
		console.error('❌ Failed to load users:', err);
		filterUser.innerHTML = '<option value="all">All</option>';
	}
}

function applyFilters() {
	const fUser = filterUser.value;
	const fAction = filterAction.value;
	const query = searchInput.value.trim().toLowerCase();

	const filtered = logs.filter(l => {
		const actor = l.username || l.actor; // Support both database field names
		if (fUser !== 'all' && actor !== fUser) return false;
		if (fAction !== 'all' && l.action !== fAction) return false;
		if (query) {
			const target = l.description || l.target || l.record_id || '';
			const hay = `${actor} ${l.action} ${target}`.toLowerCase();
			if (!hay.includes(query)) return false;
		}
		return true;
	});

	renderList(filtered);
}

function renderList(items) {
	auditList.innerHTML = items.map(item => {
		const meta = actionMeta[item.action] || actionMeta.updated;
		const actor = item.username || item.actor || 'Unknown';
		const avClass = pickAvatarClass(actor);
		const actLabel = meta.label || item.action;
		const target = item.description || item.target || item.record_id || 'N/A';
		const timestamp = item.created_at || item.at || new Date().toISOString();
		
		return `
			<li class="audit-item" data-id="${item.id}">
				<div class="avatar ${avClass}">${initials(actor)}</div>
				<div class="audit-content">
					<div class="audit-line">
						<i class="fa ${meta.icon} action-icon" style="color:${meta.color}"></i>
						<span class="actor">${actor}</span>
						<span class="action">${actLabel}</span>
						<span class="target">${target}</span>
					</div>
					<div class="audit-meta">
						<span class="status-dot ${meta.status}"></span>
						${timeAgo(timestamp)}
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

/* ============================================
   🚀 PAGE INITIALIZATION
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
	// Initialize user profile (includes auth check and UI setup)
	if (!initializeUserProfile()) {
		return; // User not authenticated, redirected to login
	}
	
	// Load audit logs from database
	await loadAuditLogs();
	
	// Populate filter dropdowns
	await populateFilters();
	
	// Apply initial filters and render
	applyFilters();
});

