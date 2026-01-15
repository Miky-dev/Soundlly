document.addEventListener('DOMContentLoaded', () => {
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullScreen);
    }

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Update icon based on state
    document.addEventListener('fullscreenchange', () => {
        const icon = fullscreenBtn.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    });

    // Real-time Clock Logic
    const clockEl = document.getElementById('realTimeClock');
    if (clockEl) {
        function updateClock() {
            const now = new Date();
            // Format: Lun 15 Gen, 14:30
            // Options for Italian format
            const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
            const timeString = now.toLocaleDateString('it-IT', options).replace(',', '');

            // Capitalize first letter (Lun -> Lun) logic if needed, but toLocaleDateString usually fine.
            // Ensure first char is uppercase
            const finalString = timeString.charAt(0).toUpperCase() + timeString.slice(1);

            clockEl.textContent = finalString;
        }
        updateClock(); // Initial call
        setInterval(updateClock, 1000); // interval
    }
});
