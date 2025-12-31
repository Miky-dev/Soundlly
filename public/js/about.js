document.addEventListener('DOMContentLoaded', async () => {
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  const csrfEl = document.getElementById('contact-csrf');
  if (csrfEl && !csrfEl.value) {
    try {
      const r = await fetch('/api/csrf');
      if (r.ok) {
        const j = await r.json();
        if (j && j.csrfToken) csrfEl.value = j.csrfToken;
      }
    } catch {}
  }

  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-status');
  const validEmail = (v) => /.+@.+\..+/.test(v);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const subject = String(fd.get('subject') || '').trim();
      const message = String(fd.get('message') || '').trim();

      if (!name || !validEmail(email) || !subject || !message) {
        statusEl.textContent = 'Compila tutti i campi correttamente.';
        return;
      }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });
        if (res.ok) {
          statusEl.textContent = 'Messaggio inviato.';
          form.reset();
        } else {
          statusEl.textContent = 'Invio non riuscito.';
        }
      } catch {
        statusEl.textContent = 'Errore di rete.';
      }
    });
  }
});
