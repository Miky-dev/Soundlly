/**
 * Questo script gestisce il caricamento della foto profilo.
 * Permette all'utente di trascinare un'immagine nel box (Drag & Drop) 
 * oppure di cliccare per selezionarla dal computer.
 * Mostra anche un'anteprima immediata prima che il form venga salvato.
 */

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const dropZoneContent = dropZone.querySelector('.drop-zone-content');

    // Se non trovo gli elementi (magari sono su un'altra pagina), non faccio nulla
    if (!dropZone || !fileInput) return;

    // --- GESTIONE DRAG & DROP ---

    // Disabilito il comportamento standard del browser che aprirebbe il file in una nuova scheda
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Quando l'utente trascina un file sopra l'area, la illumino per fargli capire che può rilasciare
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    // Tolgo l'effetto visivo se l'utente esce dall'area o lascia il file
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Gestisco il rilascio vero e proprio del file
    dropZone.addEventListener('drop', handleDrop, false);


    // --- GESTIONE CLICK E SELEZIONE ---

    // Se clicco nell'area tratteggiata, apro il classico selettore file di Windows/Mac
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Quando l'utente sceglie un file dal dialogo di sistema
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });


    // --- FUNZIONI DI SUPPORTO ---

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight'); // Aggiungo classe CSS per bordo colorato
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

                // Problema: l'input type="file" è di sola lettura per motivi di sicurezza.
                // Se il file arriva dal Drag & Drop, devo usare questo trucco con DataTransfer
                // per "spostare" il file dentro l'input del form, altrimenti non verrebbe inviato.
                if (fileInput.files !== files) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                }

                // Faccio vedere l'immagine appena caricata
                previewFile(file);
            }
        }
    }

    // Controllo banale sul tipo di file: accettiamo solo immagini comuni
    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (validTypes.indexOf(file.type) === -1) {
            alert('File non valido. Per favore carica un\'immagine JPG o PNG.');
            return false;
        }
        return true;
    }

    // Leggo il file dal disco locale e lo visualizzo al volo cambiando l'src dell'immagine
    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            avatarPreview.src = reader.result;
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none'; // Nascondo la scritta "Trascina qui..."
        }
    }

    // Controllo Iniziale: 
    // Se l'utente ha già un avatar (diverso da quello di default o vuoto), 
    // lo mostro subito nascondendo l'area di drop vuota.
    if (avatarPreview.getAttribute('src') && avatarPreview.getAttribute('src') !== '') {
        const currentSrc = avatarPreview.src;
        // Se non è l'immagine di default e non è l'URL della pagina corrente (errore comune di caricamento src vuoti)
        if (!currentSrc.includes('/immagini/usericon.png') && currentSrc !== window.location.href) {
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none';
        }
    }
});
