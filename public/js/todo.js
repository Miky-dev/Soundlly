// public/js/todo.js — v2 API (per-utente, max 4, gating premium)
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#pane-todo .todo-app') || document.querySelector('.todo-app');
  if (!root) return;

  const $ = (sel, r = root) => r.querySelector(sel);

  const els = {
    today: $('#today'),
    input: $('#newTask'),
    add: $('#addBtn'),
    list: $('#list'),
    empty: $('#empty'),
    count: $('#count'),
    clearDone: $('#clearDone'),
  };

  const fmtDate = (d) => d.toLocaleDateString('it-IT', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  els.today && (els.today.textContent = fmtDate(new Date()));

  const LIMIT = 4;
  const SUBSCRIBE_URL = '/abbonamento'; // fallback

  function renderItems(items){
    els.list.innerHTML = '';
    els.empty.hidden = items.length !== 0;
    els.count.textContent = items.length;

    // disabilita aggiunta se raggiunto limite
    if (items.length >= LIMIT) {
      els.add.disabled = true;
      els.input.disabled = true;
      els.input.placeholder = `Limite massimo ${LIMIT} attività raggiunto`;
    } else {
      els.add.disabled = false;
      els.input.disabled = false;
      els.input.placeholder = 'Aggiungi una nuova attività e premi Invio…';
    }

    for (const it of items) {
      const li = document.createElement('li');
      li.className = 'item'; li.dataset.id = it.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.className = 'check';
      cb.checked = !!it.done; cb.setAttribute('aria-label','Completa');

      const title = document.createElement('div');
      title.className = 'title' + (it.done ? ' done' : '');
      title.textContent = it.text;
      title.contentEditable = 'true';
      title.spellcheck = false;
      title.role = 'textbox';
      title.ariaLabel = 'Modifica titolo attività';

      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.innerHTML = `
        <button class="icon-btn" title="Duplica" data-act="dup" aria-label="Duplica">📄</button>
        <button class="icon-btn danger" title="Elimina" data-act="del" aria-label="Elimina">🗑️</button>
      `;

      li.append(cb, title, actions);
      els.list.append(li);
    }
  }

  // Helper fetch con gestione 401/403
  async function api(path, opts = {}){
    const res = await fetch(path, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...opts
    });
    if (res.status === 401 || res.status === 403) {
      // redirect a pagina abbonamento
      const data = await res.json().catch(()=> ({}));
      window.location.href = (data.subscribe_url || SUBSCRIBE_URL);
      throw new Error('gated');
    }
    if (!res.ok) {
      const data = await res.json().catch(()=> ({}));
      const msg = data?.error || 'network_error';
      throw new Error(msg);
    }
    return res.json();
  }

  // Stato in RAM (arriva dal server)
  let items = [];

  async function loadAll(){
    const data = await api('/api/todos');
    items = Array.isArray(data.items) ? data.items : [];
    renderItems(items);
  }

  async function createItem(text){
    const data = await api('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    if (data.item) items.unshift(data.item);
    renderItems(items);
  }

  async function updateItem(id, patch){
    const data = await api(`/api/todos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    const idx = items.findIndex(x=>x.id===id);
    if (idx !== -1 && data.item) items[idx] = data.item;
    renderItems(items);
  }

  async function deleteItem(id){
    await api(`/api/todos/${encodeURIComponent(id)}`, { method: 'DELETE' });
    items = items.filter(x=>x.id!==id);
    renderItems(items);
  }

  // Eventi UI
  els.add.addEventListener('click', async () => {
    const t = (els.input.value || '').trim();
    if (!t) return;
    await createItem(t);
    els.input.value = '';
    els.input.focus();
  });

  els.input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const t = (els.input.value || '').trim();
      if (!t) return;
      await createItem(t);
      els.input.value = '';
    }
  });

  els.list.addEventListener('change', async (e) => {
    const id = e.target.closest('.item')?.dataset.id; if (!id) return;
    if (e.target.matches('.check')) {
      await updateItem(id, { done: !!e.target.checked });
    }
  });

  els.list.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = e.target.closest('.item')?.dataset.id; if (!id) return;

    if (btn.dataset.act === 'del') {
      await deleteItem(id);
    }
    if (btn.dataset.act === 'dup') {
      const src = items.find(x=>x.id===id);
      if (!src) return;
      await createItem(src.text + ' (copia)');
    }
  });

  // Edit in place (debounce)
  let editTimer = null;
  els.list.addEventListener('input', (e) => {
    const title = e.target.closest('.title'); if (!title) return;
    const id = e.target.closest('.item')?.dataset.id; if (!id) return;
    clearTimeout(editTimer);
    editTimer = setTimeout(async () => {
      const src = items.find(x=>x.id===id); if (!src) return;
      const newText = (title.textContent || '').trim() || src.text;
      if (newText !== src.text) await updateItem(id, { text: newText });
    }, 250);
  });

  // Pulsante: cancella tutte le completate (batch semplificato)
  els.clearDone.addEventListener('click', async () => {
    const doneIds = items.filter(x=>x.done).map(x=>x.id);
    for (const id of doneIds) { await deleteItem(id); }
  });

  // Avvio
  // Inizializza solo quando il pannello To-Do è visibile
function initIfVisible(){
  const pane = document.getElementById('pane-todo');
  if (!pane) return;
  if (pane.classList.contains('active')) {
    // già visibile: carico ora
    loadAll().catch(()=>{/* se gated, il redirect è già partito */});
    // mi disintegro questo listener: non serve più
    document.removeEventListener('prod:show-pane', onPaneEvent);
  }
}

function onPaneEvent(e){
  if (e?.detail?.pane === 'todo') {
    initIfVisible();
  }
}

// se il pannello è già visibile alla partenza (es. hai scelto 'todo' come default)
initIfVisible();

// altrimenti aspetto lo switch dell’utente
document.addEventListener('prod:show-pane', onPaneEvent);

});
