/**
 * about.js
 * 
 * Piccola utilità per la pagina "Chi Siamo".
 * Serve solo a tenere aggiornato l'anno del copyright nel footer automaticamente.
 */

document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
});
