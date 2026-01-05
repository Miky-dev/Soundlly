document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const dropZoneContent = dropZone.querySelector('.drop-zone-content');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle click to select
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight');
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

                // Update file input if it wasn't the source (i.e. if drag/drop)
                if (fileInput.files !== files) {
                    // Since fileInput.files is read-only for security, we can't easily set it from drop
                    // But for form submission in modern browsers, we mainly rely on 'change' or FormData
                    // For drag-drop without setting input, we'd need AJAX.
                    // TRICK: We can use a DataTransfer object to sync inputs
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                }

                previewFile(file);
            }
        }
    }

    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (validTypes.indexOf(file.type) === -1) {
            alert('File non valido. Per favore carica un\'immagine JPG o PNG.');
            return false;
        }
        return true;
    }

    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            avatarPreview.src = reader.result;
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none'; // Hide text when showing image
        }
    }

    // Initial State Check: If user already has an avatar URL in src, show it
    if (avatarPreview.getAttribute('src') && avatarPreview.getAttribute('src') !== '') {
        // Check if it's the default placeholder or empty
        if (!avatarPreview.src.includes('/immagini/logo2.png') && avatarPreview.src !== window.location.href) {
            avatarPreview.classList.remove('preview-hidden');
            avatarPreview.style.display = 'block';
            dropZoneContent.style.display = 'none';
        }
    }
});
