/**
 * switch-handler.js
 * 
 * Gestisce la transizione tra la modalità "Standard" e la modalità "Immersive".
 * 
 * La sfida tecnica risolta qui è spostare elementi del DOM (come il Timer) in contenitori diversi
 * senza ricaricare la pagina o perdere lo stato del timer stesso.
 * 
 * Funzionamento:
 * 1. Ascolta il cambio degli switch (toggle) nella navbar.
 * 2. Attiva una transizione visiva (Fade to Black).
 * 3. Dietro le quinte, sposta il nodo HTML del timer dal layout a griglia al layout centrale.
 * 4. Rimuove la transizione (Fade In).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli switch (Navbar Standard e Navbar Immersive)
    const filterSwitch = document.getElementById('filter');
    const filterSwitchImmersive = document.getElementById('filter-immersive');
    const body = document.body;

    // Contenitori del Timer
    const standardTimerContainer = document.querySelector('.box-3');            // Posizione griglia dashboard
    const immersiveTimerContainer = document.querySelector('.immersive-timer-wrapper'); // Posizione centrale focus
    const timerElement = document.getElementById('pane-timer');                 // Il componente Timer vero e proprio

    // Elemento per l'animazione di transizione (tenda nera)
    const pageTransition = document.querySelector('.page-transition');

    function toggleImmersiveMode(isImmersive) {
        // --- FASE 1: Inizio Transizione (Scurisci schermo) ---
        if (pageTransition) {
            pageTransition.classList.add('visible'); // Usa elemento dedicato
        } else {
            body.classList.add('fade-out'); // Fallback CSS sul body
        }

        // --- FASE 2: Manipolazione DOM (durante il buio) ---
        // Attendiamo 300ms che corrisponde alla durata dell'animazione CSS
        setTimeout(() => {
            if (isImmersive) {
                // Attiva stili globali per immersive mode
                body.classList.add('immersive-mode');

                // Sposta fisicamente il timer nel nuovo contenitore
                if (timerElement && immersiveTimerContainer) {
                    immersiveTimerContainer.appendChild(timerElement);
                }
            } else {
                // Disattiva stili immersive
                body.classList.remove('immersive-mode');

                // Riporta il timer nella posizione originale
                if (timerElement && standardTimerContainer) {
                    standardTimerContainer.appendChild(timerElement);
                }
            }

            // Sincronizza visivamente i due switch (per coerenza se l'utente torna indietro)
            if (filterSwitch) filterSwitch.checked = isImmersive;
            if (filterSwitchImmersive) filterSwitchImmersive.checked = isImmersive;

            // --- FASE 3: Fine Transizione (Schiarisci schermo) ---
            // Breve ritardo per assicurare che il browser abbia renderizzato il nuovo layout
            setTimeout(() => {
                if (pageTransition) {
                    pageTransition.classList.remove('visible');
                } else {
                    body.classList.remove('fade-out');
                }
            }, 50);

        }, 300); // Durata del fade out
    }

    // --- EVENT LISTENERS ---

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

    // Opzionale: Se volessimo gestire lo stato via URL (es. #immersive)
    // if (window.location.hash === '#immersive') toggleImmersiveMode(true);
});
