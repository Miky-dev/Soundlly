const express = require('express');
const router = express.Router();
const { run } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

/*
 * POST /api/subscription/upgrade
 * Gestisce l'upgrade del piano utente (premium, creator, ecc.).
 * Simula un processo di pagamento.
 */
router.post('/api/subscription/upgrade', ensureAuthenticated, async (req, res) => {
    try {
        const { plan, method, paymentDetails } = req.body;

        // Validazione Piano
        if (!['premium', 'creator', 'standard'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Piano non valido.' });
        }

        // Simulazione Processo Pagamento
        if (method === 'cc') {
            // Qui andrebbe integrato un gateway reale (Stripe, PayPal)
            if (!paymentDetails || !paymentDetails.cardNumber) {
                return res.status(400).json({ success: false, message: 'Dati di pagamento mancanti.' });
            }
            // Delay finto per simulare rete
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Aggiornamento Utente nel Database
        if (plan === 'creator') {
            // Il piano creator potrebbe essere gestito come un Ruolo
            await run(`UPDATE users SET role = 'creator' WHERE id = ?`, [req.user.id]);
        } else {
            // Aggiorna il campo piano
            await run(`UPDATE users SET plan = ? WHERE id = ?`, [plan, req.user.id]);
        }

        return res.json({ success: true, message: `Upgrade a ${plan} completato!` });

    } catch (error) {
        console.error('Subscription Error:', error);
        return res.status(500).json({ success: false, message: 'Errore durante l\'aggiornamento del piano.' });
    }
});

module.exports = router;
