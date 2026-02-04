/**
 * Qui gestisco tutto quello che succede nella pagina di login e registrazione.
 * Mi occupo di switchare tra i due form, validare i dati inseriti dall'utente
 * (come età, password, ecc.) e mostrare eventuali errori se qualcosa non va.
 */

class AuthManager {
  constructor() {
    // Funzione comoda per selezionare elementi senza scrivere ogni volta tutto
    this.$ = (sel) => document.querySelector(sel);

    // Qui mi salvo i riferimenti agli elementi del DOM che userò spesso
    this.els = {
      loginForm: this.$('#login-form'),
      registerForm: this.$('#register-form'),
      showRegisterBtn: this.$('#show-register'),
      backToLoginBtn: this.$('#back-to-login'),
      loginAlert: this.$('#login-alert'),
      registerError: this.$('#register-error'),
      formTitle: this.$('#form-title')
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkUrlParams();
  }

  // --- GESTIONE EVENTI ---
  // Qui collego i click dei pulsanti e l'invio dei form alle funzioni giuste
  bindEvents() {
    // Se premo su "Registrati", cambio vista
    if (this.els.showRegisterBtn) {
      this.els.showRegisterBtn.addEventListener('click', () => this.toggleView('register'));
    }

    // Se voglio tornare al Login
    if (this.els.backToLoginBtn) {
      this.els.backToLoginBtn.addEventListener('click', () => this.toggleView('login'));
    }

    // Quando provo a fare login
    if (this.els.loginForm) {
      this.els.loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
    }

    // Quando provo a registrarmi
    if (this.els.registerForm) {
      this.els.registerForm.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
    }
  }

  // --- INTERFACCIA UTENTE ---

  // Questa funzione gestisce lo switch visivo tra Login e Registrazione
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

  // Mostro un messaggio di feedback (errore o successo) all'utente
  showMessage(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.remove('ok', 'error', 'info');
    el.classList.add(type);
    el.style.display = 'block';
  }

  // Nascondo i messaggi quando non servono più
  hideMessage(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
    el.style.display = 'none';
  }

  // --- CONTROLLI INIZIALI ---

  // Controllo se nell'URL ci sono parametri di errore o conferma
  // (es. quando il server mi rimanda qui dopo un login fallito)
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

  // --- VALIDAZIONE ---

  // Controllo veloce prima di inviare il login
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

  // Controllo validità dati registrazione
  handleRegisterSubmit(e) {
    const form = this.els.registerForm;
    const errBox = this.els.registerError;

    // Resetto eventuali errori precedenti
    errBox.style.display = 'none';
    errBox.textContent = '';

    const email = form.elements['email']?.value?.trim();
    const pwd = form.elements['password']?.value;
    const birth = form.elements['birth_date']?.value;

    // 1. Controllo che l'email sia scritta bene
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      e.preventDefault();
      errBox.textContent = 'Inserisci un’email valida.';
      errBox.style.display = 'block';
      return;
    }

    // 2. La password non deve essere troppo corta
    if (!pwd || pwd.length < 6) {
      e.preventDefault();
      errBox.textContent = 'La password deve contenere almeno 6 caratteri.';
      errBox.style.display = 'block';
      return;
    }

    // 3. Controllo l'età (serve avere almeno 14 anni)
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

  // Calcolo l'età a partire dalla data di nascita
  calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    // Se non ho ancora compiuto gli anni quest'anno, tolgo 1
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

// Quando la pagina è pronta, avvio tutto
document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});
