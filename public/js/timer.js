/**
 * timer.js
 * 
 * Gestore principale del Timer Focus (Tecnica del Pomodoro).
 * 
 * Questo script gestisce:
 * 1. La logica del conto alla rovescia (start, pausa, stop).
 * 2. L'interfaccia utente circolare (barra di progresso SVG).
 * 3. La sincronizzazione con il server per salvare le sessioni di studio.
 * 4. La persistenza locale (LocalStorage) per non perdere il timer se si ricarica la pagina.
 * 5. Le notifiche browser e i suoni di completamento.
 */

class FocusTimer {
  constructor() {
    // Identifica l'utente corrente per salvare lo stato localmente con una chiave univoca
    const userId = document.body.dataset.userId || 'guest';
    this.STORAGE_KEY = `soundlly_timer_state_v1_${userId}`;

    // --- CONFIGURAZIONE MODALITÀ ---
    // Definiamo i tempi base (in minuti) e i colori per ogni modalità
    this.MODES = {
      pomodoro: { minutes: 25, label: 'Pomodoro', color: '#2a9d8f' },   // Verde acqua
      shortBreak: { minutes: 5, label: 'Pausa Breve', color: '#e9c46a' } // Giallo senape
    };

    if (userId === 'guest') {
      console.warn("Timer in modalità Ospite: le statistiche non verranno salvate.");
    }

    // --- STATO INTERNO ---
    this.currentMode = 'pomodoro';
    this.timeLeft = this.MODES.pomodoro.minutes * 60; // Tempo in secondi
    this.timerId = null;        // Riferimento all'intervallo setInterval
    this.isRunning = false;     // Flag stato esecuzione
    this.currentSessionId = null; // ID sessione lato server (per salvare statistiche)
    this.sessionStartDuration = null; // Durata iniziale snapshot (per calcolo % progresso)

    // --- RIFERIMENTI AL DOM (Cache elements) ---
    this.els = {
      time: document.getElementById('pomoTime'),       // Testo 25:00
      progress: document.getElementById('pomoProgress'), // Cerchio SVG
      mode: document.getElementById('pomoMode'),       // Testo "Modalità: Pomodoro"

      // Controlli Principali
      btnStart: document.getElementById('pomoStart'),
      btnPause: document.getElementById('pomoPause'),
      btnReset: document.getElementById('pomoReset'),
      btnSkip: document.getElementById('pomoSkip'),

      // Feedback
      audio: document.getElementById('pomoDing'),

      // Pannello Impostazioni
      btnSettings: document.getElementById('pomoSettingsBtn'),
      panelSettings: document.getElementById('pomoSettingsPanel'),
      btnSaveSettings: document.getElementById('saveSettingsBtn'),
      inputs: {
        pomodoro: document.getElementById('setPomo'),
        shortBreak: document.getElementById('setShort')
      }
    };

    // Avvia l'inizializzazione solo se gli elementi necessari esistono nella pagina
    if (this.els.time && this.els.progress && this.els.btnStart) {
      this.init();
    }
  }

  // Metodo di inizializzazione asincrono
  async init() {
    // 1. Carica le impostazioni personalizzate dell'utente dal server
    await this.loadSettings();

    // 2. Tenta di ripristinare uno stato precedente dal LocalStorage
    // (Utile se l'utente ha chiuso e riaperto la scheda)
    const restored = this.loadState();

    // 3. Collega gli eventi ai pulsanti
    this.bindEvents();

    if (!restored) {
      // Se non c'era nulla da ripristinare, imposta lo stato di default
      this.setMode('pomodoro');
      this.updateUI();
    } else {
      // Se abbiamo ripristinato uno stato:
      // Applica i colori corretti per la modalità recuperata (Bugfix Refresh)
      const color = this.MODES[this.currentMode].color;
      if (this.els.progress) this.els.progress.style.stroke = color;
      if (this.els.time) this.els.time.style.color = color;

      this.updateUI();

      // Se il timer era in esecuzione, riprendilo
      if (this.isRunning) {
        this.startTimer(true); // true = isResume
      } else if (this.timeLeft === 0 && this.MODES[this.currentMode].minutes > 0) {
        // Se il tempo è scaduto mentre eravamo via (calcolato in background)
        console.log('[Timer] Trovato timer scaduto al caricamento. Completamento...');
        this.completeTimer();
      }
    }

    // Richiede permesso notifiche se non ancora concesso
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Bugfix Animation: Aggiungi la classe per l'animazione solo dopo il primo render
    // per evitare che l'anello "salti" o ruoti al caricamento della pagina.
    if (this.els.progress) {
      setTimeout(() => {
        this.els.progress.classList.add('pomo-animated');
      }, 100);
    }
  }

