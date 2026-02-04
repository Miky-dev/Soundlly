/**
 * Gestione della pagina About
 */

document.addEventListener('DOMContentLoaded', () => {
  // Imposta l'anno corrente nel copyright del footer
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
});
