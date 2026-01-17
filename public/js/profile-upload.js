/**
 * profile-upload.js
 * 
 * Gestisce il caricamento dell'immagine profilo (avatar) tramite drag & drop o selezione file.
 * 
 * Funzionalità principali:
 * 1. Drag & Drop: Evidenzia l'area quando si trascina un file sopra.
 * 2. Anteprima: Mostra immediatamente l'immagine selezionata prima del salvataggio.
 * 3. Validazione: Accetta solo immagini JPG/PNG.
 * 4. Sincronizzazione: Aggiorna l'input file nascosto quando viene droppato un file.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi del DOM
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const dropZoneContent = dropZone.querySelector('.drop-zone-content');

    // -------------------------------------------------------------------------
    // 1. Gestione Eventi Drag & Drop
    // -------------------------------------------------------------------------

    // Previene il comportamento default del browser (che aprirebbe il file in una nuova tab)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Evidenzia la zona di drop quando l'utente trascina un file sopra
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    // Rimuove l'evidenziazione quando il file esce dall'area o viene rilasciato
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Gestisce il rilascio effettivo del file
    dropZone.addEventListener('drop', handleDrop, false);

    // -------------------------------------------------------------------------
    // 2. Gestione Selezione Manuale (Click)
    // -------------------------------------------------------------------------

    // Cliccando sulla zona tratteggiata, si apre il selettore file di sistema
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Quando l'utente seleziona un file dal dialogo di sistema
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    // -------------------------------------------------------------------------
    // Funzioni di Supporto
    // -------------------------------------------------------------------------

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight'); // Aggiunge bordo colorato/sfondo
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {

                // Se il file arriva da Drag&Drop, l'input file HTML non è aggiornato automaticamente.
                // Dobbiamo sincronizzarlo manualmemte per permettere l'invio del form.
                if (fileInput.files !== files) {
                    // TRUCCO: Usiamo l'oggetto DataTransfer per impostare i file dell'input (che è read-only)
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                }

                // Mostra l'anteprima visiva
                previewFile(file);
            }
        }
    }

    // Controlla che il file sia un'immagine valida
    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (validTypes.indexOf(file.type) === -1) {
            alert('File non valido. Per favore carica un\'immagine JPG o PNG.');
            return false;
        }
        return true;
    }

    // Legge il file locale e lo mostra nel tag <img>
    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file); // Converte il file in stringa Base64
        reader.onloadend = function () {
            avatarPreview.src = reader.result;
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none'; // Nasconde il testo "Trascina qui..."
        }
    }

    // Controllo Attuale: Se l'utente ha già un avatar caricato dal server
    if (avatarPreview.getAttribute('src') && avatarPreview.getAttribute('src') !== '') {
        // Se non è l'icona di default, mostriamo l'anteprima nascondendo il testo di drop
        if (!avatarPreview.src.includes('/immagini/usericon.png') && avatarPreview.src !== window.location.href) {
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none';
        }
    }
});
