# Soundlly

Piattaforma di intrattenimento multimediale per ascoltare suoni rilassanti e musica durante lo studio, con timer Pomodoro integrato e gestione to-do list.

---

## 📁 Struttura Progetto

```
Soundlly/
│
├── 📂 public/                          # File statici serviti direttamente
│   ├── 📂 css/
│   │   ├── styleHome.css               # Stili homepage
│   │   ├── abbonamento.css             # Stili pagina abbonamento
│   │   ├── about.css                   # Stili pagina about
│   │   ├── adminstyle.css              # Stili pagina admin
│   │   ├── stats.css                   # Stili dashboard statistiche
│   │   ├── uploads.css                 # Stili pagina upload
│   │   └── profile.css                 # Stili profilo utente
│   │
│   ├── 📂 js/
│   │   ├── soundService.js             # Servizio API suoni
│   │   ├── abbonamento.js              # Abbonamento
│   │   ├── admin.js                    # Funzioni admin
│   │   ├── auth-login.js               # Servizio login
│   │   ├── auth.js                     # Servizio autenticazione client-side
│   │   ├── flip-card.js                # Gestione animazione Flip-card
│   │   ├── router.js                   # Client-side routing
│   │   ├── timer.js                    # Logica Timer Pomodoro (Auto-switch & Pause)
│   │   ├── mini-duo.js                 #
│   │   ├── pagamento.js                # Simulazione pagamento
│   │   ├── player.js                   # Player audio overlay
│   │   ├── todo.js                     # Gestione to-do list
│   │   ├── session.js                  # Servizio per la sessione di focus
│   │   ├── productivity.js             # Coordinamento timer/todo
│   │   ├── music-search.js             # Ricerca brani in tempo reale
│   │   ├── loadSounds.js               # Popolamento griglie suoni box-4
│   │   ├── uploads.js                  # Logica upload file (client)
│   │   ├── stats.js                    # Caricamento e visualizzazione statistiche
│   │   └── about.js                    # Interazioni pagina about
│   │
│   ├── 📂 immagini/                    # Asset grafici
│   │
│   │
│   ├── 📂 uploads/                     # File multimediali caricati dagli utenti (protetti)
│   │   ├── 📂 musica/
│   │   └── 📂 ambient/
│   │
│   ├── index.html                      # Homepage (SPA Entry Point)
│   └── about.html                      # Pagina about statica
│
├── 📂 views/                           # Template EJS (renderizzati server-side)
│   ├── abbonamento.ejs                 # Pagina abbonamento (Pricing)
│   ├── admin.ejs                       # Dashboard Admin
│   ├── home.ejs                        # Layout Home per utente loggato
│   ├── upload.ejs                      # Pagina caricamento file (Role-protected)
│   ├── pagamento.ejs                   # Pagina simulazione pagamento
│   ├── profilo.ejs                     # Profilo utente
│   ├── login.ejs                       # Login/registrazione
│   └── stats.ejs                       # Dashboard statistiche personali
│
├── 📂 routes/                          # Definizione percorsi API e Pagine
│   ├── auth.js                         # Rotte autenticazione (Passport)
│   ├── focus.js                        # API Focus Session (Start/Stop/Stats)
│   ├── profile.js                      # Rotte profilo utente
│   ├── stats.js                        # Rotte statistiche personali
│   ├── upload.js                       # Rotte upload
│   └── subscription.js                 # Rotte abbonamento
│
├── 📂 scripts/                          
│   ├── add_category_column.js                         
│   ├── Create_test_user.js                        
│   ├── migrate_sounds.js                      
│   ├── migrate_timer.js                        
│   ├── populate_admin.js                   
│   ├── seed.js                        
│   ├── populate_schema_profile.js                       
│   └── update_schema_stats.js                 
│
├── 📂 auth/                            # Moduli autenticazione
│   └── passport-setup.js               # Strategia Passport Local
│
├── 📂 db/                              # Connessione Database
│   └── sqlite.js                       # Wrapper SQLite3
│
├── 📂 models/                          # Data Access Layer
│   ├── AmbientModel.js                 # Gestione suoni ambientali
│   └── UserModel.js                    # Gestione utenti
│
├── 📂 migrations/                      # Schema Database
│   └── init-v3.sql                     # Schema esteso
│
├── 📂 scripts/                         # Script di utilità
│   ├── create_test_user.js
│   ├── populate_admin.js
│   ├── seed.js                         # Popolamento dati iniziali
│   └── migrate_timer.js                # Migrazione dati timer
│
├── 📂 middleware/                      # Middleware Express
│   └── auth.js                         # Verifica autenticazione e ruoli
│
├── .gitignore
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
