// public/js/auth.js

// Quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {

  // Classe di utilità per gestire i messaggi dell'interfaccia utente (UI)
  class UI {
    // Metodo statico per mostrare un messaggio in un elemento specifico
    static show(el, msg, type = 'error') {
      if (!el) return; // Se l'elemento non esiste, esce
      el.textContent = msg; // Imposta il testo del messaggio
      el.classList.remove('hidden'); // Rende visibile l'elemento
      el.classList.remove('ok', 'error', 'info'); // Rimuove eventuali classi di stato precedenti
      el.classList.add(type); // Aggiunge la classe per il nuovo stato (es. 'error')
    }

    // Metodo statico per nascondere un messaggio
    static hide(el) {
      if (!el) return;
      el.textContent = ''; // Pulisce il testo
      el.classList.add('hidden'); // Nasconde l'elemento
      el.classList.remove('ok', 'error', 'info'); // Pulisce le classi di stile
    }
  }

  // Legge i parametri dalla query string dell'URL (es. ?error=1)
  const params = new URLSearchParams(window.location.search);

  // ======= GESTIONE LOGIN =======
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('login-alert');

  // Se siamo nella pagina di login (il form esiste)
  if (loginForm) {
    // Controlla i parametri URL per mostrare eventuali errori o successi
    if (params.get('error') === '1') {
      UI.show(loginAlert, 'Credenziali non valide. Riprova.', 'error');
    }
    if (params.get('registered') === '1') {
      UI.show(loginAlert, 'Registrazione avvenuta! Ora effettua il login.', 'ok');
    }

    // Aggiunge listener per l'invio del form
    loginForm.addEventListener('submit', (e) => {
      UI.hide(loginAlert); // Nasconde alert precedenti
      const u = loginForm.username?.value?.trim();
      const p = loginForm.password?.value || '';

      // Validazione lato client: controlla se campi vuoti
      if (!u || !p) {
        e.preventDefault(); // Blocca l'invio del form
        UI.show(loginAlert, 'Inserisci username e password.', 'error');
      }
    });
  }

  // ======= GESTIONE REGISTRAZIONE =======
  const registerForm = document.getElementById('registerForm');
  const registerAlert = document.getElementById('register-alert');

  // Se siamo nella pagina di registrazione
  if (registerForm) {
    // Gestione messaggi di errore restituiti dal server via URL
    if (params.get('exists') === '1') {
      UI.show(registerAlert, 'Username già esistente. Scegline un altro.', 'error');
    }
    if (params.get('missing') === '1') {
      UI.show(registerAlert, 'Compila tutti i campi.', 'error');
    }
    if (params.get('error') === '1') {
      UI.show(registerAlert, 'Si è verificato un errore. Riprova.', 'error');
    }

    // Listener invio form
    registerForm.addEventListener('submit', (e) => {
      UI.hide(registerAlert);
      const u = registerForm.username?.value?.trim();
      const p = registerForm.password?.value || '';

      // Validazione campi vuoti
      if (!u || !p) {
        e.preventDefault();
        UI.show(registerAlert, 'Compila tutti i campi.', 'error');
        return;
      }

      // Validazione lunghezza password
      if (p.length < 6) {
        e.preventDefault();
        UI.show(registerAlert, 'La password deve avere almeno 6 caratteri.', 'error');
      }
    });
  }
});
