# Possibili Domande d'Esame - Backend Soundlly

Ecco una lista delle domande più probabili che il professore potrebbe farti sull'architettura e il codice del backend, divise per argomento.

---

## 1. Architettura e Node.js
**D: Perché hai scelto Node.js ed Express?**
*   **Risposta:** Node.js è ideale per applicazioni I/O-bound e real-time. Express fornisce un framework minimalista ma robusto per gestire le rotte e i middleware. Inoltre, permette di usare JavaScript sia su frontend che backend (Isomorphic JS).

**D: Come è strutturato il tuo progetto? (MVC)**
*   **Risposta:** Ho adottato un pattern **MVC (Model-View-Controller)**:
    *   **Model**: Gestiti in `models/` (es. `UserModel`) e tramite query dirette in `db/`.
    *   **View**: Utilizzo **EJS** in `views/` per il rendering lato server.
    *   **Controller**: La logica è nei file di route in `routes/` (es. `focus.js`, `music.js`).

**D: A cosa serve il file `server.js`?**
*   **Risposta:** È l'entry point. Inizializza Express, configura i middleware globali (sessioni, parsing body), connette il database, configura Passport e monta le rotte principali.

---

## 2. Database e SQLite
**D: Perché hai creato un wrapper in `db/sqlite.js` (funzioni `run`, `get`, `all`)?**
*   **Risposta:** La libreria standard `sqlite3` usa le **callback**. Ho creato dei wrapper che restituiscono **Promise** per poter utilizzare la sintassi `async/await` nel resto del codice. Questo evita il "callback hell" e rende il codice più leggibile e gestibile, specialmente nella gestione degli errori con `try/catch`.

**D: Come gestisci le relazioni tra le tabelle? (Es. Utente -> Sessioni)**
*   **Risposta:** Utilizzo chiavi esterne (`FOREIGN KEY`). Ad esempio, nella tabella `focus_sessions`, il campo `user_id` fa riferimento all'`id` della tabella `users`. In `init-v3.sql` ho attivato `PRAGMA foreign_keys = ON;` per garantire l'integrità referenziale (es. `ON DELETE CASCADE`: se elimino un utente, si eliminano le sue sessioni).

---

## 3. Autenticazione e Sicurezza
**D: Come gestisci l'autenticazione?**
*   **Risposta:** Uso **Passport.js** con la `LocalStrategy` (`auth/passport-setup.js`).
    1.  L'utente invia username/password.
    2.  Passport verifica lo username nel DB.
    3.  Se esiste, confronta la password hashata usando **Bcrypt**.
    4.  Se corretta, serializza l'ID utente nella sessione.

**D: Perché usi Bcrypt? Non basta MD5 o SHA?**
*   **Risposta:** No, MD5 e SHA sono troppo veloci e vulnerabili ad attacchi "rainbow table". **Bcrypt** è un algoritmo di hashing lento appositamente progettato per le password: incorpora un "salt" casuale per ogni utente, rendendo impraticabili gli attacchi di forza bruta.

**D: Cos'è il CSRF e come lo previeni?**
*   **Risposta:** Il Cross-Site Request Forgery è un attacco dove un sito malevolo forza l'utente a eseguire azioni su un sito dove è loggato.
    *   In `server.js`, ho implementato una protezione custom (funzione `ensureCsrfToken`).
    *   Genero un token univoco salvato in sessione (`req.session.csrfToken`).
    *   Ogni form POST (login, register) deve inviare questo token. Il server verifica che il token inviato corrisponda a quello in sessione.

**D: Come gestisci le sessioni?**
*   **Risposta:** Uso `express-session`. L'ID di sessione viene salvato in un cookie (`sid`) firmato e `httpOnly` (non accessibile da JS client-side). I dati della sessione sono memorizzati in memoria sul server (o su file/DB se configurato store persistente).

---

## 4. Logica Applicativa (Focus & Files)
**D: Come salvi il tempo di studio (Focus Session)?**
*   **Risposta:** In `routes/focus.js`:
    1.  Quando parte il timer -> `POST /start`: Creo un record in `focus_sessions` con stato `in_progress`.
    2.  Quando finisce -> `POST /stop`: Aggiorno quel record con i minuti effettivi e lo stato `completed`.
    *   Questo previene che l'utenza "bari" inviando solo il risultato finale, poiché il server traccia l'inizio.

**D: Come gestisci l'upload dei file audio?**
*   **Risposta:** Uso la libreria **Multer** in `routes/admin.js`.
    *   Configuro un `diskStorage` per decidere la cartella di destinazione (`public/audio/ambient`) e il nome del file.
    *   Multer gestisce lo stream dei dati multipart/form-data.

**D: Nel codice di cancellazione (`routes/admin.js`), perché controlli due path?**
*   **Risposta:** Per gestire file legacy o spostati. Il codice verifica se il file è nella cartella `ambient` o `musiche`. Se non lo trova lì ma il DB dice che è un suono "ambient", controlla anche la cartella legacy `suoni` per evitare errori e garantire la pulizia del disco (rimozione del file fisico `fs.unlinkSync`).

---

## 5. Async/Await e Gestione Errori
**D: Cosa succede se una query al database fallisce?**
*   **Risposta:** Tutte le chiamate al DB sono avvolte in blocchi `try/catch`. Se avviene un errore, viene catturato dal `catch`, loggato in console (`console.error`) e viene inviata una risposta di errore HTTP 500 al client, garantendo che il server non vada in crash.
