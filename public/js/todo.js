document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const list = document.getElementById('todo-list');
    const clearBtn = document.getElementById('clear-completed-btn');

    if (!input || !addBtn || !list) return;

    // Load tasks from API
    loadTasks();

    // --- MAIN EVENT DELEGATION ---
    list.addEventListener('click', (e) => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;

        const id = li.dataset.id;

        // DELETE BUTTON CLICK
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            e.stopPropagation(); // Avoid triggering row clicks
            deleteTask(id, li);
            return;
        }

        // CHECKBOX CLICK (Let default behavior happen, then sync)
        if (target.type === 'checkbox') {
            const isChecked = target.checked;
            updateTaskStatus(id, isChecked, li);
            return;
        }

        // TEXT/ROW CLICK (Toggle checkbox)
        // Click on LABEL triggers input change automatically, so we might not need to manually toggle if clicking text.
        // However, if the user clicks the row background outside the label, we might want to toggle.
        // But the new design has a specific wrapper. Let's see.
        // If clicking the LI but not the label/input/delete, toggle checkbox.
        if (target === li) {
            const checkbox = li.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                updateTaskStatus(id, checkbox.checked, li);
            }
        }
    });

    // --- API & UI FUNCTIONS ---

    async function addTask() {
        console.log('Attempting to add task...');
        const text = input.value.trim();
        if (text === '') {
            console.log('Empty text, ignoring.');
            return;
        }

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (res.status === 401) {
                // User not logged in
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                const task = await res.json();
                appendTaskToUI(task.text, task.completed, task.id);
                input.value = '';
                input.focus();
            }
        } catch (err) {
            console.error('Error adding task:', err);
        }
    }

    // Creating DOM elements (simplified, no listeners attached)
    function appendTaskToUI(text, isCompleted, id) {
        const li = document.createElement('li');
        li.dataset.id = id;
        if (isCompleted) li.classList.add('checked');

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper-11';

        const checkboxId = 'todo-check-' + id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        checkbox.id = checkboxId;
        checkbox.name = 'r'; // name from example
        checkbox.value = id;

        const label = document.createElement('label');
        label.htmlFor = checkboxId;
        label.textContent = text;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.classList.add('delete-btn');

        li.appendChild(wrapper);
        li.appendChild(deleteBtn);
        list.appendChild(li);

        // Auto scroll
        list.scrollTop = list.scrollHeight;
    }

    async function updateTaskStatus(id, completed, liElement) {
        // Optimistic UI Update
        if (completed) {
            liElement.classList.add('checked');
        } else {
            liElement.classList.remove('checked');
        }

        try {
            const res = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });
            if (res.status === 401) {
                window.location.href = '/login';
            }
        } catch (err) {
            console.error('Error updating task:', err);
            // Revert on error? For now, keep simple.
        }
    }

    async function deleteTask(id, liElement) {
        liElement.remove(); // Optimistic remove
        try {
            const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            if (res.status === 401) {
                window.location.href = '/login';
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    }

    async function loadTasks() {
        const isLoggedIn = document.body.dataset.loggedIn === 'true';
        if (!isLoggedIn) return; // Prevent 401 network error for guests

        try {
            const res = await fetch('/api/todos');

            if (res.ok) {
                const tasks = await res.json();
                list.innerHTML = '';
                tasks.forEach(task => appendTaskToUI(task.text, task.completed, task.id));
            }
        } catch (err) {
            console.error('Error loading tasks:', err);
        }
    }

    // --- OTHER LISTENERS ---
    addBtn.addEventListener('click', addTask);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            // Optimistic clear
            const completedItems = list.querySelectorAll('li.checked');
            completedItems.forEach(li => li.remove());

            try {
                await fetch('/api/todos/completed', { method: 'DELETE' });
            } catch (err) {
                console.error('Error clearing tasks:', err);
            }
        });
    }
});
