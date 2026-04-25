import { clean, esc } from './utils/string.js';
import { toast } from './ui/toasts.js';

console.log('📦 [Dashboard.js] Module loaded');

// ─── SESSION CHECK (DEBUG VERSION) ───
function checkSession() {
  console.log('🔍 [Dashboard] === SESSION CHECK START ===');
  
  // Step 1: Check if localStorage is accessible
  try {
    localStorage.setItem('test', '1');
    localStorage.removeItem('test');
    console.log('✅ [Dashboard] localStorage is accessible');
  } catch (e) {
    console.error('❌ [Dashboard] localStorage is NOT accessible:', e);
    return null;
  }
  
  // Step 2: Get session
  const raw = localStorage.getItem('uzima_session');
  console.log('📦 [Dashboard] Raw session from localStorage:', raw);
  
  if (!raw) {
    console.error('❌ [Dashboard] FAIL: Session is NULL or undefined');
    console.log('📋 [Dashboard] All localStorage keys:', Object.keys(localStorage));
    // window.location.href = 'index.html'; // DISABLED FOR DEBUG
    return null;
  }
  
  // Step 3: Parse session
  let auth;
  try {
    auth = JSON.parse(raw);
    console.log('✅ [Dashboard] Session parsed successfully:', auth);
  } catch (e) {
    console.error('❌ [Dashboard] FAIL: JSON parse error:', e);
    console.error('📜 [Dashboard] Raw string:', raw);
    // window.location.href = 'index.html'; // DISABLED FOR DEBUG
    return null;
  }
  
  // Step 4: Check structure
  if (!auth.model) {
    console.error('❌ [Dashboard] FAIL: Session missing "model" property');
    // window.location.href = 'index.html'; // DISABLED FOR DEBUG
    return null;
  }
  
  if (!auth.model.name) {
    console.error('❌ [Dashboard] FAIL: Session model missing "name" property');
    console.log('📋 [Dashboard] Model object:', auth.model);
    // window.location.href = 'index.html'; // DISABLED FOR DEBUG
    return null;
  }
  
  // Step 5: Check expiration
  const now = Date.now();
  const expires = auth.expires;
  console.log('⏰ [Dashboard] Current time:', new Date(now).toISOString());
  console.log('⏰ [Dashboard] Session expires:', new Date(expires).toISOString());
  console.log('⏰ [Dashboard] Time until expiry:', (expires - now) / 1000, 'seconds');
  
  if (now > expires) {
    console.error('❌ [Dashboard] FAIL: Session EXPIRED');
    // window.location.href = 'index.html'; // DISABLED FOR DEBUG
    return null;
  }
  
  // Step 6: Success
  console.log('✅ [Dashboard] === SESSION CHECK PASSED ===');
  console.log('👤 [Dashboard] User:', auth.model.name);
  console.log('📧 [Dashboard] Email:', auth.model.email);
  return auth.model;
}

// ─── INIT ───
console.log('🚀 [Dashboard] DOMContentLoaded fired');

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [Dashboard] DOMContentLoaded event handler');
  
  const user = checkSession();
  console.log('📊 [Dashboard] checkSession returned:', user);
  
  if (!user) {
    console.error('⛔ [Dashboard] ABORTING: No valid user from checkSession');
    return; // Don't redirect yet - let us see the logs
  }
  
  console.log('✅ [Dashboard] User authenticated, initializing dashboard...');

  const name = user?.name || 'Student';
  document.getElementById('welcomeMsg').textContent = `Good ${getGreeting()}, ${clean(name)}`;
  document.getElementById('navName').textContent = clean(name);
  document.getElementById('navAvatar').textContent = clean(name).charAt(0).toUpperCase();
  document.getElementById('welcomeDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Load modules
  renderStats();
  renderQuickActions();
  renderTimetable();
  renderNotifications();
  renderGradeChart();

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
});

function getGreeting() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }

