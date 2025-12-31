const express = require('express');
const router = express.Router();
const { run } = require('../db/sqlite');
const { ensureAuthenticated } = require('../middleware/auth');

// POST /api/subscription/upgrade
router.post('/api/subscription/upgrade', ensureAuthenticated, async (req, res) => {
    try {
        const { plan, method, paymentDetails } = req.body;

        if (!['premium', 'creator', 'standard'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Piano non valido.' });
        }

        // Simulate payment processing
        if (method === 'cc') {
            // In a real app, validate paymentDetails here (e.g., Stripe)
            if (!paymentDetails || !paymentDetails.cardNumber) {
                return res.status(400).json({ success: false, message: 'Dati di pagamento mancanti.' });
            }
            // Fake delay
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Update User in DB
        if (plan === 'creator') {
            await run(`UPDATE users SET role = 'creator' WHERE id = ?`, [req.user.id]);
            // Optional: Creator implies premium access? Usually yes, but sticking to role change as requested.
        } else {
            await run(`UPDATE users SET plan = ? WHERE id = ?`, [plan, req.user.id]);
        }

        return res.json({ success: true, message: `Upgrade a ${plan} completato!` });

    } catch (error) {
        console.error('Subscription Error:', error);
        return res.status(500).json({ success: false, message: 'Errore durante l\'aggiornamento del piano.' });
    }
});

module.exports = router;
