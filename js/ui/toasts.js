export const toast = {
    el: null,
    init() { this.el = document.getElementById('toasts'); },
    show(msg, type = 'i', ms = 4000) {
        if (!this.el) return;
        const d = document.createElement('div');
        const cls = { s: 's', e: 'e', w: 'w', i: 'i' };
        const ico = { s: 'fa-check-circle', e: 'fa-times-circle', w: 'fa-exclamation-triangle', i: 'fa-info-circle' };
        d.className = `toast ${cls[type] || 'i'}`;
        d.setAttribute('role', 'alert');
        // Security: escape HTML
        d.innerHTML = `<i class="fas ${ico[type] || ico.i}" aria-hidden="true"></i><span>${msg}</span><button class="toast-x" aria-label="Dismiss"><i class="fas fa-times"></i></button>`;
        this.el.appendChild(d);
        
        const rm = () => { d.classList.add('out'); setTimeout(() => d.remove(), 200); };
        d.querySelector('.toast-x').onclick = rm;
        setTimeout(rm, ms);
    }
};