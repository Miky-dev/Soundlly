# Analisi Conformità Esame: Soundlly

Di seguito sono riportati i punti mancanti o da migliorare rispetto alla traccia d'esame "Progetto d’esame MF0438 2024/2025".

## 🟢 Priorità Alta (Richiesti Tassativamente) - RISOLTI

### 1. JavaScript Frontend a Oggetti (Classi ES6)
**Requisito:** "Utilizzo di JavaScript ad oggetti (classi ES6), sia nel back-end che nel front-end."
- **Stato Attuale:** ✅ **SODDISFATTO**
  - `player.js` usa `class MusicPlayer`.
  - `timer.js` usa ora `class FocusTimer`.
  - `todo.js` usa ora `class TodoManager`.

### 2. Stili Inline (CSS/JS)
**Requisito:** "Non utilizzare dichiarazioni CSS/JS in-line, nel front-end." e "modificare... classList e non manipolando direttamente style".
- **Stato Attuale:** ✅ **SODDISFATTO**
  - Rimossi gli stili inline da `home.ejs`.
  - Spostati in `styleHome.css` con classi di utilità.
  - Sostituiti i wrapper `div` generici con semantic tags `<section>`.

### 3. HTML Semantico
**Requisito:** "Utilizzo di tag HTML in maniera semantica (per esempio, non tutto è un <div>)."
- **Stato Attuale:** ✅ **SODDISFATTO**
  - La Dashboard ora utilizza `<section aria-label="...">` per i blocchi principali invece di `div` generici.

---

## 🟡 Priorità Media (Vincoli e Funzionalità)

### 4. Funzionalità "Aperte a Tutti"
**Requisito:** "l’applicazione deve prevedere sia funzionalità aperte a tutti... sia funzionalità accessibili solamente agli utenti registrati".
- **Stato Attuale:** ✅ Soddisfatto.
  - La **Ricerca** (`/api/search`) è accessibile senza login.
  - La **Home** mostra contenuti ridotti (senza statistiche) per gli ospiti.

### 5. Tipologie di Utente
**Requisito:** "preferibilmente almeno due tipi diversi di utenti".
- **Stato Attuale:** ✅ Soddisfatto.
  - Hai `User` e `Admin` (e `Creator`).

## 🔴 Da Completare (Extra e Deploy)
Questi sono gli ultimi step rimasti per la consegna:

- **Deploy:** "Fare il deploy dell’applicazione web su qualche servizio online". Non ancora fatto.
- **Video e Documentazione:** Da preparare alla fine.
- **Credenziali Test:** Bisogna creare un file `credentials.md` o simile per il docente.

---

## 🛠 Prossimi Passi (Consigliati)
1.  **Test Deploy:** Creare un account su un servizio cloud (es. Heroku, Railway, Render) per il deploy.
2.  **Documentazione:** Scrivere due righe su come installare l'app in locale.
3.  **Pulizia Finale:** Rimuovere eventuali file di debug o commenti inutili.
