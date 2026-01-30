
document.addEventListener('DOMContentLoaded', () => {
    // Only load if the container exists (user is logged in)
    const container = document.querySelector('[data-grid="my-playlists"]');
    if (!container) return;

    loadMyPlaylists(container);
});

async function loadMyPlaylists(container) {
    try {
        const response = await fetch('/api/playlist/mine');
        if (!response.ok) throw new Error('Failed to fetch playlists');

        const playlists = await response.json();

        if (playlists.length === 0) {
            container.innerHTML = '<div class="text-muted ps-3">Non hai ancora creato nessuna playlist.</div>';
            return;
        }

        // Use existing card style or similar
        let html = '';
        playlists.forEach(playlist => {
            const cover = playlist.cover_image || '/immagini/music-placeholder.png'; // Updated placeholder path
            // Assuming we might want to play it or open it. For now just display.
            // Using a simple card layout similar to sounds but without play button directly maybe?
            // Or just a clickable card to open/play.

            // Card Style matching music-search.js
            const coverUrl = playlist.cover_image || '/immagini/usericon.png';

            html += `
                <div class="card" data-playlist-id="${playlist.id}" 
                     style="background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.2)), url('${coverUrl}') center/cover no-repeat"
                     onclick="playPlaylist(${playlist.id})">
                    
                    <div class="card-overlay">
                        <button class="btn-play-overlay" title="Play">
                            <i class="fa-solid fa-play"></i>
                        </button>
                    </div>

                    <div class="card-content">
                        <div class="card-title text-truncate">${playlist.name}</div>
                        <div class="card-author text-truncate">${playlist.description || 'Playlist personale'}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading playlists:", err);
        container.innerHTML = '<div class="text-danger ps-3">Errore caricamento playlist.</div>';
    }
}

// Stub for playing a playlist - to be implemented fully later if needed
// For now, playing a playlist might just mean finding its tracks and playing the first one?
// Or we need a specific player logic for playlists. 
// Given the current player.js, it plays single tracks. 
// We might need to fetch playlist tracks and queue them.
function playPlaylist(id) {
    console.log("Play playlist", id);
    alert("Riproduzione playlist in arrivo!");
}
