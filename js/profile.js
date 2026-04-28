// js/profile.js - Complete Profile Logic
import { pb, connected } from './core/pocketbase.js';
import { toast } from './ui/toasts.js';

console.log('📦 [Profile.js] Module loaded');

// ─── SESSION CHECK ───
function checkSession() {
  const raw = localStorage.getItem('uzima_session');
  if (!raw) { window.location.href = 'index.html'; return null; }
  const auth = JSON.parse(raw);
  if (Date.now() > auth.expires) {
    localStorage.removeItem('uzima_session');
    window.location.href = 'index.html';
    return null;
  }
  return auth.model; // Returns user data
}

// ─── INIT PROFILE PAGE ───
document.addEventListener('DOMContentLoaded', () => {
  const user = checkSession();
  if (!user) return;

  // Populate Header
  const headerName = document.getElementById('headerName');
  const headerRole = document.getElementById('headerRole');
  const navName = document.getElementById('navName');
  const navAvatar = document.getElementById('navAvatar');
  const avatarImg = document.getElementById('profileAvatarImg');
  const avatarPlaceholder = document.getElementById('profileAvatarPlaceholder');

  // Extract data (handle nested structure from previous login logic)
  let name = user.name?.name || user.name || 'Student';
  let role = (user.name?.role || user.role || 'Student').toUpperCase();
  let email = user.name?.email || user.email || 'N/A';
  let sid = user.name?.sid || user.sid || 'N/A';

  // Update UI
  if (headerName) headerName.textContent = name;
  if (headerRole) headerRole.textContent = role;
  if (navName) navName.textContent = name.split(' ')[0];
  if (navAvatar) navAvatar.textContent = name.charAt(0).toUpperCase();
  if (avatarPlaceholder) avatarPlaceholder.textContent = name.charAt(0).toUpperCase();

  // Populate Form Fields
  document.getElementById('editName').value = name;
  document.getElementById('editEmail').value = email;
  document.getElementById('editSid').value = sid;
  
  // Note: Phone/Bio might not be in DB yet, so we leave them empty or fetch if available
  // If your user record has these fields, uncomment below:
  // document.getElementById('editPhone').value = pb.authStore.model?.phone || '';
  // document.getElementById('editBio').value = pb.authStore.model?.bio || '';

  setupEventHandlers(user);
});

// ─── EVENT HANDLERS ───
function setupEventHandlers(user) {
  // 1. Save Profile
  const profileForm = document.getElementById('profileForm');
  const saveBtn = document.getElementById('saveProfileBtn');

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      const name = document.getElementById('editName').value;
      const phone = document.getElementById('editPhone').value;
      const bio = document.getElementById('editBio').value;

      // Update PocketBase
      // Note: We only update fields that exist. If phone/bio don't exist in schema yet, 
      // PB might reject them. Ensure they exist in Admin UI or remove them from this object.
      const updateData = {
        name: name,
        // phone: phone, 
        // bio: bio 
      };

      await pb.collection('users').update(pb.authStore.model.id, updateData);
      
      // Update local session name
      const session = JSON.parse(localStorage.getItem('uzima_session'));
      if (session.model.name) session.model.name = name; // Update nested name
      else session.model.name = { ...session.model.name, name: name }; // Update object
      
      // Save updated session
      // (Simplified: just reload to refresh session state cleanly)
      
      toast.show('Profile updated successfully', 's');
      setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      console.error(err);
      toast.show('Failed to update profile: ' + err.message, 'e');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  });

  // 2. Change Password
  const passForm = document.getElementById('passwordForm');
  const changeBtn = document.getElementById('changePassBtn');

  passForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPass = document.getElementById('oldPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;

    if (newPass !== confirmPass) {
      toast.show('New passwords do not match', 'e');
      return;
    }

    changeBtn.disabled = true;
    changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

    try {
      await pb.collection('users').update(pb.authStore.model.id, {
        oldPassword: oldPass,
        password: newPass,
        passwordConfirm: newPass
      });
      toast.show('Password changed successfully', 's');
      passForm.reset();
    } catch (err) {
      toast.show('Password change failed: ' + err.message, 'e');
    } finally {
      changeBtn.disabled = false;
      changeBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
    }
  });

  // 3. Avatar Upload (Basic)
  const avatarInput = document.getElementById('avatarUpload');
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      await pb.collection('users').update(pb.authStore.model.id, formData);
      toast.show('Avatar uploaded!', 's');
      window.location.reload(); // Reload to show new image
    } catch (err) {
      toast.show('Avatar upload failed', 'e');
    }
  });

  // 4. Dropdown & Logout (Re-use dashboard logic)
  const navProfile = document.getElementById('navProfile');
  const dropdown = document.getElementById('profileDropdown');
  if (navProfile && dropdown) {
    navProfile.addEventListener('click', (ev) => {
      ev.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      pb.authStore.clear();
      localStorage.removeItem('uzima_session');
      window.location.href = 'index.html';
    };
  }
}