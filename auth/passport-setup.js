const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../models/UserModel');

// Configurazione della strategia "Local": usiamo username e password per l'autenticazione.
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // 1. Cerchiamo l'utente nel database tramite lo username.
    const user = await UserModel.findByUsername(username);

    // 2. Se l'utente non esiste, restituiamo un errore (false) con un messaggio.
    if (!user) return done(null, false, { message: 'Utente non trovato' });

    // 3. Se l'utente esiste, verifichiamo che la password inserita corrisponda all'hash nel DB.
    const ok = await UserModel.validatePassword(user, password);

    // 4. Se la password è sbagliata, restituiamo errore.
    if (!ok) return done(null, false, { message: 'Password errata' });

    // 5. Se tutto è corretto, restituiamo l'oggetto utente (login riuscito).
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serializzazione: "Quale dato dell'utente salvo nella sessione?"
// Risposta: Salviamo solo l'ID per mantenere la sessione leggera.
passport.serializeUser((user, done) => done(null, user.id));

// Deserializzazione: "Ho l'ID dalla sessione, come recupero tutto l'utente?"
// Risposta: Uso l'ID per cercare l'utente completo nel DB e inserirlo in req.user.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
