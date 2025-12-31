// public/js/auth-login.js
(function () {
  const $ = (sel) => document.querySelector(sel);

  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const showRegisterBtn = $('#show-register');
  const backToLoginBtn = $('#back-to-login');
  const loginAlert = $('#login-alert');
  const loginCsrf = $('#login-csrf');
  const registerCsrf = $('#register-csrf');

  function show(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.remove('ok', 'error', 'info');
    el.classList.add(type);
  }
  function hide(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
    el.classList.remove('ok', 'error', 'info');
  }

  // Toggle forms
  showRegisterBtn?.addEventListener('click', () => {
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    $('#form-title').textContent = 'Registrazione';
  });
  backToLoginBtn?.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    $('#form-title').textContent = 'Login';
    hide(loginAlert);
  });

  // Messaggi da querystring
  const params = new URLSearchParams(location.search);
  if (params.get('error') === '1') {
    show(loginAlert, 'Credenziali non valide. Riprova.', 'error');
  }
  if (params.get('registered') === '1') {
    show(loginAlert, 'Registrazione completata! Ora effettua il login.', 'ok');
  }
  if (params.get('exists') === '1') {
    // se torniamo su /register.html useremmo un alert lì; qui indichiamo l'errore base
    show(loginAlert, 'Username già esistente. Scegline un altro.', 'error');
  }

  // Carica CSRF e inserisci nei form
  async function loadCsrf() {
    try {
      const res = await fetch('/api/csrf', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.csrfToken) {
        if (loginCsrf) loginCsrf.value = data.csrfToken;
        if (registerCsrf) registerCsrf.value = data.csrfToken;
      }
    } catch (e) {
      console.error('CSRF load error', e);
    }
  }
  loadCsrf();

  // Validazioni minime lato client (non sostituiscono quelle server)
  loginForm?.addEventListener('submit', (e) => {
    hide(loginAlert);
    const u = loginForm.username?.value?.trim();
    const p = loginForm.password?.value || '';
    if (!u || !p) {
      e.preventDefault();
      show(loginAlert, 'Inserisci username e password.', 'error');
    }
  });

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



  document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorBox = document.getElementById('register-error');

  function calcAge(d) {
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }

  form?.addEventListener('submit', (e) => {
    if (!form) return;
    errorBox.style.display = 'none';
    errorBox.textContent = '';

    const birthVal = form.elements['birth_date']?.value || '';
    const emailVal = form.elements['email']?.value || '';
    const pwdVal = form.elements['password']?.value || '';

    // Email semplice
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    if (!emailOk) {
      e.preventDefault();
      errorBox.textContent = 'Inserisci un’email valida.';
      errorBox.style.display = 'block';
      return;
    }

    // Password min 6
    if (!pwdVal || String(pwdVal).length < 6) {
      e.preventDefault();
      errorBox.textContent = 'La password deve contenere almeno 6 caratteri.';
      errorBox.style.display = 'block';
      return;
    }

    // Età ≥ 14
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
