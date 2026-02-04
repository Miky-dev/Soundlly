/**
 * music-search.js
 * 
 * Si occupa di caricare tutte le sezioni musicali (Novità, Premium, Community, ...),
 * gestire la barra di ricerca in tempo reale e generare le "card" dei brani
 * con i relativi pulsanti di play e 'mi piace'.
 */

class MusicManager {
    constructor() {
        this.currentUser = null;

        // Mi salvo i riferimenti agli elementi della pagina che dovrò modificare
        this.els = {
            searchForm: document.getElementById('footer-searchbar'),
            searchInput: document.querySelector('#footer-searchbar input'),
            resultsSection: document.getElementById('search-results-section'),
            resultsContainer: document.querySelector('#search-results-section .horizontal')
        };

        this.init();
    }

    async init() {
        // Prima di tutto controllo chi è l'utente (mi serve capire se è loggato per i like)
        await this.checkSession();

        // Carico i contenuti delle varie strisce orizzontali
        this.loadAllSections();

        // Attivo l'ascolto sulla barra di ricerca
        this.bindSearchEvents();
    }

    // --- GESTIONE SESSIONE ---
    async checkSession() {
        try {
            const res = await fetch('/api/session');
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    this.currentUser = data.user;
                }
            }
        } catch (e) {
            console.error('Errore controllo sessione:', e);
        }
    }

    // --- CARICAMENTO CONTENUTI ---
    loadAllSections() {
        // Ogni chiamata riempie una specifica "striscia" della home
        this.loadSection('/api/music/latest', '.horizontal[data-grid="latest"]', 'Nessuna novità.');
        this.loadSection('/api/music/premium', '.horizontal[data-grid="search-premium"]', 'Nessun contenuto premium.');
        this.loadSection('/api/music/creators', '.horizontal[data-grid="suoni"]', 'Nessun suono dai creatori.');
        this.loadSection('/api/music/favorites', '.horizontal[data-grid="pref"]', 'Nessun preferito.');
    }

    // Funzione generica per caricare una lista di brani in un contenitore
    async loadSection(url, selector, emptyMsg) {
        const container = document.querySelector(selector);
        if (!container) return; // Se il contenitore non c'è, salto (magari sono in un'altra pagina)

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Errore fetch ${url}`);
            const items = await res.json();

            container.innerHTML = ''; // Pulisco prima di riempire

            if (items.length === 0) {
                container.innerHTML = `<p style="color:white; padding:1rem;">${emptyMsg}</p>`;
                return;
            }

            // Creo una card per ogni brano trovato
            items.forEach((item, index) => {
                const card = this.createCard(item, index, items);
                container.appendChild(card);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // --- RICERCA ---
    bindSearchEvents() {
        if (!this.els.searchInput) return;

        // Evito che premere invio ricarichi la pagina
        if (this.els.searchForm) {
            this.els.searchForm.addEventListener('submit', (e) => e.preventDefault());
        }

        // Ascolto cosa scrive l'utente, ma aspetto un attimo (debounce) prima di cercare
        // per evitare di bombardare il server a ogni singola lettera.
        this.els.searchInput.addEventListener('input', this.debounce(async (e) => {
            const query = e.target.value.trim();

            if (!query) {
                // Se cancella tutto, nascondo i risultati
                this.els.resultsSection.hidden = true;
                this.els.resultsContainer.innerHTML = '';
                return;
            }

            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const results = await res.json();
                this.displaySearchResults(results);
            } catch (err) {
                console.error('Errore ricerca:', err);
            }
        }, 300)); // 300ms di ritardo
    }

    displaySearchResults(items) {
        this.els.resultsContainer.innerHTML = '';
        this.els.resultsSection.hidden = false; // Mostro la sezione dei risultati

        if (items.length === 0) {
            this.els.resultsContainer.innerHTML = '<p style="color:white; padding:1rem;">Nessun risultato.</p>';
            return;
        }

        items.forEach((item, index) => {
            const card = this.createCard(item, index, items);
            this.els.resultsContainer.appendChild(card);
        });
    }

    // --- CREAZIONE GRAFICA (CARD) ---
    createCard(item, index, allItems) {
        const card = document.createElement('div');
        card.className = 'card';
        // Mi segno l'ID sulla card per poterla ritrovare facilmente dopo
        card.dataset.soundId = item.id;

        // Imposto lo sfondo con la copertina
        const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/copertinaDef.png';
        card.style.background = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.2)), url('${bgUrl}') center/cover no-repeat`;

        const isLoggedIn = !!this.currentUser;

        // Costruisco l'overlay con i pulsanti (Play, Like)
        let overlayHtml = `
            <div class="card-overlay">
                <button class="btn-play-overlay" title="Play">
                    <i class="fa-solid fa-play"></i>
                </button>
        `;

        // Il cuore per i preferiti lo mostro solo se l'utente è loggato
        if (isLoggedIn) {
            const heartClass = item.is_liked ? 'fa-solid' : 'fa-regular';
            const title = item.is_liked ? 'Rimuovi dai Preferiti' : 'Aggiungi ai Preferiti';
            overlayHtml += `
                <button class="btn-fav-overlay" title="${title}">
                    <i class="${heartClass} fa-heart"></i>
                </button>
            `;
        }
        overlayHtml += `</div>`;

        card.innerHTML = `
            ${overlayHtml}
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-author">${item.author || 'Sconosciuto'}</div>
            </div>
        `;

        // Collego gli eventi click ai pulsanti appena creati
        this.attachCardEvents(card, item, index, allItems);

        return card;
    }

    attachCardEvents(card, item, index, allItems) {
        // Click sul Play
        const playBtn = card.querySelector('.btn-play-overlay');
        if (playBtn) {
            playBtn.onclick = (e) => {
                e.stopPropagation(); // Evito click fantasma
                if (window.Soundlly && window.Soundlly.player) {
                    // Faccio partire la coda musicale da questo brano
                    window.Soundlly.player.playQueue(allItems, index);
                }
            };
        }

        // Click sul Cuore
        const favBtn = card.querySelector('.btn-fav-overlay');
        if (favBtn) {
            favBtn.onclick = (e) => this.handleFavToggle(e, item, favBtn);
        }
    }

    async handleFavToggle(e, item, btn) {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/music/favorites/${item.id}/toggle`, { method: 'POST' });
            if (!res.ok) throw new Error('Fallito toggle preferito');
            const data = await res.json();

            // Aggiorna TUTTE le card di questo stesso brano presenti nella pagina.
            // (Utile se ad esempio ho lo stesso brano sia in "Novità" che nei risultati di ricerca)
            const allCards = document.querySelectorAll(`.card[data-sound-id="${item.id}"]`);

            allCards.forEach(c => {
                const b = c.querySelector('.btn-fav-overlay');
                const icon = b ? b.querySelector('i') : null;
                if (b && icon) {
                    if (data.liked) {
                        icon.classList.replace('fa-regular', 'fa-solid');
                        b.title = 'Rimuovi dai Preferiti';
                    } else {
                        icon.classList.replace('fa-solid', 'fa-regular');
                        b.title = 'Aggiungi ai Preferiti';
                    }
                }
            });

            // Se ho tolto il like, devo rimuovere la card dalla sezione "Preferiti" se presente
            if (!data.liked) {
                const favoritesContainer = document.querySelector('.horizontal[data-grid="pref"]');
                if (favoritesContainer) {
                    const cardToRemove = favoritesContainer.querySelector(`.card[data-sound-id="${item.id}"]`);
                    if (cardToRemove) {
                        cardToRemove.remove();
                        // Se era l'ultima card, mostro il messaggio "Nessun preferito"
                        if (favoritesContainer.children.length === 0) {
                            favoritesContainer.innerHTML = '<p style="color:white; padding:1rem;">Nessun preferito.</p>';
                        }
                    }
                }
            } else {
                // Se invece ho aggiunto un like, ricarico la striscia dei preferiti per vederlo apparire
                this.loadSection('/api/music/favorites', '.horizontal[data-grid="pref"]', 'Nessun preferito.');
            }

        } catch (err) {
            console.error(err);
            alert('Errore azione preferiti');
        }
    }

    // Utility: Funzione "debounce" per ritardare l'esecuzione (usata nella ricerca)
    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Inizializzazione globale
document.addEventListener('DOMContentLoaded', () => {
    // Espongo il manager globalmente per poter debuggare o accedere da altri script se serve
    window.Soundlly = window.Soundlly || {};
    window.Soundlly.music = new MusicManager();
});
