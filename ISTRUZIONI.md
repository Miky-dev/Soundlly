# Istruzioni Installazione e Utilizzo Progetto

## 1. Requisiti
Assicurati di avere installato sul tuo computer:
- **Node.js** (versione 14 o superiore consigliata)
- **NPM** (incluso in Node.js)

## 2. Installazione
Apri il terminale nella cartella del progetto (la cartella `backup14-12` o comunque quella che contiene il file `package.json`) ed esegui i seguenti comandi:

1.  **Entra nella cartella corretta (se necessario):**
    ```bash
    cd soundlly
    ```

2.  **Installare le dipendenze:**
    ```bash
    npm install
    ```

3.  **Inizializzare il Database:**
    Esegui questo comando per creare il database, le tabelle e gli utenti di test:
    ```bash
    npm run init-project
    ```
    *Nota: Se il comando dovesse fallire, potrebbero esserci processi Node attivi che bloccano il database.*

## Se si vuole il database popolato, basta rinominare:
    database.sqlite.popolato -> database.sqlite

## 3. Avvio
Per avviare il server:

```bash
npm start
```

Il server sarà attivo all'indirizzo: [http://localhost:3003](http://localhost:3003)

## 4. Credenziali di Prova
Il database viene popolato automaticamente con i seguenti utenti per testare i vari ruoli:

| Ruolo | Username | Password | Note |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Accesso completo al pannello admin |
| **Utente Standard** | `mario` | `user123` | Utente base (piano standard) |
| **Creatore** | `luigi` | `creator123` | Utente creatore (piano premium) |

## 5. Troubleshooting
- Se riscontri errori di "table not found", riesegui `npm run init-project`.
- Il database è un file `database.sqlite` nella root del progetto. Puoi cancellarlo e rieseguire l'inizializzazione per resettare tutto.
