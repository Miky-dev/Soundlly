document.addEventListener('DOMContentLoaded', () => {
  // Filtro ricerca live
  const searchInput = document.getElementById('adminSearch');
  if (searchInput) {
    searchInput.addEventListener('keyup', function () {
      const searchText = this.value.toLowerCase();
      const activeTab = document.querySelector('.tab-pane.active');
      if (!activeTab) return;

      const rows = activeTab.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        // Mostra/nascondi in base al testo
        row.style.display = text.includes(searchText) ? '' : 'none';
      });
    });

    // Quando si cambia tab, riapplichiamo il filtro di ricerca corrente
    document.querySelectorAll('button[data-bs-toggle="pill"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', () => {
        searchInput.dispatchEvent(new Event('keyup'));
      });
    });
  }

  // Gestione form per l'aggiunta di un nuovo suono di sistema
  const addSoundForm = document.getElementById('addSoundForm');
  if (addSoundForm) {
    addSoundForm.addEventListener('submit', async (e) => {
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
        console.error(err);
        alert('Errore di connessione');
      }
    });
  }

  // Gestione del modale di eliminazione (singola e multipla)
  let deleteTargetId = null;
  let isBulkDelete = false;

  const deleteModal = document.getElementById('deleteModal');
  const deleteModalText = document.getElementById('deleteModalText');
  const confirmBtn = document.getElementById('confirmDelete');
  const cancelBtn = document.getElementById('cancelDelete');

  const bulkActionsBar = document.getElementById('bulkActionsBar');
  const selectedCountSpan = document.getElementById('selectedCount');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

  // Aggiorna l'interfaccia per la selezione multipla (barra flottante)
  const updateBulkUI = () => {
    const checked = document.querySelectorAll('.select-item:checked');
    const count = checked.length;
    if (selectedCountSpan) selectedCountSpan.textContent = count;

    if (bulkActionsBar) {
      if (count > 0) {
        bulkActionsBar.classList.add('visible');
      } else {
        bulkActionsBar.classList.remove('visible');
      }
    }
  };

  // Listener per i checkbox di selezione singola
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-item')) {
      updateBulkUI();
    }
  });

  // Apertura modale per eliminazione singola (click sul cestino)
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTargetId = btn.dataset.id;
      isBulkDelete = false;
      if (deleteModalText) deleteModalText.textContent = "Sei sicuro di voler eliminare questo elemento?";
      if (deleteModal) deleteModal.classList.remove('hidden');
    });
  });

  // Apertura modale per eliminazione di gruppo (click su elimina nella barra)
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      const count = document.querySelectorAll('.select-item:checked').length;
      if (count === 0) return;

      isBulkDelete = true;
      deleteTargetId = null;
      if (deleteModalText) deleteModalText.textContent = `Sei sicuro di voler eliminare ${count} elementi selezionati?`;
      if (deleteModal) deleteModal.classList.remove('hidden');
    });
  }

  // Chiusura del modale (annulla)
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      deleteTargetId = null;
      isBulkDelete = false;
      if (deleteModal) deleteModal.classList.add('hidden');
    });
  }

  // Conferma eliminazione (esegue la chiamata API appropriata)
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      try {
        if (isBulkDelete) {
          // Eliminazione multipla via API
          const checkboxes = document.querySelectorAll('.select-item:checked');
          const ids = Array.from(checkboxes).map(cb => cb.value);

          const res = await fetch('/admin/api/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          const data = await res.json();
          if (data.ok) location.reload();
          else alert('Errore Bulk: ' + data.error);

        } else {
          // Eliminazione singola
          if (!deleteTargetId) return;
          const res = await fetch(`/admin/sounds/${deleteTargetId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.ok) location.reload();
          else alert('Errore: ' + data.error);
        }
      } catch (err) {
        alert('Errore network');
      }
      if (deleteModal) deleteModal.classList.add('hidden');
    });
  }

  // Chiusura del modale cliccando sullo sfondo scuro
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        deleteModal.classList.add('hidden');
      }
    });
  }


  // Gestione della modifica rapida (inline editing) del titolo
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      row.querySelector('.view-mode').classList.add('d-none');
      row.querySelector('.edit-mode').classList.remove('d-none');
      btn.classList.add('d-none');
      row.querySelector('.btn-save').classList.remove('d-none');
    });
  });

  document.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const id = btn.dataset.id;
      const titleInput = row.querySelector('.edit-mode');
      const title = titleInput ? titleInput.value : '';

      try {
        const res = await fetch(`/admin/sounds/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        });
        const data = await res.json();
        if (data.ok) location.reload();
      } catch (e) { alert('Errore'); }
    });
  });
});
