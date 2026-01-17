const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('./auth/passport-setup');
const UserModel = require('./models/UserModel');
const crypto = require('crypto');

const { ensureAuthenticated } = require('./middleware/auth');
const { run, get, all } = require('./db/sqlite'); // Added DB import


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'zdrtrftvgbnkjbv"£$%&cdryfxcguyhjgfdre56tyfvgitfudr657i6ufygfd57£$%&/(IJHGFDE£WSERT&YUHGHIOOKJHT%$£WSDF6uyrtcxese46u5rtfugyuhgyftdryue465yrdft',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true in prod
    maxAge: 1000 * 60 * 60 * 2 // 2h
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Locals middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  // Shim for potential view dependencies to avoid crashes, though features are gone
  res.locals.canUpload = false;
  res.locals.isAdmin = !!(req.user && req.user.role === 'admin');
  res.locals.userPlan = (req.user && req.user.plan) || 'standard';
  next();
});

// CSRF Helpers
function genToken() { return crypto.randomBytes(24).toString('hex'); }
function ensureCsrfToken(req) {
  if (!req.session) return null;
  if (!req.session.csrfToken) {
    req.session.csrfToken = genToken();
  }
  return req.session.csrfToken;
}
function checkCsrf(req, res) {
  const token = req.body?._csrf || req.headers['x-csrf-token'];
  return token && req.session && token === req.session.csrfToken;
}

// Routes
app.use(require('./routes/subscription'));

// Pre-generate CSRF token for static pages
app.get(['/login.html', '/register.html'], (req, res, next) => {
  ensureCsrfToken(req);
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/home');
  const token = ensureCsrfToken(req);
  res.render('login', { csrfToken: token });
});

// Endpoint for frontend CSRF fetch if needed
app.get('/api/csrf', (req, res) => {
  const t = ensureCsrfToken(req);
  res.json({ csrfToken: t });
});

app.post('/register', async (req, res) => {
  try {
    if (!checkCsrf(req, res)) return res.status(403).send('CSRF token mancante o non valido');
    const { username, password } = req.body;
    if (!username || !password) return res.redirect('/login?missing=1');
    await UserModel.create(username, password);
    return res.redirect('/login?registered=1');
  } catch (err) {
    console.error(err);
    if (String(err.message).toLowerCase().includes('unique')) {
      return res.redirect('/login?exists=1');
    }
    return res.redirect('/login?error=1');
  }
});

app.post('/login', (req, res, next) => {
  if (!checkCsrf(req, res)) return res.status(403).send('CSRF token mancante o non valido');
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login?error=1');
    req.logIn(user, (err) => {
      if (err) return next(err);
      if (req.body.remember === '1') {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 14; // 14 days
      } else {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 2; // 2 hours
      }
      req.session.csrfToken = genToken();
      return res.redirect('/home');
    });
  })(req, res, next);
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect('/'));
  });
});

app.post('/api/logout', (req, res, next) => {
  if (!req.isAuthenticated()) return res.json({ ok: true });
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.json({ ok: true }));
  });
});

// Routes imports
const focusRoutes = require('./routes/focus');  //TIMER

// Mount routes
app.use('/api/focus', focusRoutes);  //TIMER


// --- 4. PROFILE ROUTES ---
const profileRoutes = require('./routes/profile');
app.use('/profilo', profileRoutes);

// --- 4.5 UPLOAD ROUTE ---
const uploadRoutes = require('./routes/upload');
app.use('/upload', uploadRoutes);

// --- 4.6 TO-DO ROUTE ---
// --- 4.6 TO-DO ROUTE ---
app.use('/api/todos', require('./routes/todo'));

// --- 5. STATISTICS ROUTE ---

const statsRoutes = require('./routes/stats');
app.use('/stats', statsRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Search Route
app.use('/api/search', require('./routes/search'));

// Music Route
app.use('/api/music', require('./routes/music'));


//session INFO

app.get('/api/session', (req, res) => {
  if (req.isAuthenticated()) {
    const { id, username, role, created_at } = req.user;
    return res.json({ authenticated: true, user: { id, username, role, created_at } });
  }
  return res.json({ authenticated: false });
});

// Subscription Page
app.get('/abbonamento', ensureAuthenticated, (req, res) => {
  res.render('abbonamento', { user: req.user });
});

// Home (Public) - Served at root
app.get('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let dailyGoal = 60; // Default
    let todayMinutes = 0;
    let pomoCount = 0;
    let todoStats = { total: 0, completed: 0 };

    if (userId) {
      // Get Goal
      const goalRow = await get(`SELECT daily_focus_goal FROM user_goals WHERE user_id = ?`, [userId]);
      if (goalRow) dailyGoal = goalRow.daily_focus_goal;

      // Get Today's Progress
      const now = new Date();
      // SQLite uses 'YYYY-MM-DD HH:MM:SS' (UTC default). JS toISOString uses 'T' separator which breaks string comparison.
      // We convert local midnight to UTC, then format strictly to match SQLite.
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().replace('T', ' ').split('.')[0];

      // 1. Focus Minutes & Pomo Count
      const progressRow = await get(
        `SELECT 
           SUM(completed_minutes) as todayMinutes,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as pomoCount
         FROM focus_sessions 
         WHERE user_id = ? AND started_at >= ?`,
        [userId, startOfDay]
      );
      if (progressRow) {
        if (progressRow.todayMinutes) todayMinutes = progressRow.todayMinutes;
        if (progressRow.pomoCount) pomoCount = progressRow.pomoCount;
      }

      // 2. To-Do Stats
      const todoStatsRow = await get(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN is_done = 1 THEN 1 ELSE 0 END) as completed
         FROM todos 
         WHERE user_id = ?`,
        [userId]
      );
      if (todoStatsRow) {
        todoStats = {
          total: todoStatsRow.total || 0,
          completed: todoStatsRow.completed || 0
        };
      }
    }

    res.render('home', {
      user: req.user || null,
      summary: { uploads: 0, favorites: 0, playlists: 0 },
      playlists: [],
      favorites: [],
      dailyGoal,
      todayMinutes,
      pomoCount,
      todoStats
    });
  } catch (err) {
    console.error("Home Route Error:", err);
    res.render('home', {
      user: req.user || null,
      summary: { uploads: 0, favorites: 0, playlists: 0 },
      playlists: [],
      favorites: [],
      dailyGoal: 60,
      todayMinutes: 0,
      pomoCount: 0,
      todoStats: { total: 0, completed: 0 }
    });
  }
});

// Route Modalità Immersive - Reindirizza alla home (gestita ora lato client)
app.get('/immersive', (req, res) => {
  res.redirect('/');
});

// Legacy /home redirect
app.get('/home', (req, res) => {
  res.redirect('/');
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));