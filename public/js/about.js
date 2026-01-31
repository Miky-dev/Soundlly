/**
 * Gestione della pagina "Chi Siamo" (About)
 * Funzionalità minime: gestione anno footer.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Imposta l'anno corrente nel copyright del footer
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
});
