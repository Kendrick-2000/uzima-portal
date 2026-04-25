// js/ui/forms.js
import { toast } from './toasts.js';

export function initForms() {
    console.log('🔌 Initializing forms...');

    // Password Toggles
    document.querySelectorAll('.pwt').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = document.getElementById(btn.dataset.t);
            const ico = btn.querySelector('i');
            if (!inp || !ico) return;
            inp.type = inp.type === 'password' ? 'text' : 'password';
            ico.classList.toggle('fa-eye');
            ico.classList.toggle('fa-eye-slash');
        });
    });

    // Custom Checkboxes
    wireCheckbox('remGrp', 'remBox', () => {
        const opts = document.getElementById('remOpts');
        if(opts) opts.hidden = !document.getElementById('remBox').classList.contains('on');
    });
    wireCheckbox('termsGrp', 'termsBox', () => {
        const btn = document.getElementById('sBtn');
        if(btn) btn.disabled = !document.getElementById('termsBox').classList.contains('on');
    });

    // Tab Switching
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form');
    
    if (tabs.length === 0 || forms.length === 0) {
        console.error('❌ Tab or Form elements not found in DOM');
        return;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
            forms.forEach(f => f.classList.remove('on'));
            tab.classList.add('on');
            tab.setAttribute('aria-selected', 'true');
            const targetId = tab.dataset.t + 'Form';
            const target = document.getElementById(targetId);
            if (target) target.classList.add('on');
            console.log('🔄 Switched to:', tab.dataset.t);
        });
    });

    // Clear errors on input
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', () => { 
            if (el.classList.contains('bad')) clearField(el.id); 
        });
    });

    console.log('✅ Tabs wired. Forms active.');
}

function wireCheckbox(groupID, boxID, callback) {
    const group = document.getElementById(groupID);
    const box = document.getElementById(boxID);
    if (!group || !box) return;
    
    const toggle = () => {
        box.classList.toggle('on');
        box.setAttribute('aria-checked', box.classList.contains('on'));
        if (callback) callback();
    };
    
    group.addEventListener('click', e => { if(e.target.tagName !== 'A') toggle(); });
    box.addEventListener('keydown', e => { if(e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }});
}

export function setBad(id, msg) {
    const f = document.getElementById(id); 
    const e = document.getElementById(id + 'E');
    if (f) f.classList.add('bad');
    if (e) { e.querySelector('span').textContent = msg; e.classList.add('show'); }
}

export function setGood(id) {
    const f = document.getElementById(id); 
    const e = document.getElementById(id + 'E');
    if (f) { f.classList.remove('bad'); f.classList.add('good'); }
    if (e) e.classList.remove('show');
}

export function clearField(id) {
    const f = document.getElementById(id); 
    const e = document.getElementById(id + 'E');
    if (f) f.classList.remove('bad', 'good');
    if (e) e.classList.remove('show');
}