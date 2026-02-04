/**
 * Script per la gestione del caricamento della foto profilo.
 * Supporta il Drag & Drop e la selezione manuale del file,
 * mostrando un'anteprima immediata prima del salvataggio.
 */

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const dropZoneContent = dropZone.querySelector('.drop-zone-content');

    // Verifiche preliminari sulla presenza degli elementi nel DOM
    if (!dropZone || !fileInput) return;

    // --- GESTIONE DRAG & DROP ---

    // Disabilita il comportamento standard del browser (apertura file in nuova scheda)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Evidenzia l'area quando un file viene trascinato sopra
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    // Rimuove l'evidenziazione quando il trascinamento termina o esce dall'area
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Gestione del rilascio del file (drop)
    dropZone.addEventListener('drop', handleDrop, false);


    // --- GESTIONE CLICK E SELEZIONE ---

    // Apre il selettore file di sistema al click sull'area
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Gestione della selezione file tramite dialogo di sistema
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });


    // --- FUNZIONI DI SUPPORTO ---

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight'); // Aggiunge classe CSS per bordo colorato
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

                // Workaround: L'input type="file" è read-only.
                // Si utilizza DataTransfer per assegnare il file droppato all'input del form.
                if (fileInput.files !== files) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                }

                // Mostra l'anteprima dell'immagine
                previewFile(file);
            }
        }
    }

    // Validazione del tipo di file (solo immagini JPEG/PNG)
    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (validTypes.indexOf(file.type) === -1) {
            alert('File non valido. Per favore carica un\'immagine JPG o PNG.');
            return false;
        }
        return true;
    }

    // Legge il file locale e aggiorna l'anteprima (src dell'immagine)
    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            avatarPreview.src = reader.result;
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none'; // Nasconde il messaggio di trascinamento
        }
    }

    // Controllo Iniziale:
    // Se è già presente un avatar personalizzato, lo mostra nascondendo l'area di drop.
    if (avatarPreview.getAttribute('src') && avatarPreview.getAttribute('src') !== '') {
        const currentSrc = avatarPreview.src;
        // Verifica che non sia l'immagine di default e che l'src sia valido
        if (!currentSrc.includes('/immagini/usericon.png') && currentSrc !== window.location.href) {
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none';
        }
    }
});
