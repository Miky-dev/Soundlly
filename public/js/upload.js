document.addEventListener('DOMContentLoaded', () => {
    function setupDropzone(zoneId, inputId, labelId, nameId) {
        const dropZone = document.getElementById(zoneId);
        const fileInput = document.getElementById(inputId);
        const fileLabel = document.getElementById(labelId);
        const fileNameDisplay = document.getElementById(nameId);

        if (!dropZone || !fileInput) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateFileName(files[0]);
            }
        }, false);

        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                updateFileName(this.files[0]);
            }
        });

        function updateFileName(file) {
            if (file) {
                // fileLabel.style.display = 'none'; // Keep label but update text? Or hide?
                // Let's hide label or update it
                fileLabel.textContent = "File Caricato";
                fileNameDisplay.textContent = file.name;
                fileNameDisplay.style.color = '#2a9d8f';
                fileNameDisplay.style.fontWeight = 'bold';
            }
        }
    }

    // Setup Audio Dropzone
    setupDropzone('drop-zone-audio', 'audio', 'label-audio', 'name-audio');
    // Setup Cover Dropzone
    setupDropzone('drop-zone-cover', 'cover', 'label-cover', 'name-cover');

    // Toggle Icon field based on category
    const catAmbient = document.getElementById('cat-ambient');
    const catMusic = document.getElementById('cat-music');
    const iconContainer = document.getElementById('icon-container');
    const coverContainer = document.getElementById('cover-container');

    function toggleIconField() {
        if (catMusic.checked) {
            // Show Cover, Hide Icon
            iconContainer.classList.add('d-none');
            document.getElementById('icon').disabled = true;

            coverContainer.classList.remove('d-none');
            document.getElementById('cover').disabled = false;
        } else {
            // Show Icon AND Cover for Ambient (Sounds)
            iconContainer.classList.remove('d-none');
            document.getElementById('icon').disabled = false;

            coverContainer.classList.remove('d-none');
            document.getElementById('cover').disabled = false;
        }
    }

    if (catAmbient && catMusic) {
        catAmbient.addEventListener('change', toggleIconField);
        catMusic.addEventListener('change', toggleIconField);

        // Init
        toggleIconField();
    }
});
