/**
 * todo.js
 * 
 * Gestore della Lista "To-Do" (Compiti da svolgere).
 * 
 * Funzionalità:
 * 1. Aggiunta task: Invia al server il testo (POST).
 * 2. Visualizzazione: Renderizza la lista con checkbox personalizzati.
 * 3. Stato Check/Uncheck: Aggiorna lo stato sul server in tempo reale (PUT).
 * 4. Eliminazione: Rimuove task e pulizia completati (DELETE).
 */

class TodoManager {
    constructor() {
        // Riferimenti DOM
        this.input = document.getElementById('todo-input');
        this.addBtn = document.getElementById('add-btn');
        this.list = document.getElementById('todo-list');
        this.clearBtn = document.getElementById('clear-completed-btn');

        // Avvia solo se i componenti esistono
        if (this.input && this.addBtn && this.list) {
            this.init();
        }
    }

    init() {
        this.loadTasks(); // Carica task esistenti
        this.bindEvents(); // Attiva pulsanti e input
    }

    bindEvents() {
        // Event delegation sulla lista per gestire click su item dinamici
        this.list.addEventListener('click', (e) => this.handleListClick(e));

        // Click Bottone Aggiungi
        this.addBtn.addEventListener('click', () => this.addTask());

        // Tasto Invio nell'input
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Bottone "Pulisci Completati"
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearCompleted());
        }
    }

    // Gestore unico click sulla lista (per performance e elementi dinamici)
    handleListClick(e) {
        const target = e.target;
        // Trova l'elemento <li> padre
        const li = target.closest('li');
        if (!li) return;

        const id = li.dataset.id;

        // Caso 1: Click bottone Cancella (X)
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            e.stopPropagation();
            this.deleteTask(id, li);
            return;
        }

        // Caso 2: Click Checkbox
        if (target.type === 'checkbox') {
            const isChecked = target.checked;
            this.updateTaskStatus(id, isChecked, li);
            return;
        }

        // Caso 3: Click sulla riga vuota (opzionale: toggle checkbox)
        if (target === li) {
            const checkbox = li.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                this.updateTaskStatus(id, checkbox.checked, li);
            }
        }
    }

    // --- LOGICA API e UI ---

    async addTask() {
        const text = this.input.value.trim();
        if (text === '') return;

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            // Gestione utente non loggato
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                const task = await res.json();
                // Aggiunge visivamente il task appena creato
                this.appendTaskToUI(task.text, task.completed, task.id);
                this.input.value = ''; // Pulisce input
                this.input.focus();
            }
        } catch (err) {
            console.error('Errore aggiunta task:', err);
        }
    }

    // Crea l'HTML per il singolo task
    appendTaskToUI(text, isCompleted, id) {
        const li = document.createElement('li');
        li.dataset.id = id;
        if (isCompleted) li.classList.add('checked');

        // Wrapper per checkbox custom
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

        // Bottone Eliminazione
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.classList.add('delete-btn');

        li.appendChild(wrapper);
        li.appendChild(deleteBtn);
        this.list.appendChild(li);

        // Auto-scroll in fondo per vedere il nuovo task
        this.list.scrollTop = this.list.scrollHeight;
    }

    async updateTaskStatus(id, completed, liElement) {
        // Feedback visuale immediato
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
            console.error('Errore aggiornamento task:', err);
        }
    }

    async deleteTask(id, liElement) {
        liElement.remove(); // Rimozione visuale immediata (Optimistic UI)
        try {
            const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            if (res.status === 401) window.location.href = '/login';
        } catch (err) {
            console.error('Errore eliminazione task:', err);
        }
    }

    async loadTasks() {
        // Verifica preliminare se l'utente è loggato tramite data-attribute nel body
        const isLoggedIn = document.body.dataset.loggedIn === 'true';
        if (!isLoggedIn) return;

        try {
            const res = await fetch('/api/todos');
            if (res.ok) {
                const tasks = await res.json();
                this.list.innerHTML = ''; // Pulisce lista attuale
                tasks.forEach(task => this.appendTaskToUI(task.text, task.completed, task.id));
            }
        } catch (err) {
            console.error('Errore caricamento tasks:', err);
        }
    }

    async clearCompleted() {
        // Rimuove visualmente tutti i task completati
        const completedItems = this.list.querySelectorAll('li.checked');
        completedItems.forEach(li => li.remove());

        try {
            // Chiede al server di fare pulizia
            await fetch('/api/todos/completed', { method: 'DELETE' });
        } catch (err) {
            console.error('Errore pulizia tasks:', err);
        }
    }
}

// Inizializzazione Globale
document.addEventListener('DOMContentLoaded', () => {
    window.Soundlly = window.Soundlly || {};
    window.Soundlly.todo = new TodoManager();
});
