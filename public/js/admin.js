// ======= CONFIGURAZIONE =======
const CONFIG = {
  useMockData: false,  // Cambia da true a false
  apiBase: '/admin/api/files',
  csrfHeader: 'X-CSRF-Token',
  csrfToken: ''
};

// ======= STATO =======
const state = {
  files: [],
  filtered: [],
  selection: new Set()
};

// ======= UTIL =======
const el = sel => document.querySelector(sel);
const fmtBytes = n => {
  if (n < 1024) return n + ' B';
  const units = ['KB','MB','GB','TB'];
  let u = -1; do { n /= 1024; ++u; } while (n >= 1024 && u < units.length-1);
  return n.toFixed(1) + ' ' + units[u];
};
const fmtDate = iso => new Date(iso).toLocaleString();
const toast = (msg) => {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  el('#toast').appendChild(t);
  setTimeout(() => t.remove(), 2600);
};

// ======= API WRAPPER =======
async function apiList(){
  if (CONFIG.useMockData) return mockFetchList();
  const r = await fetch(CONFIG.apiBase, {headers:{[CONFIG.csrfHeader]: CONFIG.csrfToken}});
  if (!r.ok) throw new Error('Errore nel recupero elenco');
  return r.json();
}
async function apiUpdate(id, payload){
  if (CONFIG.useMockData) return mockUpdate(id, payload);
  const r = await fetch(`${CONFIG.apiBase}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      [CONFIG.csrfHeader]: CONFIG.csrfToken
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('Errore nell\'aggiornamento del file');
  return r.json();
}
async function apiReplace(id, file){
  if (CONFIG.useMockData){ toast('✅ (demo) File sostituito'); return; }
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`${CONFIG.apiBase}/${encodeURIComponent(id)}/replace`, {
    method:'POST', headers:{[CONFIG.csrfHeader]: CONFIG.csrfToken}, body: fd
  });
  if (!r.ok) throw new Error('Sostituzione non riuscita');
}
async function apiDelete(id){
  if (CONFIG.useMockData){ toast('🗑 (demo) File eliminato'); return; }
  const r = await fetch(`${CONFIG.apiBase}/${encodeURIComponent(id)}`, {method:'DELETE', headers:{[CONFIG.csrfHeader]: CONFIG.csrfToken}});
  if (!r.ok) throw new Error('Eliminazione non riuscita');
}
async function apiBulkDelete(ids){
  for (const id of ids) await apiDelete(id);
}

// ======= RENDER =======
function render(){
  const tbody = el('#tbody');
  tbody.innerHTML = '';

  const q = el('#searchInput').value.trim().toLowerCase();
  const s = el('#statusFilter').value;
  const t = el('#typeFilter').value;

  state.filtered = state.files.filter(f => {
    const matchesQ = !q || [f.id, f.filename, f.user, f.description].some(v => String(v || '').toLowerCase().includes(q));
    const matchesS = !s || f.status === s;
    const matchesT = !t || f.type === t;
    return matchesQ && matchesS && matchesT;
  });

  if (state.filtered.length === 0){
    el('#emptyState').hidden = false;
    return;
  }
  el('#emptyState').hidden = true;

  const tpl = el('#rowTemplate');
  for (const f of state.filtered){
    const tr = tpl.content.firstElementChild.cloneNode(true);
    tr.querySelector('.cell-id').textContent = f.id;
    tr.querySelector('.cell-filename').textContent = f.filename;
    const descEl = tr.querySelector('.cell-desc');
    descEl.textContent = f.description || '—';
    descEl.parentElement.title = f.description || '';
    tr.querySelector('.cell-user').textContent = f.user;
    tr.querySelector('.cell-type').textContent = f.type;
    tr.querySelector('.cell-size').textContent = fmtBytes(f.size);
    tr.querySelector('.cell-uploaded').textContent = fmtDate(f.uploadedAt);
    tr.querySelector('.cell-status').textContent = f.status;

    // Actions
    tr.addEventListener('click', (ev) => onRowAction(ev, f));
    tbody.appendChild(tr);
  }
}

// ======= EVENTI =======
function onRowAction(ev, file){
  const btn = ev.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  switch(action){
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
        apiDelete(file.id).then(() => { state.files = state.files.filter(x => x.id !== file.id); render(); toast('🗑 File eliminato'); })
        .catch(e => alert(e.message));
      break;
  }
}

function openEdit(file){
  el('#editId').value = file.id;
  el('#editFilename').value = file.filename;
  el('#editDesc').value = file.description || '';
  el('#editStatus').value = file.status || 'attivo';
  el('#editDialog').showModal();
}

function openReplace(file){
  el('#replaceId').value = file.id;
  el('#replaceFile').value = '';
  el('#replaceDialog').showModal();
}

function collectEdit(){
  return {
    id: el('#editId').value,
    filename: el('#editFilename').value.trim(),
    description: el('#editDesc').value.trim(),
    status: el('#editStatus').value
  };
}

// ======= BOOTSTRAP =======
document.addEventListener('DOMContentLoaded', async () => {
  // Carica lista
  try{
    state.files = await apiList();
    render();
  }catch(e){
    alert('Impossibile caricare l\'elenco: ' + e.message);
  }

  // Filtri & ricerca
  el('#searchInput').addEventListener('input', render);
  el('#statusFilter').addEventListener('change', render);
  el('#typeFilter').addEventListener('change', render);

  // Ricarica
  el('#refreshBtn').addEventListener('click', async () => {
    state.files = await apiList();
    toast('↻ Elenco aggiornato');
    render();
  });

  // Seleziona tutto + bulk delete
  el('#selectAll').addEventListener('change', (ev) => {
    const checked = ev.target.checked;
    document.querySelectorAll('.rowSelect').forEach(cb => cb.checked = checked);
  });
  el('#bulkDeleteBtn').addEventListener('click', async () => {
    const ids = [];
    document.querySelectorAll('#tbody tr').forEach(tr => {
      const cb = tr.querySelector('.rowSelect');
      if (cb.checked){ ids.push(tr.querySelector('.cell-id').textContent); }
    });
    if (!ids.length) { toast('Nessuna riga selezionata'); return; }
    if (!confirm(`Eliminare ${ids.length} file selezionati?`)) return;
    try {
      await apiBulkDelete(ids);
      state.files = state.files.filter(f => !ids.includes(f.id));
      render();
      toast('🗑 Eliminazione completata');
    } catch(e){ alert(e.message); }
  });

  // Salvataggio EDIT
  el('#saveEditBtn').addEventListener('click', async (ev) => {
    ev.preventDefault();
    const data = collectEdit();
    try{
      await apiUpdate(data.id, { filename:data.filename, description:data.description, status:data.status });
      // Aggiorna nel client
      const idx = state.files.findIndex(f => f.id === data.id);
      if (idx !== -1){
        state.files[idx] = { ...state.files[idx], ...data };
        render();
      }
      el('#editDialog').close();
      toast('✅ Modifiche salvate');
    }catch(e){ alert(e.message); }
  });

  // Conferma REPLACE
  el('#confirmReplaceBtn').addEventListener('click', async (ev) => {
    ev.preventDefault();
    const id = el('#replaceId').value;
    const fileInput = el('#replaceFile');
    if (!fileInput.files.length){ alert('Seleziona un file.'); return; }
    try{
      await apiReplace(id, fileInput.files[0]);
      el('#replaceDialog').close();
      toast('⤴︎ File sostituito con successo');
    }catch(e){ alert(e.message); }
  });
});

// Rimuovi o commenta la vecchia mockFetchList
/*
function mockFetchList(){
  return new Promise(res => setTimeout(() => res([...]), 300));
}
*/

// Nuova funzione che chiama l'API reale
async function fetchFileList() {
  try {
    const res = await fetch('/admin/api/files', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const files = await res.json();
    return files;
  } catch (err) {
    throw new Error('Impossibile recuperare l\'elenco file');    console.error('Errore nel recupero elenco file:', err);    console.error('Errore caricamento file:', err);
    alert('Impossibile caricare i file. Controlla la console.');
    return [];
  }
}

// ======= GESTIONE MODALE EDIT =======
const editDialog = document.getElementById('editDialog');
const editForm = document.getElementById('editForm');
const saveEditBtn = document.getElementById('saveEditBtn');

let currentEditingFile = null;

function openEditDialog(fileData) {
  currentEditingFile = fileData;
  
  document.getElementById('editId').value = fileData.filename; // Usiamo filename come ID
  document.getElementById('editFilename').value = fileData.filename;
  document.getElementById('editDesc').value = fileData.description || '';
  document.getElementById('editStatus').value = fileData.status || 'attivo';
  
  editDialog.showModal();
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (e.submitter.value === 'cancel') {
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
    
    await apiUpdate(currentEditingFile.filename, payload);
    
    // Aggiorna l'array locale
    const index = allFiles.findIndex(f => f.filename === currentEditingFile.filename);
    if (index !== -1) {
      allFiles[index] = { ...allFiles[index], ...payload };
    }
    
    applyFilter(currentFilter); // Riapplica il filtro corrente
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

// ======= GESTIONE AZIONI RIGA =======
function attachRowActions(row, fileData) {
  // Bottone Edit
  row.querySelector('[data-action="edit"]').addEventListener('click', () => {
    openEditDialog(fileData);
  });
  
  // ...existing code per altre azioni (delete, preview, replace)...
}

// ======= RENDERING TABELLA =======
function renderTable(files) {
  const tbody = document.getElementById('tbody');
  const emptyState = document.getElementById('emptyState');
  const template = document.getElementById('rowTemplate');
  
  tbody.innerHTML = '';
  
  if (!files.length) {
    emptyState.hidden = false;
    return;
  }
  
  emptyState.hidden = true;
  
  files.forEach(file => {
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector('tr');
    
    row.querySelector('.cell-id').textContent = file.filename;
    row.querySelector('.cell-filename').textContent = file.filename;
    row.querySelector('.cell-desc').textContent = file.description || 'Nessuna descrizione';
    row.querySelector('.cell-user').textContent = file.user || 'Sconosciuto';
    row.querySelector('.cell-type').textContent = file.category || 'audio';
    row.querySelector('.cell-size').textContent = formatBytes(file.size);
    row.querySelector('.cell-uploaded').textContent = formatDate(file.uploadedAt);
    row.querySelector('.cell-status').textContent = file.status;
    
    // Attach eventi
    attachRowActions(row, file);
    
    tbody.appendChild(clone);
  });
}

// ======= UTILITY =======
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = type;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
