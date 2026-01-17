/**
 * auth-login.js
 * 
 * Gestisce la logica di login e registrazione lato client.
 * Funzionalità:
 * 1. Switch tra Login e Registrazione.
 * 2. Gestione messaggi di errore (da URL o validazione).
 * 3. Caricamento token CSRF per la sicurezza.
 * 4. Validazione form (campi vuoti, password, età, email).
 */

class AuthManager {
  constructor() {
    // Alias breve per selezione elementi
    this.$ = (sel) => document.querySelector(sel);

    // Riferimenti agli elementi del DOM
    this.els = {
      loginForm: this.$('#login-form'),
      registerForm: this.$('#register-form'),
      showRegisterBtn: this.$('#show-register'),
      backToLoginBtn: this.$('#back-to-login'),
      loginAlert: this.$('#login-alert'),
      registerError: this.$('#register-error'),
      loginCsrf: this.$('#login-csrf'),
      registerCsrf: this.$('#register-csrf'),
      formTitle: this.$('#form-title')
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkUrlParams();
    this.loadCsrf();
  }

  // --- GESTIONE EVENTI (Click & Submit) ---
  bindEvents() {
    // Switch Login -> Registrazione
    if (this.els.showRegisterBtn) {
      this.els.showRegisterBtn.addEventListener('click', () => this.toggleView('register'));
    }

    // Switch Registrazione -> Login
    if (this.els.backToLoginBtn) {
      this.els.backToLoginBtn.addEventListener('click', () => this.toggleView('login'));
    }

    // Submit Form Login
    if (this.els.loginForm) {
      this.els.loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
    }

    // Submit Form Registrazione
    if (this.els.registerForm) {
      this.els.registerForm.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
    }
  }

  // --- LOGICA UI ---

  // Cambia vista tra login e registrazione
  toggleView(view) {
    if (view === 'register') {
      this.els.registerForm.style.display = 'block';
      this.els.loginForm.style.display = 'none';
      if (this.els.formTitle) this.els.formTitle.textContent = 'Registrazione';
      this.hideMessage(this.els.loginAlert);
    } else {
      this.els.registerForm.style.display = 'none';
      this.els.loginForm.style.display = 'block';
      if (this.els.formTitle) this.els.formTitle.textContent = 'Login';
      this.hideMessage(this.els.loginAlert);
    }
  }

  // Mostra messaggio di errore/successo
  showMessage(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.remove('ok', 'error', 'info');
    el.classList.add(type);
    el.style.display = 'block'; // Assicura visibilità
  }

  hideMessage(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
    el.style.display = 'none';
  }

  // --- CONTROLLI INIZIALI ---

  // Controlla parametri URL (es. ?error=1) per feedback server
  checkUrlParams() {
    const params = new URLSearchParams(location.search);

    if (params.get('error') === '1') {
      this.showMessage(this.els.loginAlert, 'Credenziali non valide. Riprova.', 'error');
    }
    if (params.get('registered') === '1') {
      this.showMessage(this.els.loginAlert, 'Registrazione completata! Ora effettua il login.', 'ok');
    }
    if (params.get('exists') === '1') {
      this.showMessage(this.els.loginAlert, 'Username già esistente. Scegline un altro.', 'error');
    }
  }

  // Carica token CSRF (Cross-Site Request Forgery) dal server
  async loadCsrf() {
    try {
      const res = await fetch('/api/csrf', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();

      // Inietta il token negli input hidden dei form
      if (data?.csrfToken) {
        const inputs = document.querySelectorAll('input[name="_csrf"]');
        inputs.forEach(inp => inp.value = data.csrfToken);
      }
    } catch (e) {
      console.error('Errore caricamento CSRF', e);
    }
  }

  // --- VALIDAZIONE ---

  handleLoginSubmit(e) {
    this.hideMessage(this.els.loginAlert);

    const form = this.els.loginForm;
    const u = form.elements['username']?.value?.trim();
    const p = form.elements['password']?.value;

    if (!u || !p) {
      e.preventDefault();
      this.showMessage(this.els.loginAlert, 'Inserisci username e password.', 'error');
    }
  }

  handleRegisterSubmit(e) {
    const form = this.els.registerForm;
    const errBox = this.els.registerError;

    // Reset errori
    errBox.style.display = 'none';
    errBox.textContent = '';

    const email = form.elements['email']?.value?.trim();
    const pwd = form.elements['password']?.value;
    const birth = form.elements['birth_date']?.value;

    // 1. Validazione Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      e.preventDefault();
      errBox.textContent = 'Inserisci un’email valida.';
      errBox.style.display = 'block';
      return;
    }

    // 2. Validazione Password (>6 caratteri)
    if (!pwd || pwd.length < 6) {
      e.preventDefault();
      errBox.textContent = 'La password deve contenere almeno 6 caratteri.';
      errBox.style.display = 'block';
      return;
    }

    // 3. Validazione Età (Minimo 14 anni)
    const bd = birth ? new Date(birth) : null;
    if (!bd || isNaN(bd.getTime())) {
      e.preventDefault();
      errBox.textContent = 'Inserisci una data di nascita valida.';
      errBox.style.display = 'block';
      return;
    }

    if (this.calculateAge(bd) < 14) {
      e.preventDefault();
      errBox.textContent = 'Spiacenti, devi avere almeno 14 anni per registrarti.';
      errBox.style.display = 'block';
      return;
    }
  }

  calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

// Inizializzazione al caricamento del documento
document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});
