class TodoManager {
    constructor() {
        this.input = document.getElementById('todo-input');
        this.addBtn = document.getElementById('add-btn');
        this.list = document.getElementById('todo-list');
        this.clearBtn = document.getElementById('clear-completed-btn');

        if (this.input && this.addBtn && this.list) {
            this.init();
        }
    }

    init() {
        this.loadTasks();
        this.bindEvents();
    }

    bindEvents() {
        // Main list click delegation
        this.list.addEventListener('click', (e) => this.handleListClick(e));

        // Add Button
        this.addBtn.addEventListener('click', () => this.addTask());

        // Enter key on input
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Clear completed
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearCompleted());
        }
    }

    handleListClick(e) {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;

        const id = li.dataset.id;

        // Delete
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            e.stopPropagation();
            this.deleteTask(id, li);
            return;
        }

        // Checkbox click
        if (target.type === 'checkbox') {
            const isChecked = target.checked;
            this.updateTaskStatus(id, isChecked, li);
            return;
        }

        // Row click (toggle checkbox if not clicking label/input)
        if (target === li) {
            const checkbox = li.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                this.updateTaskStatus(id, checkbox.checked, li);
            }
        }
    }

    // --- API & UI ---

    async addTask() {
        const text = this.input.value.trim();
        if (text === '') return;

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                const task = await res.json();
                this.appendTaskToUI(task.text, task.completed, task.id);
                this.input.value = '';
                this.input.focus();
            }
        } catch (err) {
            console.error('Error adding task:', err);
        }
    }

    appendTaskToUI(text, isCompleted, id) {
        const li = document.createElement('li');
        li.dataset.id = id;
        if (isCompleted) li.classList.add('checked');

        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper-11';

        const checkboxId = 'todo-check-' + id;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        checkbox.id = checkboxId;
        checkbox.name = 'r';
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
        this.list.appendChild(li);

        this.list.scrollTop = this.list.scrollHeight;
    }

    async updateTaskStatus(id, completed, liElement) {
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
            if (res.status === 401) window.location.href = '/login';
        } catch (err) {
            console.error('Error updating task:', err);
        }
    }

    async deleteTask(id, liElement) {
        liElement.remove();
        try {
            const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            if (res.status === 401) window.location.href = '/login';
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    }

    async loadTasks() {
        const isLoggedIn = document.body.dataset.loggedIn === 'true';
        if (!isLoggedIn) return;

        try {
            const res = await fetch('/api/todos');
            if (res.ok) {
                const tasks = await res.json();
                this.list.innerHTML = '';
                tasks.forEach(task => this.appendTaskToUI(task.text, task.completed, task.id));
            }
        } catch (err) {
            console.error('Error loading tasks:', err);
        }
    }

    async clearCompleted() {
        const completedItems = this.list.querySelectorAll('li.checked');
        completedItems.forEach(li => li.remove());

        try {
            await fetch('/api/todos/completed', { method: 'DELETE' });
        } catch (err) {
            console.error('Error clearing tasks:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.todoManager = new TodoManager();
});
