// js/admin.js - Full Local + PB Sync + Session Update
import { pb, connected } from './core/pocketbase.js';
import { toast } from './ui/toasts.js';
import { initNotifications } from './notifications.js';

const LOCAL_USERS_KEY = 'admin_users_local';

function checkAdmin() {
  const raw = localStorage.getItem('uzima_session');
  if (!raw) { window.location.href = 'index.html'; return false; }
  const auth = JSON.parse(raw);
  if (Date.now() > auth.expires) { localStorage.removeItem('uzima_session'); window.location.href = 'index.html'; return false; }
  const user = auth.model;
  const role = user.name?.role || user.role || 'student';
  if (role !== 'admin') {
    toast.show('Access denied: Admin privileges required', 'e');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
    return false;
  }
  return user;
}

let users = [];
let courses = [];
let editingUserId = null;
let editingCourseId = null;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // ROLE GUARD - Redirect parents to parent.html
  const raw = localStorage.getItem('uzima_session');
  if (raw) {
    try {
      const auth = JSON.parse(raw);
      const role = auth.model?.role?.toLowerCase() || 'student';
      if (role === 'parent') {
        window.location.href = 'parent.html';
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  const user = checkAdmin();
  if (!user) return;
  currentUserId = user.id || (user.name?.id || null);
  
  const navName = document.getElementById('navName');
  const navAvatar = document.getElementById('navAvatar');
  if (navName) navName.textContent = (user.name?.name || user.name || 'Admin').split(' ')[0];
  if (navAvatar) navAvatar.textContent = (user.name?.name || user.name || 'A').charAt(0).toUpperCase();

  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  if (navProfile && dropdown) {
    navProfile.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }
  document.getElementById('logoutBtn').onclick = () => {
    if (connected && pb) pb.authStore.clear();
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
  };

  await loadData();
  setupTabs();
  setupSearch();
  setupModals();
  
  // Initialize Notifications
  initNotifications();
});

async function loadData() {
  try {
    if (connected && pb) {
      users = await pb.collection('users').getFullList({ sort: '-created' });
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } else {
      users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
      toast.show('Offline mode: Using local user data', 'i');
    }
    document.getElementById('statUsers').textContent = users.length;

    const storedCourses = localStorage.getItem('admin_courses');
    if (storedCourses) { courses = JSON.parse(storedCourses); } 
    else {
      courses = [
        { id: 'c1', code: 'CS101', name: 'Data Structures', credits: 4, lecturer: 'Dr. A. Mwangi', enrolled: 42 },
        { id: 'c2', code: 'MATH201', name: 'Calculus II', credits: 3, lecturer: 'Prof. J. Ochieng', enrolled: 38 },
        { id: 'c3', code: 'ENG102', name: 'Technical Writing', credits: 2, lecturer: 'Ms. L. Wanjiku', enrolled: 25 }
      ];
      localStorage.setItem('admin_courses', JSON.stringify(courses));
    }
    updateStats();
    renderUsers(users);
    renderCourses(courses);
  } catch (err) {
    console.error(err);
    users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    renderUsers(users);
    toast.show('Sync error: Using local data', 'w');
  }
}

function updateStats() {
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statCourses').textContent = courses.length;
  document.getElementById('statEnroll').textContent = courses.reduce((s, c) => s + (c.enrolled || 0), 0);
}

function renderUsers(list) {
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = list.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--t4)">No users found</td></tr>' : 
    list.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>${u.sid || '-'}</td>
        <td>${new Date(u.created || Date.now()).toLocaleDateString()}</td>
        <td>
          <button class="action-btn" onclick="openUserModal('${u.id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
}

