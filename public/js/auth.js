// public/js/auth.js
class UI {
  static show(el, msg, type = 'error') {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.remove('ok', 'error', 'info');
    el.classList.add(type);
  }
  static hide(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
    el.classList.remove('ok', 'error', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  // LOGIN
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('login-alert');
  if (loginForm) {
    if (params.get('error') === '1') {
      UI.show(loginAlert, 'Credenziali non valide. Riprova.', 'error');
    }
    if (params.get('registered') === '1') {
      UI.show(loginAlert, 'Registrazione avvenuta! Ora effettua il login.', 'ok');
    }
    loginForm.addEventListener('submit', (e) => {
      UI.hide(loginAlert);
      const u = loginForm.username?.value?.trim();
      const p = loginForm.password?.value || '';
      if (!u || !p) {
        e.preventDefault();
        UI.show(loginAlert, 'Inserisci username e password.', 'error');
      }
    });
  }

  // REGISTER
  const registerForm = document.getElementById('registerForm');
  const registerAlert = document.getElementById('register-alert');
  if (registerForm) {
    if (params.get('exists') === '1') {
      UI.show(registerAlert, 'Username già esistente. Scegline un altro.', 'error');
    }
    if (params.get('missing') === '1') {
      UI.show(registerAlert, 'Compila tutti i campi.', 'error');
    }
    if (params.get('error') === '1') {
      UI.show(registerAlert, 'Si è verificato un errore. Riprova.', 'error');
    }
    registerForm.addEventListener('submit', (e) => {
      UI.hide(registerAlert);
      const u = registerForm.username?.value?.trim();
      const p = registerForm.password?.value || '';
      if (!u || !p) {
        e.preventDefault();
        UI.show(registerAlert, 'Compila tutti i campi.', 'error');
        return;
      }
      if (p.length < 6) {
        e.preventDefault();
        UI.show(registerAlert, 'La password deve avere almeno 6 caratteri.', 'error');
      }
    });
  }
});
