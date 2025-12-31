document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-upload');
    const openBtn = document.getElementById('btn-open-upload');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal || !openBtn) return;

    // Open modal
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active'); // active class will show it
    });

    // Close with X button
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('active');
        });
    }

    // Close when clicking outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});
