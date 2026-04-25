import { pb, connected, fallbackDB, ID_REGEX } from '../core/pocketbase.js';
import { setBad, setGood, clearField } from '../ui/forms.js';
import { toast } from '../ui/toasts.js';
import { clean, esc } from '../utils/string.js';
import { saveSession, clearSession } from './remember-me.js';

// Lockout Config
const LOCK_KEY = 'uzima_locks';
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

export function initAuth() {
    
    // Login Submit
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Signup Submit
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Forgot Password
    document.getElementById('fgtBtn').addEventListener('click', (e) => {
        e.preventDefault();
        toast.show('Reset functionality would open here.', 'i');
    });

    // Password Strength (Real-time)
    const sP = document.getElementById('sP');
    sP.addEventListener('input', () => {
        checkPasswordStrength(sP.value);
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const id = clean(document.getElementById('lE').value);
    const pw = document.getElementById('lP').value;
    
    console.log('🔑 Login attempt -> ID:', id, '| PW length:', pw.length);
    
    if (!id) { setBad('lE', 'Required'); return; }
    if (!pw) { setBad('lP', 'Required'); return; }
    
    const btn = document.getElementById('lBtn');
    btn.classList.add('loading'); btn.disabled = true;

    try {
        let user;
        if (connected && pb) {
            const authData = await pb.collection('users').authWithPassword(id, pw);
            user = authData.record;
        } else {
            user = await fallbackDB.login(id, pw);
        }
        
        clearFailures(id);
                // Save session
        saveSession(user.name || 'Student');
        
        // CRITICAL: Wait for localStorage to commit, then verify
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const verifySession = localStorage.getItem('uzima_session');
        if (!verifySession) {
            console.error('❌ Session failed to save!');
            toast.show('Session error. Try again.', 'e');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }
        
        console.log('✅ Session verified. Redirecting...');
        toast.show('Login successful. Redirecting...', 's');
        
        // Longer delay to ensure write completes
        setTimeout(() => { 
            window.location.href = 'dashboard.html'; 
        }, 500);

    } catch (err) {
        console.error('❌ Login failed:', err.message);
        console.log('📦 Stored data:', JSON.parse(localStorage.getItem('uzima_fallback') || '{}'));
        
        recordFailure(id);
        setBad('lP', 'Invalid email or password.');
        toast.show('Login failed. Check your credentials.', 'e');
    } finally {
        btn.classList.remove('loading'); btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('📝 Signup submitted');

    // Honeypot bot check
    if (document.getElementById('sHp').value) return;

    const name = clean(document.getElementById('sN').value);
    const email = clean(document.getElementById('sE').value).toLowerCase();
    const sid = clean(document.getElementById('sI').value).toUpperCase();
    const role = document.getElementById('sR').value;
    const pass = document.getElementById('sP').value;
    const conf = document.getElementById('sC').value;
    const terms = document.getElementById('termsBox').classList.contains('on');

    let valid = true;

    // Validation
    if (!name || name.length < 3) { setBad('sN', name ? 'Min 3 characters' : 'Full name required'); valid = false; } else setGood('sN');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setBad('sE', email ? 'Invalid email format' : 'Email required'); valid = false; } else setGood('sE');
    if (!sid || !ID_REGEX.test(sid)) { setBad('sI', sid ? 'Format: UMB/2024/1111' : 'Student/Staff ID required'); valid = false; } else setGood('sI');
    if (!role) { setBad('sR', 'Select your role'); valid = false; } else setGood('sR');

    // Password policy
    const commonPw = ['password','123456','qwerty','abc123','letmein','admin','student','uzima'];
    if (!pass) { setBad('sP', 'Password required'); valid = false; }
    else if (pass.length < 8) { setBad('sP', 'Min 8 characters'); valid = false; }
    else if (!/[A-Z]/.test(pass)) { setBad('sP', 'Need uppercase'); valid = false; }
    else if (!/[a-z]/.test(pass)) { setBad('sP', 'Need lowercase'); valid = false; }
    else if (!/[0-9]/.test(pass)) { setBad('sP', 'Need number'); valid = false; }
    else if (!/[^A-Za-z0-9]/.test(pass)) { setBad('sP', 'Need special char'); valid = false; }
    else if (commonPw.includes(pass.toLowerCase())) { setBad('sP', 'Too common'); valid = false; }
    else setGood('sP');

    if (pass !== conf) { setBad('sC', 'Passwords do not match'); valid = false; } else if (conf) setGood('sC');
    if (!terms) { toast.show('Accept Terms to continue', 'w'); valid = false; }

    if (!valid) { console.log('❌ Validation failed'); return; }

    const btn = document.getElementById('sBtn');
    btn.classList.add('loading'); btn.disabled = true;

    try {
        console.log('💾 Saving to fallback DB...');
        if (connected && pb) {
            await pb.collection('users').create({ email, password: pass, passwordConfirm: conf, name, student_id: sid, role });
            toast.show('Account created! You can now sign in.', 's', 5000);
        } else {
            await fallbackDB.signup(email, pass, name, sid, role);
            console.log('✅ SUCCESS: uzima_fallback updated in localStorage');
            toast.show('Account created (Demo mode)! You can now sign in.', 's', 5000);
        }

        // Switch to login tab
        document.querySelector('[data-t="login"]').click();
        
        // Reset form
        document.getElementById('signupForm').reset();
        document.getElementById('strBox').hidden = true;
        ['sN','sE','sI','sR','sP','sC'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.classList.remove('bad','good'); el.value = ''; }
        });
        document.getElementById('termsBox').classList.remove('on');
        document.getElementById('termsBox').setAttribute('aria-checked', 'false');
        document.getElementById('sBtn').disabled = true;
        localStorage.removeItem('uzima_signup_draft');

    } catch (err) {
        console.error(' Signup error:', err);
        toast.show(err.message || 'Signup failed', 'e');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = !document.getElementById('termsBox').classList.contains('on');
    }
}

