/**
 * music-search.js
 * 
 * Gestisce la logica di ricerca musicale, il caricamento delle sezioni (Ultime Uscite, Premium, Preferiti)
 * e la creazione delle card musicali con funzionalità di riproduzione e gestione preferiti.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- GESTIONE SESSIONE UTENTE ---
    let currentUser = null;

    async function checkSession() {
        try {
            const res = await fetch('/api/session');
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    currentUser = data.user;
                }
            }
        } catch (e) {
            console.error('Session check failed', e);
        }
    }

    // --- CARICAMENTO INIZIALE DELLE SEZIONI ---
    // Eseguiamo prima il controllo sessione, poi carichiamo tutto
    checkSession().then(() => {
        loadLatestMusic();      // Carica i brani più recenti
        loadPremium();          // Carica i brani premium
        loadCreatorSounds();    // Carica i suoni caricati dai creator
        loadFavorites();        // Carica i brani preferiti dall'utente
    });

    // --- RIFERIMENTI AGLI ELEMENTI DOM ---
    const searchForm = document.getElementById('footer-searchbar'); // Form della barra di ricerca nel footer
    const searchInput = searchForm.querySelector('input');          // Input di testo per la ricerca
    const resultsSection = document.getElementById('search-results-section'); // Sezione nascosta dei risultati
    const resultsContainer = resultsSection.querySelector('.horizontal');     // Contenitore scrollabile per le card dei risultati

    /**
     * Helper Function: Debounce
     * Limita la frequenza di esecuzione di una funzione.
     * Utile per la ricerca istantanea per evitare chiamate API ad ogni tasto premuto.
     * 
     * @param {Function} func - La funzione da eseguire
     * @param {number} wait - Tempo di attesa in millisecondi
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- GESTIONE RICERCA ISTANTANEA ---
    // Ascolta l'input dell'utente con un ritardo di 300ms (debounce)
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();

        // Se l'input è vuoto, nascondi la sezione risultati e pulisci
        if (!query) {
            resultsSection.hidden = true;
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            // Esegue la chiamata API di ricerca
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Search failed');

            const results = await res.json();
            displayResults(results); // Mostra i risultati
        } catch (err) {
            console.error(err);
        }
    }, 300));

    // Previene il refresh della pagina al submit del form (es. premendo Invio)
    searchForm.addEventListener('submit', (e) => e.preventDefault());

    /**
     * Mostra i risultati della ricerca nel DOM.
     * @param {Array} items - Array di oggetti brano/suono restituiti dall'API
     */
    function displayResults(items) {
        resultsContainer.innerHTML = ''; // Pulisce i risultati precedenti
        resultsSection.hidden = false;   // Rende visibile la sezione risultati

        // Se non ci sono risultati, mostra un messaggio
        if (items.length === 0) {
            resultsContainer.innerHTML = '<p style="color:white; padding:1rem;">Nessun risultato trovato.</p>';
            return;
        }

        // Crea e aggiunge una card per ogni risultato
        items.forEach(item => {
            const card = createCard(item);
            resultsContainer.appendChild(card);
        });
    }

    // --- FUNZIONI DI CARICAMENTO SEZIONI ---

    /** Carica la sezione "Ultime Uscite" */
    async function loadLatestMusic() {
        await loadSection('/api/music/latest', '.horizontal[data-grid="latest"]', 'Nessuna novità.');
    }

    /** Carica la sezione "Solo Premium" */
    async function loadPremium() {
        await loadSection('/api/music/premium', '.horizontal[data-grid="search-premium"]', 'Nessun contenuto premium.');
    }

    /** Carica la sezione "Suoni dei Creatori" */
    async function loadCreatorSounds() {
        await loadSection('/api/music/creators', '.horizontal[data-grid="suoni"]', 'Nessun suono dai creatori.');
    }

    /** Carica la sezione "Preferiti" */
    async function loadFavorites() {
        await loadSection('/api/music/favorites', '.horizontal[data-grid="pref"]', 'Nessun preferito.');
    }

    /**
     * Funzione generica per caricare una sezione di contenuti musicali.
     * Fa una fetch all'URL specificato e popola il contenitore indicato.
     * 
     * @param {string} url - Endpoint API da chiamare
     * @param {string} selector - Selettore CSS del contenitore
     * @param {string} emptyMsg - Messaggio da mostrare se non ci sono elementi
     */
    async function loadSection(url, selector, emptyMsg) {
        const container = document.querySelector(selector);
        if (!container) return; // Se il contenitore non esiste nella pagina, esci

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            const items = await res.json();

            // Gestione caso vuoto
            if (items.length === 0) {
                container.innerHTML = `<p style="color:white; padding:1rem;">${emptyMsg}</p>`;
                return;
            }

            container.innerHTML = '';
            // Popola il contenitore con le card
            items.forEach(item => {
                const card = createCard(item);
                container.appendChild(card);
            });

        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Crea l'elemento DOM (Card) per un singolo brano o suono.
     * Gestisce l'aspetto visivo, l'overlay con i pulsanti Play/Preferiti e la logica associata.
     * 
     * @param {Object} item - Oggetto dati del brano (id, title, author, icon, is_liked, etc.)
     * @returns {HTMLElement} - L'elemento div della card completo
     */
    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';

        // Determina l'immagine di sfondo:
        // Usa `item.icon` se è un URL valido, altrimenti usa un placeholder di default.
        const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/usericon.png';

        // Imposta lo sfondo con un gradiente scuro sovrapposto per leggibilità
        card.style.background = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.2)), url('${bgUrl}') center/cover no-repeat`;

        // Event listener per il click sull'intera card (opzionale, per logiche future)
        card.onclick = () => {
            console.log('Clicked:', item.title);
        };

        // Verifica se l'utente è loggato (variabile caricata via API checkSession)
        const isLoggedIn = (currentUser !== null);

        // --- COSTRUZIONE OVERLAY (Pulsanti Play/Like) ---
        let overlayHtml = '';
        if (isLoggedIn) {
            // Utente Loggato: Mostra sia Play che Cuore (Preferiti)
            // L'icona del cuore cambia stato in base a `item.is_liked`
            overlayHtml = `
            <div class="card-overlay">
                <button class="btn-play-overlay" title="Play">
                    <i class="fa-solid fa-play"></i>
                </button>
                <button class="btn-fav-overlay" title="${item.is_liked ? 'Rimuovi dai Preferiti' : 'Aggiungi ai Preferiti'}">
                    <i class="${item.is_liked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>`;
        } else {
            // Ospite: Mostra solo il pulsante Play (niente preferiti)
            overlayHtml = `
            <div class="card-overlay">
                <button class="btn-play-overlay" title="Play">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>`;
        }

        // Aggiunge un data-attribute per identificare facilmente tutte le card dello stesso brano
        // (utile per sincronizzare lo stato dei preferiti tra diverse sezioni)
        card.dataset.soundId = item.id;

        // Inserisce l'HTML nella card
        card.innerHTML = `
            ${overlayHtml}
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-author">${item.author || 'Sconosciuto'}</div>
            </div>
        `;

        // --- LOGICA PULSANTE PLAY ---
        const playBtn = card.querySelector('.btn-play-overlay');
        if (playBtn) {
            playBtn.onclick = (e) => {
                e.stopPropagation(); // Evita di attivare il click della card genitore

                // Chiama il player musicale globale (definito altrove, vedi `js/loadSounds.js` o simile)
                if (typeof musicPlayer !== 'undefined') {
                    musicPlayer.playTrack(item);
                } else {
                    console.error('Music Player not loaded');
                }
            };
        }

        // --- LOGICA PULSANTE PREFERITI ---
        const favBtn = card.querySelector('.btn-fav-overlay');
        if (favBtn) {
            favBtn.onclick = async (e) => {
                e.stopPropagation(); // Evita click card

                try {
                    // Chiamata API per attivare/disattivare il preferito
                    const res = await fetch(`/api/music/favorites/${item.id}/toggle`, { method: 'POST' });
                    if (!res.ok) throw new Error('Toggle failed');
                    const data = await res.json();

                    // --- SINCRONIZZAZIONE UI GLOBALE ---
                    // Trova TUTTE le card che rappresentano questo stesso brano nella pagina
                    // (es. potrebbe essere sia in "Ultime Uscite" che in "Risultati Ricerca")
                    const allCardsToCheck = document.querySelectorAll(`.card[data-sound-id="${item.id}"]`);

                    allCardsToCheck.forEach(c => {
                        const btn = c.querySelector('.btn-fav-overlay');
                        const icon = btn ? btn.querySelector('i') : null;
                        if (btn && icon) {
                            // Aggiorna icone e tooltip in base al nuovo stato
                            if (data.liked) {
                                icon.classList.remove('fa-regular');
                                icon.classList.add('fa-solid'); // Cuore pieno
                                btn.title = 'Rimuovi dai Preferiti';
                            } else {
                                icon.classList.remove('fa-solid');
                                icon.classList.add('fa-regular'); // Cuore vuoto
                                btn.title = 'Aggiungi ai Preferiti';
                            }
                        }
                    });

                    // --- GESTIONE SPECIALE SEZIONE PREFERITI ---
                    // Se siamo dentro la sezione "Preferiti", rimuoviamo la card se è stata "un-liked".
                    const parentGrid = card.closest('.horizontal');
                    const isInsideFavorites = parentGrid && parentGrid.dataset.grid === 'pref';

                    if (!data.liked && isInsideFavorites) {
                        // Rimosso dai preferiti -> Rimuovi card dal DOM immediatamente
                        card.remove();
                        // Se la lista diventa vuota, mostra messaggio placeholder
                        if (parentGrid.children.length === 0) {
                            parentGrid.innerHTML = '<p style="color:white; padding:1rem;">Nessun preferito.</p>';
                        }
                    } else {
                        // Se è stato aggiunto (da ovunque) o rimosso (da fuori la sezione preferiti),
                        // ricarichiamo l'intera lista preferiti per mantenerla aggiornata e ordinata.
                        const favGrid = document.querySelector('.horizontal[data-grid="pref"]');
                        if (favGrid) {
                            loadFavorites();
                        }
                    }

                } catch (err) {
                    console.error('Fav toggle error', err);
                    alert('Errore nel salvataggio del preferito');
                }
            };
        }

        return card;
    }
});
