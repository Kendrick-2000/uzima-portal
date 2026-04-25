// js/features/remember-me.js
const SESSION_KEY = 'uzima_session';

export function saveSession(userName) {
    const isRemembered = document.getElementById('remBox')?.classList.contains('on');
    const days = isRemembered ? 30 : 1;
    
    const session = {
        token: 'demo_' + Date.now(),
        model: { name: userName, email: document.getElementById('lE')?.value || 'demo@uzima.ac.ke' },
        expires: Date.now() + (days * 24 * 60 * 60 * 1000)
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log('💾 Session Saved:', session);
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    console.log('🗑️ Session Cleared');
}

// Add this to fix the import error
export function initRememberMe() {
    // UI wiring moved to js/ui/forms.js
    // This is a no-op for backward compatibility
    console.log('🔐 Remember Me module loaded');
}