/**
 * timer.js
 * 
 * Gestisce il Timer Pomodoro (25/5/15) con interfaccia circolare.
 * Refactoring: Conversione in Classe ES6 come richiesto dall'esame.
 */

class FocusTimer {
  constructor() {
    const userId = document.body.dataset.userId || 'guest';
    this.STORAGE_KEY = `soundlly_timer_state_v1_${userId}`;

    // --- CONFIGURAZIONE DEFAULT ---
    this.MODES = {
      pomodoro: { minutes: 25, label: 'Pomodoro', color: '#2a9d8f' },
      shortBreak: { minutes: 5, label: 'Pausa Breve', color: '#e9c46a' }
    };

    if (userId === 'guest') {
      console.warn("Timer in Guest Mode. Stats will not be saved.");
      // Optional: Add a visual indicator
      const label = document.getElementById('pomoMode');
      if (label) label.title = "Modalità Ospite: le statistiche non verranno salvate";
    }

    // --- STATO ---
    this.currentMode = 'pomodoro';
    this.timeLeft = this.MODES.pomodoro.minutes * 60;
    this.timerId = null;
    this.isRunning = false;
    this.currentSessionId = null;
    this.sessionStartDuration = null; // Snapshot of duration at start

    // --- ELEMENTI DOM ---
    this.els = {
      time: document.getElementById('pomoTime'),
      progress: document.getElementById('pomoProgress'),
      mode: document.getElementById('pomoMode'),
      btnStart: document.getElementById('pomoStart'),
      btnPause: document.getElementById('pomoPause'),
      btnReset: document.getElementById('pomoReset'),
      btnSkip: document.getElementById('pomoSkip'),
      audio: document.getElementById('pomoDing'),
      btnSettings: document.getElementById('pomoSettingsBtn'),
      panelSettings: document.getElementById('pomoSettingsPanel'),
      btnSaveSettings: document.getElementById('saveSettingsBtn'),
      inputs: {
        pomodoro: document.getElementById('setPomo'),
        shortBreak: document.getElementById('setShort')
      }
    };

    // Avvio solo se gli elementi esistono
    if (this.els.time && this.els.progress && this.els.btnStart) {
      this.init();
    }
  }

  async init() {
    await this.loadSettings();

    const restored = this.loadState();
    if (!restored) {
      this.updateUI();
    }

    this.bindEvents();

    if (!restored) {
      this.setMode('pomodoro');
    } else {
      // Restore colors for the current mode
      const color = this.MODES[this.currentMode].color;
      if (this.els.progress) this.els.progress.style.stroke = color;
      if (this.els.time) this.els.time.style.color = color;

      this.updateUI();
      this.toggleButtons();
      if (this.isRunning) {
        this.startTimer(true); // Resume
      } else if (this.timeLeft === 0 && this.MODES[this.currentMode].minutes > 0) {
        // Did we expire while away?
        console.log('[Timer] Found expired timer on load. Completing...');
        this.completeTimer();
      }
    }

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }

