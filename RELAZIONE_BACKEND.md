# Relazione Tecnica Backend - Progetto Soundlly

## 1. Introduzione e Stack Tecnologico
Il backend del progetto **Soundlly** è costruito utilizzando **Node.js** come runtime environment e **Express.js** come web framework. Questa scelta garantisce un'architettura leggera, scalabile e basata su eventi, ideale per applicazioni web moderne che gestiscono funzionalità real-time come timer e riproduzione audio.

**Tecnologie Principali:**
*   **Runtime**: Node.js
*   **Framework**: Express 5.x
*   **Database**: SQLite (tramite libreria `sqlite3`)
*   **Autenticazione**: Passport.js con strategia locale
*   **Template Engine**: EJS (Server-Side Rendering)
*   **Hashing**: Bcrypt (per la sicurezza delle password)
*   **Session Management**: Express-session

---

## 2. Architettura del Progetto
Il progetto segue un'architettura **MVC (Model-View-Controller)** adattata, separando chiaramente la logica di gestione dei dati, la logica applicativa (rotte) e la presentazione.

### Struttura delle Directory
*   **`/server.js`**: Entry point dell'applicazione. Configura i middleware, inizializza il database, gestisce le sessioni e monta le rotte principali.
*   **`/routes`**: Contiene i "Controller" dell'applicazione. Ogni file gestisce uno specifico dominio funzionale (es. `auth`, `music`, `admin`).
*   **`/models`**: Contiene la logica di accesso ai dati (DAO). Sebbene l'interazione avvenga spesso direttamente tramite helper SQL, esistono modelli specifici come `UserModel.js`.
*   **`/db`**: Gestione della connessione al database SQLite e helper functions (`run`, `get`, `all`) per semplificare le query asincrone (Promise-based).
*   **`/middleware`**: Funzioni intermedie per la gestione della sicurezza (es. `ensureAuthenticated`, `ensureAdmin`) e setup globale delle variabili (`res.locals`).
*   **`/migrations`**: Script SQL per la definizione e il versionamento dello schema del database (es. `init-v3.sql`).
*   **`/auth`**: Configurazione della strategia di autenticazione con Passport.

---

## 3. Database (SQLite)
Il sistema di persistenza è un database relazionale **SQLite** (`database.sqlite`), ottimizzato per l'uso locale e la portabilità. Lo schema è definito nel file `init-v3.sql` ed è strutturato per supportare funzionalità avanzate.

### Tabelle Principali
1.  **`users`**: Gestione utenti, credenziali (password hashata), impostazioni del profilo (bio, avatar, mood), configurazione del timer e stato dell'abbonamento (standard/premium/admin).
2.  **`sounds`**: Catalogo centrale dei file audio. Distingue tra `music` (canzoni con copertina) e `ambient` (suoni di sottofondo). Supporta livelli di accesso (`public`, `premium`, `private`).
3.  **`focus_sessions`**: Registro delle sessioni di studio (Pomodoro). Traccia l'inizio, la fine, i minuti pianificati vs completati e lo stato della sessione (completata/interrotta).
4.  **`playlists` & `playlist_items`**: Sistema per permettere agli utenti di creare raccolte personalizzate di brani.
5.  **`sound_likes` & `playlist_likes`**: Gestione dell'engagement (funzionalità "Mi piace").
6.  **`user_goals`**: Obiettivi di studio personalizzati (giornalieri, settimanali, mensili).
7.  **`listening_history` & `ambient_listening_stats`**: Tabelle analitiche per tracciare le abitudini di ascolto e generare statistiche.

---

## 4. Autenticazione e Sicurezza
La sicurezza è un pilastro centrale del backend.

*   **Autenticazione**: Gestita tramite **Passport.js**.
    *   Utilizza `passport-local` per login con username e password.
    *   Le password vengono salvate esclusivamente come hash cifrati tramite **bcrypt**.
    *   Nessuna password in chiaro viene mai memorizzata o loggata.
*   **Gestione Sessioni**: Utilizza `express-session` per mantenere lo stato dell'utente tra le richieste HTTP. I cookie di sessione sono configurati con flag `httpOnly` per prevenire attacchi XSS.
*   **Protezione CSRF**: Implementazione custom nel `server.js`.
    *   Genera un token crittografico univoco per sessione.
    *   Verifica la presenza del token in tutte le richieste `POST` sensibili (login, register), bloccando tentativi di *Cross-Site Request Forgery*.
*   **Middleware di Ruolo**: Middleware specifici (`ensureAuthenticated`, `ensureAdmin`) proteggono le rotte sensibili, garantendo che solo gli utenti autorizzati possano accedere a determinate funzionalità (es. pannello admin).

---

## 5. Analisi Funzionale delle Rotte (Business Logic)

### A. Focus & Timer (`routes/focus.js`)
Gestisce il core business dell'app: la produttività.
*   **Timer Settings**: Permette di leggere e salvare le preferenze personali per la durata del Pomodoro e delle pause.
*   **Session Tracking**: API per iniziare (`/start`) e terminare (`/stop`) le sessioni. Calcola in tempo reale i minuti di studio e aggiorna il database.
*   **Ambient Control**: Gestisce le preferenze dei suoni ambientali (volume, attivazione) salvandole nel database per ritrovarle al login successivo.

### B. Gestione Musica (`routes/music.js`)
Fornisce i dati per il player musicale.
*   **Discovery**: Endpoint per ottenere le ultime uscite (`/latest`), musica per creatori (`/creators`) e contenuti esclusivi (`/premium`).
*   **Access Control**: Filtra i contenuti in base al livello dell'utente (es. solo utenti premium vedono determinati brani).
*   **Favorites**: API toggle per aggiungere/rimuovere brani dai preferiti.

### C. Amministrazione (`routes/admin.js`)
Pannello di controllo per i gestori della piattaforma.
*   **Upload Manager**: Utilizza `multer` per caricare file audio nel sistema, smistandoli automaticamente nelle cartelle corrette (`public/audio/ambient` o `musiche`).
*   **Gestione Contenuti**: Permette di modificare metadati o cancellare brani.
*   **Bulk Delete**: Funzionalità avanzata per la cancellazione multipla di file, con logica robusta per rimuovere anche i file fisici dal disco per evitare "files orfani".

### D. Statistiche (`routes/stats.js`)
Il motore analitico dell'app.
*   Aggrega i dati grezzi da `focus_sessions` per calcolare totali giornalieri, settimanali e mensili.
*   Genera i dati per i grafici (es. array degli ultimi 7 giorni).
*   Identifica i suoni più ascoltati e gestisce gli obiettivi di studio dell'utente.

### E. Upload Utente (`routes/upload.js`)
Permette agli utenti (Creator) di caricare i propri brani.
*   Gestisce validation dei file e associazione con l'utente creatore.

---

## 6. Conclusione
Il backend di Soundlly è strutturato in modo ordinato e modulare. L'uso di **SQLite** con helper custom (`db/sqlite.js`) fornisce un ottimo equilibrio tra semplicità e potenza per le query SQL dirette. La logica di business è ben suddivisa in file di instradamento specifici, rendendo il codice manutenibile e scalabile. Particolare attenzione è stata posta alla sicurezza (CSRF, Auth) e alla gestione robusta dei file media.
