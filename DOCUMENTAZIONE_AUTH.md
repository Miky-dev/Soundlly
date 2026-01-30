# Documentazione Backend: Sistema di Autenticazione (Login & Registrazione)

Questo documento spiega il funzionamento tecnico del sistema di autenticazione implementato nel progetto Soundlly. Il sistema utilizza **Node.js**, **Express**, **Passport.js** per la gestione delle sessioni e **Bcrypt** per la sicurezza delle password.

## 1. Mappa dei File Coinvolti

Ecco l'elenco dei file che compongono il sistema di autenticazione, divisi per ruolo:

| File | Percorso | Funzione |
| :--- | :--- | :--- |
| **Server (Entry Point)** | `server.js` | Configura Express, le sessioni e le rotte POST /login e /register. |
| **Logica Autenticazione** | `auth/passport-setup.js` | Configura la "Local Strategy" di Passport (come verifichiamo utente e password). |
| **Database Model** | `models/UserModel.js` | Esegue le query SQL e gestisce l'hashing delle password con bcrypt. |
| **Frontend (View)** | `views/login.ejs` | Contiene sia il form di Login che quello di Registrazione (toggle JS). |
| **Protezione** | `middleware/auth.js` | Controlla se una richiesta proviene da un utente loggato. |
| **Database** | `migrations/init-v3.sql` | Definisce la tabella `users` con le colonne `username` e `password_hash`. |

---

## 2. Panoramica del Flusso

Il sistema segue il pattern standard di autenticazione basata su sessioni (Session-Based Authentication):
1.  **Registrazione**: L'utente invia le credenziali -> Il server cifra la password -> Salva nel Database (SQLite).
2.  **Login**: L'utente invia le credenziali -> Il server verifica l'hash della password -> Crea una sessione sul server -> Invia un cookie (`sid`) al client.
3.  **Navigazione**: Il browser invia il cookie `sid` ad ogni richiesta -> Il server riconosce l'utente tramite la sessione deserializzata.

---

## 3. Guida Passo-Passo nel Codice

### Fase 1: Registrazione Utente

1.  **Input Utente**: L'utente compila il form "Registrati" in `views/login.ejs`.
2.  **Richiesta**: Parte una POST verso `/register` (definita in `server.js`).
3.  **Controller (`server.js`)**:
    ```javascript
    app.post('/register', async (req, res) => {
        // ... controlli CSRF ...
        await UserModel.create(username, password); // Chiama il model
        res.redirect('/login');
    });
    ```
4.  **Model (`models/UserModel.js`)**:
    ```javascript
    static async create(username, plainPassword) {
        const hash = await bcrypt.hash(plainPassword, 10); // Cifra la password
        const res = await run(`INSERT INTO users ...`, [username, hash, ...]); // Salva nel DB
    }
    ```

### Fase 2: Login

1.  **Input Utente**: L'utente compila il form "Accedi".
2.  **Richiesta**: Parte una POST verso `/login` (definita in `server.js`).
3.  **Controller (`server.js`)**:
    ```javascript
    app.post('/login', (req, res, next) => {
        // Delega tutto a Passport
        passport.authenticate('local', (err, user) => {
            req.logIn(user, (err) => { // Crea la sessione
                 res.redirect('/home');
            });
        })(req, res, next);
    });
    ```
4.  **Strategia (`passport-setup.js`)**:
    ```javascript
    passport.use(new LocalStrategy(async (username, password, done) => {
        const user = await UserModel.findByUsername(username); // Cerca utente
        const ok = await UserModel.validatePassword(user, password); // Controlla hash
        if (ok) return done(null, user); // Successo!
    }));
    ```

---

## 4. Componenti Principali (Dettaglio)

### A. Server & Rotte (`server.js`)
Il file principale gestisce le richieste HTTP per login e registrazione.

-   **POST /register**:
    1.  **CSRF Check**: Verifica il token di sicurezza per prevenire attacchi Cross-Site Request Forgery.
    2.  **Validazione**: Controlla che username e password siano presenti.
    3.  **Creazione**: Chiama `UserModel.create(username, password)` per salvare l'utente.
    4.  **Risposta**: Reindirizza al login in caso di successo o errore.

-   **POST /login**:
    1.  **CSRF Check**: Verifica la validità della richiesta.
    2.  **Passport Authenticate**: Delega la verifica delle credenziali a `passport.authenticate('local')`.
    3.  **Sessione**: Se le credenziali sono valide, Passport crea la sessione e `express-session` salva il cookie nel browser dell'utente.

### B. Modello Dati (`models/UserModel.js`)
Gestisce l'interazione diretta con il database e la crittografia.

-   **`create(username, plainPassword)`**:
    -   Utilizza la libreria **bcrypt** per trasformare la password in chiaro in un hash sicuro (`bcrypt.hash(plainPassword, 10)`).
    -   *Nota di Sicurezza*: Non salviamo mai la password in chiaro nel database, ma solo il suo "digest" crittografato.
    -   Esegue una query `INSERT` nella tabella `users`.

-   **`validatePassword(user, plainPassword)`**:
    -   Confronta la password inserita dall'utente con l'hash salvato nel database usando `bcrypt.compare()`.

### C. Strategia di Autenticazione (`auth/passport-setup.js`)
Configura **Passport.js** per utilizzare la "Local Strategy" (Username + Password).

1.  **Strategia (`LocalStrategy`)**:
    -   Cerca l'utente nel DB tramite username (`findByUsername`).
    -   Se trovato, valida la password (`validatePassword`).
    -   Restituisce l'utente se tutto è corretto, altrimenti un errore.

2.  **Serializzazione (`serializeUser`)**:
    -   Decide cosa salvare nella sessione corrente. Salviamo solo l'**ID** dell'utente per mantenere la sessione leggera.

3.  **Deserializzazione (`deserializeUser`)**:
    -   Ad ogni richiesta successiva, Passport usa l'ID salvato nella sessione per recuperare l'intero oggetto utente dal database (`UserModel.findById`). Questo rende `req.user` disponibile in tutte le rotte.

### D. Middleware di Protezione (`middleware/auth.js`)
Modulo che protegge le rotte riservate.

-   **`ensureAuthenticated`**: Intercetta le richieste. Se l'utente non ha una sessione attiva (`req.isAuthenticated()` è falso), lo reindirizza forzatamente alla pagina di login.

---

## 3. Schema del Database (`migrations/init-v3.sql`)

La tabella `users` è il cuore del sistema:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,  -- Qui salviamo solo l'hash bcrypt
  role TEXT DEFAULT 'user',     -- Gestione permessi (user/admin)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ...
);
```

## 4. Diagramma di Sequenza Semplificato (Login)

1.  **Client** -> `POST /login` (username, password)
2.  **Server** -> `Passport Strategy`
3.  **Passport** -> `UserModel.findByUsername()` -> **DB**
4.  **Passport** -> `bcrypt.compare()` (Verifica Hash)
5.  **Server** -> Crea Sessione (ID Utente) -> Invia Cookie `sid`
6.  **Client** -> Riceve Cookie e accede alla Home.
