// js/dashboard.js - Complete Working Version
import { toast } from './ui/toasts.js';

console.log('📦 [Dashboard.js] Module loaded');

// ─── SESSION CHECK ───
function checkSession() {
  try {
    const raw = localStorage.getItem('uzima_session');
    if (!raw) throw new Error('No session');
    
    const auth = JSON.parse(raw);
    if (!auth.model?.name) throw new Error('Invalid session');
    if (Date.now() > auth.expires) throw new Error('Expired');
    
    return auth.model;
  } catch (e) {
    console.warn('⚠️ Session invalid:', e.message);
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
    return null;
  }
}

// ─── UPDATE UI WITH USER DATA ───
function updateUI(user) {
  // Welcome message
  const welcome = document.getElementById('welcomeMsg');
  if (welcome) welcome.textContent = `Good morning, ${user.name}`;
  
  // Navigation profile
  const navName = document.getElementById('navName');
  if (navName) navName.textContent = user.name.split(' ')[0];
  
  // Avatar initial
  const avatar = document.getElementById('navAvatar');
  if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
  
  // Stats (demo data)
  const statCredits = document.getElementById('statCredits');
  if (statCredits) statCredits.textContent = '42';
  
  const statGPA = document.getElementById('statGPA');
  if (statGPA) statGPA.textContent = '3.85';
  
  const statPending = document.getElementById('statPending');
  if (statPending) statPending.textContent = '3';
  
  const statAttendance = document.getElementById('statAttendance');
  if (statAttendance) statAttendance.textContent = '94%';
  
  // Date
  const welcomeDate = document.getElementById('welcomeDate');
  if (welcomeDate) {
    const now = new Date();
    welcomeDate.textContent = now.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  }
  
  console.log('🎨 UI updated for', user.name);
}

// ─── SETUP LOGOUT BUTTON ───
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('uzima_session');
      toast.show('Logged out successfully', 's');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 400);
    };
    console.log('🔌 Logout handler attached');
  } else {
    console.warn('⚠️ logoutBtn not found in DOM');
  }
}

// ─── SETUP PROFILE DROPDOWN ───
function setupProfileDropdown() {
  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  
  if (navProfile && dropdown) {
    navProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }
}

// ─── LOAD DASHBOARD CONTENT (Demo) ───
function loadDashboardContent() {
  // Quick actions
  const actionsGrid = document.getElementById('actionsGrid');
  if (actionsGrid) {
    actionsGrid.innerHTML = `
      <button class="action-card"><i class="fas fa-book"></i><span>View Courses</span></button>
      <button class="action-card"><i class="fas fa-clipboard-list"></i><span>Grades</span></button>
      <button class="action-card"><i class="fas fa-calendar-alt"></i><span>Timetable</span></button>
      <button class="action-card"><i class="fas fa-bell"></i><span>Notifications</span></button>
    `;
  }
  
  // Timetable tabs
  const ttTabs = document.getElementById('ttTabs');
  const ttBody = document.getElementById('ttBody');
  if (ttTabs && ttBody) {
    ttTabs.querySelectorAll('.tt-tab').forEach(tab => {
      tab.onclick = () => {
        ttTabs.querySelectorAll('.tt-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        ttBody.innerHTML = `<p class="muted">No classes scheduled for ${tab.dataset.day.toUpperCase()}</p>`;
      };
    });
    // Trigger first tab
    ttTabs.querySelector('.tt-tab')?.click();
  }
  
  // Notifications
  const notifList = document.getElementById('notifList');
  const notifBadge = document.getElementById('notifBadge');
  if (notifList && notifBadge) {
    const notifs = [
      { title: 'Assignment Due', desc: 'CS101: Data Structures - Tomorrow', time: '2h ago' },
      { title: 'Grade Posted', desc: 'MATH201: Calculus II - B+', time: '1d ago' }
    ];
    notifList.innerHTML = notifs.map(n => `
      <div class="notif-item">
        <div class="notif-content">
          <strong>${n.title}</strong>
          <p class="muted">${n.desc}</p>
          <small class="muted">${n.time}</small>
        </div>
      </div>
    `).join('');
    notifBadge.textContent = notifs.length;
  }
  
  console.log('📊 Dashboard content loaded');
}

// ─── INIT ON DOM READY ───
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔌 Dashboard initializing...');
  
  const user = checkSession();
  if (!user) return; // Redirect already handled
  
  updateUI(user);
  setupLogout();
  setupProfileDropdown();
  loadDashboardContent();
  
  // Hide loader if exists
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.add('hidden');
  
  console.log('🚀 Dashboard ready');
});