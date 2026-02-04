/**
 * todo.js
 * 
 * Gestisce la lista dei compiti (To-Do List).
 * Permette di aggiungere nuovi task, segnarli come fatti e cancellarli.
 * Tutte le modifiche vengono salvate subito sul server così le ritrovi anche se cambi dispositivo.
 */

class TodoManager {
    constructor() {
        // I pezzi della pagina che ci servono
        this.input = document.getElementById('todo-input');
        this.addBtn = document.getElementById('add-btn');
        this.list = document.getElementById('todo-list');
        this.clearBtn = document.getElementById('clear-completed-btn');

        // Parto solo se la lista esiste in questa pagina
        if (this.input && this.addBtn && this.list) {
            this.init();
        }
    }

    init() {
        this.loadTasks(); // Chiedo al server i compiti vecchi
        this.bindEvents(); // Attivo i bottoni
    }

    bindEvents() {
        // Ascolto i click su tutta la lista (così funziona anche per gli elementi creati dinamicamente dopo)
        this.list.addEventListener('click', (e) => this.handleListClick(e));

        // Click sul bottone "+"
        this.addBtn.addEventListener('click', () => this.addTask());

        // Invio dalla tastiera
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Bottone "Pulisci Completati" (il cestino generale)
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearCompleted());
        }
    }

    // Gestisco un solo listener per tanti elementi (Performance migliore)
    handleListClick(e) {
        const target = e.target;
        // Risalgo all'elemento <li> che contiene tutto
        const li = target.closest('li');
        if (!li) return;

        const id = li.dataset.id;

        // 1. Hanno cliccato la X per cancellare?
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            e.stopPropagation(); // Evito che il click si propaghi
            this.deleteTask(id, li);
            return;
        }

        // 2. Hanno cliccato la spunta (checkbox)?
        if (target.type === 'checkbox') {
            const isChecked = target.checked;
            this.updateTaskStatus(id, isChecked, li);
            return;
        }

        // 3. (Opzionale) Se cliccano sulla riga vuota, attivo la spunta lo stesso
        if (target === li) {
            const checkbox = li.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                this.updateTaskStatus(id, checkbox.checked, li);
            }
        }
    }

    // --- COMUNICAZIONE CON IL SERVER ---

    async addTask() {
        const text = this.input.value.trim();
        if (text === '') return; // Niente task vuoti

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            // Se la sessione è scaduta, rimando al login
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                const task = await res.json();
                // Disegno subito il nuovo task nella lista
                this.appendTaskToUI(task.text, task.completed, task.id);
                this.input.value = ''; // Pulisco il campo
                this.input.focus();
            }
        } catch (err) {
            console.error('Impossibile aggiungere il task:', err);
        }
    }

    // Costruisco l'HTML del task (li, checkbox, label, bottone elimina)
    appendTaskToUI(text, isCompleted, id) {
        const li = document.createElement('li');
        li.dataset.id = id;
        if (isCompleted) li.classList.add('checked');

        // Div contenitore per lo stile checkbox personalizzato (da CSS)
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

        // Bottone "X"
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.classList.add('delete-btn');

        li.appendChild(wrapper);
        li.appendChild(deleteBtn);
        this.list.appendChild(li);

        // Scrollo in basso per mostrare l'ultimo arrivato
        this.list.scrollTop = this.list.scrollHeight;
    }

    async updateTaskStatus(id, completed, liElement) {
        // Feedback visuale istantaneo (prima ancora che risponda il server)
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
        liElement.remove(); // Lo tolgo subito dalla vista (Optimistic UI)
        try {
            const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            if (res.status === 401) window.location.href = '/login';
        } catch (err) {
            console.error('Errore eliminazione task:', err);
        }
    }

    async loadTasks() {
        // Controllo veloce se siamo loggati (l'attributo è messo da EJS nel body)
        const isLoggedIn = document.body.dataset.loggedIn === 'true';
        if (!isLoggedIn) return;

        try {
            const res = await fetch('/api/todos');
            if (res.ok) {
                const tasks = await res.json();
                this.list.innerHTML = ''; // Pulisco per sicurezza
                tasks.forEach(task => this.appendTaskToUI(task.text, task.completed, task.id));
            }
        } catch (err) {
            console.error('Impossibile caricare i task:', err);
        }
    }

    async clearCompleted() {
        // Tolgo subito dalla vista quelli spuntati
        const completedItems = this.list.querySelectorAll('li.checked');
        completedItems.forEach(li => li.remove());

        try {
            // Dico al server di fare lo stesso nel database
            await fetch('/api/todos/completed', { method: 'DELETE' });
        } catch (err) {
            console.error('Errore pulizia completa:', err);
        }
    }
}

// Avvio tutto quando la pagina è pronta
document.addEventListener('DOMContentLoaded', () => {
    window.Soundlly = window.Soundlly || {};
    window.Soundlly.todo = new TodoManager();
});