// ─── STATS ───
function renderStats() {
  animateValue('statCredits', 0, 24, 1000);
  animateValue('statGPA', 0, 3.42, 1200, true);
  animateValue('statPending', 0, 3, 800);
  document.getElementById('statAttendance').textContent = '87%';
}
function animateValue(id, start, end, duration, isFloat = false) {
  const el = document.getElementById(id);
  const range = end - start;
  const startTime = performance.now();
  const step = (ts) => {
    const progress = Math.min((ts - startTime) / duration, 1);
    el.textContent = isFloat ? (start + range * progress).toFixed(2) : Math.round(start + range * progress);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ─── QUICK ACTIONS ───
function renderQuickActions() {
  const actions = [
    { icon: 'fa-file-pdf', label: 'Transcript', sub: 'Request official copy' },
    { icon: 'fa-receipt', label: 'Fee Statement', sub: 'View balance & history' },
    { icon: 'fa-user-tie', label: 'Academic Advisor', sub: 'Book consultation' },
    { icon: 'fa-book-open', label: 'Library Portal', sub: 'Access e-resources' }
  ];
  document.getElementById('actionsGrid').innerHTML = actions.map(a => `
    <div class="action-card" tabindex="0" role="button" aria-label="${esc(a.label)}">
      <div class="action-icon"><i class="fas ${a.icon}"></i></div>
      <div class="action-label">${esc(a.label)}</div>
      <div class="action-sub">${esc(a.sub)}</div>
    </div>
  `).join('');
}

// ─── TIMETABLE ───
const timetableData = {
  mon: [{time:'09:00',course:'Advanced Web Systems',room:'Lab 302',status:'live'},{time:'11:30',course:'Data Structures',room:'Room 104',status:'upcoming'},{time:'14:00',course:'Cybersecurity Fund.',room:'Lab 201',status:'upcoming'}],
  tue: [{time:'10:00',course:'Database Systems',room:'Room 205',status:'upcoming'},{time:'13:00',course:'Mathematics III',room:'Hall A',status:'done'}],
  wed: [{time:'09:00',course:'Network Security',room:'Lab 302',status:'upcoming'},{time:'12:00',course:'Research Methods',room:'Room 112',status:'upcoming'}],
  thu: [{time:'10:30',course:'Cloud Computing',room:'Lab 205',status:'upcoming'},{time:'15:00',course:'Ethics in IT',room:'Room 301',status:'upcoming'}],
  fri: [{time:'09:00',course:'Capstone Project',room:'Innovation Hub',status:'upcoming'}]
};

function renderTimetable() {
  const tabs = document.getElementById('ttTabs');
  const body = document.getElementById('ttBody');
  
  const switchDay = (day) => {
    tabs.querySelectorAll('.tt-tab').forEach(t => t.classList.toggle('active', t.dataset.day === day));
    const slots = timetableData[day] || [];
    body.innerHTML = slots.length ? slots.map(s => `
      <div class="schedule-slot">
        <div class="slot-time">${esc(s.time)}</div>
        <div class="slot-info"><h4>${esc(s.course)}</h4><p><i class="fas fa-map-marker-alt"></i> ${esc(s.room)}</p></div>
        <span class="slot-status ${s.status}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
      </div>
    `).join('') : '<p style="color:var(--t4);text-align:center;padding:1.5rem">No classes scheduled</p>';
  };

  tabs.querySelectorAll('.tt-tab').forEach(btn => {
    btn.addEventListener('click', () => switchDay(btn.dataset.day));
  });
  switchDay('mon');
}

// ─── NOTIFICATIONS ───
let notifications = [
  { id:1, type:'info', title:'Mid-Term Schedule Released', meta:'Academic Registry • 2h ago', read:false },
  { id:2, type:'warn', title:'Fee Payment Deadline Approaching', meta:'Finance Office • 5h ago', read:false },
  { id:3, type:'success', title:'Assignment Submitted Successfully', meta:'Web Systems • 1d ago', read:true }
];

function renderNotifications() {
  const list = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  const unread = notifications.filter(n => !n.read).length;
  badge.textContent = unread;
  badge.classList.toggle('empty', unread === 0);

  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read?'read':''}" data-id="${n.id}">
      <div class="notif-icon ${n.type}"><i class="fas ${n.type==='info'?'fa-circle-info':n.type==='warn'?'fa-triangle-exclamation':'fa-check-circle'}"></i></div>
      <div class="notif-content">
        <div class="notif-title">${esc(n.title)}</div>
        <div class="notif-meta">${esc(n.meta)}</div>
        ${!n.read ? `<button class="mark-read-btn" onclick="window.markNotifRead(${n.id})">Mark as read</button>` : ''}
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>
  `).join('');
}

window.markNotifRead = (id) => {
  const n = notifications.find(x => x.id === id);
  if (n) { n.read = true; renderNotifications(); }
};

function markAllNotificationsRead() {
  notifications.forEach(n => n.read = true);
  renderNotifications();
  toast.show('All notifications marked as read', 's');
}

// ─── GRADE CHART ───
function renderGradeChart() {
  const courses = [
    { name:'Web Development', score:92 },
    { name:'Database Systems', score:78 },
    { name:'Network Security', score:85 },
    { name:'Mathematics III', score:41 },
    { name:'Cloud Computing', score:88 }
  ];
  const container = document.getElementById('gradeChart');
  
  container.innerHTML = `
    <div class="chart-container">
      ${courses.map(c => {
        const cls = c.score >= 70 ? 'pass' : c.score >= 50 ? 'warn' : 'fail';
        return `<div class="chart-row">
          <div class="chart-label" title="${esc(c.name)}">${esc(c.name)}</div>
          <div class="chart-bar-bg"><div class="chart-bar ${cls}" data-w="${c.score}"><span>${c.score}%</span></div></div>
        </div>`;
      }).join('')}
      <div class="chart-legend">
        <span><i class="fas fa-circle" style="color:var(--accent)"></i> Pass (≥70%)</span>
        <span><i class="fas fa-circle" style="color:var(--warn)"></i> Borderline (50-69%)</span>
        <span><i class="fas fa-circle" style="color:var(--err)"></i> Fail (<50%)</span>
      </div>
    </div>
  `;

  // Animate bars on load
  setTimeout(() => {
    container.querySelectorAll('.chart-bar').forEach(bar => {
      bar.style.width = bar.dataset.w + '%';
    });
  }, 100);
}