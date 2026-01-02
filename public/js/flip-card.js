document.addEventListener('DOMContentLoaded', () => {
    const flipBtn = document.getElementById('flipBtnExternal');
    const flipCard = document.getElementById('flipCard');

    if (flipBtn && flipCard) {
        flipBtn.addEventListener('click', () => {
            flipCard.classList.toggle('is-back');

            // Optional: Toggle icon
            const icon = flipBtn.querySelector('i');
            if (flipCard.classList.contains('is-back')) {
                icon.classList.remove('fa-list-check');
                icon.classList.add('fa-clock');
                flipBtn.title = "Torna al Timer";
            } else {
                icon.classList.remove('fa-clock');
                icon.classList.add('fa-list-check');
                flipBtn.title = "Vai alla To-Do List";
            }
        });
    }
});
