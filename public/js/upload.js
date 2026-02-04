/**
 * Gestione interfaccia di caricamento (Upload).
 * Gestisce il Drag & Drop dei file e l'adattamento dinamico del form
 * in base alla categoria selezionata (Musica vs Ambient).
 */

document.addEventListener('DOMContentLoaded', () => {

    // Configurazione generica Drag & Drop per un'area specifica
    function setupDropzone(zoneId, inputId, labelId, nameId) {
        const dropZone = document.getElementById(zoneId);
        const fileInput = document.getElementById(inputId);
        const fileLabel = document.getElementById(labelId);
        const fileNameDisplay = document.getElementById(nameId);

        if (!dropZone || !fileInput) return;

        // Previene il comportamento default del browser (apertura file)
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Feedback visivo (hover) durante il trascinamento
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        // Gestione evento Drop
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;

            // Assegna i file droppati all'input nascosto
            if (files.length > 0) {
                fileInput.files = files;
                updateFileName(files[0]);
            }
        }, false);

        // Gestione selezione manuale (click su Sfoglia)
        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                updateFileName(this.files[0]);
            }
        });

        // Aggiorna interfaccia con nome file selezionato
        function updateFileName(file) {
            if (file) {
                fileLabel.textContent = "File Pronto!"; // Feedback immediato
                fileNameDisplay.textContent = file.name;
                fileNameDisplay.style.color = '#2a9d8f'; // Verde Soundlly
                fileNameDisplay.style.fontWeight = 'bold';
            }
        }
    }

    // Inizializzazione aree upload (Audio e Cover)
    setupDropzone('drop-zone-audio', 'audio', 'label-audio', 'name-audio');
    setupDropzone('drop-zone-cover', 'cover', 'label-cover', 'name-cover');


    // --- LOGICA CATEGORIE ---
    // Gestione visualizzazione campi in base alla categoria (Musica richiede cover, Ambient richiede icona)

    const catAmbient = document.getElementById('cat-ambient');
    const catMusic = document.getElementById('cat-music');

    // Elementi DOM da mostrare/nascondere
    const iconContainer = document.getElementById('icon-container');
    const coverContainer = document.getElementById('cover-container');

    function toggleIconField() {
        if (catMusic.checked) {
            // MUSICA: Nasconde Icona, Richiede Copertina
            iconContainer.classList.add('d-none');
            document.getElementById('icon').disabled = true; // Disabilito per non inviarlo

            coverContainer.classList.remove('d-none');
            document.getElementById('cover').disabled = false;
        } else {
            // AMBIENT: Richiede Icona, Copertina opzionale
            iconContainer.classList.remove('d-none');
            document.getElementById('icon').disabled = false;

            coverContainer.classList.remove('d-none');
            document.getElementById('cover').disabled = false;
        }
    }

    if (catAmbient && catMusic) {
        catAmbient.addEventListener('change', toggleIconField);
        catMusic.addEventListener('change', toggleIconField);

        // Inizializzazione stato campi all'avvio
        toggleIconField();
    }
});
