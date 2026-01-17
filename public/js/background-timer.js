/**
 * Gestione Timer in Background
 * Questa classe permette al timer di "funzionare" anche se l'utente cambia pagina o naviga nel sito.
 * 
 * Funzionamento:
 * 1. Legge lo stato del timer salvato dal componente principale (timer.js) nel LocalStorage.
 * 2. Se c'è un timer attivo, calcola quanto tempo è passato dall'ultimo aggiornamento.
 * 3. Se il tempo è scaduto o sta per scadere, pianifica il suono di fine timer e la notifica.
 */

class BackgroundTimerListener {
    constructor() {
        // Identifica l'utente (o 'guest') per leggere la chiave corretta nel LocalStorage
        this.userId = document.body.dataset.userId || 'guest';
        this.storageKey = `soundlly_timer_state_v1_${this.userId}`;

        // Appena caricata la pagina, controlla se c'è un timer in corso
        this.checkTimer();
    }

    checkTimer() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);

            // Verifica se il timer era in esecuzione
            if (state.isRunning && state.timeLeft > 0) {
                // Calcola il tempo reale rimanente
                // (Ora attuale - Ultimo aggiornamento registrato)
                const now = Date.now();
                const lastTick = state.lastTick || now;
                const elapsedSeconds = (now - lastTick) / 1000;
                const remainingSeconds = state.timeLeft - elapsedSeconds;

                if (remainingSeconds > 0) {
                    console.log(`[Background Timer] Tempo rimanente calcolato: ${remainingSeconds}s`);
                    // Imposta un timeout per suonare quando il tempo scadrà effettivamente
                    this.scheduleCompletion(remainingSeconds * 1000);
                } else {
                    // Il timer è scaduto mentre l'utente non era sulla pagina.
                    // Qui potremmo mostrare un avviso immediato se necessario.
                }
            }
        } catch (e) {
            console.error('[Background Timer] Errore nella lettura dello stato', e);
        }
    }

    // Pianifica l'azione di completamento (suono + notifica)
    scheduleCompletion(ms) {
        setTimeout(() => {
            this.playAudio();
            this.sendNotification();
        }, ms);
    }

    // Riproduce il suono di fine timer ("Ding")
    playAudio() {
        const audio = new Audio('/audio/ding.mp3');
        audio.play().catch(err => console.log('[Background Timer] Impossibile riprodurre audio', err));
    }

    // Invia una notifica browser (se l'utente ha dato il permesso)
    sendNotification() {
        if (Notification.permission === 'granted') {
            new Notification('Tempo scaduto!', {
                body: 'Il timer su Soundlly è terminato.',
                icon: '/immagini/logo3.png'
            });
        }
    }
}

// Avvia l'ascoltatore non appena il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundTimerListener();
});
