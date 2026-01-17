document.addEventListener('DOMContentLoaded', () => {
    const filterSwitch = document.getElementById('filter'); // Switch Standard (Navbar Home)
    const filterSwitchImmersive = document.getElementById('filter-immersive'); // Switch Immersive (Navbar Immersive)
    const body = document.body;

    // Contenitori del Timer
    const standardTimerContainer = document.querySelector('.box-3'); // Contenitore originale nella griglia
    const immersiveTimerContainer = document.querySelector('.immersive-timer-wrapper'); // Contenitore per la modalità immersive
    const timerElement = document.getElementById('pane-timer'); // L'elemento del timer da spostare

    const pageTransition = document.querySelector('.page-transition');

    function toggleImmersiveMode(isImmersive) {
        // 1. Start Transition (Fade to Black)
        if (pageTransition) {
            pageTransition.classList.add('visible');
        } else {
            body.classList.add('fade-out');
        }

        // 2. Wait for fade to complete (300ms matches CSS transition)
        setTimeout(() => {
            if (isImmersive) {
                // Attiva la modalità immersive aggiungendo la classe al body
                body.classList.add('immersive-mode');
                // Se gli elementi esistono, sposta il timer nel contenitore immersive
                if (timerElement && immersiveTimerContainer) {
                    immersiveTimerContainer.appendChild(timerElement);
                }
            } else {
                // Disattiva la modalità immersive
                body.classList.remove('immersive-mode');
                // Riporta il timer nella sua posizione originale (box-3)
                if (timerElement && standardTimerContainer) {
                    standardTimerContainer.appendChild(timerElement);
                }
            }

            // Sincronizza lo stato dei due switch
            if (filterSwitch) filterSwitch.checked = isImmersive;
            if (filterSwitchImmersive) filterSwitchImmersive.checked = isImmersive;

            // 3. End Transition (Fade In from Black)
            // Small delay to ensure DOM updates are rendered behind the curtain
            setTimeout(() => {
                if (pageTransition) {
                    pageTransition.classList.remove('visible');
                } else {
                    body.classList.remove('fade-out');
                }
            }, 50);

        }, 300);

        // Opzionale: Salva lo stato nella sessione se necessario
        // sessionStorage.setItem('immersiveResult', isImmersive); 
    }

    // Event Listeners per i click sugli switch
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

    // Controllo URL o sessione per avvio automatico (Opzionale)
    // if (window.location.hash === '#immersive') toggleImmersiveMode(true);
});
