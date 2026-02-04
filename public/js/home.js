document.addEventListener('DOMContentLoaded', () => {
    // Evito che la barra di ricerca nel footer ricarichi la pagina se premuta per sbaglio
    const searchForm = document.getElementById('footer-searchbar');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    // Gestione intelligente delle immagini: se un'immagine non si carica, uso quella di fallback
    const imagesWithFallback = document.querySelectorAll('img[data-fallback]');
    imagesWithFallback.forEach(img => {
        img.addEventListener('error', function () {
            // Cambio la sorgente solo se non sto già provando a caricare il fallback (per evitare loop infiniti)
            if (this.src !== this.dataset.fallback) {
                this.src = this.dataset.fallback;
            }
        });
    });

    // Imposto la larghezza delle barre (es. statistiche) dinamicamente usando variabili CSS.
    // Questo trucco aiuta anche a rendere il codice più pulito e gestibile dagli strumenti di stile.
    document.querySelectorAll('[data-width]').forEach(el => {
        el.style.setProperty('--bar-width', el.dataset.width + '%');
        el.style.width = 'var(--bar-width)';
    });
});
