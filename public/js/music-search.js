document.addEventListener('DOMContentLoaded', () => {
    loadLatestMusic();
    loadPremium();
    loadCreatorSounds();
    loadFavorites();

    const searchForm = document.getElementById('footer-searchbar');
    const searchInput = searchForm.querySelector('input');
    const resultsSection = document.getElementById('search-results-section');
    const resultsContainer = resultsSection.querySelector('.horizontal');

    // Debounce Helper
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Instant Search Listener
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();

        if (!query) {
            resultsSection.hidden = true;
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Search failed');

            const results = await res.json();
            displayResults(results);
        } catch (err) {
            console.error(err);
        }
    }, 300));

    // Keep submit as fallback (prevent default reload)
    searchForm.addEventListener('submit', (e) => e.preventDefault());

    function displayResults(items) {
        resultsContainer.innerHTML = '';
        resultsSection.hidden = false;

        if (items.length === 0) {
            resultsContainer.innerHTML = '<p style="color:white; padding:1rem;">Nessun risultato trovato.</p>';
            return;
        }

        items.forEach(item => {
            const card = createCard(item);
            resultsContainer.appendChild(card);
        });

        // Scroll removed as per user request
    }

    async function loadLatestMusic() {
        await loadSection('/api/music/latest', '.horizontal[data-grid="latest"]', 'Nessuna novità.');
    }

    async function loadPremium() {
        await loadSection('/api/music/premium', '.horizontal[data-grid="search-premium"]', 'Nessun contenuto premium.');
    }

    async function loadCreatorSounds() {
        await loadSection('/api/music/creators', '.horizontal[data-grid="suoni"]', 'Nessun suono dai creatori.');
    }

    async function loadFavorites() {
        await loadSection('/api/music/favorites', '.horizontal[data-grid="pref"]', 'Nessun preferito.');
    }

    async function loadSection(url, selector, emptyMsg) {
        const container = document.querySelector(selector);
        if (!container) return;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            const items = await res.json();

            if (items.length === 0) {
                container.innerHTML = `<p style="color:white; padding:1rem;">${emptyMsg}</p>`;
                return;
            }

            container.innerHTML = '';
            items.forEach(item => {
                const card = createCard(item);
                container.appendChild(card);
            });

        } catch (err) {
            console.error(err);
        }
    }

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';

        // Determine background image
        // If icon is a URL (contains /) use it, otherwise if it's a class (starts with fa- or has no /) use default.
        // The API might return 'fa-car' for ambient sounds mixed in? 
        // Or if it's music, it should be a URL.
        const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/usericon.png';

        card.style.background = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.2)), url('${bgUrl}') center/cover no-repeat`;

        // Add click listener if needed
        card.onclick = () => {
            // Existing logic or placeholder
            console.log('Clicked:', item.title);
        };

        // Check if user is logged in
        const isLoggedIn = (typeof CURRENT_USER_ID !== 'undefined' && CURRENT_USER_ID !== null);

        let overlayHtml = '';
        if (isLoggedIn) {
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
            // For guests, maybe just play button or nothing? User said "guests cannot set or see favorites".
            // We can show play button but no favorite.
            overlayHtml = `
            <div class="card-overlay">
                <button class="btn-play-overlay" title="Play">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>`;
        }

        card.dataset.soundId = item.id; // Add data attribute for global selection

        card.innerHTML = `
            ${overlayHtml}
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-author">${item.author || 'Sconosciuto'}</div>
            </div>
        `;

        // Play Button Logic
        const playBtn = card.querySelector('.btn-play-overlay');
        if (playBtn) {
            playBtn.onclick = (e) => {
                e.stopPropagation();
                console.log('Play clicked (No-op)');
            };
        }

        // Favorite Button Logic
        const favBtn = card.querySelector('.btn-fav-overlay');
        if (favBtn) {
            favBtn.onclick = async (e) => {
                e.stopPropagation();

                try {
                    const res = await fetch(`/api/music/favorites/${item.id}/toggle`, { method: 'POST' });
                    if (!res.ok) throw new Error('Toggle failed');
                    const data = await res.json();

                    // Global Sync: Update ALL cards with this sound ID
                    const allCardsToCheck = document.querySelectorAll(`.card[data-sound-id="${item.id}"]`);
                    allCardsToCheck.forEach(c => {
                        const btn = c.querySelector('.btn-fav-overlay');
                        const icon = btn ? btn.querySelector('i') : null;
                        if (btn && icon) {
                            if (data.liked) {
                                icon.classList.remove('fa-regular');
                                icon.classList.add('fa-solid');
                                btn.title = 'Rimuovi dai Preferiti';
                            } else {
                                icon.classList.remove('fa-solid');
                                icon.classList.add('fa-regular');
                                btn.title = 'Aggiungi ai Preferiti';
                            }
                        }
                    });

                    // Handles Sync Logic for Favorites Section
                    const parentGrid = card.closest('.horizontal');
                    const isInsideFavorites = parentGrid && parentGrid.dataset.grid === 'pref';

                    if (!data.liked && isInsideFavorites) {
                        // Unliked from inside Favorites -> Remove immediately
                        card.remove();
                        if (parentGrid.children.length === 0) {
                            parentGrid.innerHTML = '<p style="color:white; padding:1rem;">Nessun preferito.</p>';
                        }
                    } else {
                        // Liked (from anywhere) OR Unliked (from outside Favorites) -> Reload Favorites
                        // This ensures the list is always up to date
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
