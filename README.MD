# Soundlly

Piattaforma di intrattenimento multimediale per ascoltare suoni rilassanti e musica durante lo studio, con timer Pomodoro integrato e gestione to-do list.

---

## 📁 Struttura Progetto

```
Soundlly/
│
├── 📂 auth/                            # Moduli autenticazione
│   └── passport-setup.js               # Strategia Passport Local
│
├── 📂 db/                              # Connessione Database
│   └── sqlite.js                       # Wrapper SQLite3
│
├── 📂 middleware/                      # Middleware Express
│   └── auth.js                         # Verifica autenticazione e ruoli
│
├── 📂 migrations/                      # Schema Database
│   └── init-v3.sql                     # Schema esteso
│
├── 📂 models/                          # Data Access Layer
│   ├── AmbientModel.js                 # Gestione suoni ambientali
│   └── UserModel.js                    # Gestione utenti
│
├── 📂 public/                          # File statici serviti direttamente
│   ├── 📂 audio/
│   ├── 📂 css/
│   │   ├── abbonamento.css
│   │   ├── about.css
│   │   ├── admin.css
│   │   ├── horizontal.css
│   │   ├── immersive.css
│   │   ├── login.css
│   │   ├── music-overlay.css
│   │   ├── player.css
│   │   ├── profilo.css
│   │   ├── stats-blur.css
│   │   ├── stats.css
│   │   ├── styleHome.css               # Stili homepage
│   │   ├── switch.css
│   │   ├── timer.css
│   │   ├── todo.css
│   │   └── upload.css
│   │
│   ├── 📂 immagini/                    # Asset grafici
│   │
│   ├── 📂 js/
│   │   ├── abbonamento.js
│   │   ├── about.js
│   │   ├── admin.js
│   │   ├── auth-login.js
│   │   ├── auth.js
│   │   ├── background-timer.js
│   │   ├── home.js
│   │   ├── immersive-controls.js
│   │   ├── loadSounds.js
│   │   ├── music-search.js
│   │   ├── player.js
│   │   ├── profile-upload.js
│   │   ├── router.js
│   │   ├── session.js
│   │   ├── stats.js
│   │   ├── switch-handler.js
│   │   ├── timer.js
│   │   ├── todo.js
│   │   ├── upload-modal.js
│   │   └── upload.js
│   │
│   ├── 📂 temp_uploads/
│   └── 📂 uploads/                     # File multimediali caricati dagli utenti
│
├── 📂 routes/                          # Definizione percorsi API e Pagine
│   ├── abbonamento.js
│   ├── admin.js
│   ├── focus.js
│   ├── music.js
│   ├── profile.js
│   ├── search.js
│   ├── stats.js
│   ├── stream.js
│   ├── todo.js
│   └── upload.js
│
├── 📂 scripts/                         # Script di utilità
│   ├── create_test_users.js
│   ├── database-v4.js
│   ├── init_project.js
│   ├── migrate_system_user.js
│   ├── populate_admin.js
│   ├── seed.js
│   └── setup_aws.sh
│
├── 📂 storage/                         # Storage locale (se usato come fallback)
│   ├── 📂 ambient/
│   ├── 📂 musiche/
│   └── 📂 suoni/
│
├── 📂 views/                           # Template EJS (renderizzati server-side)
│   ├── abbonamento.ejs
│   ├── about.ejs
│   ├── admin.ejs
│   ├── home.ejs
│   ├── login.ejs
│   ├── profilo.ejs
│   ├── stats.ejs
│   └── upload.ejs
│
├── .gitignore
├── database.sqlite                     # Database SQLite
├── package.json
├── server.js                           # Entry point server Express
└── README.md                           # Documentazione
```

## Descrizione Funzionalità Chiave

### Timer Pomodoro Avanzato (`public/js/timer.js`)
Il cuore della produttività di Soundlly.
- **Logica**: Cicli di 25 min (Pomodoro) / 5 min (Pausa Breve).
- **Auto-Switch**: Al termine di un timer, il sistema passa **automaticamente** alla modalità successiva (es. da Studio a Pausa).
- **Auto-Pause**: Il timer successivo **non** parte in automatico; attende il "Play" dell'utente per garantire una pausa effettiva e controllata.
- **Session Tracking**: Ogni sessione viene registrata nel database (`focus_sessions`) per le statistiche.
- **Notifiche**: Suoni e notifiche desktop avvisano del cambio fase.

### Gestione Ruoli e Upload (`routes/upload.js`)
- L'accesso alla pagina di `upload` è ristretto.
- Solo gli utenti con ruolo `admin` o `creator` possono accedere.
- Gli altri utenti vengono reindirizzati alla pagina `/abbonamento`.

### Statistiche e Obiettivi
- Tracciamento del tempo totale di focus, sessioni completate e streak giornaliere.
- Visualizzazione dati tramite `chart.js` o progress bar custom.
- Persistenza degli obiettivi giornalieri/settimanali nel DB sqlite.

---

## Pagina Index (Homepage)

### Panoramica

La homepage è una SPA (Single Page Application) ibrida che integra navigazione dinamica e contenuti renderizzati server-side dove necessario.

### Struttura e Sezioni

#### 1. **Flip Card Produttività (Box 3)**
- **Fronte**: Timer Pomodoro (con le funzionalità descritte sopra).
- **Retro**: To-Do List persistente (localStorage) integrata nel flusso di lavoro.

#### 2. **Player Audio Overlay**
- Esperienza immersiva attivabile dal footer.
- Riproduzione continua durante la navigazione nella pagina.
- Supporto coda e controlli volume.

#### 3. **Libreria Suoni**
- Caricamento dinamico da API REST `/api/sounds`.
- Filtraggio per categorie (Premium, Ultime Uscite, Community).

#### 4. **Sezione "Ultime Uscite"**
Requisiti per l'inclusione dei brani nella home:
- **Categoria**: Deve essere `music` o `sound`.
- **Visibilità**:
    - `public`: Visibile a tutti.
    - `registered`: Visibile solo se l'utente è loggato.
    - I contenuti `premium` sono **esclusi** da questa lista.
- **Ordinamento**: Decrescente per data di creazione (i più recenti in alto).
- **Limite**: Mostra solo gli ultimi 10 brani.

---

## Tecnologie

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, Vanilla JS, CSS3 (No framework JS pesanti)
- **Templating**: EJS
- **Auth**: Passport.js

---

## Avvio Rapido

```bash
npm install
npm run init-project
npm start
```

L'app sarà disponibile su `http://localhost:3003`

---

## Note Database

Il database utilizza SQLite. Le migrazioni sono disponibili in `migrations/`.
- `init.sql`: Tabelle base (`users`, `sounds`, `music`).
- `init-v3.sql`: Tabelle avanzate per le statistiche (`focus_sessions`, `focus_goals`).

---

**Autore**: Michele Vitella matricola: 20045272  
**Anno**: 2025-2026
