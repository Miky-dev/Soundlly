/**
 * immersive-controls.js
 * 
 * Gestisce i controlli specifici della "Immersive Mode" (modalità focus globale).
 * 
 * Funzionalità:
 * 1. Orologio in tempo reale (formattato in italiano).
 * 2. Toggle Fullscreen (schermo intero) con cambio icona dinamico.
 */

class ImmersiveControls {
    constructor() {
        // Elementi DOM
        this.clockEl = document.getElementById('realTimeClock');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');

        // Avvia solo se gli elementi esistono
        this.init();
    }

    init() {
        // Gestione Orologio
        if (this.clockEl) {
            this.updateClock(); // Primo aggiornamento immediato
            setInterval(() => this.updateClock(), 1000); // Aggiornamento periodico
        }

        // Gestione Fullscreen
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullScreen());
            // Ascolta cambiamenti esterni (es. tasto ESC) per aggiornare l'icona
            document.addEventListener('fullscreenchange', () => this.updateFullscreenIcon());
        }
    }

    // --- OROLOGIO ---
    updateClock() {
        const now = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

        // Formattazione data locale italiana
        const timeString = now.toLocaleDateString('it-IT', options).replace(',', '');

        // Capitalizzazione prima lettera (es. "lun 10 gen" -> "Lun 10 gen")
        const finalString = timeString.charAt(0).toUpperCase() + timeString.slice(1);

        this.clockEl.textContent = finalString;
    }

    // --- FULLSCREEN ---
    toggleFullScreen() {
        if (!document.fullscreenElement) {
            // Entra in fullscreen
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Errore attivazione fullscreen: ${err.message}`);
            });
        } else {
            // Esci da fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    updateFullscreenIcon() {
        const icon = this.fullscreenBtn.querySelector('i');
        if (!icon) return;

        if (document.fullscreenElement) {
            // Icona "Comprimi" se siamo già full screen
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            // Icona "Espandi" se siamo in finestra normale
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    }
}

// Istanziazione
document.addEventListener('DOMContentLoaded', () => {
    new ImmersiveControls();
});
