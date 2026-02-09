# Istruzioni Installazione e Utilizzo Progetto


## 1. Installazione
Apri il terminale nella cartella del progetto ed esegui i seguenti comandi:

1.  **Installare le dipendenze:**
    ```bash
    npm install
    ```

2.  **Inizializzare il Database (Reset):**
    Per ripristinare il database allo stato pulito (con i 3 utenti di esempio e i suoni base), cancella il file `database.sqlite` (se esiste) ed esegui:
    ```bash
    sqlite3 database.sqlite ".read dump.sql"
    ```
    *Nota: Assicurati che il server Node sia spento (`CTRL+C`) prima di resettare il database, altrimenti il file sarà bloccato.*

## 2. Avvio
Per avviare il server:

```bash
npm start
```

Il server sarà attivo all'indirizzo: [http://localhost:3003](http://localhost:3003)

## 3. Credenziali di Accesso
Il database (ripristinato dal `dump.sql`) fornisce 3 utenti preimpostati.

### Password Comune
Per tutti gli account la password è: **`admin123`**

### Utenti
| Ruolo | Username | Email | Note |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@example.com` | Accesso completo al pannello admin, gestione utenti e contenuti. |
| **Creatore** | `creator` | `creator@example.com` | Piano Premium, può caricare brani e creare album pubblici/privati. |
| **Utente Standard** | `user` | `user@example.com` | Piano Standard, solo fruizione e playlist personali. |

## 4. Possibili problemi
- **Database Locked**: Se riscontri errori di database locked durante il reset, spegni prima il server Node.
- **Table not found**: Se all'avvio il server si lamenta di tabelle mancanti, esegui il comando di ripristino del DB sopra descritto.
