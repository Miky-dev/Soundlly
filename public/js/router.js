// public/js/router.js
document.addEventListener('DOMContentLoaded', () => {
  const service = new SoundService();

  page('/', async () => {
    // puoi caricare dinamicamente la lista su home (se hai un container #content)
    const container = document.getElementById('main-content');
    if (!container) return;
    container.innerHTML = '<p>Caricamento...</p>';
    try {
      const sounds = await service.list();
      container.innerHTML = '<ul>' + sounds.map(s => `<li>${s.title} — ${s.owner || 'anonimo'}</li>`).join('') + '</ul>';
    } catch (e) {
      container.innerHTML = `<p>Errore: ${e.message}</p>`;
    }
  });

  // avvia router client-side
  page();
});
