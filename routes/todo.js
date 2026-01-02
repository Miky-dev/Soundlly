const express = require('express');
const router = express.Router();
const { run, all, get } = require('../db/sqlite');

// Middleware to ensure authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

router.use(ensureAuthenticated);

// GET /api/todos - Get all tasks for user
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

// POST /api/todos - Add new task
router.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

        await run('INSERT INTO todos (user_id, text) VALUES (?, ?)', [req.user.id, text.trim()]);
        // Get the inserted item to return it (SQLite doesn't support RETURNING in older versions, but let's try standard flow)
        // We can just get the last inserted for this user or standard rowid
        // For simplicity/robustness, just fetch the last one created.
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

// PUT /api/todos/:id - Toggle status
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

// DELETE /api/todos/completed - Clear completed
router.delete('/completed', async (req, res) => {
    try {
        await run('DELETE FROM todos WHERE user_id = ? AND is_done = 1', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/todos/:id - Delete single task
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
