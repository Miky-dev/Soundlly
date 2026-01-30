document.addEventListener('DOMContentLoaded', () => {
    const createBtn = document.getElementById('createPlaylistBtn'); // The button in Horizontal Box
    const confirmBtn = document.getElementById('confirmCreatePlaylist');
    const modalEl = document.getElementById('createPlaylistModal');
    let modalInstance = null;

    // Initialize Bootstrap Modal
    if (modalEl) {
        // eslint-disable-next-line no-undef
        modalInstance = new bootstrap.Modal(modalEl);
    }

    // 1. Open Modal & Load Candidates
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            // Check if user is logged in (frontend check, backend will enforce too)
            const body = document.body;
            const isLoggedIn = body.dataset.loggedIn === 'true';

            if (!isLoggedIn) {
                window.location.href = '/login';
                return;
            }

            // Show Modal
            modalInstance.show();

            // Load Music Candidates
            await loadCandidates();
        });
    }

    // 2. Load Candidates Function
    async function loadCandidates() {
        const listContainer = document.getElementById('playlistTracksList');
        listContainer.innerHTML = '<div class="text-center text-muted p-3"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            const response = await fetch('/api/playlist/candidates');
            if (response.status === 403) {
                listContainer.innerHTML = '<div class="text-danger p-2">Funzionalità riservata agli utenti Premium. <a href="/abbonamento">Abbonati ora</a></div>';
                confirmBtn.disabled = true;
                return;
            }

            const tracks = await response.json();

            if (tracks.length === 0) {
                listContainer.innerHTML = '<div class="text-muted p-2">Nessun brano musicale disponibile.</div>';
                return;
            }

            // Build List
            let html = '';
            tracks.forEach(track => {
                html += `
                    <div class="form-check track-item" style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <input class="form-check-input" type="checkbox" value="${track.id}" id="track-${track.id}">
                        <label class="form-check-label w-100" for="track-${track.id}" style="cursor: pointer; margin-left: 8px;">
                            <span style="font-weight: 600; font-size: 0.95rem;">${track.title}</span>
                            <br>
                            <span style="font-size: 0.8rem; opacity: 0.7;">${track.author || 'Sconosciuto'}</span>
                        </label>
                    </div>
                `;
            });

            listContainer.innerHTML = html;
            confirmBtn.disabled = false;

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<div class="text-danger">Errore caricamento brani.</div>';
        }
    }

    // 3. Create Playlist Submission
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('playlistName');
            const descInput = document.getElementById('playlistDesc');
            const name = nameInput.value.trim();
            const description = descInput.value.trim();

            if (!name) {
                alert('Inserisci un nome per la playlist.');
                return;
            }

            // Get selected IDs
            const checkboxes = document.querySelectorAll('#playlistTracksList input[type="checkbox"]:checked');
            const selectedIds = Array.from(checkboxes).map(cb => cb.value);

            try {
                const res = await fetch('/api/playlist/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description, tracks: selectedIds })
                });

                const data = await res.json();

                if (data.ok) {
                    // Success
                    modalInstance.hide();
                    alert('Playlist creata con successo!');
                    // Optionally refresh playlist list if visible
                    nameInput.value = '';
                    descInput.value = '';
                } else {
                    alert('Errore: ' + (data.error || 'Impossibile creare playlist'));
                }
            } catch (err) {
                console.error(err);
                alert('Errore di connessione.');
            }
        });
    }
});
