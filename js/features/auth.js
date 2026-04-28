// js/features/auth.js - DEBUG VERSION
import { pb, connected, fallbackDB } from '../core/pocketbase.js';
import { toast } from '../ui/toasts.js';

console.log(' auth.js module loaded');

async function handleLogin(e) {
  e.preventDefault();
  console.log('📝 Login form submitted');
  
  const id = document.getElementById('lE').value.trim();
  const pw = document.getElementById('lP').value;
  
  if (!id || !pw) { 
    console.warn('⚠️ Missing email/password'); 
    return; 
  }
  
  const btn = document.getElementById('lBtn');
  btn.classList.add('loading'); btn.disabled = true;
  console.log('🔐 Attempting auth for:', id);

  try {
    let user;
    if (connected && pb) {
      console.log('📡 Connecting to PocketBase...');
      const authData = await pb.collection('users').authWithPassword(id, pw);
      user = authData.record;
      console.log('✅ PB Auth success. User data:', user);
    } else {
      console.log('📦 Using Fallback DB...');
      user = await fallbackDB.login(id, pw);
      console.log('✅ Fallback Auth success. User data:', user);
    }
    
    console.log('💾 Preparing session data...');
    const session = {
      model: {
        id: user.id,
        name: user.name || 'User',
        email: user.email,
        role: (user.role || 'student').toLowerCase().trim(),
        sid: user.sid || 'N/A',
        child_id: user.child_id || null
      },
      expires: Date.now() + (24 * 60 * 60 * 1000)
    };
    
    console.log('💾 Saving to localStorage...');
    localStorage.setItem('uzima_session', JSON.stringify(session));
    console.log('✅ Session saved successfully!');
    
    // Verify save immediately
    const check = localStorage.getItem('uzima_session');
    if (!check) {
        console.error('❌ FAILED TO SAVE TO LOCALSTORAGE!');
        toast.show('Session save failed. Try again.', 'e');
        return;
    }
    
    toast.show('Login successful', 's');
    
    setTimeout(() => {
      const role = session.model.role;
      console.log('🔄 Redirecting based on role:', role);
      if (role === 'parent') {
          console.log('➡️ Redirecting to parent.html');
          window.location.href = 'parent.html';
      } else if (role === 'admin') {
          console.log('➡️ Redirecting to admin.html');
          window.location.href = 'admin.html';
      } else {
          console.log('➡️ Redirecting to dashboard.html');
          window.location.href = 'dashboard.html';
      }
    }, 200);

  } catch (err) {
    console.error('❌ LOGIN ERROR:', err);
    console.error('Error details:', err.message, err.status);
    toast.show('Login failed: ' + err.message, 'e');
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
}

// Bind form on load
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', handleLogin);
    console.log('🔗 Login form event bound');
  }
});