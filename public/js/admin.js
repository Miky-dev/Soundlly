// ======= BOOTSTRAP (Avvio completo incapsulato) =======
document.addEventListener('DOMContentLoaded', async () => {

  // ======= CONFIGURAZIONE =======
  // Oggetto principale di configurazione per l'applicazione
  const CONFIG = {
    useMockData: false,  // Imposta a true per usare dati finti (mock), false per chiamate API reali
    apiBase: '/admin/api/files', // Endpoint base per le chiamate API
    csrfHeader: 'X-CSRF-Token', // Nome dell'header per il token CSRF (protezione sicurezza)
    csrfToken: '' // Token CSRF che verrà popolato (idealmente dal server)
  };

  // ======= STATO =======
  // Gestione dello stato locale dell'applicazione (store reattivo semplice)
  const state = {
    files: [],      // Array che conterrà l'elenco completo dei file
    filtered: [],   // Array che conterrà l'elenco filtrato mostrato a video
    selection: new Set() // Set per gestire gli ID dei file selezionati (per azioni di massa)
  };

  // ======= UTIL =======
  // Helper per selezionare elementi DOM (abbreviazione di document.querySelector)
  const el = sel => document.querySelector(sel);

  // Formatta i byte in formato leggibile (KB, MB, GB)
  const fmtBytes = n => {
    if (n < 1024) return n + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let u = -1; do { n /= 1024; ++u; } while (n >= 1024 && u < units.length - 1);
    return n.toFixed(1) + ' ' + units[u];
  };

  // Formatta una data ISO in stringa locale leggibile
  const fmtDate = iso => new Date(iso).toLocaleString();

  // Mostra un messaggio "toast" (notifica temporanea) in basso
  const toast = (msg) => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    el('#toast').appendChild(t); // Aggiunge al container dei toast
    setTimeout(() => t.remove(), 2600); // Rimuove dopo 2.6 secondi
  };

  // ======= API WRAPPER =======
  // Funzioni async per interagire con il backend

  // Recupera la lista dei file
  async function apiList() {
    if (CONFIG.useMockData) return mockFetchList(); // Fallback su mock se attivo

    // Chiamata GET all'endpoint configurato
    const r = await fetch(CONFIG.apiBase, { headers: { [CONFIG.csrfHeader]: CONFIG.csrfToken } });
    if (!r.ok) throw new Error('Errore nel recupero elenco');
    return r.json();
  }

  // Aggiorna i metadati di un file (PATCH)
  async function apiUpdate(id, payload) {
    if (CONFIG.useMockData) return mockUpdate(id, payload);

    const r = await fetch(`${CONFIG.apiBase}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        [CONFIG.csrfHeader]: CONFIG.csrfToken
      },
      credentials: 'include', // Include i cookie di sessione
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('Errore nell\'aggiornamento del file');
    return r.json();
  }

  // Sostituisce il file fisico mantenendo l'ID (POST speciale /replace)
  async function apiReplace(id, file) {
    if (CONFIG.useMockData) { toast('✅ (demo) File sostituito'); return; }

    const fd = new FormData();
    fd.append('file', file); // Aggiunge il file al form data

    const r = await fetch(`${CONFIG.apiBase}/${encodeURIComponent(id)}/replace`, {
      method: 'POST', headers: { [CONFIG.csrfHeader]: CONFIG.csrfToken }, body: fd
    });
    if (!r.ok) throw new Error('Sostituzione non riuscita');
  }

  // Elimina un singolo file
  async function apiDelete(id) {
    if (CONFIG.useMockData) { toast('🗑 (demo) File eliminato'); return; }

    const r = await fetch(`${CONFIG.apiBase}/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { [CONFIG.csrfHeader]: CONFIG.csrfToken }
    });
    if (!r.ok) throw new Error('Eliminazione non riuscita');
  }

  // Elimina più file in serie (iterazione)
  async function apiBulkDelete(ids) {
    for (const id of ids) await apiDelete(id);
  }

  // ======= RENDER =======
  // Funzione principale per aggiornare l'interfaccia in base allo stato
  function render() {
    const tbody = el('#tbody');
    tbody.innerHTML = ''; // Pulisce la tabella corrente

    // Recupera i valori dei filtri
    const q = el('#searchInput').value.trim().toLowerCase();
    const s = el('#statusFilter').value;
    const t = el('#typeFilter').value;

    // Filtra l'array principale dei file
    state.filtered = state.files.filter(f => {
      // Cerca corrispondenza parziale in ID, nome, utente o descrizione
      const matchesQ = !q || [f.id, f.filename, f.user, f.description].some(v => String(v || '').toLowerCase().includes(q));
      // Filtro esatto per stato
      const matchesS = !s || f.status === s;
      // Filtro esatto per tipo
      const matchesT = !t || f.type === t;
      return matchesQ && matchesS && matchesT;
    });

    // Gestione stato vuoto (nessun risultato)
    if (state.filtered.length === 0) {
      el('#emptyState').hidden = false;
      return;
    }
    el('#emptyState').hidden = true;

    // Itera sui file filtrati e crea le righe della tabella
    const tpl = el('#rowTemplate');
    for (const f of state.filtered) {
      const tr = tpl.content.firstElementChild.cloneNode(true);
      // Popola le celle
      tr.querySelector('.cell-id').textContent = f.id;
      tr.querySelector('.cell-filename').textContent = f.filename;
      const descEl = tr.querySelector('.cell-desc');
      descEl.textContent = f.description || '—';
      descEl.parentElement.title = f.description || ''; // Tooltip nativo
      tr.querySelector('.cell-user').textContent = f.user;
      tr.querySelector('.cell-type').textContent = f.type;
      tr.querySelector('.cell-size').textContent = fmtBytes(f.size);
      tr.querySelector('.cell-uploaded').textContent = fmtDate(f.uploadedAt);
      tr.querySelector('.cell-status').textContent = f.status;

      // Aggiunge listener per i bottoni d'azione
      tr.addEventListener('click', (ev) => onRowAction(ev, f));
      tbody.appendChild(tr);
    }
  }

  // ======= EVENTI =======
  // Gestisce i click sui bottoni di azione dentro ogni riga
  function onRowAction(ev, file) {
    const btn = ev.target.closest('button');
    if (!btn) return; // Se il click non è su un bottone, ignora

    const action = btn.dataset.action; // Legge l'azione dall'attributo data-action
    switch (action) {
      case 'preview':
        if (file.url) window.open(file.url, '_blank');
        break;
      case 'edit':
        openEdit(file);
        break;
      case 'replace':
        openReplace(file);
        break;
      case 'delete':
        if (confirm(`Eliminare definitivamente ${file.filename}?`))
          apiDelete(file.id)
            .then(() => {
              // Aggiorna stato locale ottimisticamente o ricarica
              state.files = state.files.filter(x => x.id !== file.id);
              render();
              toast('🗑 File eliminato');
            })
            .catch(e => alert(e.message));
        break;
    }
  }

  // Apre il modale di modifica
  function openEdit(file) {
    el('#editId').value = file.id;
    el('#editFilename').value = file.filename;
    el('#editDesc').value = file.description || '';
    el('#editStatus').value = file.status || 'attivo';
    el('#editDialog').showModal(); // API nativa dialog
  }

  // Apre il modale di sostituzione file
  function openReplace(file) {
    el('#replaceId').value = file.id;
    el('#replaceFile').value = '';
    el('#replaceDialog').showModal();
  }

  // Raccoglie i dati dal form di modifica
  function collectEdit() {
    return {
      id: el('#editId').value,
      filename: el('#editFilename').value.trim(),
      description: el('#editDesc').value.trim(),
      status: el('#editStatus').value
    };
  }

  // ======= STARTUP CODE ORIGINALMENTE IN DOMCONTENTLOADED =======
  // (Ora siamo già dentro DOMContentLoaded, quindi eseguiamo direttamente)

  // 1. Caricamento iniziale della lista file
  try {
    state.files = await apiList();
    render();
  } catch (e) {
    alert('Impossibile caricare l\'elenco: ' + e.message);
  }

  // 2. Setup Filtri & Ricerca (render al cambiamento)
  el('#searchInput').addEventListener('input', render);
  el('#statusFilter').addEventListener('change', render);
  el('#typeFilter').addEventListener('change', render);

  // 3. Bottone Ricarica manuale
  el('#refreshBtn').addEventListener('click', async () => {
    state.files = await apiList();
    toast('↻ Elenco aggiornato');
    render();
  });

  // 4. Selezione Multipla (Checkbox "Select All")
  el('#selectAll').addEventListener('change', (ev) => {
    const checked = ev.target.checked;
    document.querySelectorAll('.rowSelect').forEach(cb => cb.checked = checked);
  });

  // 5. Cancellazione di massa (Bulk Delete)
  el('#bulkDeleteBtn').addEventListener('click', async () => {
    const ids = [];
    // Raccoglie gli ID delle righe checkate
    document.querySelectorAll('#tbody tr').forEach(tr => {
      const cb = tr.querySelector('.rowSelect');
      if (cb.checked) { ids.push(tr.querySelector('.cell-id').textContent); }
    });

    if (!ids.length) { toast('Nessuna riga selezionata'); return; }
    if (!confirm(`Eliminare ${ids.length} file selezionati?`)) return;

    try {
      await apiBulkDelete(ids);
      // Rimuove i file eliminati dallo stato locale
      state.files = state.files.filter(f => !ids.includes(f.id));
      render();
      toast('🗑 Eliminazione completata');
    } catch (e) { alert(e.message); }
  });

  // 6. Salvataggio Modifiche (EDIT)
  el('#saveEditBtn').addEventListener('click', async (ev) => {
    ev.preventDefault();
    const data = collectEdit();
    try {
      await apiUpdate(data.id, { filename: data.filename, description: data.description, status: data.status });

      // Aggiorna l'elemento modificato nell'array locale
      const idx = state.files.findIndex(f => f.id === data.id);
      if (idx !== -1) {
        state.files[idx] = { ...state.files[idx], ...data };
        render(); // Rirenderizza per mostrare le modifiche
      }
      el('#editDialog').close();
      toast('✅ Modifiche salvate');
    } catch (e) { alert(e.message); }
  });

  // 7. Conferma Sostituzione (REPLACE)
  el('#confirmReplaceBtn').addEventListener('click', async (ev) => {
    ev.preventDefault();
    const id = el('#replaceId').value;
    const fileInput = el('#replaceFile');
    if (!fileInput.files.length) { alert('Seleziona un file.'); return; }
    try {
      await apiReplace(id, fileInput.files[0]);
      el('#replaceDialog').close();
      toast('⤴︎ File sostituito con successo');
    } catch (e) { alert(e.message); }
  });

  // ======= FUNZIONI HELPERS ADDIZIONALI (Inclusi nell scope) =======

  const editDialog = document.getElementById('editDialog');
  const editForm = document.getElementById('editForm');
  const saveEditBtn = document.getElementById('saveEditBtn');
  let currentEditingFile = null;

  // Gestione submit form edit (alternativa)
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (e.submitter && e.submitter.value === 'cancel') {
        editDialog.close();
        return;
      }

      const formData = new FormData(editForm);
      const payload = {
        filename: formData.get('filename'),
        description: formData.get('description'),
        status: formData.get('status')
      };

      try {
        saveEditBtn.disabled = true;
        saveEditBtn.textContent = 'Salvataggio...';

        // Chiama apiUpdate usando il filename o l'id corretto
        // Nota: currentEditingFile potrebbe non essere valorizzato se non si passa per openEditDialog
        // Ma nel codice originale c'erano due flussi. Questo è quello "alternativo".
        // Per sicurezza, se questo listener esiste, usiamo currentEditingFile se presente, altrimenti fallback.
        const targetId = currentEditingFile ? currentEditingFile.filename : collectEdit().id;

        await apiUpdate(targetId, payload);

        showToast('✓ File aggiornato con successo', 'success');
        editDialog.close();
      } catch (err) {
        console.error('Errore salvataggio:', err);
        showToast('✗ Errore durante il salvataggio', 'error');
      } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = 'Salva';
      }
    });
  }

  function showToast(message, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = message;
    t.className = type;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
  }

}); // Closes DOMContentLoaded wrapper

// ======= MOCK O ALTRE FUNZIONI GLOBALI RIMOSSE O SPOSTATE =======
