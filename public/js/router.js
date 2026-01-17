/**
 * router.js
 * 
 * Gestione Routing Lato Client tramite page.js (Requisito Tecnico).
 * 
 * Questo script intercetta la navigazione e permette di caricare contenuti dinamicamente
 * senza ricaricare l'intera pagina (SPA behavior) per sezioni specifiche.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Definiamo dove renderizzare i contenuti dinamici (assicurati che esista in home.ejs)
  const contentDiv = document.getElementById('main-content');

  // Configura page.js
  page.base(''); // Base path (root)

  // ROUTE: / (Home Defaults)
  // In questo caso, lasciamo che sia il server a servire la home inizialmente,
  // ma page.js può intercettare click successivi se configurato.
  page('/', () => {
    console.log('[Router] Home route active');
  });

  // ROUTE: /app/creators (Esempio di SPA Route)
  // Carica dinamicamente la lista dei suoni "Creators" tramite fetch API
  page('/app/creators', showCreators);

  // Avvia il router
  page();

  function showCreators() {
    if (!contentDiv) return;

    console.log('[Router] Loading Creators View via Fetch...');
    contentDiv.innerHTML = '<div class="text-white p-5">Caricamento contenuti community... <i class="fa-solid fa-spinner fa-spin"></i></div>';

    // Fetch dati reali dall'API che abbiamo documentato (routes/music.js)
    fetch('/api/music/creators')
      .then(res => res.json())
      .then(sounds => {
        let html = `
                    <div class="box full-width" style="grid-column: span 12;">
                        <h2 class="text-white mb-4"><i class="fa-solid fa-users"></i> Community Creations</h2>
                        <div class="row g-4">
                `;

        if (sounds.length === 0) {
          html += `<p class="text-white-50">Nessun contenuto trovato.</p>`;
        } else {
          sounds.forEach(sound => {
            html += `
                            <div class="col-md-3">
                                <div class="card bg-dark text-white border-secondary h-100">
                                    <div class="card-body">
                                        <h5 class="card-title text-truncate">${sound.title}</h5>
                                        <h6 class="card-subtitle mb-2 text-muted">by ${sound.author || 'Unknown'}</h6>
                                        <p class="card-text small">${sound.description || ''}</p>
                                        <button class="btn btn-sm btn-primary play-btn" data-file="/audio/ambient/${sound.filename}">
                                            <i class="fa-solid fa-play"></i> Ascolta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
          });
        }
        html += `</div>
                         <div class="mt-4">
                            <a href="/" class="btn btn-outline-light">Torna alla Dashboard</a>
                         </div>
                         </div>`;

        contentDiv.innerHTML = html;
      })
      .catch(err => {
        console.error('[Router] Error:', err);
        contentDiv.innerHTML = '<div class="text-danger p-5">Errore caricamento dati.</div>';
      });
  }
});
