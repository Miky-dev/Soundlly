class BackgroundTimerListener {
    constructor() {
        this.userId = document.body.dataset.userId || 'guest';
        this.storageKey = `soundlly_timer_state_v1_${this.userId}`;
        this.checkTimer();
    }

    checkTimer() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            if (state.isRunning && state.timeLeft > 0) {
                // Calculate real remaining time considering when it was last saved
                const now = Date.now();
                const lastTick = state.lastTick || now;
                const elapsedSeconds = (now - lastTick) / 1000;
                const remainingSeconds = state.timeLeft - elapsedSeconds;

                if (remainingSeconds > 0) {
                    console.log(`[Background Timer] Calculated remaining: ${remainingSeconds}s`);
                    this.scheduleCompletion(remainingSeconds * 1000);
                } else {
                    // Timer expired while away? 
                    // Optional: could play sound immediately if within a small threshold
                }
            }
        } catch (e) {
            console.error('[Background Timer] Error parsing state', e);
        }
    }

    scheduleCompletion(ms) {
        setTimeout(() => {
            this.playAudio();
            this.sendNotification();
        }, ms);
    }

    playAudio() {
        const audio = new Audio('/audio/ding.mp3');
        audio.play().catch(err => console.log('[Background Timer] Audio play failed', err));
    }

    sendNotification() {
        if (Notification.permission === 'granted') {
            new Notification('Tempo scaduto!', {
                body: 'Il timer su Soundlly è terminato.',
                icon: '/immagini/logo3.png'
            });
        }
    }
}

// Start listener on load
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundTimerListener();
});
