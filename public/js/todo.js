document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const list = document.getElementById('todo-list');
    const clearBtn = document.getElementById('clear-completed-btn');

    if (!input || !addBtn || !list) return;

    // Load tasks from LocalStorage
    loadTasks();

    // Add Task
    function addTask() {
        const text = input.value.trim();
        if (text === '') return;

        createTaskElement(text, false);
        saveTasks();
        input.value = '';
        input.focus();
    }

    // Create HTML Element for Task
    function createTaskElement(text, isCompleted) {
        const li = document.createElement('li');
        if (isCompleted) li.classList.add('checked');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        checkbox.style.marginRight = '10px';
        checkbox.style.cursor = 'pointer';

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                li.classList.add('checked');
            } else {
                li.classList.remove('checked');
            }
            saveTasks();
        });

        const span = document.createElement('span');
        span.textContent = text;
        span.style.flex = '1';

        // Optional: click on text also toggles checkbox
        span.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            li.remove();
            saveTasks();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    }

    // Save to LocalStorage
    function saveTasks() {
        const tasks = [];
        list.querySelectorAll('li').forEach(li => {
            tasks.push({
                text: li.querySelector('span').textContent,
                completed: li.classList.contains('checked')
            });
        });
        localStorage.setItem('soundlly_todos', JSON.stringify(tasks));
    }

    // Load from LocalStorage
    function loadTasks() {
        const saved = localStorage.getItem('soundlly_todos');
        if (saved) {
            const tasks = JSON.parse(saved);
            tasks.forEach(task => createTaskElement(task.text, task.completed));
        }
    }

    // Clear Completed
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const completedItems = list.querySelectorAll('li.checked');
            completedItems.forEach(li => li.remove());
            saveTasks();
        });
    }

    // Event Listeners
    addBtn.addEventListener('click', addTask);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
});
