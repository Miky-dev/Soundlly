const express = require('express');
const router = express.Router();
const { run, all, get } = require('../db/sqlite');

// Middleware di autenticazione specifico per le API (restituisce JSON 401 invece di redirect)
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Non autorizzato' });
}

// Applica il middleware a tutte le route di questo file
router.use(ensureAuthenticated);

// Recupera la lista delle attività (To-Do) dell'utente, ordinate per data di creazione
router.get('/', async (req, res) => {
    try {
        const tasks = await all('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at ASC', [req.user.id]);
        res.json(tasks.map(t => ({
            id: t.id,
            text: t.text,
            completed: !!t.is_done
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Aggiunge una nuova attività alla lista
router.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

        await run('INSERT INTO todos (user_id, text) VALUES (?, ?)', [req.user.id, text.trim()]);

        // Recupera l'ultimo elemento inserito per restituirlo completo di ID
        const newTask = await get('SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);

        res.json({
            id: newTask.id,
            text: newTask.text,
            completed: !!newTask.is_done
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Aggiorna lo stato di completamento di un'attività (spuntata/non spuntata)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        const is_done = completed ? 1 : 0;
        const completed_at = completed ? new Date().toISOString() : null;

        await run(
            'UPDATE todos SET is_done = ?, completed_at = ? WHERE id = ? AND user_id = ?',
            [is_done, completed_at, id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Elimina tutte le attività completate (pulizia liste)
router.delete('/completed', async (req, res) => {
    try {
        await run('DELETE FROM todos WHERE user_id = ? AND is_done = 1', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Elimina una singola attività tramite il suo ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await run('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
