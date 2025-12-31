# Relazione Dettagliata del Progetto

Questa relazione descrive ogni singola pagina e funzionalità del progetto, analizzando le route di backend, le view di frontend e le logiche associate.

## 1. Home / Dashboard Principale
**Route:** `GET /home`
**View:** `views/home.ejs`
**File Route:** `server.js`

La pagina principale dell'applicazione. È il punto di atterraggio dopo il login.
- **Funzionalità:**
  - Visualizza la barra di navigazione principale.
  - Mostra il Timer per le sessioni di focus (Pomodoro).
  - Gestisce la riproduzione dei suoni ambientali.
  - Mostra il progresso giornaliero dell'utente (minuti completati vs obiettivo).
- **Logica Backend:**
  - Calcola i minuti completati oggi interrogando la tabella `focus_sessions`.
  - Recupera l'obiettivo giornaliero dell'utente da `user_goals`.

## 2. Autenticazione (Login & Registrazione)
**Route:** `GET /login`
**View:** `views/login.ejs`
**File Route:** `server.js`

Gestisce l'accesso e la registrazione di nuovi utenti.
- **Funzionalità:**
  - Modulo di Login per utenti esistenti.
  - Modulo di Registrazione per creare un nuovo account.
  - Gestione errori (credenziali errate, utente già esistente) tramite query params.
  - Protezione CSRF.
- **Logica Backend:**
  - `POST /register`: Crea un nuovo utente nel database (`UserModel.create`).
  - `POST /login`: Autentica l'utente tramite Passport.js (strategia locale).

## 3. Profilo Utente
**Route:** `GET /profilo`
**View:** `views/profilo.ejs`
**File Route:** `routes/profile.js`

Pagina personale dell'utente dove può visualizzare e modificare i propri dati.
- **Funzionalità:**
  - Visualizzazione avatar, bio, città e altre info personali.
  - Modulo per aggiornare le informazioni del profilo (`display_name`, `bio`, ecc.).
  - Lista dei suoni/tracce caricate dall'utente.
- **Logica Backend:**
  - `POST /profilo/update`: Aggiorna i dati utente nella tabella `users`.
  - Recupera la lista dei suoni caricati dall'utente dalla tabella `sounds`.

## 4. Statistiche
**Route:** `GET /stats`
**View:** `views/stats.ejs`
**File Route:** `routes/stats.js`

Dashboard analitica per monitorare la produttività dell'utente.
- **Funzionalità:**
  - Visualizza il totale dei minuti di focus e numero di sessioni.
  - Grafici o indicatori di progresso Giornaliero, Settimanale e Mensile.
  - Statistiche sui To-Do (completati vs pendenti).
  - Classifica dei suoni ambientali più ascoltati ("Top 5 Sounds").
  - Cronologia delle sessioni recenti.
  - Modulo per impostare gli obiettivi di focus (Goals).
- **Logica Backend:**
  - Calcola aggregazioni complesse su `focus_sessions` e `user_goals`.
  - Recupera statistiche di ascolto da `ambient_listening_stats`.

## 5. Caricamento Contenuti (Upload)
**Route:** `GET /upload`
**View:** `views/upload.ejs`
**File Route:** `routes/upload.js`

Pagina dedicata al caricamento di file audio. Accessibile solo a utenti con ruolo **Creator** o **Admin**.
- **Funzionalità:**
  - Form per caricare file MP3.
  - Inserimento metadati: Titolo, Descrizione, Categoria (Musica/Ambient), Mood, Genere.
  - Gestione permessi: Se l'utente non è autorizzato, viene reindirizzato alla pagina Abbonamento.
- **Logica Backend:**
  - `POST /api/upload`: Gestisce l'upload fisico del file tramite `multer`.
  - Salva il file nella cartella `public/audio/...`.
  - Estrae automaticamente la durata del file audio.
  - Salva i metadati nel database `sounds`.

## 6. Abbonamenti
**Route:** `GET /abbonamento`
**View:** `views/abbonamento.ejs`
**File Route:** `server.js` & `routes/subscription.js`

Pagina per la gestione del piano di abbonamento.
- **Funzionalità:**
  - Mostra le differenze tra piano Standard, Creator e Premium.
  - Permette di effettuare l'upgrade del piano.
- **Logica Backend:**
  - `POST /api/subscription/upgrade`: Simula il processo di pagamento e aggiorna il ruolo o il piano dell'utente nel database.

## 7. Pannello Admin
**Route:** `GET /admin`
**View:** `views/admin.ejs`
**File Route:** `routes/admin.js`

Area riservata agli amministratori del sistema trasforma.
- **Funzionalità:**
  - Gestione dei suoni ambientali (Aggiunta, Modifica, Cancellazione).
  - Caricamento di nuove icone e file audio per i suoni ambientali di sistema.
  - Visualizzazione di tutti i brani caricati dagli utenti (moderazione base).
- **Logica Backend:**
  - CRUD completo sulla tabella `sounds`.
  - Gestione file su disco (cancellazione file quando viene eliminato il record).

## 8. API Timer & Focus
**File Route:** `routes/focus.js`

Set di endpoint JSON per supportare il funzionamento del Timer nella Home.
- **Funzionalità:**
  - `GET/POST /api/focus/settings`: Legge e salva le preferenze di durata del timer (Pomodoro/Pausa).
  - `POST /api/focus/start` & `/stop`: Registra l'inizio e la fine delle sessioni di focus per le statistiche.
  - `GET/POST /api/focus/ambient...`: Gestisce le preferenze di volume e attivazione dei suoni ambientali.

---
**Note Tecniche Generali:**
- **Database:** SQLite (`db/sqlite.js`).
- **Autenticazione:** Passport.js con sessioni persistenti.
- **View Engine:** EJS (Embedded JavaScript templates).
- **Sicurezza:** CSRF protection su form critici, middleware `ensureAuthenticated` per proteggere le route.
