/**
 * music-search.js
 * 
 * Gestore principale dell'Ecosistema Musicale (Dashboard Home).
 * 
 * Funzionalità:
 * 1. Caricamento dinamico sezioni (Nuove Uscite, Premium, Community, Preferiti).
 * 2. Ricerca istantanea (con debounce).
 * 3. Generazione UI (Card musicali con overlay).
 * 4. Gestione interazioni (Play, Preferiti).
 */

class MusicManager {
    constructor() {
        this.currentUser = null;

        // Riferimenti DOM
        this.els = {
            searchForm: document.getElementById('footer-searchbar'),
            searchInput: document.querySelector('#footer-searchbar input'),
            resultsSection: document.getElementById('search-results-section'),
            resultsContainer: document.querySelector('#search-results-section .horizontal')
        };

        this.init();
    }

    async init() {
        // 1. Identifica l'utente corrente
        await this.checkSession();

        // 2. Carica le sezioni della dashboard
        this.loadAllSections();

        // 3. Attiva la ricerca
        this.bindSearchEvents();
    }

    // --- SESSIONE ---
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

    // --- CARICAMENTO DATI ---
    loadAllSections() {
        this.loadSection('/api/music/latest', '.horizontal[data-grid="latest"]', 'Nessuna novità.');
        this.loadSection('/api/music/premium', '.horizontal[data-grid="search-premium"]', 'Nessun contenuto premium.');
        this.loadSection('/api/music/creators', '.horizontal[data-grid="suoni"]', 'Nessun suono dai creatori.');
        this.loadSection('/api/music/favorites', '.horizontal[data-grid="pref"]', 'Nessun preferito.');
    }

    async loadSection(url, selector, emptyMsg) {
        const container = document.querySelector(selector);
        if (!container) return;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Errore fetch ${url}`);
            const items = await res.json();

            // Svuota container
            container.innerHTML = '';

            if (items.length === 0) {
                container.innerHTML = `<p style="color:white; padding:1rem;">${emptyMsg}</p>`;
                return;
            }

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

        // Previene refresh form
        if (this.els.searchForm) {
            this.els.searchForm.addEventListener('submit', (e) => e.preventDefault());
        }

        // Input con Debounce (ritardo per non spammare richieste)
        this.els.searchInput.addEventListener('input', this.debounce(async (e) => {
            const query = e.target.value.trim();

            if (!query) {
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
        }, 300));
    }

    displaySearchResults(items) {
        this.els.resultsContainer.innerHTML = '';
        this.els.resultsSection.hidden = false;

        if (items.length === 0) {
            this.els.resultsContainer.innerHTML = '<p style="color:white; padding:1rem;">Nessun risultato.</p>';
            return;
        }

        items.forEach((item, index) => {
            const card = this.createCard(item, index, items);
            this.els.resultsContainer.appendChild(card);
        });
    }

    // --- UI GENERATOR (Card) ---
    createCard(item, index, allItems) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.soundId = item.id; // Utile per trovare duplicati nel DOM

        // Background
        const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/copertinaDef.png';
        card.style.background = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.2)), url('${bgUrl}') center/cover no-repeat`;

        const isLoggedIn = !!this.currentUser;

        // Pulsanti Overlay
        let overlayHtml = `
            <div class="card-overlay">
                <button class="btn-play-overlay" title="Play">
                    <i class="fa-solid fa-play"></i>
                </button>
        `;

        // Aggiungi pulsante Like solo se loggato
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

        // Struttura HTML
        card.innerHTML = `
            ${overlayHtml}
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-author">${item.author || 'Sconosciuto'}</div>
            </div>
        `;

        // Eventi
        this.attachCardEvents(card, item, index, allItems);

        return card;
    }

    attachCardEvents(card, item, index, allItems) {
        // Play Click
        const playBtn = card.querySelector('.btn-play-overlay');
        if (playBtn) {
            playBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.Soundlly && window.Soundlly.player) {
                    // window.Soundlly.player.playTrack(item);
                    window.Soundlly.player.playQueue(allItems, index);
                }
            };
        }

        // Fav Click
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

            // Aggiorna TUTTE le card di questo brano presenti nella pagina
            // (es. se ho lo stesso brano in "Novità" e "Ricerca", aggiorno entrambi)
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

            // Se abbiamo rimosso il like, rimuoviamo la card dalla sezione Preferiti (ovunque sia stato cliccato il cuore)
            if (!data.liked) {
                const favoritesContainer = document.querySelector('.horizontal[data-grid="pref"]');
                if (favoritesContainer) {
                    const cardToRemove = favoritesContainer.querySelector(`.card[data-sound-id="${item.id}"]`);
                    if (cardToRemove) {
                        cardToRemove.remove();
                        if (favoritesContainer.children.length === 0) {
                            favoritesContainer.innerHTML = '<p style="color:white; padding:1rem;">Nessun preferito.</p>';
                        }
                    }
                }
            } else {
                // Se ho aggiunto un like, ricarica la lista preferiti per mostrarlo
                this.loadSection('/api/music/favorites', '.horizontal[data-grid="pref"]', 'Nessun preferito.');
            }

        } catch (err) {
            console.error(err);
            alert('Errore azione preferiti');
        }
    }

    // Utility: Debounce
    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Avvio
document.addEventListener('DOMContentLoaded', () => {
    window.Soundlly = window.Soundlly || {};
    window.Soundlly.music = new MusicManager();
});
