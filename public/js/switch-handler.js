document.addEventListener('DOMContentLoaded', () => {
    const filterSwitch = document.getElementById('filter');
    const body = document.body;

    // Create transition element if it doesn't exist (for home page)
    let transitionEl = document.querySelector('.page-transition');
    if (!transitionEl) {
        transitionEl = document.createElement('div');
        transitionEl.className = 'page-transition';
        // Basic styles for transition if not defined in CSS
        transitionEl.style.position = 'fixed';
        transitionEl.style.top = '0';
        transitionEl.style.left = '0';
        transitionEl.style.width = '100%';
        transitionEl.style.height = '100%';
        transitionEl.style.backgroundColor = '#000'; // Black fade
        transitionEl.style.opacity = '0';
        transitionEl.style.pointerEvents = 'none';
        transitionEl.style.zIndex = '9999';
        transitionEl.style.transition = 'opacity 0.6s ease-in-out';
        document.body.appendChild(transitionEl);
    }

    if (filterSwitch) {
        filterSwitch.addEventListener('change', function () {
            // Determine destination based on checkbox state
            // If checked -> Go to Immersive (if not already there)
            // If unchecked -> Go to Standard (home) (if not already there)

            const isChecked = this.checked;
            const currentPath = window.location.pathname;

            // Check if we need to redirect
            // If on /immersive and unchecked -> Go home
            // If on / or /home and checked -> Go immersive

            let targetUrl = null;

            if (currentPath.includes('/immersive')) {
                if (!isChecked) {
                    targetUrl = '/';
                }
            } else {
                if (isChecked) {
                    targetUrl = '/immersive';
                }
            }

            if (targetUrl) {
                // Set flag to persist ambient sounds logic
                sessionStorage.setItem('soundlly_navigating', 'true');

                // Trigger animation
                transitionEl.style.opacity = '1';
                transitionEl.style.pointerEvents = 'auto';

                // Wait for transition end then redirect
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 600);
            }
        });
    }
});
