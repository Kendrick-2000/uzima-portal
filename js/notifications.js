// js/notifications.js - Live Notification System (Auto-Injecting)
const NOTIF_KEY = 'uzima_notifications';
const mockNotifs = [
  { id: 'n1', title: 'Assignment Due', desc: 'CS101: Data Structures submission due tomorrow', time: '2h ago', read: false },
  { id: 'n2', title: 'Grade Posted', desc: 'MATH201: Calculus II - B+ published', time: '1d ago', read: false },
  { id: 'n3', title: 'System Maintenance', desc: 'Portal will be offline for updates on Sunday', time: '3d ago', read: true }
];

function loadNotifs() {
  const stored = localStorage.getItem(NOTIF_KEY);
  return stored ? JSON.parse(stored) : mockNotifs;
}

function saveNotifs(notifs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

function renderNotifs(notifs, dropdown, listEl, badgeEl) {
  const unreadCount = notifs.filter(n => !n.read).length;
  badgeEl.textContent = unreadCount > 0 ? unreadCount : '';
  badgeEl.style.display = unreadCount > 0 ? 'inline-flex' : 'none';

  if (notifs.length === 0) {
    listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--t4)">No notifications</div>';
    return;
  }

  listEl.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="notif-title">${n.title}</div>
      <div class="notif-desc">${n.desc}</div>
      <div class="notif-time">${n.time}</div>
    </div>
  `).join('');

  listEl.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const notif = notifs.find(n => n.id === id);
      if (notif && !notif.read) {
        notif.read = true;
        saveNotifs(notifs);
        renderNotifs(notifs, dropdown, listEl, badgeEl);
      }
    });
  });
}

export function initNotifications() {
  const bell = document.getElementById('notifBell');
  let dropdown = document.getElementById('notifDropdown');
  const badgeEl = document.getElementById('notifBadge');
  
  // Auto-inject dropdown HTML if missing (for pages other than dashboard)
  if (!dropdown && bell) {
    dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.className = 'notif-dropdown';
    dropdown.innerHTML = `
      <div class="notif-header">
        <h4>Notifications</h4>
        <button class="notif-clear" id="markAllRead">Mark all read</button>
      </div>
      <div class="notif-list" id="notifList"></div>
    `;
    bell.parentNode.insertBefore(dropdown, bell.nextSibling);
  }

  if (!bell || !dropdown) return;

  const listEl = document.getElementById('notifList');
  const markAllBtn = document.getElementById('markAllRead');

  let notifs = loadNotifs();
  renderNotifs(notifs, dropdown, listEl, badgeEl);

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      notifs.forEach(n => n.read = true);
      saveNotifs(notifs);
      renderNotifs(notifs, dropdown, listEl, badgeEl);
    });
  }
}