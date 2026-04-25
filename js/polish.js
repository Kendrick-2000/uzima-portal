// ═══════════════════════════════════════════
// LOADING SKELETON UTILITIES
// ═══════════════════════════════════════════

export function showSkeleton(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = Array(count).fill(`
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 75%"></div>
    </div>
  `).join('');
}

export function hideSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.remove('loading');
  }
}

// ═══════════════════════════════════════════
// EMPTY STATE UTILITIES
// ═══════════════════════════════════════════

export function showEmptyState(containerId, icon, title, message, actionText, actionCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state">
      <i class="fas ${icon}"></i>
      <h3>${title}</h3>
      <p>${message}</p>
      ${actionText && actionCallback ? `<button class="btn btn-primary">${actionText}</button>` : ''}
    </div>
  `;
  
  if (actionText && actionCallback) {
    container.querySelector('.btn').addEventListener('click', actionCallback);
  }
}

// ═══════════════════════════════════════════
// LOADING OVERLAY
// ═══════════════════════════════════════════

export function showLoadingOverlay(text = 'Loading...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${text}</div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('hidden');
}

export function hideLoadingOverlay() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════
// MOBILE TOUCH DETECTION
// ═══════════════════════════════════════════

export function isTouchDevice() {
  return (('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0));
}

export function initTouchOptimizations() {
  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
    console.log('📱 Touch device detected - optimizations enabled');
  }
}

// ═══════════════════════════════════════════
// PERFORMANCE: LAZY LOADING
// ═══════════════════════════════════════════

export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// ═══════════════════════════════════════════
// ANALYTICS (Demo - replace with real service)
// ═══════════════════════════════════════════

export function trackPageView(page) {
  console.log(`📊 Page view: ${page}`);
  // Replace with real analytics:
  // gtag('config', 'GA_TRACKING_ID', { page_path: page });
}

export function trackEvent(category, action, label) {
  console.log(`📊 Event: ${category} - ${action} - ${label}`);
  // Replace with real analytics:
  // gtag('event', action, { event_category: category, event_label: label });
}