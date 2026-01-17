/**
 * Gestione della pagina "Chi Siamo" (About)
 * Questo script si occupa di piccole funzionalità interattive come:
 * 1. Aggiornamento dinamico dell'anno nel footer.
 * 2. Recupero del token CSRF per la sicurezza del modulo contatti.
 * 3. Validazione e invio del modulo di contatto tramite chiamata asincrona (AJAX).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Imposta l'anno corrente nel copyright del footer
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  // ---------------------------------------------------------
  // Gestione Sicurezza (CSRF)
  // ---------------------------------------------------------
  // Recupera un token CSRF aggiornato dal server se non è già presente.
  // Questo previene attacchi di tipo Cross-Site Request Forgery.
  const csrfEl = document.getElementById('contact-csrf');
  if (csrfEl && !csrfEl.value) {
    try {
      const r = await fetch('/api/csrf');
      if (r.ok) {
        const j = await r.json();
        if (j && j.csrfToken) csrfEl.value = j.csrfToken;
      }
    } catch (err) {
      console.error("Impossibile recuperare il token CSRF", err);
    }
  }

  // ---------------------------------------------------------
  // Gestione Modulo Contatti
  // ---------------------------------------------------------
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-status');

  // Semplice controllo validità email con regex
  const validEmail = (v) => /.+@.+\..+/.test(v);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Evita il ricaricamento della pagina standard

      // Raccoglie i dati dal form
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const subject = String(fd.get('subject') || '').trim();
      const message = String(fd.get('message') || '').trim();

      // Validazione lato client
      if (!name || !validEmail(email) || !subject || !message) {
        statusEl.textContent = 'Compila tutti i campi correttamente.';
        return;
      }

      // Invio dei dati al backend
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });

        // Gestione risposta del server
        if (res.ok) {
          statusEl.textContent = 'Messaggio inviato.';
          form.reset(); // Pulisce i campi
        } else {
          statusEl.textContent = 'Invio non riuscito.';
        }
      } catch (error) {
        statusEl.textContent = 'Errore di rete.';
      }
    });
  }
});
