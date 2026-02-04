/**
 * Questo file gestisce la navigazione "lato client" (SPA - Single Page Application).
 * In pratica, usa la libreria 'page.js' per intercettare i click sui link e cambiare
 * il contenuto della pagina senza doverla ricaricare da zero ogni volta.
 * È un requisito tecnico del progetto per rendere la navigazione fluida.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Questo è il contenitore principale dove andrò a iniettare le nuove schermate
  // (Mi assicuro che esista nel file home.ejs)
  const contentDiv = document.getElementById('main-content');

  // Configuro page.js dicendogli che siamo nella root del sito
  page.base('');

  // --- DEFINIZIONE ROTTE ---

  // Rotta Home ('/')
  // Qui non faccio nulla di particolare perché la home viene già servita completa dal server.
  // Lascio comunque il log per debug.
  page('/', () => {
    console.log('[Router] Sono in Home');
  });

  // Rotta Creators ('/app/creators')
  // Quando l'utente va su questa pagina, invece di chiedere al server una nuova pagina HTML,
  // scarico solo i dati JSON e costruisco l'interfaccia al volo qui nel browser.
  page('/app/creators', showCreators);

  // Faccio partire il router
  page();


  // --- FUNZIONI DI RENDER ---

  function showCreators() {
    if (!contentDiv) return;

    console.log('[Router] Carico la vista Creators...');

    // Mostro un loader intanto che aspetto i dati
    contentDiv.innerHTML = '<div class="text-white p-5">Caricamento contenuti community... <i class="fa-solid fa-spinner fa-spin"></i></div>';

    // Chiedo i dati all'API del server
    fetch('/api/music/creators')
      .then(res => res.json())
      .then(sounds => {
        // Costruisco l'HTML della pagina pezzo per pezzo
        let html = `
                    <div class="box full-width" style="grid-column: span 12;">
                        <h2 class="text-white mb-4"><i class="fa-solid fa-users"></i> Community Creations</h2>
                        <div class="row g-4">
                `;

        if (sounds.length === 0) {
          html += `<p class="text-white-50">Nessun contenuto trovato.</p>`;
        } else {
          // Creo una card per ogni suono ricevuto
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
        // Chiudo i div aperti e aggiungo il tasto per tornare indietro
        html += `</div>
                         <div class="mt-4">
                            <a href="/" class="btn btn-outline-light">Torna alla Dashboard</a>
                         </div>
                         </div>`;

        // Inietto tutto l'HTML generato nella pagina
        contentDiv.innerHTML = html;
      })
      .catch(err => {
        console.error('[Router] Errore:', err);
        contentDiv.innerHTML = '<div class="text-danger p-5">Impossibile caricare i dati. Riprova più tardi.</div>';
      });
  }
});
