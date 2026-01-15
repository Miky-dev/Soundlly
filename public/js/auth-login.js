// public/js/auth-login.js
// Funzione auto-invocante (IIFE) per incapsulare lo scope e non inquinare quello globale
(function () {
  // Alias breve per document.querySelector
  const $ = (sel) => document.querySelector(sel);

  // Selezione elementi del DOM (form, bottoni, alert)
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const showRegisterBtn = $('#show-register');
  const backToLoginBtn = $('#back-to-login');
  const loginAlert = $('#login-alert');
  const loginCsrf = $('#login-csrf');
  const registerCsrf = $('#register-csrf');

  // Funzione per mostrare messaggi di errore/successo
  function show(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden'); // Mostra
    el.classList.remove('ok', 'error', 'info'); // Reset classi
    el.classList.add(type); // Assegna tipo
  }

  // Funzione per nascondere i messaggi
  function hide(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden'); // Nasconde
    el.classList.remove('ok', 'error', 'info');
  }

  // ======= VISUALIZZAZIONE FORM =======
  // Gestisce il cambio tra Login e Registrazione se i bottoni esistono
  showRegisterBtn?.addEventListener('click', () => {
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    $('#form-title').textContent = 'Registrazione';
  });

  backToLoginBtn?.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    $('#form-title').textContent = 'Login';
    hide(loginAlert); // Pulisce eventuali errori precedenti
  });

  // ======= GESTIONE QUERYSTRING =======
  // Controlla parametri URL per messaggi di stato dal server
  const params = new URLSearchParams(location.search);
  if (params.get('error') === '1') {
    show(loginAlert, 'Credenziali non valide. Riprova.', 'error');
  }
  if (params.get('registered') === '1') {
    show(loginAlert, 'Registrazione completata! Ora effettua il login.', 'ok');
  }
  if (params.get('exists') === '1') {
    // Errore generico di esistenza utente
    show(loginAlert, 'Username già esistente. Scegline un altro.', 'error');
  }

  // ======= SICUREZZA (CSRF) =======
  // Recupera il token CSRF dal server e lo inietta nei form nascosti
  async function loadCsrf() {
    try {
      const res = await fetch('/api/csrf', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      // Se riceviamo un token, lo inseriamo nei campi input hidden
      if (data?.csrfToken) {
        if (loginCsrf) loginCsrf.value = data.csrfToken;
        if (registerCsrf) registerCsrf.value = data.csrfToken;
      }
    } catch (e) {
      console.error('CSRF load error', e);
    }
  }
  loadCsrf(); // Avvia caricamento token

  // ======= VALIDAZIONE LOGIN =======
  loginForm?.addEventListener('submit', (e) => {
    hide(loginAlert);
    // safe access ai campi
    const u = loginForm.username?.value?.trim();
    const p = loginForm.password?.value || '';

    // Controllo campi vuoti
    if (!u || !p) {
      e.preventDefault();
      show(loginAlert, 'Inserisci username e password.', 'error');
    }
  });

  // ======= VALIDAZIONE BASE REGISTRAZIONE (FORM 1) =======
  // Questa parte sembra gestire un form di registrazione generico o parziale
  registerForm?.addEventListener('submit', (e) => {
    hide(loginAlert);
    const u = registerForm.username?.value?.trim();
    const p = registerForm.password?.value || '';

    if (!u || !p) {
      e.preventDefault();
      show(loginAlert, 'Compila tutti i campi.', 'error');
      return;
    }
    if (p.length < 6) {
      e.preventDefault();
      show(loginAlert, 'La password deve avere almeno 6 caratteri.', 'error');
    }
  });


  // ======= VALIDAZIONE ESTESA REGISTRAZIONE =======
  // Listener addizionale per validazioni più complesse (data nascita, email)
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorBox = document.getElementById('register-error');

    // Calcola età da data di nascita
    function calcAge(d) {
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      // Aggiusta se compleanno non ancora passato quest'anno
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      return age;
    }

    form?.addEventListener('submit', (e) => {
      if (!form) return;
      // Reset errori
      errorBox.style.display = 'none';
      errorBox.textContent = '';

      const birthVal = form.elements['birth_date']?.value || '';
      const emailVal = form.elements['email']?.value || '';
      const pwdVal = form.elements['password']?.value || '';

      // Regex validazione Email semplice
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      if (!emailOk) {
        e.preventDefault();
        errorBox.textContent = 'Inserisci un’email valida.';
        errorBox.style.display = 'block';
        return;
      }

      // Password min 6 caratteri
      if (!pwdVal || String(pwdVal).length < 6) {
        e.preventDefault();
        errorBox.textContent = 'La password deve contenere almeno 6 caratteri.';
        errorBox.style.display = 'block';
        return;
      }

      // Validazione Età ≥ 14
      const bd = birthVal ? new Date(birthVal) : null;
      if (!bd || isNaN(bd)) {
        e.preventDefault();
        errorBox.textContent = 'Inserisci una data di nascita valida.';
        errorBox.style.display = 'block';
        return;
      }
      if (calcAge(bd) < 14) {
        e.preventDefault();
        errorBox.textContent = 'Spiacenti, devi avere almeno 14 anni per registrarti.';
        errorBox.style.display = 'block';
        return;
      }
    });
  });
})();
