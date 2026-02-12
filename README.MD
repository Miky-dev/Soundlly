# Soundlly

Piattaforma di intrattenimento multimediale per ascoltare suoni rilassanti e musica durante lo studio, con timer Pomodoro integrato e gestione to-do list.

---

##  Video Presentazione
Link video presentazione: https://youtu.be/1234567890

---

##  Installazione e Avvio Rapido

### 1. Installazione Dipendenze
Apri il terminale nella cartella del progetto ed esegui:
```bash
cd Soundlly
npm install
```

### 2. Inizializzazione Database
Per configurare il database con gli utenti di prova e i dati base, esegui:
```bash
npm run init-project
```

*Nota: Questo script (`scripts/init_project.js`) si occupa di creare il file `database.sqlite`, applicare le migrazioni e popolare il DB con i dati iniziali.*

### 3. Avvio Server
```bash
npm start
```
Il server sarà attivo all'indirizzo: [http://localhost:3003](http://localhost:3003)

---

## Credenziali di Accesso (Test)

Il database viene inizializzato con 3 utenti preimpostati per testare i diversi ruoli:

| Ruolo | Username | Password | Note |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Accesso completo, gestione upload e utenti. |
| **Creatore** | `creator` | `admin123` | Piano Premium, può caricare brani e gestire album. |
| **Utente** | `user` | `admin123` | Piano Standard. |

---

## Struttura Progetto

```
Soundlly/
│
├── 📂 auth/                            # Moduli autenticazione (Passport)
├── 📂 db/                              # Connessione Database (SQLite wrapper)
├── 📂 middleware/                      # Middleware Express (Auth, Ruoli)
├── 📂 migrations/                      # Schema Database SQL
├── 📂 models/                          # Data Access Layer (User, Ambient)
│
├── 📂 public/                          # Frontend Statico (CSS, JS, Immagini)
│   ├── 📂 css/                         # Fogli di stile modulari
│   ├── 📂 js/                          # Logica Frontend (Timer, Player, SPA)
│   └── 📂 uploads/                     # File multimediali utenti
│
├── 📂 routes/                          # API e Routing Pagine
├── 📂 scripts/                         # Script di utilità e setup
├── 📂 views/                           # Template EJS (Server-side rendering)
│
├── database.sqlite                     # Database SQLite
├── server.js                           # Entry point Express
└── README.md                           # Questo file
```

---

## Funzionalità Chiave

### Timer Pomodoro Avanzato (`public/js/timer.js`)
- **Ciclo Studio/Pausa**: Alternanza automatica 25min (Focus) / 5min (Pausa).
- **Auto-Switch & Auto-Pause**: Cambio fase automatico ma avvio manuale per controllo totale.
- **Tracking**: Ogni sessione completata viene salvata nel DB per le statistiche.

### Player Audio Immersivo
- Overlay persistente che permette la navigazione senza interrompere l'audio.
- Supporto coda, volume e mix suoni ambientali.

### Ruoli e Permessi (`routes/upload.js`)
- **RBAC**: Accesso differenziato in base al ruolo (Admin/Creator/User).
- **Upload**: Riservato a Admin e Creator.

### Statistiche e Dashboard
- Grafici interattivi (Chart.js) per visualizzare il tempo di focus.
- Obiettivi giornalieri e settimanali persistenti.

---

## Tecnologie

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, Vanilla JS, CSS3 (No framework JS pesanti)
- **Templating**: EJS
- **Auth**: Passport.js

---

## Risoluzione Problemi Comuni

- **Database Locked**: Se riscontri errori di database bloccato durante il reset (`init-project`), assicurati di aver spento il server Node (`CTRL+C`).
- **Tabelle Mancanti**: Se all'avvio il server segnala errori di tabella, riesegui `npm run init-project`.

---

**Autore**: Michele Vitella (Matricola: 20045272)
**Anno**: 2025-2026
