import { initPocketBase } from './core/pocketbase.js';
import { initCanvas } from './ui/canvas.js';
import { initForms } from './ui/forms.js';
import { toast } from './ui/toasts.js';
import { initAuth } from './features/auth.js';
import { initDraftSave } from './features/draft-save.js';
import { initSessions } from './features/sessions.js';
import { initProfile } from './features/profile.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize UI Components
    toast.init();
    initCanvas();
    initForms();
    
    // 2. Initialize Backend/Features
    await initPocketBase();
    initAuth();
    initDraftSave();
    initSessions();
    initProfile();
    
    console.log('🚀 Uzima Portal Initialized');
});