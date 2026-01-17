/**
 * admin.js
 * 
 * Gestione Pannello di Amministrazione (SPA Client).
 * 
 * Nota: Questo script è progettato per essere incluso in admin.ejs.
 * Attualmente admin.ejs potrebbe usare script inline; questo file rappresenta
 * la versione modulare e pulita in Classi ES6.
 */

class AdminPanel {
  constructor() {
    this.config = {
      apiBase: '/admin/api/files',
      csrfHeader: 'X-CSRF-Token',
      csrfToken: '' // Da popolare se necessario
    };

    this.state = {
      files: [],
      filtered: [],
      selection: new Set()
    };

    // Cache selezioni DOM
    this.$ = (sel) => document.querySelector(sel);

    this.init();
  }

  async init() {
    // Carica dati iniziali
    try {
      await this.searchSounds(); // Usa la logica corrente della pagina
      this.bindEvents();
    } catch (e) {
      console.error('Admin Init Error:', e);
    }
  }

  bindEvents() {
    // Esempio: Listener per form di aggiunta suono
    const addForm = document.getElementById('addSoundForm');
    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleAddSound(e));
    }

    // Ricerca
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => this.handleSearch(e));
    }

    // Delega eventi per bottoni dinamici (Delete/Edit)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete')) this.handleDelete(e);
      if (e.target.closest('.btn-edit')) this.handleEditMode(e);
      if (e.target.closest('.btn-save')) this.handleSaveEdit(e);
    });
  }

  // --- AZIONI ---

  async handleAddSound(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('description', 'Suono Ambientale');

    try {
      const res = await fetch('/admin/sounds', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.ok) location.reload();
      else alert('Errore: ' + data.error);
    } catch (err) {
      alert('Errore di connessione');
    }
  }

  async handleDelete(e) {
    const btn = e.target.closest('.btn-delete');
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;

    const id = btn.dataset.id;
    try {
      const res = await fetch(`/admin/sounds/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) location.reload();
      else alert('Errore: ' + data.error);
    } catch (err) {
      alert('Errore eliminazione');
    }
  }

  handleEditMode(e) {
    const btn = e.target.closest('.btn-edit');
    const row = btn.closest('tr');

    // Toggle visualizzazione input
    row.querySelector('.view-mode').classList.add('d-none');
    row.querySelector('.edit-mode').classList.remove('d-none');
    btn.classList.add('d-none');
    row.querySelector('.btn-save').classList.remove('d-none');
  }

  async handleSaveEdit(e) {
    const btn = e.target.closest('.btn-save');
    const row = btn.closest('tr');
    const id = btn.dataset.id;
    const title = row.querySelector('.edit-mode').value;

    try {
      const res = await fetch(`/admin/sounds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      if (data.ok) location.reload();
    } catch (err) {
      alert('Errore salvataggio');
    }
  }

  handleSearch(e) {
    const searchText = e.target.value.toLowerCase();
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) return;

    const rows = activeTab.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(searchText) ? '' : 'none';
    });
  }
}

// Avvio
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
