document.addEventListener('DOMContentLoaded', () => {
    const filterSwitch = document.getElementById('filter'); // Standard
    const filterSwitchImmersive = document.getElementById('filter-immersive'); // Immersive
    const body = document.body;

    // Timer Containers
    const standardTimerContainer = document.querySelector('.box-3');
    const immersiveTimerContainer = document.querySelector('.immersive-timer-wrapper');
    const timerElement = document.getElementById('pane-timer');

    function toggleImmersiveMode(isImmersive) {
        if (isImmersive) {
            body.classList.add('immersive-mode');
            if (timerElement && immersiveTimerContainer) {
                immersiveTimerContainer.appendChild(timerElement);
            }
        } else {
            body.classList.remove('immersive-mode');
            if (timerElement && standardTimerContainer) {
                standardTimerContainer.appendChild(timerElement); // Appends to end, which is fine as box-3 only has timer
            }
        }

        // Sync switches
        if (filterSwitch) filterSwitch.checked = isImmersive;
        if (filterSwitchImmersive) filterSwitchImmersive.checked = isImmersive;

        // Persist state if needed (optional, or just rely on current session)
        // sessionStorage.setItem('immersiveResult', isImmersive); 
    }

    // Event Listeners
    if (filterSwitch) {
        filterSwitch.addEventListener('change', function () {
            toggleImmersiveMode(this.checked);
        });
    }

    if (filterSwitchImmersive) {
        filterSwitchImmersive.addEventListener('change', function () {
            toggleImmersiveMode(this.checked);
        });
    }

    // Check URL or session to auto-start (Optional)
    // if (window.location.hash === '#immersive') toggleImmersiveMode(true);
});
