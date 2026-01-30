# Librerie Esterne Utilizzate

Questo documento elenca le principali librerie di terze parti (dipendenze) utilizzate nel backend del progetto Soundlly e ne descrive la funzione.

## Dipendenze Principali (Dependencies)
Queste librerie sono essenziali per il funzionamento dell'applicazione in produzione.

| Libreria | Descrizione e Utilizzo nel Progetto |
| :--- | :--- |
| **express** | Il framework web principale per Node.js. È utilizzato per gestire il server, le rotte HTTP (GET, POST, ecc.), i middleware e la logica generale dell'applicazione. È la "spina dorsale" del backend. |
| **sqlite3** | Il driver ufficiale per interagire con il database SQLite. Permette di eseguire query SQL (SELECT, INSERT, UPDATE, DELETE) sui file `.sqlite` del progetto. Nel codice, è spesso usato attraverso un wrapper per supportare `async/await`. |
| **bcrypt** | Libreria di crittografia utilizzata per l'hashing sicuro delle password. Quando un utente si registra, la sua password viene trasformata in una stringa incomprensibile (hash) con un "salt" univoco prima di essere salvata nel database. Al login, bcrypt verifica la password inserita confrontandola con l'hash salvato. |
| **passport** | Middleware di autenticazione per Node.js. Gestisce il flusso di login degli utenti in modo modulare. |
| **passport-local** | Una "strategia" specifica per Passport che permette l'autenticazione tramite username e password (credenziali locali salvate nel database), a differenza di strategie esterne come "Login con Google". |
| **express-session** | Middleware per la gestione delle sessioni utente. Mantiene lo stato dell'utente (es. "utente loggato") attraverso le diverse richieste HTTP, solitamente salvando un ID di sessione in un cookie sicuro nel browser. |
| **ejs** (Embedded JavaScript) | Motore di template utilizzato per generare pagine HTML dinamiche lato server ("Server-Side Rendering"). Permette di inserire variabili e logica JavaScript (cicli, if) direttamente nei file `.ejs` (le Viste del pattern MVC). |
| **multer** | Middleware per la gestione dei dati `multipart/form-data`, utilizzato principalmente per l'upload di file. È fondamentale per permettere agli utenti (e admin) di caricare file audio (musica, suoni ambientali) e immagini di copertina. |
| **music-metadata** | Libreria utilizzata per analizzare i file audio caricati e leggerne i metadati, come la **durata** del brano. Questo permette di salvare automaticamente la durata corretta nel database senza input manuale. |
| **mime-types** | Utility per determinare il "MIME type" (tipo di contenuto) di un file basandosi sulla sua estensione (es. `.mp3` -> `audio/mpeg`) o viceversa. Utile per validare i file caricati o impostare gli header corretti nelle risposte. |

## Dipendenze di Sviluppo (DevDependencies)
Queste librerie sono utili solo durante la fase di scrittura del codice e non sono necessarie per l'esecuzione finale.

| Libreria | Descrizione |
| :--- | :--- |
| **nodemon** | Uno strumento che monitora i file del progetto. Ogni volta che viene salvata una modifica al codice (`Ctrl+S`), nodemon riavvia automaticamente il server, velocizzando notevolmente il ciclo di sviluppo ed evitando di dover fermare e riavviare il processo manualmente. |
