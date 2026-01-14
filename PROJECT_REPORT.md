# Relazione Tecnica: Progetto Soundlly

## 1. Panoramica del Progetto
**Soundlly** è un'applicazione web focalizzata sulla produttività e il benessere, che combina un timer di focus (tecnica del Pomodoro) con funzionalità di riproduzione musicale e suoni ambientali. Il sistema include un sistema di autenticazione, gestione delle attività (To-Do), statistiche utente e un pannello di amministrazione per la gestione dei contenuti multimediali.

### Stack Tecnologico
- **Backend**: Node.js con Express.js
- **Database**: SQLite3 (tramite libreria `sqlite3` e wrapper custom)
- **Frontend Server-Side**: EJS (Embedded JavaScript templates)
- **Autenticazione**: Passport.js (Local Strategy)
- **Sessioni**: express-session (Store in memoria, non persistente al riavvio server)
- **Upload**: Multer

---

## 2. Analisi Funzionale (Cosa fa il programma)

Il sistema è suddiviso in moduli logici ben definiti:

### 2.1 Autenticazione e Utenti
- **Login/Registrazione**: Gli utenti possono registrarsi con nome utente e password. Le password sono criptate in modo sicuro usando `bcrypt`.
- **Ruoli**: Esiste un sistema di ruoli (`user`, `admin`, `creator`) che differenzia l'accesso alle funzionalità (es. pannello admin, upload).
- **Abbonamenti**: È presente una struttura (mockup) per l'upgrade dei piani utente (Standard, Premium, Creator).

### 2.2 Produttività (Focus & To-Do)
- **Timer Focus**: Permette di avviare sessioni di lavoro (Pomodoro) o pausa. Le sessioni vengono registrate nel database con durata e stato.
- **To-Do List**: Una lista di attività semplice (CRUD) che permette di aggiungere, completare e cancellare task. Le attività sono collegate all'utente loggato.

### 2.3 Audio e Musica
- **Suoni Ambientali**: Gli utenti possono ascoltare suoni ambientali (gestiti dagli Admin) e regolarne il volume. Le preferenze di volume vengono salvate.
- **Musica**: Esiste una categorizzazione tra musica e suoni ambientali.
- **Player**: Il frontend (non analizzato in dettaglio, ma supportato dal backend) gestisce la riproduzione.

### 2.4 Statistiche
- **Dashboard**: Fornisce una vista dettagliata delle performance dell'utente:
  - Minuti totali di focus e sessioni completate.
  - Grafico settimanale dell'attività.
  - Attività To-Do completate vs pendenti.
  - Obiettivi giornalieri/settimanali impostabili dall'utente.

### 2.5 Amministrazione e Upload
- **Pannello Admin**: Accessibile solo agli admin, permette di visualizzare e gestire i suoni caricati.
- **Upload**: Gli utenti con ruolo `creator` o `admin` possono caricare file audio (MP3) con metadati (titolo, categoria, copertina).
- **Gestione File**: I file caricati vengono salvati nel filesystem (`public/audio/...`) e rinominati per evitare conflitti.

---

## 3. Analisi della Sicurezza

### Cosa va bene ✅
- **SQL Injection**: L'uso costante di query parametriche (es. `db.run('... values (?, ?)', [a, b])`) protegge efficacemente contro iniezioni SQL.
- **Password Hashing**: L'utilizzo di `bcrypt` con salt (default 10) è lo standard industriale per la protezione delle password.
- **Protezione CSRF**: È implementato un sistema artigianale ma funzionale di token CSRF (`ensureCsrfToken`, `checkCsrf`) che protegge le form di login e registrazione.
- **Controllo Accessi**: Il middleware `ensureAuthenticated` e `ensureAdmin` protegge correttamente le rotte sensibili.

### Cosa richiede attenzione ⚠️
- **Session Store**: Le sessioni sono salvate in memoria (`MemoryStore` di default in express-session). Questo non è adatto alla produzione perché causa leak di memoria e disconnette tutti gli utenti ad ogni riavvio del server.
- **Validazione File**: L'upload controlla l'estensione del file ma potrebbe beneficiare di una verifica più approfondita del "MIME type" reale per prevenire upload malevoli camuffati (anche se `music-metadata` aiuta parzialmente).
- **Input Validation**: Manca una libreria di validazione robusta (come Joi o Zod). I controlli sono fatti manualmente (es. `if (!title)...`).

---

## 4. Qualità del Codice e Struttura

### Punti di Forza
- **Modularità**: Il codice è ben organizzato. Le rotte sono separate in file dedicati (`routes/`), così come i modelli (`models/`) e la configurazione del DB.
- **Leggibilità**: Il codice è pulito e generalmente facile da seguire.

### File Potenzialmente Inutili o di Debug
Durante la scansione sono stati individuati file che sembrano script di utilità o residui:
- `debug_ejs.js`: Probabilmente usato per testare template EJS. Se non serve in produzione, può essere rimosso o spostato in una cartella `tests/`.
- `patch_db.js`: Sembra uno script "one-off" per correggere il database. Dovrebbe essere archiviato o rimosso se l'operazione è conclusa.
- `scripts/`: Contiene script di seeding. Utili in dev, ma da gestire con cura in produzione.

### Problemi Noti (Cosa non va)
- **Hardcoed Secrets**: Il `SESSION_SECRET` in `server.js` ha un fallback hardcodato molto lungo. In produzione, questo DEVE venire *esclusivamente* dalle variabili d'ambiente (.env).
- **Error Handling**: Alcuni `catch` stampano solo l'errore in console (`console.error`) senza notificare adeguatamente l'utente o un sistema di monitoraggio.

---

## 5. Conclusioni e Raccomandazioni

Il progetto è **solido e ben strutturato** per una fase di sviluppo/MVP. Le funzionalità core sono implementate correttamente e la sicurezza di base è presente.

**Prossimi Passi Consigliati:**
1.  **Spostare le Sessioni su DB**: Usare `connect-sqlite3` per salvare le sessioni nel database invece che in RAM.
2.  **Pulizia**: Rimuovere `debug_ejs.js` e verificare se `patch_db.js` è ancora necessario.
3.  **Sicurezza Upload**: Rafforzare i controlli sui file caricati per assicurarsi che siano veramente file audio.
4.  **Variabili d'Ambiente**: Creare un file `.env.example` per documentare le variabili necessarie.
