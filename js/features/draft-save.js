const DRAFT_KEY = 'uzima_signup_draft';

export function initDraftSave() {
    const fields = ['sN', 'sE', 'sI', 'sR'];
    
    // Load on startup
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (draft && Date.now() - draft.ts < 86400000) { // 24h expiry
        if (draft.name) document.getElementById('sN').value = draft.name;
        if (draft.email) document.getElementById('sE').value = draft.email;
        if (draft.sid) document.getElementById('sI').value = draft.sid;
        if (draft.role) document.getElementById('sR').value = draft.role;
    }

    // Save on change
    const save = () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            name: document.getElementById('sN').value,
            email: document.getElementById('sE').value,
            sid: document.getElementById('sI').value,
            role: document.getElementById('sR').value,
            ts: Date.now()
        }));
    };
    
    fields.forEach(id => document.getElementById(id)?.addEventListener('input', save));
    
    // Clear on submit
    document.getElementById('signupForm')?.addEventListener('submit', () => localStorage.removeItem(DRAFT_KEY));
}