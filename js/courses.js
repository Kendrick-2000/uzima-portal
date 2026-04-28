// js/courses.js - Courses Page Logic
import { pb, connected } from './core/pocketbase.js';
import { toast } from './ui/toasts.js';
import { initNotifications } from './notifications.js';

const mockCourses = [
  { id: '1', code: 'CS101', name: 'Introduction to Data Structures', credits: 4, lecturer: 'Dr. A. Mwangi', semester: '1', status: 'enrolled', schedule: 'Mon & Wed 8:00 AM', grade: null },
  { id: '2', code: 'MATH201', name: 'Calculus II', credits: 3, lecturer: 'Prof. J. Ochieng', semester: '1', status: 'enrolled', schedule: 'Tue & Thu 10:00 AM', grade: null },
  { id: '3', code: 'ENG102', name: 'Technical Writing', credits: 2, lecturer: 'Ms. L. Wanjiku', semester: '1', status: 'enrolled', schedule: 'Fri 2:00 PM', grade: null },
  { id: '4', code: 'PHY101', name: 'Physics for Engineers', credits: 4, lecturer: 'Dr. K. Njoroge', semester: '2', status: 'completed', schedule: 'Mon & Wed 11:00 AM', grade: 'B+' },
  { id: '5', code: 'CS205', name: 'Database Systems', credits: 3, lecturer: 'Mr. P. Kamau', semester: '2', status: 'completed', schedule: 'Tue & Thu 2:00 PM', grade: 'A' },
];

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

function renderCourses(courses) {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;
  if (courses.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-book-open" style="font-size:2rem;margin-bottom:12px;display:block;"></i><p>No courses found matching your filters.</p></div>';
    return;
  }
  grid.innerHTML = courses.map(c => `
    <div class="course-card">
      <div class="course-header">
        <span class="course-code">${c.code}</span>
        <span class="course-status status-${c.status}">${c.status}</span>
      </div>
      <h3 class="course-title">${c.name}</h3>
      <div class="course-meta">
        <span><i class="fas fa-chalkboard-teacher"></i> ${c.lecturer}</span>
        <span><i class="fas fa-clock"></i> ${c.schedule}</span>
        ${c.grade ? `<span><i class="fas fa-star"></i> Grade: <strong style="color:var(--accent)">${c.grade}</strong></span>` : ''}
      </div>
      <div class="course-footer">
        <span class="course-credits"><strong>${c.credits}</strong> Credits</span>
        <button class="btn-view" onclick="alert('Course details module coming soon!')">View Details</button>
      </div>
    </div>
  `).join('');
}

function initCourses() {
  const user = checkSession();
  if (!user) return;

  const navName = document.getElementById('navName');
  const navAvatar = document.getElementById('navAvatar');
  if (navName) navName.textContent = (user.name?.name || user.name || 'User').split(' ')[0];
  if (navAvatar) navAvatar.textContent = (user.name?.name || user.name || 'U').charAt(0).toUpperCase();

  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  if (navProfile && dropdown) {
    navProfile.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (connected && pb) pb.authStore.clear();
      localStorage.removeItem('uzima_session');
      window.location.href = 'index.html';
    };
  }

  renderCourses(mockCourses);

  const searchInput = document.getElementById('courseSearch');
  const semFilter = document.getElementById('filterSemester');
  const statusFilter = document.getElementById('filterStatus');

  function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const sem = semFilter.value;
    const stat = statusFilter.value;
    const filtered = mockCourses.filter(c => {
      const matchQuery = c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query) || c.lecturer.toLowerCase().includes(query);
      const matchSem = sem === 'all' || c.semester === sem;
      const matchStat = stat === 'all' || c.status === stat;
      return matchQuery && matchSem && matchStat;
    });
    renderCourses(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  semFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  
  // Initialize Notifications
  initNotifications();
}

document.addEventListener('DOMContentLoaded', initCourses);
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