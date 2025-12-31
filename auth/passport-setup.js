// auth/passport-setup.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../models/UserModel');

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await UserModel.findByUsername(username);
    if (!user) return done(null, false, { message: 'Utente non trovato' });
    const ok = await UserModel.validatePassword(user, password);
    if (!ok) return done(null, false, { message: 'Password errata' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
