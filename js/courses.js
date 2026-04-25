import { clean, esc } from './utils/string.js';
import { toast } from './ui/toasts.js';

// ─── SESSION CHECK ───
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
    return auth.model;
  } catch {
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
    return null;
  }
}

// ─── MOCK DATA ───
const coursesData = [
  { code: 'CS401', name: 'Advanced Web Systems', instructor: 'Dr. A. Mwangi', term: 'fall2024', grade: 92, status: 'active' },
  { code: 'CS302', name: 'Database Systems', instructor: 'Prof. J. Ochieng', term: 'fall2024', grade: 78, status: 'active' },
  { code: 'CYB201', name: 'Cybersecurity Fundamentals', instructor: 'Dr. S. Kamau', term: 'fall2024', grade: 85, status: 'active' },
  { code: 'MAT300', name: 'Mathematics III', instructor: 'Prof. R. Ngugi', term: 'fall2024', grade: 41, status: 'completed' },
  { code: 'CS405', name: 'Cloud Computing', instructor: 'Dr. P. Wanjiku', term: 'spring2025', grade: 88, status: 'active' }
];

const assignmentsData = [
  { course: 'CS401', title: 'Final Project Deployment', due: '2026-05-15', status: 'pending' },
  { course: 'CS302', title: 'SQL Optimization Lab', due: '2026-05-10', status: 'submitted' },
  { course: 'CYB201', title: 'Vulnerability Assessment Report', due: '2026-05-12', status: 'pending' },
  { course: 'MAT300', title: 'Final Exam', due: '2026-04-20', status: 'overdue' },
  { course: 'CS405', title: 'Cloud Architecture Diagram', due: '2026-05-18', status: 'pending' }
];

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  const user = checkSession();
  if (!user) return;

  const name = user?.name || 'Student';
  document.getElementById('navName').textContent = clean(name);
  document.getElementById('navAvatar').textContent = clean(name).charAt(0).toUpperCase();

  renderCourses();
  renderAssignments();
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
});

// ─── RENDER COURSES ───
function renderCourses(filterTerm = 'all', sortBy = 'grade', search = '') {
  const grid = document.getElementById('coursesGrid');
  let filtered = coursesData.filter(c => {
    const matchTerm = filterTerm === 'all' || c.term === filterTerm;
    const matchSearch = search === '' || 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.instructor.toLowerCase().includes(search.toLowerCase());
    return matchTerm && matchSearch;
  });

  if (sortBy === 'grade') filtered.sort((a, b) => b.grade - a.grade);
  else filtered.sort((a, b) => a.name.localeCompare(b.name));

  const circumference = 2 * Math.PI * 22; // r=22
  grid.innerHTML = filtered.map(c => {
    const offset = circumference - (c.grade / 100) * circumference;
    return `
      <div class="course-card">
        <div class="course-header">
          <div>
            <div class="course-code">${esc(c.code)}</div>
            <div class="course-title">${esc(c.name)}</div>
            <div class="course-instructor"><i class="fas fa-chalkboard-teacher"></i> ${esc(c.instructor)}</div>
          </div>
          <div class="progress-ring-wrap">
            <svg width="56" height="56">
              <circle class="progress-ring-bg" cx="28" cy="28" r="22"></circle>
              <circle class="progress-ring-fill" cx="28" cy="28" r="22" 
                stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" data-target="${offset}"></circle>
            </svg>
            <div class="progress-ring-text">${c.grade}%</div>
          </div>
        </div>
        <div class="course-meta">
          <span>Term: ${c.term.replace(/([A-Z])/g, ' $1').trim()}</span>
          <span class="course-status ${c.status}">${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
        </div>
      </div>
    `;
  }).join('');

  // Animate rings
  setTimeout(() => {
    grid.querySelectorAll('.progress-ring-fill').forEach(ring => {
      ring.style.strokeDashoffset = ring.dataset.target;
    });
  }, 50);
}

// ─── RENDER ASSIGNMENTS ───
function renderAssignments() {
  const tbody = document.getElementById('assignmentsBody');
  tbody.innerHTML = assignmentsData.map(a => `
    <tr>
      <td><strong>${esc(a.course)}</strong></td>
      <td>${esc(a.title)}</td>
      <td>${new Date(a.due).toLocaleDateString()}</td>
      <td><span class="assign-badge ${a.status}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></td>
      <td>
        <button class="assign-btn" ${a.status !== 'pending' ? 'disabled' : ''} onclick="window.submitAssignment('${a.course}', '${esc(a.title)}')">
          ${a.status === 'submitted' ? 'Submitted' : a.status === 'overdue' ? 'Closed' : 'Submit'}
        </button>
      </td>
    </tr>
  `).join('');
}

window.submitAssignment = (course, title) => {
  toast.show(`Submitted: ${title}`, 's');
  const idx = assignmentsData.findIndex(a => a.course === course && a.title === title);
  if (idx !== -1) assignmentsData[idx].status = 'submitted';
  renderAssignments();
};

// ─── CONTROLS ───
function bindControls() {
  const termEl = document.getElementById('termFilter');
  const sortEl = document.getElementById('sortFilter');
  const searchEl = document.getElementById('courseSearch');
  
  const refresh = () => renderCourses(termEl.value, sortEl.value, searchEl.value);
  termEl.addEventListener('change', refresh);
  sortEl.addEventListener('change', refresh);
  searchEl.addEventListener('input', refresh);

  document.getElementById('markAllDone').addEventListener('click', () => {
    assignmentsData.forEach(a => { if(a.status === 'pending') a.status = 'submitted'; });
    renderAssignments();
    toast.show('All pending assignments marked as submitted', 's');
  });

  document.getElementById('transcriptBtn').addEventListener('click', () => {
    window.print();
  });
}