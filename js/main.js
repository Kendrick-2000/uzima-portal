import './features/auth.js';

// js/main.js - UI Controller (No Auth Imports)
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching (Login / Signup)
  const loginTab = document.querySelector('[data-t="login"]');
  const signupTab = document.querySelector('[data-t="signup"]');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const signupExtra = document.getElementById('signupExtra');

  if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
      if (signupExtra) signupExtra.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
      if (signupExtra) signupExtra.style.display = 'block';
    });
  }

  // Password visibility toggles
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.classList.toggle('fa-eye');
        btn.classList.toggle('fa-eye-slash');
      }
    });
  });

  // Terms checkbox visual toggle
  const termsBox = document.getElementById('termsBox');
  if (termsBox) {
    termsBox.addEventListener('click', () => {
      termsBox.classList.toggle('on');
      const btn = document.getElementById('sBtn');
      if (btn) btn.disabled = !termsBox.classList.contains('on');
    });
  }
});