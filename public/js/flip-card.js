// flip-card.js — gestione flip + attivazione pannelli
(() => {
  const flipCard = document.getElementById('flipCard');
  const btn = document.getElementById('flipBtnExternal');
  if (!flipCard || !btn) return;

  const frontFace = flipCard.querySelector('.face.is-front');
  const backFace  = flipCard.querySelector('.face.is-back');
  const paneTimer = document.getElementById('pane-timer');
  const paneTodo  = document.getElementById('pane-todo');

  function updateA11y(){
    const isBack = flipCard.classList.contains('is-back');
    const label = isBack ? 'Mostra fronte' : 'Mostra retro';
    btn.setAttribute('aria-pressed', String(isBack));
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);

    if (frontFace && backFace){
      frontFace.setAttribute('aria-hidden', String(isBack));
      backFace.setAttribute('aria-hidden', String(!isBack));
    }
  }

  function setActivePane(which){
    if (!paneTimer || !paneTodo) return;
    if (which === 'todo'){
      paneTimer.classList.remove('active');
      paneTodo.classList.add('active');
      // Notifica a todo.js di inizializzarsi (lo ascolta in fondo al file)
      document.dispatchEvent(new CustomEvent('prod:show-pane', { detail: { pane: 'todo' } }));
    } else {
      paneTodo.classList.remove('active');
      paneTimer.classList.add('active');
    }
  }

  function toggle(){
    const nowBack = flipCard.classList.toggle('is-back');
    setActivePane(nowBack ? 'todo' : 'timer');
    updateA11y();
  }

  btn.addEventListener('click', toggle);
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });

  // stato iniziale coerente
  setActivePane(flipCard.classList.contains('is-back') ? 'todo' : 'timer');
  updateA11y();
})();
