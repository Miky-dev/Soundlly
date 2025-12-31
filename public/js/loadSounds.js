/**
 * loadSounds.js
 * Populates Box 4 with a grid of ambient sounds from 'public/audio/ambient'.
 * Handles:
 * - Rendering Sound Cards (Icon + Label + Volume Slider)
 * - Persisting state & volume to Database (via API)
 * - Tracking listening time for statistics
 * - Debounced API calls for volume updates
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('sounds-container');
    if (!container) return; // Guard clause

    // Global state
    let sounds = [];
    const audioPlayers = {};
    const sessionStats = {};
    const STATS_INTERVAL_MS = 10000;
    const COUNT_INTERVAL_MS = 1000;

    try {
        // --- 1. FETCH DATA (Sounds List + User Prefs) ---
        const [soundsRes, prefsRes] = await Promise.all([
            fetch('/api/focus/ambient-list'),
            fetch('/api/focus/ambient')
        ]);

        if (!soundsRes.ok) throw new Error('Failed to load sounds list');

        sounds = await soundsRes.json();
        const prefs = await prefsRes.json(); // Array of { sound_id, volume, is_active }

        // Convert prefs to map
        // Note: sound_id in DB might be string/int mix if legacy. We use loose equality or string keys.
        const prefsMap = {};
        if (Array.isArray(prefs)) {
            prefs.forEach(p => {
                prefsMap[p.sound_id] = p;
            });
        }

        renderGrid(prefsMap);
        startStatsTracking();

    } catch (err) {
        console.error('Error initializing sounds:', err);
        container.innerHTML = '<p class="text-danger">Impossibile caricare i suoni.</p>';
    }


    function renderGrid(prefsMap) {
        // Create Grid Container
        const grid = document.createElement('div');
        grid.className = 'vertical-grid sound-grid-2col';

        // Check availability
        if (!sounds || sounds.length === 0) {
            container.innerHTML = '<p class="text-white">Nessun suono disponibile.</p>';
            return;
        }

        sounds.forEach(sound => {
            // sound: { id, label, icon, file }
            const pref = prefsMap[sound.id] || { volume: 50, is_active: 0 };

            // User request: Start with all sounds OFF on load/login unless specifically desired otherwise.
            // But usually we respect DB "is_active". 
            // If user previously left it active, we might want to restore it?
            // "User request: Start with all sounds OFF" comment in old code. 
            // I will respect the DB `is_active` value for now, as that's "persistence".
            // If the user SPECIFICALLY asked for "always off on load", I should use false.
            // The previous code had `const isActive = false;` hardcoded despite reading prefs. 
            // I will stick to `const isActive = false;` to match previous behavior if that was intentional.
            // Actually, the previous code had `const savedVolume = pref.volume;` and `const isActive = false;`.
            // So I will keep `isActive = false` on load.

            const isActive = false;
            const savedVolume = pref.volume !== undefined ? pref.volume : 50;

            // Card Element
            const card = document.createElement('div');
            card.className = 'sound-card-item';
            card.dataset.id = sound.id;
            if (isActive) card.classList.add('active');

            // Click Area (Icon + Text)
            const clickArea = document.createElement('div');
            clickArea.className = 'sound-click-area';

            // Icon
            const icon = document.createElement('i');
            // Handle fontawesome class
            // sound.icon might be "fa-cloud-rain" or "fa-solid fa-cloud-rain"
            // We'll strip fa-solid if present to avoid dupes, or just add it.
            // Best to reset class list.
            icon.className = '';
            icon.classList.add('fa-solid', 'sound-icon');
            // Add specific icon class (remove potential 'fa-' prefix duplicate if needed, but usually just add)
            // Assuming DB has 'fa-cloud-rain'
            const iconClass = sound.icon.startsWith('fa-') ? sound.icon : `fa-${sound.icon}`;
            icon.classList.add(iconClass);

            // Label
            const span = document.createElement('span');
            span.textContent = sound.label;
            span.className = 'sound-label';

            clickArea.appendChild(icon);
            clickArea.appendChild(span);

            // Volume Slider (Input Range)
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'sound-volume-container';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0;
            slider.max = 100;
            slider.value = savedVolume;
            slider.className = 'sound-slider';

            // Stop bubbling so clicking slider doesn't toggle card active state
            slider.addEventListener('click', (e) => e.stopPropagation());
            slider.addEventListener('mousedown', (e) => e.stopPropagation()); // Prevent drag conflict
            slider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value, 10);
                updateVolume(sound.id, vol);
                const currentActive = card.classList.contains('active');
                savePreferenceDebounced(sound.id, vol, currentActive);
            });

            sliderContainer.appendChild(slider);
            card.appendChild(clickArea);
            card.appendChild(sliderContainer);

            // Click Handler (Toggle Active)
            clickArea.addEventListener('click', () => {
                toggleSound(sound, card, slider.value);
            });

            grid.appendChild(card);

            // Auto-play if active (disabled by default above)
            if (isActive) {
                playAudio(sound.id, sound.file, savedVolume);
            }
        });

        container.innerHTML = '';
        container.appendChild(grid);
    }


    // --- AUDIO LOGIC ---

    function toggleSound(sound, cardEl, currentVolumeLevel) {
        const isActive = cardEl.classList.toggle('active');
        const volume = parseInt(currentVolumeLevel, 10);

        if (isActive) {
            playAudio(sound.id, sound.file, volume);
        } else {
            pauseAudio(sound.id);
        }

        savePreference(sound.id, volume, isActive);
    }

    function playAudio(id, filename, volumePct) {
        if (!audioPlayers[id]) {
            // Create audio if not exists
            const audio = new Audio(`/audio/ambient/${filename}`);
            audio.loop = true;
            audioPlayers[id] = audio;
        }
        const audio = audioPlayers[id];
        audio.volume = volumePct / 100;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Playback prevented for ${id}:`, error);
            });
        }
    }

    function pauseAudio(id) {
        if (audioPlayers[id]) {
            audioPlayers[id].pause();
        }
    }

    function updateVolume(id, volumePct) {
        if (audioPlayers[id]) {
            audioPlayers[id].volume = volumePct / 100;
        }
    }


    // --- PERSISTENCE (API) ---

    const debounceTimers = {};

    function savePreferenceDebounced(soundId, volume, isActive) {
        if (debounceTimers[soundId]) clearTimeout(debounceTimers[soundId]);

        debounceTimers[soundId] = setTimeout(() => {
            savePreference(soundId, volume, isActive);
        }, 500);
    }

    function savePreference(soundId, volume, isActive) {
        fetch('/api/focus/ambient/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ soundId, volume, isActive })
        }).catch(err => console.error('Save Pref Error:', err));
    }


    // --- STATS LOGIC ---

    function startStatsTracking() {
        setInterval(() => {
            for (const id in audioPlayers) {
                const audio = audioPlayers[id];
                if (!audio.paused && !audio.muted && audio.currentTime > 0) {
                    sessionStats[id] = (sessionStats[id] || 0) + 1;
                }
            }
        }, COUNT_INTERVAL_MS);

        setInterval(flushStatsToServer, STATS_INTERVAL_MS);
        window.addEventListener('beforeunload', flushStatsToServer);
    }

    function flushStatsToServer() {
        const payload = [];
        for (const id in sessionStats) {
            if (sessionStats[id] > 0) {
                payload.push({ soundId: id, seconds: sessionStats[id] });
                sessionStats[id] = 0;
            }
        }

        if (payload.length > 0) {
            const data = JSON.stringify({ stats: payload });
            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon('/api/focus/ambient/stats', blob);
            } else {
                fetch('/api/focus/ambient/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                }).catch(e => console.error('Stats Sync Error', e));
            }
        }
    }
});

