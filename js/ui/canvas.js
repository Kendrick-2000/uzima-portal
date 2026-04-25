export function initCanvas() {
    const cv = document.getElementById('bgCanvas'); 
    if (!cv) return;
    const ctx = cv.getContext('2d'); 
    let pts = [];
    
    function resize() {
        const r = cv.parentElement.getBoundingClientRect();
        cv.width = r.width * devicePixelRatio; 
        cv.height = r.height * devicePixelRatio;
        cv.style.width = r.width + 'px'; 
        cv.style.height = r.height + 'px';
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        
        // Init particles
        pts = [];
        for (let i = 0; i < 38; i++) {
            pts.push({
                x: Math.random() * r.width,
                y: Math.random() * r.height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                r: Math.random() * 2 + 0.5,
                hue: 140 + Math.random() * 30 // Green hue range
            });
        }
    }

    function draw() {
        const w = cv.width / devicePixelRatio;
        const h = cv.height / devicePixelRatio;
        ctx.clearRect(0, 0, w, h);
        
        // Draw dots and lines
        pts.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
            if (p.y < -20) p.y = h + 20;
            if (p.y > h + 20) p.y = -20;
            
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, 0.5)`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            
            // Connections
            for (let j = i + 1; j < pts.length; j++) {
                const dx = p.x - pts[j].x;
                const dy = p.y - pts[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = `rgba(0,230,138,${(1 - dist/100) * 0.05})`;
                    ctx.lineWidth = 0.5; ctx.stroke();
                }
            }
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) draw();
}