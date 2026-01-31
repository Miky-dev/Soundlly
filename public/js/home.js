document.addEventListener('DOMContentLoaded', () => {
    // Form submit prevention
    const searchForm = document.getElementById('footer-searchbar');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    // Image fallback handling
    const imagesWithFallback = document.querySelectorAll('img[data-fallback]');
    imagesWithFallback.forEach(img => {
        img.addEventListener('error', function () {
            if (this.src !== this.dataset.fallback) {
                this.src = this.dataset.fallback;
            }
        });
    });

    // Apply dynamic styles from data attributes to satisfy IDE parsers
    document.querySelectorAll('[data-width]').forEach(el => {
        // el.style.width = el.dataset.width + '%'; 
        // Changed to CSS variable for cleaner style manipulation
        el.style.setProperty('--bar-width', el.dataset.width + '%');
        el.style.width = 'var(--bar-width)';
    });
});
