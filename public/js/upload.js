/**
 * Gestisce la pagina di caricamento (Upload).
 * Qui gestiamo il drag & drop dei file (MP3 e Immagini) e la logica 
 * che cambia i campi del form in base a cosa stai caricando (Musica vs Suoni Ambientali).
 */

document.addEventListener('DOMContentLoaded', () => {

    // Funzione per gestire il Drag & Drop su qualsiasi area gli passiamo
    function setupDropzone(zoneId, inputId, labelId, nameId) {
        const dropZone = document.getElementById(zoneId);
        const fileInput = document.getElementById(inputId);
        const fileLabel = document.getElementById(labelId);
        const fileNameDisplay = document.getElementById(nameId);

        if (!dropZone || !fileInput) return;

        // Impediamo al browser di fare di testa sua (es. aprire il file) quando trascini qualcosa
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Effetti visivi quando passi sopra col mouse (aggiungo classe CSS)
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        // Quando rilasci il file...
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;

            // ...se c'è davvero un file, lo metto nell'input nascosto
            if (files.length > 0) {
                fileInput.files = files;
                updateFileName(files[0]);
            }
        }, false);

        // Gestisco anche il click classico "Sfoglia..."
        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                updateFileName(this.files[0]);
            }
        });

        // Aggiorno la scritta nel box per confermare che il file è preso
        function updateFileName(file) {
            if (file) {
                fileLabel.textContent = "File Pronto!"; // Feedback immediato
                fileNameDisplay.textContent = file.name;
                fileNameDisplay.style.color = '#2a9d8f'; // Verde Soundlly
                fileNameDisplay.style.fontWeight = 'bold';
            }
        }
    }

    // Configuro le due aree di upload: una per l'Audio e una per la Cover
    setupDropzone('drop-zone-audio', 'audio', 'label-audio', 'name-audio');
    setupDropzone('drop-zone-cover', 'cover', 'label-cover', 'name-cover');


    // --- LOGICA CATEGORIE ---
    // Se carichi musica serve la copertina. Se carichi suoni ambientali, basta l'icona.

    const catAmbient = document.getElementById('cat-ambient');
    const catMusic = document.getElementById('cat-music');

    // Contenitori da mostrare/nascondere
    const iconContainer = document.getElementById('icon-container');
    const coverContainer = document.getElementById('cover-container');

    function toggleIconField() {
        if (catMusic.checked) {
            // MUSICA: Nascondo Icona, Mostro Copertina
            iconContainer.classList.add('d-none');
            document.getElementById('icon').disabled = true; // Disabilito per non inviarlo

            coverContainer.classList.remove('d-none');
            document.getElementById('cover').disabled = false;
        } else {
            // AMBIENT (o altri): Mostro sia Icona che Copertina (opzionale)
            // Nel design attuale, per i suoni ambientali usiamo le icone
            iconContainer.classList.remove('d-none');
            document.getElementById('icon').disabled = false;

            coverContainer.classList.remove('d-none');
            document.getElementById('cover').disabled = false;
        }
    }

    if (catAmbient && catMusic) {
        catAmbient.addEventListener('change', toggleIconField);
        catMusic.addEventListener('change', toggleIconField);

        // Lancio la funzione all'avvio per impostare lo stato corretto
        toggleIconField();
    }
});
