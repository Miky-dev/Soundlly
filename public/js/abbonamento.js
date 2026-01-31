document.addEventListener('DOMContentLoaded', () => {
    // Event Delegation for Buttons
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.getAttribute('data-action');
        const plan = target.getAttribute('data-plan');

        if (!action) return; // Not an action button

        // Unify actions: both 'subscribe', 'fast-track', and 'select-plan' now just do the simulated upgrade
        if (action === 'subscribe' || action === 'fast-track' || action === 'select-plan') {
            fastTrack(plan);
        }
    });

    function fastTrack(plan) {
        if (!plan) return;

        // Visual feedback
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
                    location.reload();
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
