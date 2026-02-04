/**
 * Gestisce l'effetto "Cinema" (Immersive Mode).
 * Quando attivi l'interruttore, oscura la pagina e sposta il timer al centro dello schermo
 * per aiutarti a concentrarti meglio, nascondendo tutto il resto.
 */

document.addEventListener('DOMContentLoaded', () => {
    // I due interruttori (quello nella home normale e quello nella modalità focus)
    const filterSwitch = document.getElementById('filter');
    const filterSwitchImmersive = document.getElementById('filter-immersive');
    const body = document.body;

    // Dove si trova il timer adesso e dove deve andare
    const standardTimerContainer = document.querySelector('.box-3');
    const immersiveTimerContainer = document.querySelector('.immersive-timer-wrapper');
    const timerElement = document.getElementById('pane-timer');

    // L'elemento nero che copre lo schermo durante il cambio
    const pageTransition = document.querySelector('.page-transition');

    function toggleImmersiveMode(isImmersive) {
        // 1. Spengo la luce (Fade Out)
        if (pageTransition) {
            pageTransition.classList.add('visible');
        } else {
            body.classList.add('fade-out');
        }

        // Aspetto che sia buio (300ms) per fare i cambi senza che l'utente veda scatti
        setTimeout(() => {
            if (isImmersive) {
                // Attivo la modalità focus
                body.classList.add('immersive-mode');

                // Prendo fisicamente il timer e lo sposto al centro
                if (timerElement && immersiveTimerContainer) {
                    immersiveTimerContainer.appendChild(timerElement);
                }
            } else {
                // Torno alla modalità normale
                body.classList.remove('immersive-mode');

                // Rimetto il timer al suo posto nella griglia
                if (timerElement && standardTimerContainer) {
                    standardTimerContainer.appendChild(timerElement);
                }
            }

            // Tengo sincronizzati i due interruttori (così se ne clicchi uno, si aggiorna anche l'altro)
            if (filterSwitch) filterSwitch.checked = isImmersive;
            if (filterSwitchImmersive) filterSwitchImmersive.checked = isImmersive;

            // 2. Riaccendo la luce (Fade In)
            setTimeout(() => {
                if (pageTransition) {
                    pageTransition.classList.remove('visible');
                } else {
                    body.classList.remove('fade-out');
                }
            }, 50);

        }, 300);
    }

    // Ascolto i click sugli interruttori
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
});