  bindEvents() {
    this.els.btnStart.addEventListener('click', () => this.startTimer());
    this.els.btnPause.addEventListener('click', () => this.pauseTimer());
    this.els.btnReset.addEventListener('click', () => this.resetTimer());
    if (this.els.btnSkip) this.els.btnSkip.addEventListener('click', () => this.nextMode());

    // Gestione Pannello Impostazioni
    if (this.els.btnSettings) {
      this.els.btnSettings.addEventListener('click', () => {
        // Toggle visibilità pannello overlay
        const style = window.getComputedStyle(this.els.panelSettings);
        const isHidden = style.display === 'none';

        if (isHidden) {
          this.els.panelSettings.style.display = 'block';
          this.els.panelSettings.classList.remove('hidden');
        } else {
          this.els.panelSettings.style.display = 'none';
          this.els.panelSettings.classList.add('hidden');
        }
      });
    }

    if (this.els.btnSaveSettings) {
      this.els.btnSaveSettings.addEventListener('click', () => this.saveSettings());
    }
  }

  // --- GESTIONE IMPOSTAZIONI (API) ---

  async loadSettings() {
    try {
      const res = await fetch('/api/focus/settings');
      if (res.ok) {
        const cfg = await res.json();
        // Sovrascrive i default con le preferenze utente
        if (cfg.pomodoro) this.MODES.pomodoro.minutes = cfg.pomodoro;
        if (cfg.shortBreak) this.MODES.shortBreak.minutes = cfg.shortBreak;

        // Se il timer è fermo, aggiorna il tempo visualizzato con i nuovi valori
        if (!this.isRunning) {
          this.timeLeft = this.MODES[this.currentMode].minutes * 60;
          this.updateUI();
        }
      }
    } catch (e) {
      console.error('Errore caricamento impostazioni', e);
    }
    // Aggiorna anche gli input del pannello impostazioni
    if (this.els.inputs.pomodoro) this.els.inputs.pomodoro.value = this.MODES.pomodoro.minutes;
    if (this.els.inputs.shortBreak) this.els.inputs.shortBreak.value = this.MODES.shortBreak.minutes;
  }

  async saveSettings() {
    const p = parseInt(this.els.inputs.pomodoro.value) || 25;
    const s = parseInt(this.els.inputs.shortBreak.value) || 5;

    // Aggiorna configurazione locale
    this.MODES.pomodoro.minutes = p;
    this.MODES.shortBreak.minutes = s;

    // Salva sul server
    try {
      await fetch('/api/focus/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pomodoro: p, shortBreak: s })
      });
    } catch (e) {
      console.error('Errore salvataggio impostazioni', e);
    }

    this.els.panelSettings.style.display = 'none';

