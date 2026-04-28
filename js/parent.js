// js/parent.js - Parent Portal Logic (Read-Only)
import { pb, connected } from './core/pocketbase.js';
import { initNotifications } from './notifications.js';

// Mock data fallback (replace with PB fetch when ready)
const mockGrades = [
  { semester: "Semester 1", courses: [{code:"CS101",name:"Data Structures",grade:"A",credits:4},{code:"MATH201",name:"Calculus II",grade:"B+",credits:3}] },
  { semester: "Semester 2", courses: [{code:"CS205",name:"Database Systems",grade:"A",credits:3},{code:"ENG102",name:"Technical Writing",grade:"A-",credits:2}] }
];
const mockFees = { due: 25000, paid: 33500, transactions: [
  {date:"2025-09-15",ref:"MPESA9X2K1",desc:"Tuition Installment 1",amount:25000,status:"paid"},
  {date:"2025-11-02",ref:"BANK88L2M9",desc:"Library & Lab Fees",amount:8500,status:"paid"}
]};
const mockSchedule = {
  mon: [{time:"08:00-10:00",name:"CS101",room:"Lab 301"}],
  tue: [{time:"10:00-12:00",name:"MATH201",room:"Room 205"}],
  wed: [{time:"14:00-16:00",name:"ENG102",room:"Hall 102"}],
  thu: [{time:"08:00-10:00",name:"CS205",room:"Lab 302"}],
  fri: []
};

function checkParentSession() {
  const raw = localStorage.getItem('uzima_session');
  console.log('🔍 Parent session check - raw:', raw);
  
  if (!raw) { 
    console.warn('⚠️ No session found');
    window.location.href = 'index.html'; 
    return null; 
  }
  
  try {
    const auth = JSON.parse(raw);
    console.log('🔍 Parsed auth:', auth);
    
    if (Date.now() > auth.expires) { 
      console.warn('⚠️ Session expired');
      localStorage.removeItem('uzima_session'); 
      window.location.href = 'index.html'; 
      return null; 
    }
    
    const role = auth.model?.role?.toLowerCase() || 'student';
    console.log('🔍 User role:', role);
    
    if (role !== 'parent') {
      console.warn('⚠️ Wrong role, redirecting to dashboard');
      window.location.href = 'dashboard.html';
      return null;
    }
    
    console.log('✅ Parent session valid');
    return auth.model;
  } catch (e) {
    console.error('❌ Session parse error:', e);
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
    return null;
  }
}
async function loadChildData(parentId) {
  try {
    // Try PB first
    if (connected && pb) {
      const parentRecord = await pb.collection('users').getOne(parentId);
      const childId = parentRecord.child_id;
      if (!childId) throw new Error('No student assigned');
      return await pb.collection('users').getOne(childId);
    }
  } catch (err) {
    console.warn('PB fetch failed, using mock child data');
  }
  // Fallback mock student
  return { name: 'John Doe', sid: 'UMB/2025/001', role: 'Computer Science' };
}

function renderGrades() {
  const gpaEl = document.getElementById('childGPA');
  const creditsEl = document.getElementById('childCredits');
  const bodyEl = document.getElementById('childGradesBody');
  
  let totalPts = 0, totalCr = 0;
  const gradeMap = {A:4.0,"A-":3.7,"B+":3.3,B:3.0,"B-":2.7,C:2.0,F:0.0};
  
  let html = '';
  mockGrades.forEach(sem => {
    let semPts = 0, semCr = 0;
    html += `<div style="margin-bottom:16px"><strong style="color:var(--t1)">${sem.semester}</strong><table class="admin-table" style="margin-top:8px"><thead><tr><th>Code</th><th>Course</th><th>Credits</th><th>Grade</th></tr></thead><tbody>`;
    sem.courses.forEach(c => {
      const pts = gradeMap[c.grade] || 0;
      semPts += pts * c.credits; semCr += c.credits;
      html += `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td><td><span class="status-badge status-paid">${c.grade}</span></td></tr>`;
    });
    html += `</tbody></table><div style="text-align:right;color:var(--t2);font-size:0.85rem;margin-top:4px">Semester GPA: ${(semPts/semCr).toFixed(2)}</div></div>`;
    totalPts += semPts; totalCr += semCr;
  });
  
  gpaEl.textContent = (totalPts/totalCr).toFixed(2);
  creditsEl.textContent = totalCr;
  bodyEl.innerHTML = html;
}

function renderFees() {
  document.getElementById('childFeesDue').textContent = `KES ${mockFees.due.toLocaleString()}`;
  document.getElementById('childFeesPaid').textContent = `KES ${mockFees.paid.toLocaleString()}`;
  const tbody = document.getElementById('childFeesBody');
  tbody.innerHTML = mockFees.transactions.map(t => `
    <tr><td>${t.date}</td><td>${t.ref}</td><td>${t.desc}</td><td>KES ${t.amount.toLocaleString()}</td><td><span class="status-badge status-${t.status}">${t.status}</span></td></tr>
  `).join('');
}

function renderSchedule() {
  const container = document.getElementById('childScheduleBody');
  container.innerHTML = `<div class="schedule-grid-mini">${['mon','tue','wed','thu','fri'].map(day => `
    <div class="day-col"><h4>${day.charAt(0).toUpperCase()+day.slice(1)}</h4>
    ${mockSchedule[day].map(c => `<div class="class-block"><span class="time">${c.time}</span><span class="name">${c.name}</span><span class="room">${c.room}</span></div>`).join('') || '<div style="color:var(--t4);font-size:0.85rem">No classes</div>'}
    </div>`).join('')}</div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const parent = checkParentSession();
  if (!parent) return;

  // Update Nav UI
  document.getElementById('navName').textContent = parent.name.split(' ')[0];
  document.getElementById('navAvatar').textContent = parent.name.charAt(0).toUpperCase();

  // 🔑 FIX: Profile Dropdown Toggle
  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  if (navProfile && dropdown) {
    navProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }

  // Load Child Data
  const child = await loadChildData(parent.id);
  document.getElementById('childName').textContent = child.name;
  document.getElementById('childSid').textContent = child.sid || 'N/A';
  document.getElementById('childRole').textContent = child.role || 'Student';

  renderGrades();
  renderFees();
  renderSchedule();

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    });
  });

  // Logout
  document.getElementById('logoutBtn').onclick = () => {
    if (connected && pb) pb.authStore.clear();
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
  };

  initNotifications();
});