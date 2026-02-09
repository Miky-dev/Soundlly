# Questo script automatizza l'installazione delle dipendenze base
# necessarie per eseguire l'applicazione su un server Linux.
# Istruzioni: eseguire sul server con 'bash setup_aws.sh'

echo "--- Inizio Configurazione Server ---"

# 1. Aggiornamento sistema
echo "[1/5] Aggiornamento dei pacchetti di sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Installazione tool di base
echo "[2/5] Installazione di Git e Curl..."
sudo apt install -y git curl

# 3. Installazione Node.js (Versione 20 LTS)
echo "[3/5] Installazione di Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Installazione PM2 (Process Manager)
# PM2 permette di mantenere l'app attiva in background
echo "[4/5] Installazione di PM2..."
sudo npm install -g pm2

# 5. Verifica versioni installate
echo "[5/5] Verifica delle versioni installate:"
node -v
npm -v
pm2 -v
git --version

echo "-----------------------------------"
echo "Configurazione completata con successo!"
echo "Ora puoi clonare il repository e avviare l'app."
