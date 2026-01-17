// In attesa che il DOM sia completamente caricato per assicurarsi che gli elementi esistano
document.addEventListener('DOMContentLoaded', () => {
    // Seleziona il pulsante per il fullscreen tramite il suo ID
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Se il pulsante esiste nella pagina, aggiunge un ascoltatore per l'evento click
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullScreen);
    }

    // Funzione per attivare/disattivare la modalità a schermo intero
    function toggleFullScreen() {
        // Se non siamo già in fullscreen (document.fullscreenElement è null)
        if (!document.fullscreenElement) {
            // Richiede al browser di mandare l'elemento radice (document.documentElement) in fullscreen
            document.documentElement.requestFullscreen().catch((err) => {
                // Gestisce e logga eventuali errori (es. permesso negato)
                console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            });
        } else {
            // Se siamo già in fullscreen, usciamo
            // Controlla se la funzione exitFullscreen esiste (compatibilità)
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Aggiorna l'icona del pulsante in base allo stato del fullscreen
    document.addEventListener('fullscreenchange', () => {
        // Seleziona l'elemento icona (<i>) all'interno del pulsante
        const icon = fullscreenBtn.querySelector('i');

        // Se c'è un elemento in fullscreen attivo
        if (document.fullscreenElement) {
            // Rimuove l'icona di espansione e aggiunge quella di compressione (uscita)
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            // Altrimenti, ripristina l'icona di espansione
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    });

    // Logica per l'orologio in tempo reale
    const clockEl = document.getElementById('realTimeClock');

    // Se l'elemento orologio esiste nella pagina
    if (clockEl) {
        // Funzione per aggiornare il testo dell'orologio
        function updateClock() {

            const now = new Date();


            const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

            // Crea la stringa formattata e rimuove eventuali virgole indesiderate
            const timeString = now.toLocaleDateString('it-IT', options).replace(',', '');

            // Assicura che la prima lettera sia maiuscola (estetica)
            const finalString = timeString.charAt(0).toUpperCase() + timeString.slice(1);

            // Imposta il testo dell'elemento orologio
            clockEl.textContent = finalString;
        }

        // Chiama la funzione subito per evitare ritardi iniziali
        updateClock();

        // Imposta un intervallo per aggiornare l'orologio ogni 1000ms (1 secondo)
        setInterval(updateClock, 1000);
    }
});
