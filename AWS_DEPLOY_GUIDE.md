# Guida al Deploy su AWS EC2 (Ubuntu)

Questa guida ti accompagnerà passo dopo passo nella pubblicazione del tuo sito Soundlly su un server AWS.

## 1. Creare l'istanza EC2 su AWS
1.  Accedi alla console AWS.
2.  Vai su **EC2** -> **Instances** -> **Launch Instances**.
3.  **Name**: `Soundlly-Server`.
4.  **OS Image**: Seleziona **Ubuntu** (Ubuntu Server 24.04 LTS o 22.04 LTS va benissimo).
5.  **Instance Type**: `t2.micro` (Gratis per il primo anno).
6.  **Key Pair**:
    *   Clicca "Create new key pair".
    *   Nome: `soundlly-key`.
    *   Tipo: `RSA` e formato `.pem`.
    *   **Importante**: Scarica il file e conservalo gelosamente sul tuo PC desktop!
7.  **Network Settings**:
    *   Spunta "Allow SSH traffic from Anywhere" (o My IP per più sicurezza).
    *   Spunta "Allow HTTP traffic from the internet".
    *   Spunta "Allow HTTPS traffic from the internet".
8.  Clicca su **Launch Instance**.

## 2. Configurare la Sicurezza (Porta 3003)
Di default, AWS blocca tutto tranne le porte standard (80, 443, 22). Noi usiamo la **3003**.
1.  Nella dashboard EC2, clicca sulla tua istanza.
2.  Vai nella tab **Security**.
3.  Clicca sul link del **Security Group** (es. `sg-0123...`).
4.  Clicca **Edit inbound rules**.
5.  Clicca **Add rule**:
    *   Type: `Custom TCP`
    *   Type: `Custom TCP`
    *   Port range: `3003`
    *   Source: Clicca sul menu a tendina "Custom" e seleziona **Anywhere-IPv4** (oppure scrivi `0.0.0.0/0`).
    *   *Nota: Se vedi un errore sulla "regola ID gruppo", assicurati di aver selezionato "Anywhere" dal menu e non un altro Security Group.*
6.  Clicca **Save rules**.

## 3. Connettersi al Server (Windows)

1.  Apri **PowerShell** (cerca "PowerShell" nel menu Start di Windows).
2.  Vai nella cartella dove hai il file `.pem`. Ad esempio, se è in Downloads:
    ```powershell
    cd Downloads
    ```
3.  Esegui il comando SSH per connetterti:
    ```powershell
    ssh -i "soundlly-key.pem" ubuntu@<Tuo-Indirizzo-IP-Pubblico>
    ```
    *(Sostituisci `<Tuo-Indirizzo-IP-Pubblico>` con l'IP vero, es. 35.123.45.67)*.

4.  Se ti chiede "Are you sure you want to continue connecting?", scrivi `yes` e premi Invio.

*Nota: Se ti dà errore "Permissions are too open", clicca col tasto destro sul file .pem -> Proprietà -> Sicurezza -> Avanzate -> Disabilita Ereditarietà -> Rimuovi tutte le autorizzazioni -> Aggiungi solo il tuo utente con "Controllo completo". Oppure usa Git Bash se ce l'hai installato.*

## 4. Installazione Automatica
Una volta dentro al server (schermata nera con scritto `ubuntu@ip...`), dobbiamo installare i programmi.
Ho creato uno script per fare tutto in automatico.

1.  Crea il file di setup sul server:
    ```bash
    nano setup.sh
    ```
2.  Incolla dentro questo codice (copia da qui e incolla con tasto destro nel terminale):
    ```bash
    #!/bin/bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    sudo npm install -g pm2
    echo "Fatto!"
    ```
3.  Salva con `CTRL+O` -> `Invio` -> `CTRL+X`.
4.  Avvia l'installazione:
    ```bash
    sudo bash setup.sh
    ```

## 5. Scaricare il Progetto
1.  Clona la tua repo GitHub:
    ```bash
    git clone https://github.com/Miky-dev/Soundlly.git
    ```
2.  Entra nella cartella:
    ```bash
    cd Soundlly
    ```
3.  Installa le dipendenze:
    ```bash
    npm install
    ```
4.  Inizializza il database (crea tabelle e utenti base):
    ```bash
    npm run db:migrate
    ```

## 6. Avviare il Server definitivaemnte
Useremo **PM2** per tenere il sito sempre acceso, anche se chiudi il terminale.

1.  Avvia con la configurazione pronta:
    ```bash
    pm2 start ecosystem.config.js
    ```
2.  Salva la lista processi per il riavvio automatico:
    ```bash
    pm2 save
    ```
3.  Fai generare lo script di startup (copia ed esegui il comando che ti suggerisce a video):
    ```bash
    pm2 startup
    ```

## Finito!
Ora il tuo sito è online all'indirizzo:
`http://<Tuo-IP-Pubblico>:3003`

### Comandi Utili per il futuro
*   Aggiornare il sto:
    ```bash
    git pull
    npm install
    pm2 restart soundlly
    ```
*   Vedere i log (errori):
    ```bash
    pm2 logs
    ```