// --- Lockout Logic ---
function isLocked(id) {
    const data = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}');
    const entry = data[id.toLowerCase()];
    if (entry && entry.until > Date.now()) {
        const secs = Math.ceil((entry.until - Date.now()) / 1000);
        const lockOv = document.getElementById('lockOv');
        lockOv.classList.add('open');
        let counter = secs;
        const intv = setInterval(() => {
            counter--;
            document.getElementById('lockTm').textContent = `00:${counter < 10 ? '0'+counter : counter}`;
            if (counter <= 0) { clearInterval(intv); lockOv.classList.remove('open'); }
        }, 1000);
        return true;
    }
    if (entry && entry.until <= Date.now()) { delete data[id.toLowerCase()]; localStorage.setItem(LOCK_KEY, JSON.stringify(data)); }
    return false;
}

function recordFailure(id) {
    const data = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}');
    if (!data[id.toLowerCase()]) data[id.toLowerCase()] = { count: 0 };
    data[id.toLowerCase()].count++;
    if (data[id.toLowerCase()].count >= MAX_ATTEMPTS) {
        data[id.toLowerCase()].until = Date.now() + LOCK_TIME;
        toast.show('Account locked for 15 minutes.', 'e');
    }
    localStorage.setItem(LOCK_KEY, JSON.stringify(data));
}

function clearFailures(id) {
    const data = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}');
    delete data[id.toLowerCase()];
    localStorage.setItem(LOCK_KEY, JSON.stringify(data));
}

// --- Password Strength ---
function checkPasswordStrength(pw) {
    const box = document.getElementById('strBox');
    box.hidden = !pw;
    if (!pw) return;

    const checks = {
        len: pw.length >= 8,
        up: /[A-Z]/.test(pw),
        low: /[a-z]/.test(pw),
        num: /[0-9]/.test(pw),
        spec: /[^A-Za-z0-9]/.test(pw)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    const fill = document.getElementById('strFill');
    fill.style.width = `${(score/5)*100}%`;
    fill.style.background = score > 3 ? 'var(--accent)' : (score > 1 ? 'var(--warn)' : 'var(--err)');

    document.querySelectorAll('.pol-item').forEach(item => {
        const k = item.dataset.c;
        item.classList.toggle('ok', checks[k]);
        item.querySelector('i').className = checks[k] ? 'fas fa-check-circle' : 'fas fa-circle';
    });
}