/**
 * loadSounds.js
 * Gestisce la sezione "Suoni Ambientali" (Box 4).
 * 
 * Funzionalità principali:
 * 1. Caricamento Dati: Recupera la lista dei suoni e le preferenze utente dal server.
 * 2. Creazione Interfaccia: Genera dinamicamente la griglia di card con icone e slider del volume.
 * 3. Gestione Audio: Riproduzione in loop dei suoni, gestione del volume indipendente per ogni traccia.
 * 4. Persistenza: Salva su database quali suoni sono attivi e il loro volume (Debounce).
 * 5. Statistiche: Traccia per quanti secondi ogni suono viene ascoltato e invia i dati al server.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('sounds-container');

    // Stato globale dell'applicazione
    let sounds = [];             // Lista dei suoni disponibili
    const audioPlayers = {};     // Mappa degli oggetti Audio HTML5: { soundId: AudioObject }
    const sessionStats = {};     // Accumulatore locale per le statistiche: { soundId: seconds }

    // Configurazioni intervalli
    const STATS_INTERVAL_MS = 10000; // Invia statistiche al server ogni 10 secondi
    const COUNT_INTERVAL_MS = 1000;  // Aggiorna il contatore locale ogni secondo

    // Modalità "Headless": utile se siamo in una vista dove non c'è il contenitore grafico (es. Immersive Mode)
    // ma vogliamo comunque mantenere l'audio attivo.
    const isHeadless = !container;

    try {
        // --- 1. RECUPERO DATI ---
        // Eseguiamo due chiamate parallele: lista suoni totali e preferenze salvate dell'utente
        const [soundsRes, prefsRes] = await Promise.all([
            fetch('/api/focus/ambient-list'),
            fetch('/api/focus/ambient')
        ]);

        if (!soundsRes.ok) throw new Error('Impossibile caricare la lista dei suoni');

        sounds = await soundsRes.json();
        const prefs = await prefsRes.json(); // Array di oggetti { sound_id, volume, is_active }

        // Convertiamo le preferenze in una mappa per accesso rapido
        const prefsMap = {};
        if (Array.isArray(prefs)) {
            prefs.forEach(p => {
                prefsMap[p.sound_id] = p;
            });
        }

        // Controllo se stiamo navigando internamente nel sito per mantenere lo stato audio
        const isNavigating = sessionStorage.getItem('soundlly_navigating') === 'true';
        if (isNavigating) {
            sessionStorage.removeItem('soundlly_navigating'); // Pulizia flag
        }

        // BUG FIX: Sincronizzazione "Partenza Silenziosa"
        // Se l'utente ricarica la pagina (F5), vogliamo che i suoni partano spenti per non disturbare.
        // Dobbiamo resettare lo stato attivo nel database per coerenza con l'interfaccia.
        if (!isNavigating && Array.isArray(prefs) && prefs.some(p => p.is_active)) {
            fetch('/api/focus/ambient/reset-active', { method: 'POST' })
                .catch(e => console.error('Errore sincronizzazione silenziosa:', e));
        }

        // Renderizzazione o Inizializzazione Audio
        if (!isHeadless) {
            renderGrid(prefsMap, isNavigating);
        } else {
            // Se non c'è interfaccia (es. modalità immersive), inizializziamo solo l'audio
            initHeadlessAudio(sounds, prefsMap, isNavigating);
        }

        // Avvio del tracciamento statistiche di ascolto
        startStatsTracking();

    } catch (err) {
        console.error('Errore inizializzazione suoni:', err);
        if (container) container.innerHTML = '<p class="text-danger">Impossibile caricare i suoni.</p>';
    }


    // --- FUNZIONI DI INIZIALIZZAZIONE ---

    function initHeadlessAudio(soundsList, prefsMap, isNavigating) {
        if (!isNavigating) return; // Non riprodurre nulla se non è una navigazione interna

        soundsList.forEach(sound => {
            const pref = prefsMap[sound.id];
            // Riproduci solo se l'utente lo aveva lasciato attivo e stiamo navigando
            if (pref && pref.is_active) {
                const savedVolume = pref.volume !== undefined ? pref.volume : 50;
                playAudio(sound.id, sound.file, savedVolume);
            }
        });
    }

    function renderGrid(prefsMap, isNavigating) {
        // Creazione del contenitore griglia
        const grid = document.createElement('div');
        grid.className = 'vertical-grid sound-grid-2col';

        if (!sounds || sounds.length === 0) {
            container.innerHTML = '<p class="text-white">Nessun suono disponibile.</p>';
            return;
        }

        sounds.forEach(sound => {
            // Recupera preferenze o usa default (volume 50, spento)
            const pref = prefsMap[sound.id] || { volume: 50, is_active: 0 };

            // Logica persistenza:
            // Se stiamo navigando -> mantieni stato attivo dal DB.
            // Se è un nuovo caricamento -> parti spento (false).
            const isActive = isNavigating ? (pref && !!pref.is_active) : false;
            const savedVolume = pref.volume !== undefined ? pref.volume : 50;

            // Creazione Card Elemento
            const card = document.createElement('div');
            card.className = 'sound-card-item';
            card.dataset.id = sound.id;
            if (isActive) card.classList.add('active');

            // Area Cliccabile (Icona + Testo)
            const clickArea = document.createElement('div');
            clickArea.className = 'sound-click-area';

            // Icona
            const icon = document.createElement('i');
            icon.className = '';
            icon.classList.add('fa-solid', 'sound-icon');
            // Gestione nome icona (aggiunge prefisso fa- se mancante)
            const iconName = sound.icon || 'fa-music';
            const iconClass = iconName.startsWith('fa-') ? iconName : `fa-${iconName}`;
            icon.classList.add(iconClass);

            // Etichetta Nome Suono
            const span = document.createElement('span');
            span.textContent = sound.label;
            span.className = 'sound-label';

            clickArea.appendChild(icon);
            clickArea.appendChild(span);

            // Container Slider Volume
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'sound-volume-container';

            // Input Range per il Volume
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0;
            slider.max = 100;
            slider.value = savedVolume;
            slider.className = 'sound-slider';

            // Prevenzione conflitti di eventi (clic e touch)
            slider.addEventListener('click', (e) => e.stopPropagation());
            slider.addEventListener('mousedown', (e) => e.stopPropagation());
            slider.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
            slider.addEventListener('touchend', (e) => e.stopPropagation());

            // Gestione cambio volume
            slider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value, 10);
                updateVolume(sound.id, vol); // Aggiorna audio in tempo reale
                const currentActive = card.classList.contains('active');
                savePreferenceDebounced(sound.id, vol, currentActive); // Salva su DB
            });

            sliderContainer.appendChild(slider);
            card.appendChild(clickArea);
            card.appendChild(sliderContainer);

            // Handler Click Principale (Attiva/Disattiva suono)
            clickArea.addEventListener('click', () => {
                toggleSound(sound, card, slider.value);
            });

            grid.appendChild(card);

            // Auto-play se lo stato iniziale è attivo
            if (isActive) {
                playAudio(sound.id, sound.file, savedVolume);
            }
        });

        // Sostituisce il contenuto del container con la nuova griglia
        container.innerHTML = '';
        container.appendChild(grid);
    }


    // --- LOGICA AUDIO ---

    function toggleSound(sound, cardEl, currentVolumeLevel) {
        // Inverte lo stato attivo visuale
        const isActive = cardEl.classList.toggle('active');
        const volume = parseInt(currentVolumeLevel, 10);

        if (isActive) {
            playAudio(sound.id, sound.file, volume);
        } else {
            pauseAudio(sound.id);
        }

        // Salva la nuova preferenza
        savePreference(sound.id, volume, isActive);
    }

    function playAudio(id, filename, volumePct) {
        if (!audioPlayers[id]) {
            // Recupera l'oggetto sound dalla lista caricata
            const soundObj = sounds.find(s => s.id == id);
            const folder = soundObj ? soundObj.folder : 'ambient';

            // Crea oggetto Audio se non esiste (Singleton pattern per ID)
            const audio = new Audio(`/audio/${folder}/${filename}`);
            audio.loop = true; // Loop infinito per suoni ambientali
            audioPlayers[id] = audio;
        }
        const audio = audioPlayers[id];
        audio.volume = volumePct / 100; // HTML Audio usa range 0.0 - 1.0

        // Gestione Promise play() per evitare errori se il browser blocca l'autoplay
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Riproduzione bloccata per ${id}:`, error);
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


    // --- PERSISTENZA E API ---

    // Oggetto per gestire i timer di debounce (evita troppe chiamate al server)
    const debounceTimers = {};

    function savePreferenceDebounced(soundId, volume, isActive) {
        if (debounceTimers[soundId]) clearTimeout(debounceTimers[soundId]);

        // Attende 500ms di inattività prima di inviare la richiesta
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


    // --- LOGICA STATISTICHE ---

    function startStatsTracking() {
        // 1. Ogni secondo: Incrementa contatori locali in memoria
        setInterval(() => {
            for (const id in audioPlayers) {
                const audio = audioPlayers[id];
                // Conta solo se sta suonando e non è muto
                if (!audio.paused && !audio.muted && audio.currentTime > 0) {
                    sessionStats[id] = (sessionStats[id] || 0) + 1;
                }
            }
        }, COUNT_INTERVAL_MS);

        // 2. Ogni 10 secondi: Invia (flush) i dati accumulati al server
        setInterval(flushStatsToServer, STATS_INTERVAL_MS);

        // 3. Alla chiusura pagina: Invia gli ultimi dati rimasti
        window.addEventListener('beforeunload', flushStatsToServer);
    }

    function flushStatsToServer() {
        const payload = [];
        // Prepara il pacchetto dati
        for (const id in sessionStats) {
            if (sessionStats[id] > 0) {
                payload.push({ soundId: id, seconds: sessionStats[id] });
                sessionStats[id] = 0; // Resetta contatore locale dopo invio
            }
        }

        if (payload.length > 0) {
            const data = JSON.stringify({ stats: payload });

            // Usa Beacon API se disponibile (più affidabile in chiusura pagina)
            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon('/api/focus/ambient/stats', blob);
            } else {
                // Fallback su fetch standard
                fetch('/api/focus/ambient/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true // Importante per richieste during unload
                }).catch(e => console.error('Errore sync statistiche', e));
            }
        }
    }
});
