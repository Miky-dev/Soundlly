/**
 * upload-modal.js
 * 
 * Gestione apertura/chiusura finestra modale di Upload.
 * Semplice script di utilità per l'interfaccia utente.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti DOM
    const modal = document.getElementById('modal-upload');
    const openBtn = document.getElementById('btn-open-upload'); // Pulsante "Carica" (o icona +)
    const closeBtn = document.querySelector('.modal-close');    // Pulsante "X"

    if (!modal || !openBtn) return;

    // Apertura Modale
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active'); // La classe CSS 'active' rende visibile il modale
    });

    // Chiusura con bottone X
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('active');
        });
    }

    // Chiusura cliccando fuori dal contenuto (sull'overlay scuro)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});