function renderCourses(list) {
  const tbody = document.getElementById('coursesBody');
  tbody.innerHTML = list.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--t4)">No courses found</td></tr>' :
    list.map(c => `
      <tr>
        <td><strong>${c.code}</strong></td>
        <td>${c.name}</td>
        <td>${c.credits}</td>
        <td>${c.lecturer}</td>
        <td>${c.enrolled || 0}</td>
        <td>
          <button class="action-btn" onclick="openCourseModal('${c.id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" onclick="deleteCourse('${c.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    });
  });
}

function setupSearch() {
  document.getElementById('userSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const role = document.getElementById('userRoleFilter').value;
    const filtered = users.filter(u => {
      const matchQ = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.sid || '').toLowerCase().includes(q);
      const matchR = role === 'all' || u.role === role;
      return matchQ && matchR;
    });
    renderUsers(filtered);
  });
  document.getElementById('userRoleFilter').addEventListener('change', () => document.getElementById('userSearch').dispatchEvent(new Event('input')));
  document.getElementById('courseSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderCourses(courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)));
  });
}

function setupModals() {
  document.getElementById('addUserBtn').onclick = () => { editingUserId = null; document.getElementById('userModalTitle').textContent = 'Add User'; document.getElementById('userForm').reset(); openModal('userModal'); };
  document.getElementById('addCourseBtn').onclick = () => { editingCourseId = null; document.getElementById('courseModalTitle').textContent = 'Add Course'; document.getElementById('courseForm').reset(); openModal('courseModal'); };
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
  document.getElementById('courseForm').addEventListener('submit', handleCourseSubmit);
}

window.openUserModal = async (id) => {
  editingUserId = id;
  const u = users.find(x => x.id === id);
  if (!u) return;
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('uName').value = u.name;
  document.getElementById('uEmail').value = u.email;
  document.getElementById('uRole').value = u.role;
  document.getElementById('uSid').value = u.sid || '';
  document.getElementById('uPass').value = '';
  openModal('userModal');
};

window.openCourseModal = (id) => {
  editingCourseId = id;
  const c = courses.find(x => x.id === id);
  if (!c) return;
  document.getElementById('courseModalTitle').textContent = 'Edit Course';
  document.getElementById('cCode').value = c.code;
  document.getElementById('cName').value = c.name;
  document.getElementById('cCredits').value = c.credits;
  document.getElementById('cLecturer').value = c.lecturer;
  openModal('courseModal');
};

window.closeModal = (id) => document.getElementById(id).classList.remove('open');
function openModal(id) { document.getElementById(id).classList.add('open'); }

async function handleUserSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('uName').value;
  const email = document.getElementById('uEmail').value;
  const role = document.getElementById('uRole').value;
  const sid = document.getElementById('uSid').value;
  const pass = document.getElementById('uPass').value;

  try {
    const data = { name, email, role, sid };
    if (pass) { data.password = pass; data.passwordConfirm = pass; }
    
    if (editingUserId) {
      if (connected && pb) await pb.collection('users').update(editingUserId, data);
      const idx = users.findIndex(u => u.id === editingUserId);
      if (idx !== -1) users[idx] = { ...users[idx], ...data };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      
      const session = JSON.parse(localStorage.getItem('uzima_session') || '{}');
      if (session.model?.id === editingUserId || session.model?.name?.id === editingUserId) {
        session.model.name = name; session.model.email = email; session.model.role = role; session.model.sid = sid;
        localStorage.setItem('uzima_session', JSON.stringify(session));
        toast.show('Profile updated (syncing session...)', 's');
        closeModal('userModal');
        setTimeout(() => location.reload(), 600);
        return;
      }
      toast.show('User updated', 's');
    } else {
      if (connected && pb) { data.password = pass || 'TempPass123!'; data.passwordConfirm = data.password; await pb.collection('users').create(data); }
      const newUser = { id: 'u' + Date.now(), ...data, created: new Date().toISOString() };
      users.unshift(newUser);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      toast.show('User created', 's');
    }
    closeModal('userModal');
    renderUsers(users);
    updateStats();
  } catch (err) { toast.show(err.message || 'Operation failed', 'e'); }
}

window.deleteUser = async (id) => {
  if (!confirm('Delete this user? This cannot be undone.')) return;
  try {
    if (connected && pb) await pb.collection('users').delete(id);
    users = users.filter(u => u.id !== id);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    const session = JSON.parse(localStorage.getItem('uzima_session') || '{}');
    if (session.model?.id === id || session.model?.name?.id === id) { localStorage.clear(); window.location.href = 'index.html'; return; }
    toast.show('User deleted', 's');
    renderUsers(users);
    updateStats();
  } catch (err) { toast.show(err.message, 'e'); }
};

async function handleCourseSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('cCode').value;
  const name = document.getElementById('cName').value;
  const credits = parseInt(document.getElementById('cCredits').value);
  const lecturer = document.getElementById('cLecturer').value;

  try {
    if (editingCourseId) {
      const idx = courses.findIndex(c => c.id === editingCourseId);
      if (idx !== -1) courses[idx] = { ...courses[idx], code, name, credits, lecturer };
      toast.show('Course updated', 's');
    } else {
      courses.push({ id: 'c' + Date.now(), code, name, credits, lecturer, enrolled: 0 });
      toast.show('Course created', 's');
    }
    localStorage.setItem('admin_courses', JSON.stringify(courses));
    closeModal('courseModal');
    renderCourses(courses);
    updateStats();
  } catch (err) { toast.show(err.message, 'e'); }
}

window.deleteCourse = (id) => {
  if (!confirm('Delete this course?')) return;
  courses = courses.filter(c => c.id !== id);
  localStorage.setItem('admin_courses', JSON.stringify(courses));
  toast.show('Course deleted', 's');
  renderCourses(courses);
  updateStats();
};