// public/js/session.js

/**
 * Gestione Sessione Utente (Frontend)
 * 
 * Questo script verifica se l'utente è loggato e aggiorna l'interfaccia di conseguenza.
 * 
 * Funzionalità:
 * 1. Chiamata API `/api/session` per ottenere lo stato dell'utente.
 * 2. Toggle visibilità elementi: Mostra/Nasconde pulsanti Login/Logout in base allo stato.
 * 3. Inserimento dati utente: Popola il nome utente dove necessario (es. Navbar).
 * 4. Gestione Logout: Chiama l'API di logout e reindirizza alla home.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // Classe di utilità per manipolare il DOM in base all'autenticazione
  class SessionUI {
    static apply(auth) {
      // Seleziona elementi che devono essere visibili SOLO se loggati (in) o sloggati (out)
      const elsIn = document.querySelectorAll('[data-auth="in"]');
      const elsOut = document.querySelectorAll('[data-auth="out"]');

      if (auth?.authenticated) {
        // Utente Loggato
        elsIn.forEach(el => el.classList.remove('hidden'));
        elsOut.forEach(el => el.classList.add('hidden'));

        // Inserisce il nome utente negli elementi predisposti
        document.querySelectorAll('[data-username]').forEach(el => el.textContent = auth.user?.username || '');
      } else {
        // Utente Ospite
        elsIn.forEach(el => el.classList.add('hidden'));
        elsOut.forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('[data-username]').forEach(el => el.textContent = '');
      }
    }
  }

  try {
    // 1. Verifica Sessione al caricamento pagina
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = await res.json();

    // 2. Aggiorna la UI
    SessionUI.apply(data);

    // 3. Gestione Click Logout
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Esegue il logout lato server
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        // Ricarica la pagina o va alla home
        window.location.href = '/';
      });
    }
  } catch (e) {
    console.error('Errore durante la verifica della sessione', e);
  }
});
