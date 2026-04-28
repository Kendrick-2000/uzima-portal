// js/schedule.js - Interactive Schedule Logic
import { pb, connected } from './core/pocketbase.js';
import { toast } from './ui/toasts.js';
import { initNotifications } from './notifications.js';

const scheduleData = [
  { course: 'CS101', name: 'Data Structures', day: 'mon', start: '08:00', end: '10:00', room: 'Lab 301', lecturer: 'Dr. A. Mwangi', color: '#4ade80' },
  { course: 'MATH201', name: 'Calculus II', day: 'tue', start: '10:00', end: '12:00', room: 'Room 205', lecturer: 'Prof. J. Ochieng', color: '#60a5fa' },
  { course: 'ENG102', name: 'Technical Writing', day: 'wed', start: '14:00', end: '16:00', room: 'Hall 102', lecturer: 'Ms. L. Wanjiku', color: '#f472b6' },
  { course: 'CS205', name: 'Database Systems', day: 'thu', start: '08:00', end: '10:00', room: 'Lab 302', lecturer: 'Mr. P. Kamau', color: '#a78bfa' },
  { course: 'STAT200', name: 'Probability & Stats', day: 'mon', start: '09:30', end: '11:30', room: 'Room 404', lecturer: 'Dr. K. Njoroge', color: '#f59e0b' },
  { course: 'HUM101', name: 'Ethics in Tech', day: 'fri', start: '13:00', end: '15:00', room: 'Auditorium', lecturer: 'Prof. M. Wambui', color: '#22d3ee' }
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };
const HOURS_START = 8;
const HOURS_END = 18;

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

function checkSession() {
  const raw = localStorage.getItem('uzima_session');
  if (!raw) { window.location.href = 'index.html'; return null; }
  const auth = JSON.parse(raw);
  if (Date.now() > auth.expires) { localStorage.removeItem('uzima_session'); window.location.href = 'index.html'; return null; }
  return auth.model;
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return (h - HOURS_START) * 60 + m;
}

function detectConflicts(data) {
  const conflicts = new Set();
  DAYS.forEach(day => {
    const dayClasses = data.filter(c => c.day === day);
    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const s1 = timeToMinutes(dayClasses[i].start), e1 = timeToMinutes(dayClasses[i].end);
        const s2 = timeToMinutes(dayClasses[j].start), e2 = timeToMinutes(dayClasses[j].end);
        if (s1 < e2 && s2 < e1) { conflicts.add(dayClasses[i].course); conflicts.add(dayClasses[j].course); }
      }
    }
  });
  return conflicts;
}

function renderSchedule() {
  const grid = document.getElementById('scheduleGrid');
  const timeLabels = document.getElementById('timeLabels');
  const legend = document.getElementById('scheduleLegend');
  grid.innerHTML = ''; timeLabels.innerHTML = ''; legend.innerHTML = '';

  for (let h = HOURS_START; h <= HOURS_END; h++) {
    const div = document.createElement('div');
    div.className = 'time-slot';
    div.textContent = `${h.toString().padStart(2, '0')}:00`;
    timeLabels.appendChild(div);
  }

  const conflicts = detectConflicts(scheduleData);
  const uniqueCourses = [...new Map(scheduleData.map(c => [c.course, c])).values()];

  DAYS.forEach(day => {
    const col = document.createElement('div');
    col.className = 'day-column';
    col.innerHTML = `<div class="day-header">${DAY_NAMES[day].slice(0,3)}</div>`;

    scheduleData.filter(c => c.day === day).forEach(c => {
      const top = timeToMinutes(c.start);
      const height = timeToMinutes(c.end) - top;
      const isConflict = conflicts.has(c.course);

      const block = document.createElement('div');
      block.className = `course-block ${isConflict ? 'conflict' : ''}`;
      block.style.top = `${(top / 600) * 100}%`;
      block.style.height = `${(height / 600) * 100}%`;
      block.style.background = `${c.color}22`;
      block.style.borderColor = `${c.color}66`;
      block.innerHTML = `<span class="code" style="color:${c.color}">${c.course}</span><span class="room">${c.room}</span>`;
      block.onclick = () => showCourseModal(c);
      col.appendChild(block);
    });
    grid.appendChild(col);
  });

  uniqueCourses.forEach(c => {
    legend.innerHTML += `<div class="legend-item"><span class="legend-color" style="background:${c.color}"></span>${c.course} - ${c.name}</div>`;
  });
}

function showCourseModal(c) {
  document.getElementById('modalCourseTitle').textContent = c.name;
  document.getElementById('modalContent').innerHTML = `
    <div><strong>Code:</strong> ${c.course}</div>
    <div><strong>Day:</strong> ${DAY_NAMES[c.day]}</div>
    <div><strong>Time:</strong> ${c.start} - ${c.end}</div>
    <div><strong>Location:</strong> ${c.room}</div>
    <div><strong>Lecturer:</strong> ${c.lecturer}</div>
    ${detectConflicts(scheduleData).has(c.course) ? '<div style="color:var(--err);font-weight:600;margin-top:8px;">⚠️ Schedule Conflict Detected</div>' : ''}
  `;
  document.getElementById('courseModal').classList.add('open');
}

window.closeModal = (id) => document.getElementById(id).classList.remove('open');

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
  const user = checkSession();
  if (!user) return;

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
  document.getElementById('logoutBtn').onclick = () => {
    if (connected && pb) pb.authStore.clear();
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
  };

  renderSchedule();

  const weekLabel = document.getElementById('currentWeekLabel');
  document.getElementById('prevWeek').onclick = () => { weekLabel.textContent = 'Previous Week'; toast.show('Previous week loaded', 'i'); };
  document.getElementById('nextWeek').onclick = () => { weekLabel.textContent = 'Next Week'; toast.show('Next week loaded', 'i'); };
  document.getElementById('todayBtn').onclick = () => { weekLabel.textContent = 'Current Week'; toast.show('Focused on current week', 'i'); };
  document.getElementById('printSchedule').onclick = () => window.print();
  
  // Initialize Notifications
  initNotifications();
});