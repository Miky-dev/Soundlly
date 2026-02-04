const express = require('express');
const router = express.Router();
const { run } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// Gestione upgrade del piano utente (premium, creator, ecc.)
router.post('/api/abbonamento/upgrade', ensureAuthenticated, async (req, res) => {
    try {
        const { plan, method, paymentDetails } = req.body;

        // Verifica che il piano richiesto sia valido
        if (!['premium', 'creator', 'standard'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Piano non valido.' });
        }

        // Gestione metodo di pagamento (attualmente simulato per carte di credito)
        if (method === 'cc') {
            if (!paymentDetails || !paymentDetails.cardNumber) {
                return res.status(400).json({ success: false, message: 'Dati di pagamento mancanti.' });
            }
            // In un sistema reale qui avverrebbe la chiamata a Stripe/PayPal
        }

        // Aggiorniamo i permessi dell'utente nel DB
        if (plan === 'creator') {
            // "Creator" è gestito come un ruolo specifico nell'architettura attuale
            await run(`UPDATE users SET role = 'creator' WHERE id = ?`, [req.user.id]);
        } else {
            // Gli altri livelli (es. Premium) sono gestiti tramite il campo 'plan'
            await run(`UPDATE users SET plan = ? WHERE id = ?`, [plan, req.user.id]);
        }

        return res.json({ success: true, message: `Upgrade a ${plan} completato!` });

    } catch (error) {
        console.error('Errore durante l\'upgrade dell\'abbonamento:', error);
        return res.status(500).json({ success: false, message: 'Si è verificato un errore durante l\'aggiornamento.' });
    }
});

module.exports = router;