  bindEvents() {
    this.els.btnStart.addEventListener('click', () => this.startTimer());
    this.els.btnPause.addEventListener('click', () => this.pauseTimer());
    this.els.btnReset.addEventListener('click', () => this.resetTimer());
    if (this.els.btnSkip) this.els.btnSkip.addEventListener('click', () => this.nextMode());

    if (this.els.btnSettings) {
      this.els.btnSettings.addEventListener('click', () => {
        // Toggle visibility using classes if possible, but for minimal DOM change we keep toggle logic
        // Ideally: this.els.panelSettings.classList.toggle('d-none');
        // Checking current style for compatibility with existing inline logic if we haven't fully cleaned CSS yet
        if (this.els.panelSettings.style.display === 'none' || this.els.panelSettings.classList.contains('hidden')) {
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

  // --- API SETTINGS ---

  async loadSettings() {
    try {
      const res = await fetch('/api/focus/settings');
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.pomodoro) this.MODES.pomodoro.minutes = cfg.pomodoro;
        if (cfg.shortBreak) this.MODES.shortBreak.minutes = cfg.shortBreak;

        if (!this.isRunning) {
          this.timeLeft = this.MODES[this.currentMode].minutes * 60;
          this.updateUI();
        }
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
    if (this.els.inputs.pomodoro) this.els.inputs.pomodoro.value = this.MODES.pomodoro.minutes;
    if (this.els.inputs.shortBreak) this.els.inputs.shortBreak.value = this.MODES.shortBreak.minutes;
  }

  async saveSettings() {
    const p = parseInt(this.els.inputs.pomodoro.value) || 25;
    const s = parseInt(this.els.inputs.shortBreak.value) || 5;

    this.MODES.pomodoro.minutes = p;
    this.MODES.shortBreak.minutes = s;

    try {
      await fetch('/api/focus/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pomodoro: p, shortBreak: s })
      });
    } catch (e) {
      console.error('Error saving settings', e);
    }

    this.els.panelSettings.style.display = 'none';
    if (!this.isRunning) {
      this.resetTimer();
    }
  }

  // --- LOGIC ---

  setMode(modeKey) {
    if (this.isRunning) return;
    this.currentMode = modeKey;
    this.timeLeft = this.MODES[modeKey].minutes * 60;

    const color = this.MODES[modeKey].color;
    this.els.progress.style.stroke = color;
    this.els.time.style.color = color;

    this.updateUI();
    this.saveState();
  }

  async startTimer(isResume = false) {
    if (this.isRunning && !isResume) return;

    // Snapshot duration if starting fresh
    if (!isResume) {
      this.sessionStartDuration = this.MODES[this.currentMode].minutes * 60;
    }

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
          this.saveState();
        }
      } catch (err) {
        console.error('Error starting session:', err);
        alert('Attenzione: Impossibile avviare la sessione di studio sul server. Le statistiche potrebbero non essere salvate. Verifica la connessione o effettua il login.');
      }
    }

    this.isRunning = true;
    this.saveState();
    this.toggleButtons();

    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateUI();
      } else {
        this.completeTimer();
      }
    }, 1000);
  }

  pauseTimer() {
    if (!this.isRunning) return;
    clearInterval(this.timerId);
    this.isRunning = false;
    this.saveState();
    this.toggleButtons();
  }

  async resetTimer() {
    this.pauseTimer();
    if (this.currentSessionId) {
      await this.stopSessionServer('abandoned');
    }
    this.timeLeft = this.MODES[this.currentMode].minutes * 60;
    this.sessionStartDuration = null;
    this.clearState();
    this.updateUI();
  }

  async completeTimer() {
    this.pauseTimer();
    this.timeLeft = 0;
    this.clearState();
    this.updateUI();

    if (this.els.audio) {
      this.els.audio.currentTime = 0;
      this.els.audio.play().catch(e => console.log('Audio error', e));
    }

    if (Notification.permission === "granted") {
      new Notification("Timer completato!", { body: `${this.MODES[this.currentMode].label} terminato.` });
    }

    if (this.currentSessionId) {
      await this.stopSessionServer('completed');
    }

    this.nextMode();
  }

  async stopSessionServer(status) {
    if (!this.currentSessionId) return;

    // Use snapshot if available, else fallback to current settings
    const totalSec = this.sessionStartDuration || (this.MODES[this.currentMode].minutes * 60);

    // Ensure we don't return negative minutes if settings changed mid-session
    const rawMinutes = Math.ceil((totalSec - this.timeLeft) / 60);
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
        this.updateHomeWidget(data);
      }
    } catch (err) {
      console.error('Error stopping session', err);
    }
    this.currentSessionId = null;
    this.sessionStartDuration = null;
  }

  updateHomeWidget(data) {
    const { todayMinutes, pomoCount } = data;
    const widget = document.getElementById('focusWidget');
    if (!widget) return; // Not on home page or widget missing

    const elCount = document.getElementById('widgetPomoCount');
    const elTime = document.getElementById('widgetBigTime');
    const elRing = document.getElementById('widgetRing');

    if (elCount) elCount.textContent = pomoCount;
    if (elTime) {
      const hours = Math.floor(todayMinutes / 60);
      const mins = todayMinutes % 60;
      elTime.textContent = (hours > 0 ? hours + 'h ' : '') + mins + 'm';
    }

    if (elRing && widget.dataset.dailyGoal) {
      const dailyGoal = parseInt(widget.dataset.dailyGoal) || 60;
      const goalPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);
      const radius = 42;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (goalPercent / 100) * circumference;

      elRing.style.strokeDashoffset = offset;
    }
  }

  nextMode() {
    this.resetTimer();
    this.setMode(this.currentMode === 'pomodoro' ? 'shortBreak' : 'pomodoro');
  }

  // --- UI ---

  updateUI() {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    this.els.time.textContent = `${this.pad(m)}:${this.pad(s)}`;
    this.els.mode.textContent = `Modalità: ${this.MODES[this.currentMode].label}`;

    document.title = this.isRunning ? `${this.pad(m)}:${this.pad(s)} - Soundlly` : 'Soundlly - Focus';

    // For progress bar, use sessionStartDuration if running/paused, else current settings
    const totalTime = this.sessionStartDuration || (this.MODES[this.currentMode].minutes * 60);
    const pct = ((totalTime - this.timeLeft) / totalTime) * 100;
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

  pad(n) {
    return n < 10 ? '0' + n : n;
  }

  // --- PERSISTENCE ---

  saveState() {
    const state = {
      mode: this.currentMode,
      isRunning: this.isRunning,
      timeLeft: this.timeLeft,
      sessionId: this.currentSessionId,
      sessionStartDuration: this.sessionStartDuration, // Save snapshot
      timestamp: Date.now()
    };
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
      this.sessionStartDuration = state.sessionStartDuration || null; // Restore snapshot

      if (this.isRunning && state.targetTime) {
        const diffSeconds = Math.round((state.targetTime - Date.now()) / 1000);
        if (diffSeconds > 0) {
          this.timeLeft = diffSeconds;
        } else {
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

// Instantiate and expose
document.addEventListener('DOMContentLoaded', () => {
  window.Soundlly = window.Soundlly || {};
  window.Soundlly.timer = new FocusTimer();
});
