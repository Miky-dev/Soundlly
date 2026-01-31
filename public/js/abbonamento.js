document.addEventListener('DOMContentLoaded', () => {
    let selectedPlan = '';
    const modal = document.getElementById('payment-modal');

    // Event Delegation for Buttons
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.getAttribute('data-action');
        const plan = target.getAttribute('data-plan');

        if (!action) return; // Not an action button

        if (action === 'subscribe') {
            openPaymentModal(plan);
        } else if (action === 'fast-track') {
            fastTrack(plan);
        } else if (action === 'close-modal') {
            closePaymentModal();
        } else if (action === 'pay') {
            processPayment();
        } else if (action === 'select-plan') {
            // Logic for just selecting (maybe highlighting) or handled by link
            console.log('Selected plan:', plan);
            fastTrack(plan);
        }
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closePaymentModal();
        }
    });

    function openPaymentModal(plan) {
        selectedPlan = plan;
        modal.style.display = 'flex';
    }

    function closePaymentModal() {
        modal.style.display = 'none';
    }

    function fastTrack(plan) {
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
                }
            });
    }

    function processPayment() {
        // Simulate CC processing visual delay
        const payBtn = modal.querySelector('button[data-action="pay"]');
        const originalText = payBtn.textContent;

        payBtn.textContent = 'Elaborazione...';
        payBtn.disabled = true;

        fetch('/api/abbonamento/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: selectedPlan,
                method: 'cc',
                paymentDetails: { cardNumber: '1234' } // Mock data
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Pagamento Riuscito! Benvenuto in ' + selectedPlan);
                    location.reload();
                } else {
                    alert('Errore Pagamento: ' + data.message);
                    payBtn.textContent = originalText;
                    payBtn.disabled = false;
                }
            });
    }
});
