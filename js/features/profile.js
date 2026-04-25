export function initProfile() {
    const zone = document.getElementById('avatarZone');
    const input = document.getElementById('avatarInput');
    
    if (zone && input) {
        zone.addEventListener('click', () => input.click());
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const preview = document.getElementById('avatarPreview');
                    if (preview) {
                        preview.style.backgroundImage = `url(${ev.target.result})`;
                        preview.style.backgroundSize = 'cover';
                        preview.textContent = '';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}