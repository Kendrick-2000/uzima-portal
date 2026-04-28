// js/settings.js - Settings Page Logic
import { pb, connected } from './core/pocketbase.js';
import { toast } from './ui/toasts.js';
import { initNotifications } from './notifications.js';

// 🔒 HIDE ADMIN LINK FOR NON-ADMINS
const sessionRaw = localStorage.getItem('uzima_session');
if (sessionRaw) {
    try {
        const auth = JSON.parse(sessionRaw);
        // If role is NOT admin, hide the Admin sidebar link
        if (auth.model?.role !== 'admin') {
            const adminLink = document.querySelector('a[href="admin.html"]');
            if (adminLink) adminLink.style.display = 'none';
        }
    } catch (e) {}
}

const SETTINGS_KEY = 'uzima_settings';

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  document.getElementById('themeToggle').checked = saved.theme === 'light';
  document.getElementById('emailNotif').checked = saved.emailNotif !== false;
  document.getElementById('pushNotif').checked = saved.pushNotif === true;
  document.getElementById('sessionTimeout').value = saved.timeout || '30';
  document.getElementById('language').value = saved.language || 'en';
  document.getElementById('timezone').value = saved.timezone || 'EAT';
  applyTheme(saved.theme === 'light');
}

function saveSettings() {
  const settings = {
    theme: document.getElementById('themeToggle').checked ? 'light' : 'dark',
    emailNotif: document.getElementById('emailNotif').checked,
    pushNotif: document.getElementById('pushNotif').checked,
    timeout: document.getElementById('sessionTimeout').value,
    language: document.getElementById('language').value,
    timezone: document.getElementById('timezone').value
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  toast.show('Settings saved', 's');
}

function applyTheme(isLight) {
  document.body.classList.toggle('light-theme', isLight);
}

function exportData() {
  const session = JSON.parse(localStorage.getItem('uzima_session') || '{}');
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const data = { exportDate: new Date().toISOString(), session: session.model, settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'uzima_user_data.json'; a.click();
  URL.revokeObjectURL(url);
  toast.show('Data exported successfully', 's');
}

function deleteAccount() {
  if (confirm('⚠️ Are you sure? This will permanently delete your account and cannot be undone.')) {
    if (connected && pb && pb.authStore.model?.id) {
      pb.collection('users').delete(pb.authStore.model.id).catch(() => {});
    }
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 🔒 ROLE GUARD: Block parents from student/admin pages
  const sessionRaw = localStorage.getItem('uzima_session');
  if (sessionRaw) {
    try {
      const auth = JSON.parse(sessionRaw);
      const role = auth.model?.role?.toLowerCase().trim() || 'student';
      if (role === 'parent') {
        console.log('🚫 Parent access blocked. Redirecting to parent.html');
        window.location.href = 'parent.html';
        return; // ⚠️ Stops the rest of the page from loading
      }
    } catch (e) { /* ignore parse errors */ }
  }
  
  const raw = localStorage.getItem('uzima_session');
  if (!raw) { window.location.href = 'index.html'; return; }
  const auth = JSON.parse(raw);
  if (Date.now() > auth.expires) { localStorage.removeItem('uzima_session'); window.location.href = 'index.html'; return; }

  const user = auth.model;
  const navName = document.getElementById('navName');
  const navAvatar = document.getElementById('navAvatar');
  if (navName) navName.textContent = (user.name?.name || user.name || 'User').split(' ')[0];
  if (navAvatar) navAvatar.textContent = (user.name?.name || user.name || 'U').charAt(0).toUpperCase();

  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  if (navProfile && dropdown) {
    navProfile.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = () => {
    if (connected && pb) pb.authStore.clear();
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
  };

  loadSettings();
  document.querySelectorAll('#themeToggle, #emailNotif, #pushNotif, #sessionTimeout, #language, #timezone').forEach(el => {
    el.addEventListener('change', saveSettings);
  });
  document.getElementById('themeToggle').addEventListener('change', e => applyTheme(e.target.checked));
  document.getElementById('exportBtn').onclick = exportData;
  document.getElementById('deleteBtn').onclick = deleteAccount;
  document.getElementById('2faBtn').onclick = () => toast.show('2FA coming in next update', 'i');
  
  // Initialize Notifications
  initNotifications();
});