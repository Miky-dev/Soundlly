/**
 * timer.js
 * 
 * Gestisce il Timer Pomodoro (25/5/15) con interfaccia circolare, 
 * salvataggio delle sessioni sul server e configurazione personalizzata.
 * 
 * Funzionalità principali:
 * - Timer (Start/Pause/Reset)
 * - Gestione modalità (Pomodoro, Pausa Breve)
 * - Persistenza configurazione (durata sessioni)
 * - Comunicazione con il backend per tracciare le sessioni di focus
 * - Notifiche audio e desktop
 */

(function () {
  // --- ELEMENTI DEL DOM ---
  // Riferimenti agli elementi HTML necessari per il funzionamento del timer
  const els = {
    time: document.getElementById('pomoTime'),       // Display del tempo (MM:SS)
    progress: document.getElementById('pomoProgress'), // Cerchio di progresso SVG
    mode: document.getElementById('pomoMode'),       // Testo modalità corrente
    btnStart: document.getElementById('pomoStart'),  // Bottone Avvia
    btnPause: document.getElementById('pomoPause'),  // Bottone Pausa
    btnReset: document.getElementById('pomoReset'),  // Bottone Reset
    btnSkip: document.getElementById('pomoSkip'),    // Bottone Salta (per cambio modalità manuale)
    audio: document.getElementById('pomoDing'),      // Elemento audio per la fine del timer
    // Impostazioni
    btnSettings: document.getElementById('pomoSettingsBtn'), // Bottone apri settings
    panelSettings: document.getElementById('pomoSettingsPanel'), // Pannello settings
    btnSaveSettings: document.getElementById('saveSettingsBtn'), // Bottone salva settings
    inputs: {
      pomodoro: document.getElementById('setPomo'),   // Input durata Pomodoro
      shortBreak: document.getElementById('setShort') // Input durata Pausa Breve
    }
  };

  // Se mancano elementi essenziali (es. in altre pagine), interrompiamo l'esecuzione
  if (!els.time || !els.progress || !els.btnStart) return;

  // --- CONFIGURAZIONE ---
  // Impostazioni di default per le modalità. Vengono sovrascritte dalle impostazioni utente.
  const MODES = {
    pomodoro: { minutes: 25, label: 'Pomodoro', color: '#2a9d8f' },
    shortBreak: { minutes: 5, label: 'Pausa Breve', color: '#e9c46a' }
  };

  // --- STATO DELL'APPLICAZIONE ---
  let currentMode = 'pomodoro'; // Modalità corrente ('pomodoro' o 'shortBreak')
  let timeLeft = MODES[currentMode].minutes * 60; // Tempo rimanente in secondi
  let timerId = null;           // ID del timer (setInterval)
  let isRunning = false;        // Stato del timer (in esecuzione o no)
  let currentSessionId = null;  // ID della sessione backend (se attiva)

  // --- INIZIALIZZAZIONE ---
  function init() {
    loadSettings(); // Carica le impostazioni dal server
    updateUI();     // Aggiorna l'interfaccia iniziale

    // Event Listeners per i controlli principali
    els.btnStart.addEventListener('click', startTimer);
    els.btnPause.addEventListener('click', pauseTimer);
    els.btnReset.addEventListener('click', resetTimer);
    if (els.btnSkip) els.btnSkip.addEventListener('click', nextMode);

    // Event Listeners per il pannello impostazioni
    if (els.btnSettings) {
      els.btnSettings.addEventListener('click', () => {
        // Toggle visibilità pannello
        const isHidden = els.panelSettings.style.display === 'none';
        els.panelSettings.style.display = isHidden ? 'block' : 'none';
      });
    }
    if (els.btnSaveSettings) {
      els.btnSaveSettings.addEventListener('click', saveSettings);
    }

    // Imposta la modalità iniziale
    setMode('pomodoro');
  }

  // --- GESTIONE IMPOSTAZIONI ---

  /**
   * Carica le impostazioni personalizzate dell'utente dal server.
   * Se fallisce, rimangono i valori di default.
   */
  async function loadSettings() {
    try {
      const res = await fetch('/api/focus/settings');
      if (res.ok) {
        const cfg = await res.json();
        // Aggiorna i minuti delle modalità se presenti nella risposta
        if (cfg.pomodoro) MODES.pomodoro.minutes = cfg.pomodoro;
        if (cfg.shortBreak) MODES.shortBreak.minutes = cfg.shortBreak;

        // Se il timer è fermo, aggiorna il tempo visualizzato con i nuovi valori
        if (!isRunning) {
          timeLeft = MODES[currentMode].minutes * 60;
          updateUI();
        }
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }

    // Aggiorna i valori negli input del pannello impostazioni
    if (els.inputs.pomodoro) els.inputs.pomodoro.value = MODES.pomodoro.minutes;
    if (els.inputs.shortBreak) els.inputs.shortBreak.value = MODES.shortBreak.minutes;
  }

  /**
   * Salva le nuove impostazioni sul server e aggiorna lo stato locale.
   */
  async function saveSettings() {
    const p = parseInt(els.inputs.pomodoro.value) || 25;
    const s = parseInt(els.inputs.shortBreak.value) || 5;

    // Aggiorna configurazione locale
    MODES.pomodoro.minutes = p;
    MODES.shortBreak.minutes = s;

    // Invia al server
    try {
      await fetch('/api/focus/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pomodoro: p, shortBreak: s })
      });
    } catch (e) {
      console.error('Error saving settings', e);
    }

    // Chiude il pannello
    els.panelSettings.style.display = 'none';

    // Resetta il timer per applicare le modifiche (se non in esecuzione, resetta per aggiornare il tempo totale)
    if (!isRunning) {
      resetTimer();
    }
  }

  // --- LOGICA TIMER ---

  /**
   * Cambia la modalità del timer (es. da Studio a Pausa).
   * @param {string} modeKey - La chiave della modalità ('pomodoro' o 'shortBreak')
   */
  function setMode(modeKey) {
    if (isRunning) return; // Impedisce il cambio modalità mentre il timer corre
    currentMode = modeKey;
    timeLeft = MODES[modeKey].minutes * 60;

    // Aggiorna i colori dell'interfaccia in base alla modalità
    const color = MODES[modeKey].color;
    els.progress.style.stroke = color;
    els.time.style.color = color;

    updateUI();
  }

  /**
   * Avvia il timer.
   * Crea una sessione sul server se siamo in modalità Pomodoro.
   */
  async function startTimer() {
    if (isRunning) return;

    // Se si avvia un Pomodoro e non c'è una sessione attiva, creane una
    if (currentMode === 'pomodoro' && !currentSessionId) {
      try {
        const res = await fetch('/api/focus/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_type: currentMode,
            planned_minutes: MODES[currentMode].minutes
          })
        });
        const data = await res.json();
        if (data.ok) {
          currentSessionId = data.session_id; // Memorizza l'ID sessione
        }
      } catch (err) {
        console.error('Error starting session:', err);
      }
    }

    isRunning = true;
    toggleButtons();

    // Loop principale del timer (ogni secondo)
    timerId = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateUI();
      } else {
        completeTimer(); // Tempo scaduto
      }
    }, 1000);
  }

  /**
   * Mette in pausa il timer.
   */
  function pauseTimer() {
    if (!isRunning) return;
    clearInterval(timerId); // Ferma il loop
    isRunning = false;
    toggleButtons();
  }

  /**
   * Resetta il timer allo stato iniziale della modalità corrente.
   * Interrompe eventuali sessioni attive come 'abandoned'.
   */
  async function resetTimer() {
    pauseTimer();

    // Se c'era una sessione attiva, segnalala come abbandonata al server
    if (currentSessionId) {
      await stopSessionServer('abandoned');
    }

    // Ripristina il tempo totale
    timeLeft = MODES[currentMode].minutes * 60;
    updateUI();
  }

  /**
   * Gestisce il completamento del timer (00:00).
   */
  async function completeTimer() {
    pauseTimer();
    timeLeft = 0;
    updateUI();

    // Suona l'audio di fine
    if (els.audio) {
      els.audio.currentTime = 0;
      els.audio.play().catch(e => console.log('Audio play failed', e));
    }

    // Invia notifica desktop
    if (Notification.permission === "granted") {
      new Notification("Timer completato!", { body: `${MODES[currentMode].label} terminato.` });
    }

    // Chiude la sessione sul server come 'completed'
    if (currentSessionId) {
      await stopSessionServer('completed');
    }

    // Passa automaticamente alla modalità successiva (in pausa)
    nextMode();
  }

  /**
   * Comunica al server di terminare la sessione corrente.
   * @param {string} status - Lo stato finale ('completed' o 'abandoned')
   */
  async function stopSessionServer(status) {
    if (!currentSessionId) return;

    // Calcola i minuti completati (approssimato)
    const totalSec = MODES[currentMode].minutes * 60;
    const completedMinutes = Math.round((totalSec - timeLeft) / 60);

    try {
      await fetch('/api/focus/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          completed_minutes: completedMinutes,
          status: status
        })
      });
    } catch (err) {
      console.error('Error stopping session', err);
    }
    currentSessionId = null; // Reset ID sessione
  }

  /**
   * Passa alla modalità successiva (ciclo Pomodoro -> Pausa -> Pomodoro).
   * Resetta il timer e lo lascia in pausa.
   */
  function nextMode() {
    resetTimer();
    if (currentMode === 'pomodoro') {
      setMode('shortBreak');
    } else {
      setMode('pomodoro');
    }
  }

  // --- AGGIORNAMENTO INTERFACCIA ---

  /**
   * Aggiorna tutti gli elementi visuali (tempo, progress bar, titolo pagina).
   */
  function updateUI() {
    // Formatta MM:SS
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    els.time.textContent = `${pad(m)}:${pad(s)}`;
    els.mode.textContent = `Modalità: ${MODES[currentMode].label}`;

    // Aggiorna titolo tab browser (solo se attivo)
    if (isRunning) document.title = `${pad(m)}:${pad(s)} - Soundlly`;
    else document.title = 'Soundlly - Focus';

    // Calcola percentuale per il cerchio SVG
    const totalTime = MODES[currentMode].minutes * 60;
    const pct = ((totalTime - timeLeft) / totalTime) * 100;
    els.progress.style.strokeDashoffset = pct;

    toggleButtons();
  }

  /**
   * Mostra/Nasconde i bottoni in base allo stato (Play vs Pause).
   */
  function toggleButtons() {
    if (isRunning) {
      els.btnStart.hidden = true;
      els.btnPause.hidden = false;
      if (els.btnSettings) els.btnSettings.disabled = true; // Disabilita settings durante il timer
    } else {
      els.btnStart.hidden = false;
      els.btnPause.hidden = true;
      if (els.btnSettings) els.btnSettings.disabled = false;
    }
  }

  /**
   * Aggiunge lo zero iniziale per numeri < 10 (es. 9 -> '09').
   */
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  // Richiedi permessi notifica se necessario
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Avvio
  init();

})();
