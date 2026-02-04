/**
 * Questo script gestisce tutta la sezione dei "Suoni Ambientali".
 * Si occupa di scaricare la lista dei suoni dal server, costruire le card
 * nell'interfaccia, gestire la riproduzione audio, il volume e salvare
 * le preferenze dell'utente (quali suoni sono attivi e a che volume).
 * Inoltre, tiene traccia di quanto tempo ogni suono viene ascoltato.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('sounds-container');

    // Qui tengo traccia di tutto quello che succede
    let sounds = [];             // La lista completa dei suoni
    const audioPlayers = {};     // I player audio veri e propri (uno per suono)
    const sessionStats = {};     // Conta i secondi di ascolto per le statistiche

    // Ogni quanto inviare i dati al server
    const STATS_INTERVAL_MS = 10000; // Invio le statistiche ogni 10 secondi
    const COUNT_INTERVAL_MS = 1000;  // Aggiorno il conteggio locale ogni secondo

    // Se non trovo il contenitore (es. sono nell'immersive mode), 
    // l'interfaccia è "invisibile" ma l'audio deve funzionare lo stesso.
    const isHeadless = !container;

    try {
        // --- RECUPERO DATI ---
        // Scarico contemporaneamente la lista dei suoni e le preferenze salvate dell'utente
        const [soundsRes, prefsRes] = await Promise.all([
            fetch('/api/focus/ambient-list'),
            fetch('/api/focus/ambient')
        ]);

        if (!soundsRes.ok) throw new Error('Impossibile caricare la lista dei suoni');

        sounds = await soundsRes.json();
        const prefs = await prefsRes.json();

        // Mi creo una mappa veloce per trovare le preferenze di ogni suono senza dover cercare nell'array ogni volta
        const prefsMap = {};
        if (Array.isArray(prefs)) {
            prefs.forEach(p => {
                prefsMap[p.sound_id] = p;
            });
        }

        // Controllo se l'utente sta navigando tra le pagine del sito.
        // Se sì, mantengo l'audio attivo tra una pagina e l'altra.
        const isNavigating = sessionStorage.getItem('soundlly_navigating') === 'true';
        if (isNavigating) {
            sessionStorage.removeItem('soundlly_navigating'); // Pulisco il flag, l'ho usato
        }

        // FIX: Se ricarico la pagina (F5), voglio silenzio.
        // Se non sto navigando ma ci sono suoni che risultano "attivi" nel database,
        // li resetto per evitare incoerenze (audio spento ma tasto "acceso").
        if (!isNavigating && Array.isArray(prefs) && prefs.some(p => p.is_active)) {
            fetch('/api/focus/ambient/reset-active', { method: 'POST' })
                .catch(e => console.error('Errore reset suoni:', e));
        }

        // --- AVVIO ---
        if (!isHeadless) {
            // Se c'è l'interfaccia, disegno la griglia
            renderGrid(prefsMap, isNavigating);
        } else {
            // Se non c'è interfaccia (es. modalità focus), faccio partire solo l'audio
            initHeadlessAudio(sounds, prefsMap, isNavigating);
        }

        // Faccio partire il sistema che conta i minuti di ascolto
        startStatsTracking();

    } catch (err) {
        console.error('Errore inizializzazione suoni:', err);
        if (container) container.innerHTML = '<p class="text-danger">Impossibile caricare i suoni.</p>';
    }


    // --- FUNZIONI DI INIZIALIZZAZIONE ---

    // Gestione audio senza interfaccia grafica
    function initHeadlessAudio(soundsList, prefsMap, isNavigating) {
        if (!isNavigating) return; // Se non stavo navigando, non devo far partire nulla da solo

        soundsList.forEach(sound => {
            const pref = prefsMap[sound.id];
            // Riproduco solo se il suono era attivo prima del cambio pagina
            if (pref && pref.is_active) {
                const savedVolume = pref.volume !== undefined ? pref.volume : 50;
                playAudio(sound.id, sound.file, savedVolume);
            }
        });
    }

    // Disegno le card per ogni suono
    function renderGrid(prefsMap, isNavigating) {
        const grid = document.createElement('div');
        grid.className = 'vertical-grid sound-grid-2col';

        if (!sounds || sounds.length === 0) {
            container.innerHTML = '<p class="text-white">Nessun suono disponibile.</p>';
            return;
        }

        sounds.forEach(sound => {
            // Se non ho preferenze salvate, uso valori di default (metà volume, spento)
            const pref = prefsMap[sound.id] || { volume: 50, is_active: 0 };

            // Se stavo navigando, rispetto lo stato salvato. Se è un refresh, parto spento.
            const isActive = isNavigating ? (pref && !!pref.is_active) : false;
            const savedVolume = pref.volume !== undefined ? pref.volume : 50;

            // Creo l'elemento Card
            const card = document.createElement('div');
            card.className = 'sound-card-item';
            card.dataset.id = sound.id;
            if (isActive) card.classList.add('active');

            // Creo l'area che si può cliccare per attivare/disattivare
            const clickArea = document.createElement('div');
            clickArea.className = 'sound-click-area';

            // Icona del suono
            const icon = document.createElement('i');
            icon.className = '';
            icon.classList.add('fa-solid', 'sound-icon');
            // Aggiungo il prefisso 'fa-' se manca nel database
            const iconName = sound.icon || 'fa-music';
            const iconClass = iconName.startsWith('fa-') ? iconName : `fa-${iconName}`;
            icon.classList.add(iconClass);

            // Nome del suono
            const span = document.createElement('span');
            span.textContent = sound.label;
            span.className = 'sound-label';

            clickArea.appendChild(icon);
            clickArea.appendChild(span);

            // Slider del volume
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'sound-volume-container';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0;
            slider.max = 100;
            slider.value = savedVolume;
            slider.className = 'sound-slider';

            // Evito che trascinare lo slider attivi anche il click sulla card o lo scroll
            slider.addEventListener('click', (e) => e.stopPropagation());
            slider.addEventListener('mousedown', (e) => e.stopPropagation());
            slider.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
            slider.addEventListener('touchend', (e) => e.stopPropagation());

            // Quando muovo lo slider
            slider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value, 10);
                updateVolume(sound.id, vol); // Cambio volume subito
                const currentActive = card.classList.contains('active');
                savePreferenceDebounced(sound.id, vol, currentActive); // Salvo nel DB (con calma)
            });

            sliderContainer.appendChild(slider);
            card.appendChild(clickArea);
            card.appendChild(sliderContainer);

            // Click principale sulla card
            clickArea.addEventListener('click', () => {
                toggleSound(sound, card, slider.value);
            });

            grid.appendChild(card);

            // Se doveva essere attivo, lo faccio partire subito
            if (isActive) {
                playAudio(sound.id, sound.file, savedVolume);
            }
        });

        // Metto tutto nella pagina
        container.innerHTML = '';
        container.appendChild(grid);
    }


    // --- GESTIONE AUDIO ---

    function toggleSound(sound, cardEl, currentVolumeLevel) {
        // Accendo o spengo visivamente la card
        const isActive = cardEl.classList.toggle('active');
        const volume = parseInt(currentVolumeLevel, 10);

        if (isActive) {
            playAudio(sound.id, sound.file, volume);
        } else {
            pauseAudio(sound.id);
        }

        // Salvo la scelta
        savePreference(sound.id, volume, isActive);
    }

    function playAudio(id, filename, volumePct) {
        if (!audioPlayers[id]) {
            // Se non ho ancora creato il player audio per questo suono, lo faccio ora
            const soundObj = sounds.find(s => s.id == id);

            // Uso lo stream audio dell'API
            const audio = new Audio(`/api/stream/track/${id}`);
            audio.loop = true; // È un ambient, deve girare all'infinito
            audioPlayers[id] = audio;
        }
        const audio = audioPlayers[id];
        audio.volume = volumePct / 100;

        // Faccio play gestendo eventuali blocchi del browser (autoplay policy)
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Non riesco a riprodurre il suono ${id}:`, error);
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


    // --- SALVATAGGIO PREFERENZE ---

    // Evito di bombardare il server se l'utente gioca con lo slider
    const debounceTimers = {};

    function savePreferenceDebounced(soundId, volume, isActive) {
        if (debounceTimers[soundId]) clearTimeout(debounceTimers[soundId]);

        // Aspetto mezzo secondo che l'utente si fermi prima di salvare
        debounceTimers[soundId] = setTimeout(() => {
            savePreference(soundId, volume, isActive);
        }, 500);
    }

    function savePreference(soundId, volume, isActive) {
        fetch('/api/focus/ambient/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ soundId, volume, isActive })
        }).catch(err => console.error('Errore salvataggio preferenza:', err));
    }


    // --- STATISTICHE DI ASCOLTO ---

    function startStatsTracking() {
        // 1. Ogni secondo controllo chi sta suonando
        setInterval(() => {
            for (const id in audioPlayers) {
                const audio = audioPlayers[id];
                // Se suona e non è muto, conto un secondo in più
                if (!audio.paused && !audio.muted && audio.currentTime > 0) {
                    sessionStats[id] = (sessionStats[id] || 0) + 1;
                }
            }
        }, COUNT_INTERVAL_MS);

        // 2. Ogni tot secondi invio il pacchetto dati al server
        setInterval(flushStatsToServer, STATS_INTERVAL_MS);

        // 3. Se l'utente chiude la pagina, provo a mandare l'ultimo aggiornamento
        window.addEventListener('beforeunload', flushStatsToServer);
    }

    function flushStatsToServer() {
        const payload = [];

        // Raccolgo tutti i contatori > 0
        for (const id in sessionStats) {
            if (sessionStats[id] > 0) {
                payload.push({ soundId: id, seconds: sessionStats[id] });
                sessionStats[id] = 0; // Resetta contatore locale
            }
        }

        if (payload.length > 0) {
            const data = JSON.stringify({ stats: payload });

            // SendBeacon è meglio quando la pagina si sta chiudendo perché non viene interrotto
            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon('/api/focus/ambient/stats', blob);
            } else {
                // Altrimenti uso la classica fetch
                fetch('/api/focus/ambient/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                }).catch(e => console.error('Errore sync statistiche', e));
            }
        }
    }
});
