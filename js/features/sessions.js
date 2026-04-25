import { pb } from '../core/pocketbase.js';
import { toast } from '../ui/toasts.js';
import { clean } from '../utils/string.js';

export function initSessions() {
    const btn = document.getElementById('manageSessions');
    const modal = document.getElementById('modal-root'); // Using generic modal container
    
    if (btn) {
        btn.addEventListener('click', () => renderSessionsModal());
    }
}

function renderSessionsModal() {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
        <div class="overlay open" id="sessOverlay">
            <div class="panel">
                <div class="panel-head">
                    <h3>Active Sessions</h3>
                    <button class="panel-x" onclick="this.closest('.overlay').remove()"><i class="fas fa-times"></i></button>
                </div>
                <div id="sessionList"></div>
                <button class="btn btn-primary" id="signOutAll" style="margin-top:1rem">Sign Out All Devices</button>
            </div>
        </div>
    `;
    
    // Mock Data for Demo
    const list = document.getElementById('sessionList');
    list.innerHTML = `
        <div class="session-item">
            <div class="session-info">
                <div class="session-icon"><i class="fas fa-desktop"></i></div>
                <div class="session-meta"><h4>Chrome on Windows</h4><p>Nairobi, Kenya • Current</p></div>
            </div>
            <button class="session-action" disabled style="opacity:0.3">Current</button>
        </div>
        <div class="session-item">
            <div class="session-info">
                <div class="session-icon"><i class="fas fa-mobile-alt"></i></div>
                <div class="session-meta"><h4>Safari on iPhone</h4><p>Mombasa, Kenya • 2 days ago</p></div>
            </div>
            <button class="session-action" onclick="this.closest('.session-item').remove(); document.getElementById('toasts').querySelector('button').click()">
                <i class="fas fa-sign-out-alt"></i> Revoke
            </button>
        </div>
    `;
    
    document.getElementById('signOutAll').addEventListener('click', function() {
        this.classList.add('loading');
        setTimeout(() => {
            list.innerHTML = '<p style="text-align:center; padding:1rem; color:var(--t4)">No other active sessions</p>';
            this.classList.remove('loading');
        }, 1000);
    });
}