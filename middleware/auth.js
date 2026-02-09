// Si mette in mezzo tra la richiesta dell'utente e la pagina finale.

// Questa funzione controlla se l'utente è loggato.
// Se sì -> next() fa passare alla pagina richiesta.
// Se no -> reindirizza alla pagina di login.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Questa funzione controlla se l'utente è un AMMINISTRATORE.
// Utile per proteggere pagine sensibili come il pannello admin.
function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Accesso negato: non sei un amministratore.');
}

module.exports = { ensureAuthenticated, ensureAdmin };