document.addEventListener('DOMContentLoaded', () => {
    loadLatestMusic();
    loadPremium();
    loadCreatorSounds();
    loadFavorites();

    const searchForm = document.getElementById('footer-searchbar');
    const searchInput = searchForm.querySelector('input');
    const resultsSection = document.getElementById('search-results-section');
    const resultsContainer = resultsSection.querySelector('.horizontal-wrapper');

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
            const card = document.createElement('div');
            card.className = 'item'; // Using existing class for horizontal items
            // Enhance styling if needed, or use a specific class defined in CSS

            // Simplified display for now, matching "horizontal-wrapper .item" style
            card.style.minWidth = '200px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'flex-start'; // Align left
            card.style.justifyContent = 'flex-end'; // Content at bottom
            card.style.padding = '10px';
            card.style.background = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)), url('/immagini/logo2.png') center/cover no-repeat`; // Placeholder image
            // If item.icon is available and it's an image, use it? Or filename if it's an image?
            // Assuming no image preview for audio yet, using default background.

            card.innerHTML = `
                <div style="font-size:1rem; font-weight:bold;">${item.title}</div>
                <div style="font-size:0.8rem; opacity:0.8;">${item.author || 'Sconosciuto'}</div>
            `;

            resultsContainer.appendChild(card);
        });

        // Scroll removed as per user request
    }

    async function loadLatestMusic() {
        await loadSection('/api/music/latest', '.horizontal-wrapper[data-grid="latest"]', 'Nessuna novità.');
    }

    async function loadPremium() {
        await loadSection('/api/music/premium', '.horizontal-wrapper[data-grid="search-premium"]', 'Nessun contenuto premium.');
    }

    async function loadCreatorSounds() {
        await loadSection('/api/music/creators', '.horizontal-wrapper[data-grid="suoni"]', 'Nessun suono dai creatori.');
    }

    async function loadFavorites() {
        await loadSection('/api/music/favorites', '.horizontal-wrapper[data-grid="pref"]', 'Nessun preferito.');
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
        card.className = 'item';
        card.style.minWidth = '200px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'flex-start';
        card.style.justifyContent = 'flex-end';
        card.style.padding = '10px';
        card.style.background = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)), url('${item.icon || '/immagini/logo2.png'}') center/cover no-repeat`;
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <div style="font-size:1rem; font-weight:bold;">${item.title}</div>
            <div style="font-size:0.8rem; opacity:0.8;">${item.author || 'Sconosciuto'}</div>
        `;

        // Optional: Play on click logic could go here

        return card;
    }
});
