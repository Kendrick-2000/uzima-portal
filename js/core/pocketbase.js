// js/core/pocketbase.js - NPM Import Version (Stable)
import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.21.5/dist/pocketbase.es.js';

const PB_URL = 'http://127.0.0.1:8090';
export let pb = null;
export let connected = false;

export const ID_REGEX = /^[A-Z]{2,4}\/\d{4}\/\d{3,}$/;

export function initPocketBase() {
  try {
    // Initialize using the bundled package
    pb = new PocketBase(PB_URL);
    
    // Check connection to server
    pb.health.check()
      .then(() => {
        connected = true;
        console.log('🟢 PocketBase connected');
      })
      .catch(() => {
        connected = false;
        console.warn('🟡 PocketBase offline → Demo Mode');
      });
  } catch (e) {
    console.error('❌ PocketBase Init Error:', e);
    connected = false;
  }
  return pb;
}

// Demo fallback (used when server is offline)
export const fallbackDB = {
  KEY: 'uzima_fallback',
  read() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; } },
  write(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },
  async signup(email, pass, name, sid, role) { 
    const db = this.read(); 
    db[email.toLowerCase()] = { pass, name, sid: sid.toUpperCase(), role }; 
    this.write(db); 
  },
  async login(id, pass) { 
    const db = this.read();
    const clean = id.trim().toLowerCase();
    const match = Object.entries(db).find(([email, data]) => 
      email === clean || (data.sid && data.sid.toLowerCase() === clean)
    );
    if (!match) throw new Error('User not found');
    if (match[1].pass !== pass) throw new Error('Password mismatch');
    return { name: match[1].name, email: match[0], sid: match[1].sid, role: match[1].role, id: match[0] };
  }
};

// Auto-initialize
initPocketBase();