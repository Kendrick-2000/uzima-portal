export function esc(str) {
    if (typeof str !== 'string') return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML.replace(/"/g, '&quot;');
}

export function clean(str) { 
    return typeof str === 'string' ? str.replace(/<[^>]*>/g, '').replace(/[<>{}()\[\]\\]/g, '').trim().replace(/\s+/g, ' ') : ''; 
}