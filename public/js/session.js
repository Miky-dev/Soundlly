// public/js/session.js

document.addEventListener('DOMContentLoaded', async () => {
  class SessionUI {
    static apply(auth) {
      const elsIn = document.querySelectorAll('[data-auth="in"]');
      const elsOut = document.querySelectorAll('[data-auth="out"]');
      if (auth?.authenticated) {
        elsIn.forEach(el => el.classList.remove('hidden'));
        elsOut.forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('[data-username]').forEach(el => el.textContent = auth.user?.username || '');
      } else {
        elsIn.forEach(el => el.classList.add('hidden'));
        elsOut.forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('[data-username]').forEach(el => el.textContent = '');
      }
    }
  }

  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = await res.json();
    SessionUI.apply(data);

    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/';
      });
    }
  } catch (e) {
    console.error('Errore lettura sessione', e);
  }
});
