document.addEventListener('DOMContentLoaded', () => {
    // Gestisco i click su tutta la pagina per intercettare i pulsanti dei piani
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        // Recupero le informazioni dal bottone cliccato
        const action = target.getAttribute('data-action');
        const plan = target.getAttribute('data-plan');

        if (!action) return; // Se non è un bottone che ci interessa, ignoro

        // Unifico le azioni: che sia "abbonati", "fast-track" o "seleziona", 
        // alla fine eseguo sempre la simulazione di upgrade.
        if (action === 'subscribe' || action === 'fast-track' || action === 'select-plan') {
            fastTrack(plan);
        }
    });

    // Funzione che simula il passaggio rapido a un nuovo piano
    function fastTrack(plan) {
        if (!plan) return;

        // Do un feedback visivo all'utente mentre aspetto
        const feedback = document.getElementById('feedback-message');
        if (feedback) feedback.textContent = 'Elaborazione in corso...';

        fetch('/api/abbonamento/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: plan, method: 'fast' })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Upgrade Simulato Riuscito!');
                    location.reload(); // Ricarico per aggiornare l'interfaccia col nuovo piano
                } else {
                    alert('Errore: ' + data.message);
                    if (feedback) feedback.textContent = '';
                }
            })
            .catch(err => {
                console.error(err);
                alert('Errore di connessione');
                if (feedback) feedback.textContent = '';
            });
    }
});
