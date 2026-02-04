# 🔍 Documentazione Funzionalità di Ricerca

Questo documento spiega nel dettaglio il funzionamento tecnico della ricerca "live" in Home Page, dal momento in cui l'utente digita fino alla visualizzazione dei risultati.

## 1. Panoramica del Flusso

Il processo segue questo schema logico:
1.  **Frontend**: Intercetta l'input dell'utente (con ritardo "debounce").
2.  **Frontend**: Invia una richiesta HTTP `GET` al server.
3.  **Backend**: Riceve la query, interroga il Database SQLite.
4.  **Backend**: Restituisce i risultati in formato JSON.
5.  **Frontend**: Riceve i dati e genera dinamicamente le "card" dei brani.

---

## 2. Frontend (Client-side)
**File:** `public/js/music-search.js`

### A. Ascolto e Debounce
Il sistema non invia una richiesta per ogni singolo tasto premuto (che sovraccaricherebbe il server), ma utilizza una tecnica chiamata **Debounce**.

```javascript
// Esempio logica debounce (semplificata)
this.els.searchInput.addEventListener('input', this.debounce(async (e) => {
    // ...codice ricerca...
}, 300));
```

*   **Evento:** `input` (scatta ad ogni tasto premuto).
*   **Timer (300ms):** La funzione aspetta 300 millisecondi di inattività dell'utente. Se l'utente digita un'altra lettera prima che il tempo scada, il timer riparte da zero.
*   **Effetto:** La ricerca parte solo quando l'utente si "ferma" un attimo a pensare o ha finito di scrivere.

### B. Richiesta API
Una volta confermato l'input, il client contatta il server:

```javascript
const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
const results = await res.json();
```

*   Viende usata la funzione nativa `fetch`.
*   La query viene codificata (`encodeURIComponent`) per gestire spazi e caratteri speciali.

---

## 3. Backend (Server-side)
**File:** `routes/search.js`

### A. Ricezione e Validazione
Il server Express gestisce la rotta:

```javascript
router.get('/', async (req, res) => {
    const query = req.query.q || '';
    if (!query.trim()) return res.json([]); // Ritorna vuoto se non c'è testo
    // ...
```

### B. Query SQL
La ricerca avviene nel database SQLite utilizzando l'operatore `LIKE` per trovare corrispondenze parziali (es. "pia" trova "Piano", "Pioggia", etc.).

```sql
SELECT s.id, s.title, s.description, ... 
FROM sounds s
LEFT JOIN users u ON s.owner_id = u.id
WHERE (
    s.title LIKE ? OR 
    s.description LIKE ? OR 
    u.username LIKE ? OR     -- Cerca anche per nome autore
    s.mood LIKE ? OR 
    s.genre_primary LIKE ?
)
AND (s.access_level = 'public' OR s.access_level = 'premium')
ORDER BY s.created_at DESC
LIMIT 20
```

*   **Campi cercati**: Titolo, Descrizione, Autore, Mood, Genere.
*   **Sicurezza**: Vengono usati i **Prepared Statements** (`?`) per prevenire SQL Injection.
*   **Filtri**: Vengono mostrati solo brani `public` o `premium` (non privati/bozze).
*   **Limite**: Massimo 20 risultati per garantire velocità.

---

## 4. Visualizzazione (Renderizzazione)
**File:** `public/js/music-search.js`

Una volta ricevuti i dati JSON (`[]` array di oggetti), il frontend aggiorna l'interfaccia:

1.  **Pulizia**: Svuota il contenitore dei risultati precedenti (`innerHTML = ''`).
2.  **Visibilità**: Rende visibile la sezione `#search-results-section`.
3.  **Ciclo**: Per ogni elemento trovato, crea una Card HTML.

```javascript
items.forEach((item, index) => {
    const card = this.createCard(item, index, items);
    this.els.resultsContainer.appendChild(card);
});
```

Ogni card è generata dinamicamente con:
*   Immagine di copertina.
*   Titolo e Autore.
*   Pulsanti funzionali (Play e Like), a cui vengono subito "attaccati" gli eventi di click (`attachCardEvents`).

---

## Riassunto Interazione

1.  Utente scrive "Relax" ⌨️
2.  ... (attesa 300ms) ⏳
3.  GET `/api/search?q=Relax` 🌐
4.  SELECT * FROM sounds WHERE title LIKE '%Relax%' ... 💾
5.  Server risponde con JSON `[{title: "Relaxing Rain", ...}]` 📦
6.  JS crea i div `.card` e li mostra a video 🖼️