    // Resetta il timer per applicare il nuovo tempo (solo se non era in corso)
    if (!this.isRunning) {
      this.resetTimer();
    }
  }

  // --- LOGICA TIMER ---

  setMode(modeKey) {
    if (this.isRunning) return; // Non cambiare modalità mentre conta
    this.currentMode = modeKey;
    this.timeLeft = this.MODES[modeKey].minutes * 60;

    // Imposta il colore del tema (anello e testo)
    const color = this.MODES[modeKey].color;
    this.els.progress.style.stroke = color;
    this.els.time.style.color = color;

    this.updateUI();
    this.saveState();
  }

  async startTimer(isResume = false) {
    if (this.isRunning && !isResume) return;

    // Snapshot per calcolo barra progresso (se è un nuovo avvio)
    if (!isResume) {
      this.sessionStartDuration = this.MODES[this.currentMode].minutes * 60;
    }

    // Se è una sessione 'pomodoro' (studio) e non abbiamo ancora un ID sessione, creiamola sul server
    if (this.currentMode === 'pomodoro' && !this.currentSessionId) {
      try {
        const res = await fetch('/api/focus/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_type: this.currentMode,
            planned_minutes: this.MODES[this.currentMode].minutes
          })
        });
        const data = await res.json();
        if (data.ok) {
          this.currentSessionId = data.session_id;
          this.saveState(); // Salviamo l'ID sessione localmente
        }
      } catch (err) {
        console.error('Errore avvio sessione:', err);
      }
    }

    this.isRunning = true;
    this.saveState();
    this.toggleButtons(); // Mostra Pausa, Nascondi Start

    if (this.timerId) clearInterval(this.timerId);

    // Il cuore del timer: tick ogni secondo
    this.timerId = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateUI();
      } else {
        this.completeTimer(); // Tempo scaduto
      }
    }, 1000);
  }

  pauseTimer() {
    if (!this.isRunning) return;
    clearInterval(this.timerId); // Ferma il conteggio
    this.isRunning = false;
    this.saveState();
    this.toggleButtons(); // Mostra Start, Nascondi Pausa
  }

  async resetTimer() {
    this.pauseTimer();

    // Se c'era una sessione attiva sul server, segnaliamola come 'abbandonata'
    if (this.currentSessionId) {
      await this.stopSessionServer('abandoned');
    }

    // Ripristina tempo iniziale
    this.timeLeft = this.MODES[this.currentMode].minutes * 60;
    this.sessionStartDuration = null;
    this.clearState(); // Pulisce LocalStorage
    this.updateUI();
  }

  async completeTimer() {
    this.pauseTimer();
    this.timeLeft = 0;
    this.clearState();
    this.updateUI();

    // Feedback Sonoro
    if (this.els.audio) {
      this.els.audio.currentTime = 0;
      this.els.audio.play().catch(e => console.log('Errore audio', e));
    }

    // Feedback Notifica
    if (Notification.permission === "granted") {
      new Notification("Timer completato!", { body: `${this.MODES[this.currentMode].label} terminato.` });
    }

    // Aggiorna stato sul server (completato)
    if (this.currentSessionId) {
      await this.stopSessionServer('completed');
    }

    // Passa automaticamente alla modalità successiva (Pausa <-> Pomodoro)
    this.nextMode();
  }

  // Notifica al server che la sessione è finita
  async stopSessionServer(status) {
    if (!this.currentSessionId) return;

    // Calcolo minuti effettivi svolti
    // Usa lo snapshot se disponibile (per precisione se l'utente ha cambiato impostazioni durante)
    const totalSec = this.sessionStartDuration || (this.MODES[this.currentMode].minutes * 60);
    const rawMinutes = Math.floor((totalSec - this.timeLeft) / 60);
    const completedMinutes = Math.max(0, rawMinutes);

    try {
      const res = await fetch('/api/focus/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.currentSessionId,
          completed_minutes: completedMinutes,
          status: status
        })
      });
      const data = await res.json();
      if (data.ok) {
        // Aggiorna il widget statistiche giornaliere senza ricaricare pagina
        this.updateHomeWidget(data);
      }
    } catch (err) {
      console.error('Errore chiusura sessione', err);
    }
    this.currentSessionId = null;
    this.sessionStartDuration = null;
  }

  // Aggiorna il widget "Obiettivo Giornaliero" nella dashboard
  updateHomeWidget(data) {
    const { todayMinutes, pomoCount } = data;
    const widget = document.getElementById('focusWidget');
    if (!widget) return;

    // Aggiorna contatori testo
    const elCount = document.getElementById('widgetPomoCount');
    const elTime = document.getElementById('widgetBigTime');
    const elRing = document.getElementById('widgetRing');

    if (elCount) elCount.textContent = pomoCount;
    if (elTime) {
      const hours = Math.floor(todayMinutes / 60);
      const mins = todayMinutes % 60;
      elTime.textContent = (hours > 0 ? hours + 'h ' : '') + mins + 'm';
    }

    // Aggiorna anello progresso obiettivo
    if (elRing && widget.dataset.dailyGoal) {
      const dailyGoal = parseInt(widget.dataset.dailyGoal) || 60;
      const goalPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);

      // Calcoli geometrici cerchio SVG (raggio 42)
      const radius = 42;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (goalPercent / 100) * circumference;

      elRing.style.strokeDashoffset = offset;
    }
  }

  nextMode() {
    this.resetTimer();
    // Alterna tra Pomodoro e Pausa Breve
    this.setMode(this.currentMode === 'pomodoro' ? 'shortBreak' : 'pomodoro');
  }

  // --- INTERFACCIA UTENTE (UI) ---

  updateUI() {
    // Formattazione MM:SS
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    this.els.time.textContent = `${this.pad(m)}:${this.pad(s)}`;
    this.els.mode.textContent = `Modalità: ${this.MODES[this.currentMode].label}`;

    // Aggiorna titolo tab browser
    document.title = this.isRunning ? `${this.pad(m)}:${this.pad(s)} - Soundlly` : 'Soundlly - Focus';

    // Calcolo barra progresso circolare
    const totalTime = this.sessionStartDuration || (this.MODES[this.currentMode].minutes * 60);
    const pct = ((totalTime - this.timeLeft) / totalTime) * 100;

    // strokeDashoffset: 100 = vuoto, 0 = pieno (o viceversa in base al CSS)
    this.els.progress.style.strokeDashoffset = pct;

    this.toggleButtons();
  }

  toggleButtons() {
    if (this.isRunning) {
      this.els.btnStart.hidden = true;
      this.els.btnPause.hidden = false;
      if (this.els.btnSettings) this.els.btnSettings.disabled = true;
    } else {
      this.els.btnStart.hidden = false;
      this.els.btnPause.hidden = true;
      if (this.els.btnSettings) this.els.btnSettings.disabled = false;
    }
  }

  // Utility zero-padding (es. 5 -> "05")
  pad(n) {
    return n < 10 ? '0' + n : n;
  }

  // --- PERSISTENZA LOCAL STORAGE ---

  saveState() {
    const state = {
      mode: this.currentMode,
      isRunning: this.isRunning,
      timeLeft: this.timeLeft,
      sessionId: this.currentSessionId,
      sessionStartDuration: this.sessionStartDuration,
      timestamp: Date.now()
    };
    // Se è in esecuzione, calcoliamo il momento esatto in cui finirà
    // Questo permette a background-timer.js di sapere se è scaduto
    if (this.isRunning) {
      state.targetTime = Date.now() + (this.timeLeft * 1000);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);

      this.currentMode = state.mode || 'pomodoro';
      this.currentSessionId = state.sessionId || null;
      this.isRunning = state.isRunning || false;
      this.sessionStartDuration = state.sessionStartDuration || null;

      // Sincronizzazione tempo trascorso offline
      if (this.isRunning && state.targetTime) {
        const diffSeconds = Math.round((state.targetTime - Date.now()) / 1000);
        if (diffSeconds > 0) {
          this.timeLeft = diffSeconds; // Aggiorna al tempo rimanente reale
        } else {
          // Scaduto nel passato
          this.timeLeft = 0;
          this.isRunning = false;
        }
      } else {
        this.timeLeft = state.timeLeft || this.MODES[this.currentMode].minutes * 60;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  clearState() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Istanziazione al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
  window.Soundlly = window.Soundlly || {};
  window.Soundlly.timer = new FocusTimer();
});
