// js/dashboard.js - Complete Fixed Version
import { pb, connected } from './core/pocketbase.js';
import { toast } from './ui/toasts.js';
import { initNotifications } from './notifications.js';

console.log('📦 [Dashboard.js] Module loaded');

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

// ─── SESSION CHECK ───
function checkSession() {
  try {
    const raw = localStorage.getItem('uzima_session');
    if (!raw) throw new Error('No session');
    
    const auth = JSON.parse(raw);
    if (!auth.model) throw new Error('Invalid session');
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
  let displayName = "Student";
  let displaySid = "N/A";
  let displayRole = "STUDENT";
  let displayEmail = "N/A";

  if (user.name && typeof user.name === 'object') {
      displayName = user.name.name || "Student";
      displaySid = user.name.sid || "N/A";
      displayRole = (user.name.role || "student").toUpperCase();
      displayEmail = user.name.email || "N/A";
  } else if (user.name && typeof user.name === 'string') {
      displayName = user.name;
      displaySid = user.sid || "N/A";
      displayRole = (user.role || "student").toUpperCase();
      displayEmail = user.email || "N/A";
  }

  // 1. Welcome & Nav
  const welcome = document.getElementById('welcomeMsg');
  if (welcome) welcome.textContent = `Welcome back, ${displayName}`;
  
  const navName = document.getElementById('navName');
  if (navName) navName.textContent = displayName.split(' ')[0];
  
  const avatar = document.getElementById('navAvatar');
  if (avatar) avatar.textContent = displayName.charAt(0).toUpperCase();
  
  // 2. Profile Card (Live Data)
  const profileSid = document.getElementById('profileSid');
  if (profileSid) profileSid.textContent = displaySid;
  
  const profileRole = document.getElementById('profileRole');
  if (profileRole) profileRole.textContent = displayRole;
  
  const profileEmail = document.getElementById('profileEmail');
  if (profileEmail) profileEmail.textContent = displayEmail;
  
  // 3. Date
  const welcomeDate = document.getElementById('welcomeDate');
  if (welcomeDate) {
    const now = new Date();
    welcomeDate.textContent = now.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  }
  
  console.log('🎨 UI updated for', displayName, '| SID:', displaySid);
}

// ─── LOGOUT ───
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      if (connected && pb) pb.authStore.clear();
      localStorage.removeItem('uzima_session');
      toast.show('Logged out successfully', 's');
      setTimeout(() => { window.location.href = 'index.html'; }, 400);
    };
  }
}

// ─── DROPDOWN ───
function setupProfileDropdown() {
  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  if (!navProfile || !dropdown) return;

  navProfile.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!navProfile.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
}

// ─── TIMETABLE ───
function setupTimetable() {
  const ttTabs = document.getElementById('ttTabs');
  const ttBody = document.getElementById('ttBody');
  if (!ttTabs || !ttBody) return;

  const tabs = ttTabs.querySelectorAll('.tt-tab');
  const schedules = {
    mon: '<div class="schedule-item" style="padding: 12px 0;"><strong style="color: var(--accent);">8:00 AM - 10:00 AM</strong><br>CS101 - Data Structures<br><span class="muted">Room 301</span></div>',
    tue: '<div class="schedule-item" style="padding: 12px 0;"><strong style="color: var(--accent);">10:00 AM - 12:00 PM</strong><br>MATH201 - Calculus II<br><span class="muted">Room 205</span></div>',
    wed: '<div class="schedule-item" style="padding: 12px 0;"><strong style="color: var(--accent);">2:00 PM - 4:00 PM</strong><br>ENG102 - Technical Writing<br><span class="muted">Room 102</span></div>',
    thu: '<div class="schedule-item" style="padding: 12px 0;"><strong style="color: var(--accent);">8:00 AM - 10:00 AM</strong><br>CS101 - Data Structures<br><span class="muted">Room 301</span></div>',
    fri: '<p class="muted" style="padding: 12px 0;">No classes scheduled</p>'
  };
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      ttBody.innerHTML = schedules[tab.dataset.day] || '<p class="muted">No schedule</p>';
    });
  });
  
  if (tabs.length > 0) tabs[0].click();
}

// ─── QUICK ACTIONS & NOTIFS ───
function loadExtras() {
  const actionsGrid = document.getElementById('actionsGrid');
  if (actionsGrid) {
    actionsGrid.innerHTML = `
      <button class="action-card"><i class="fas fa-book"></i><span>View Courses</span></button>
      <button class="action-card"><i class="fas fa-clipboard-list"></i><span>Grades</span></button>
      <button class="action-card"><i class="fas fa-calendar-alt"></i><span>Timetable</span></button>
      <button class="action-card"><i class="fas fa-bell"></i><span>Notifications</span></button>
    `;
  }

  const notifList = document.getElementById('notifList');
  if (notifList) {
    notifList.innerHTML = `
      <div class="notif-item"><strong style="color:var(--t1)">Assignment Due</strong><p class="muted">CS101: Data Structures - Tomorrow</p></div>
      <div class="notif-item"><strong style="color:var(--t1)">Grade Posted</strong><p class="muted">MATH201: Calculus II - B+</p></div>
    `;
  }
}

// ─── INIT ──
document.addEventListener('DOMContentLoaded', () => {
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
  console.log('🔌 Dashboard initializing...');
  const user = checkSession();
  if (!user) return;
  
  updateUI(user);
  setupLogout();
  setupProfileDropdown();
  setupTimetable();
  loadExtras();
  initNotifications();
  console.log('🚀 Dashboard ready');
});