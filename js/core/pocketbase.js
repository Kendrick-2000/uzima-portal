import { esc } from '../utils/string.js';
import { toast } from '../ui/toasts.js';

const PB_URL = 'http://127.0.0.1:8090';
export let pb = null;
export let connected = false;
export const ID_REGEX = /^[A-Z0-9]{2,6}\/\d{4}\/\d{4}$/;

// Fallback Database (LocalStorage)
const fallbackDB = {
    KEY: 'uzima_fallback',
    read() { 
        try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } 
        catch { return {}; } 
    },
    write(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },
    
    async signup(email, pass, name, sid, role) { 
        const db = this.read(); 
        db[email.toLowerCase()] = { 
            pass, 
            name, 
            sid: sid.toUpperCase(), 
            role 
        }; 
        this.write(db); 
    },
    
    async login(identifier, pass) { 
        const db = this.read();
        const cleanInput = identifier.trim();
        
        console.log('🔍 Searching for:', cleanInput);
        console.log('📦 Available users:', Object.keys(db));
        
        // Find by exact email OR exact student_id (case-insensitive for ID)
        const match = Object.entries(db).find(([email, data]) => {
            const byEmail = email === cleanInput.toLowerCase();
            const byId = data.sid && data.sid.toUpperCase() === cleanInput.toUpperCase();
            return byEmail || byId;
        });
        
        if (!match) throw new Error('User not found');
        if (match[1].pass !== pass) throw new Error('Password mismatch');
        
        console.log('✅ Match found:', match[0]);
        return { name: match[1].name, email: match[0], ...match[1] };
    }
};

export async function initPocketBase() {
    try {
        // Dynamically import PocketBase SDK if available, or use a simple fetch check
        // For this modular structure, we assume the SDK is loaded globally or handled here
        // A simple fetch check to verify server reachability
        const res = await fetch(PB_URL + '/api/health');
        if (res.ok) {
            // In a real build, we would 'import PocketBase ...'
            // For CDN usage, PocketBase is available on window
            pb = new window.PocketBase(PB_URL);
            connected = true;
        }
    } catch (e) {
        connected = false;
        pb = null;
    }
    updateStatusUI();
}

function updateStatusUI() {
    const cls = connected ? 'dot live' : 'dot off';
    const txt = connected ? 'PocketBase connected' : 'Offline — Demo mode';
    
    const dots = [document.getElementById('dotL'), document.getElementById('dotS')];
    const labels = [document.getElementById('statusL'), document.getElementById('statusS')];
    
    dots.forEach(d => { if(d) d.className = cls; });
    labels.forEach(l => { if(l) l.textContent = txt; });

    if (!connected) toast.show('PocketBase not found. Running in demo mode.', 'w', 5000);
    else toast.show('Connected to PocketBase.', 's', 3000);
}

export { fallbackDB };