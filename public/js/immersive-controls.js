/**
 * immersive-controls.js
 * 
 * Qui controllo le funzionalità della "Immersive Mode", quella schermata pensata
 * per il focus totale. Gestisco l'orologio in alto e il pulsante per 
 * entrare/uscire dallo schermo intero.
 */

class ImmersiveControls {
    constructor() {
        // Mi salvo i riferimenti ai bottoni e all'orologio
        this.clockEl = document.getElementById('realTimeClock');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');

        this.init();
    }

    init() {
        // Se c'è l'orologio, lo faccio partire
        if (this.clockEl) {
            this.updateClock(); // Lo imposto subito appena carico la pagina
            setInterval(() => this.updateClock(), 1000); // E poi lo aggiorno ogni secondo
        }

        // Se c'è il tasto fullscreen, attivo l'ascolto
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullScreen());

            // Questo serve se l'utente esce dal fullscreen premendo ESC invece del bottone:
            // devo comunque aggiornare l'icona
            document.addEventListener('fullscreenchange', () => this.updateFullscreenIcon());
        }
    }

    // --- OROLOGIO ---
    updateClock() {
        const now = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

        // Formatto la data in italiano (es. "lun 10 gen, 14:30")
        const timeString = now.toLocaleDateString('it-IT', options).replace(',', '');

        // Metto la maiuscola al giorno della settimana, per estetica
        const finalString = timeString.charAt(0).toUpperCase() + timeString.slice(1);

        this.clockEl.textContent = finalString;
    }

    // --- SCHERMO INTERO ---
    toggleFullScreen() {
        if (!document.fullscreenElement) {
            // Provo ad andare a schermo intero
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Non riesco ad attivare il fullscreen: ${err.message}`);
            });
        } else {
            // Esco dallo schermo intero
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Cambio l'icona del bottone in base allo stato
    updateFullscreenIcon() {
        const icon = this.fullscreenBtn.querySelector('i');
        if (!icon) return;

        if (document.fullscreenElement) {
            // Se sono già full, mostro l'icona per "rimpicciolire"
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            // Se sono normale, mostro l'icona per "espandere"
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    }
}

// Quando la pagina è pronta, avvio i controlli
document.addEventListener('DOMContentLoaded', () => {
    new ImmersiveControls();
});
