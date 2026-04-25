import { clean, esc } from './utils/string.js';
import { toast } from './ui/toasts.js';

// ─── SESSION & ROLE GUARD ───
function checkSession() {
  const raw = localStorage.getItem('uzima_session');
  if (!raw) { window.location.href = 'index.html'; return null; }
  try {
    const auth = JSON.parse(raw);
    if (Date.now() > auth.expires) {
      localStorage.removeItem('uzima_session');
      window.location.href = 'index.html';
      return null;
    }
    // Demo mode bypass: allow access but log warning if not admin
    if (auth.model.role !== 'admin') {
      console.warn('⚠️ Admin panel accessed by non-admin role:', auth.model.role);
    }
    return auth.model;
  } catch {
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
    return null;
  }
}

// ─── MOCK DATA ───
let users = [
  { id: 'u1', name: 'Test Student', email: 'test@uzima.ac.ke', sid: 'UMB/2024/1001', role: 'student', status: 'active' },
  { id: 'u2', name: 'Dr. Amina Mwangi', email: 'amina@uzima.ac.ke', sid: 'UMS/2019/0042', role: 'lecturer', status: 'active' },
  { id: 'u3', name: 'John Doe', email: 'john@uzima.ac.ke', sid: 'UMB/2023/0881', role: 'student', status: 'suspended' },
  { id: 'u4', name: 'Prof. James Ochieng', email: 'james@uzima.ac.ke', sid: 'UMS/2015/0012', role: 'lecturer', status: 'active' },
  { id: 'u5', name: 'Admin User', email: 'admin@uzima.ac.ke', sid: 'ADM/2020/0001', role: 'admin', status: 'active' }
];

let editingId = null;

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  const user = checkSession();
  if (!user) return;

  const name = user?.name || 'Administrator';
  document.getElementById('navName').textContent = clean(name);
  document.getElementById('navAvatar').textContent = clean(name).charAt(0).toUpperCase();

  renderStats();
  renderUsers();
  renderLockouts();
  bindControls();

  // UI Bindings
  document.getElementById('navProfile').addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('profileDropdown');
    const ch = document.querySelector('.nav-chevron');
    dd.classList.toggle('open');
    ch.style.transform = dd.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0)';
  });
  document.addEventListener('click', () => {
    document.getElementById('profileDropdown').classList.remove('open');
    document.querySelector('.nav-chevron').style.transform = 'rotate(0)';
  });
  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('dashSidebar').classList.toggle('open');
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('uzima_session');
    toast.show('Signed out successfully', 's');
    setTimeout(() => window.location.href = 'index.html', 800);
  });

  // Modal bindings
  document.getElementById('closeEdit').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', (e) => { if(e.target.id === 'editModal') closeEditModal(); });
  document.getElementById('saveUser').addEventListener('click', saveUserChanges);
});

// ─── STATS ───
function renderStats() {
  const locks = JSON.parse(localStorage.getItem('uzima_locks') || '{}');
  const lockedCount = Object.values(locks).filter(l => l.until > Date.now()).length;
  
  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('activeUsers').textContent = users.filter(u => u.status === 'active').length;
  document.getElementById('lockedUsers').textContent = lockedCount;
  
  // Approximate localStorage usage
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) total += localStorage[key].length * 2; // UTF-16
  }
  document.getElementById('storageUsed').textContent = (total / 1024).toFixed(1) + ' KB';
}

// ─── USERS TABLE ───
function renderUsers(search = '', role = 'all') {
  const tbody = document.getElementById('usersBody');
  const filtered = users.filter(u => {
    const matchSearch = search === '' || 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.sid.toLowerCase().includes(search.toLowerCase());
    const matchRole = role === 'all' || u.role === role;
    return matchSearch && matchRole;
  });

  document.getElementById('userCount').textContent = `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`;
  
  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="user-avatar-sm">${u.name.charAt(0)}</div>
          <div class="user-info"><h4>${esc(u.name)}</h4><p>${esc(u.email)}</p></div>
        </div>
      </td>
      <td><code style="background:var(--input);padding:0.2rem 0.4rem;border-radius:4px;font-size:0.78rem">${esc(u.sid)}</code></td>
      <td><span class="role-badge ${u.role}">${u.role}</span></td>
      <td><span class="status-badge ${u.status}">${u.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn" onclick="window.openEditModal('${u.id}')"><i class="fas fa-pen"></i> Edit</button>
          <button class="action-btn danger" onclick="window.deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── LOCKOUTS ───
function renderLockouts() {
  const locks = JSON.parse(localStorage.getItem('uzima_locks') || '{}');
  const container = document.getElementById('lockoutList');
  const activeLocks = Object.entries(locks).filter(([k, v]) => v.until > Date.now());
  
  if (activeLocks.length === 0) {
    container.innerHTML = '<p class="empty-state">No locked accounts detected.</p>';
    return;
  }

  container.innerHTML = activeLocks.map(([email, data]) => `
    <div class="lock-item">
      <div class="lock-info">
        <i class="fas fa-lock"></i>
        <div class="lock-meta">
          <h4>${esc(email)}</h4>
          <p>Locked until: ${new Date(data.until).toLocaleString()}</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem">
        <span class="lock-count">${data.count} fails</span>
        <button class="action-btn" onclick="window.clearLock('${email}')"><i class="fas fa-unlock"></i> Unlock</button>
      </div>
    </div>
  `).join('');
}

// ─── ACTIONS ───
window.openEditModal = (id) => {
  editingId = id;
  const u = users.find(x => x.id === id);
  if (!u) return;
  document.getElementById('editRole').value = u.role;
  document.getElementById('editStatus').value = u.status;
  document.getElementById('editModal').classList.add('open');
};

function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
  editingId = null;
}

window.saveUserChanges = () => {
  if (!editingId) return;
  const u = users.find(x => x.id === editingId);
  if (u) {
    u.role = document.getElementById('editRole').value;
    u.status = document.getElementById('editStatus').value;
    toast.show(`Updated ${u.name}`, 's');
    renderUsers();
    renderStats();
  }
  closeEditModal();
};

window.deleteUser = (id) => {
  const u = users.find(x => x.id === id);
  if (u && confirm(`Delete ${u.name}? This cannot be undone.`)) {
    users = users.filter(x => x.id !== id);
    toast.show(`Deleted ${u.name}`, 'w');
    renderUsers();
    renderStats();
  }
};

window.clearLock = (email) => {
  const locks = JSON.parse(localStorage.getItem('uzima_locks') || '{}');
  delete locks[email.toLowerCase()];
  localStorage.setItem('uzima_locks', JSON.stringify(locks));
  toast.show(`Unlocked ${email}`, 's');
  renderLockouts();
  renderStats();
};

// ─── CONTROLS & EXPORT ───
function bindControls() {
  const searchEl = document.getElementById('adminSearch');
  const roleEl = document.getElementById('roleFilter');
  
  const refresh = () => renderUsers(searchEl.value, roleEl.value);
  searchEl.addEventListener('input', refresh);
  roleEl.addEventListener('change', refresh);

  document.getElementById('clearAllLocks').addEventListener('click', () => {
    localStorage.removeItem('uzima_locks');
    toast.show('All lockouts cleared', 's');
    renderLockouts();
    renderStats();
  });

  document.getElementById('exportCSV').addEventListener('click', () => {
    const headers = ['Name', 'Email', 'Student/Staff ID', 'Role', 'Status'];
    const rows = users.map(u => [u.name, u.email, u.sid, u.role, u.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `uzima_users_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show('CSV exported successfully', 's');
  });
}