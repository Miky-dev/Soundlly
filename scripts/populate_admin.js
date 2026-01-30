const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");
const { db, run, get, all } = require("../db/sqlite");

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return date.toISOString().replace("T", " ").replace("Z", "");
}

async function ensureSchema() {
  const migrationsPath = path.join(__dirname, "..", "migrations", "init-v3.sql");
  const sql = fs.readFileSync(migrationsPath, "utf8");
  await new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function ensureAdminUser() {


  // Cerchiamo utente 'Admin'
  let admin = await UserModel.findByUsername("Admin");
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - 34); // 34 anni
  const now = new Date();

  if (!admin) {
    // crea l'utente con password temporanea (viene poi hashtata/aggiornata)
    const created = await UserModel.create("Admin", "admin123", "admin");
    admin = await UserModel.findById(created.id);
    console.log("Creato utente Admin (record di base).");
  }

  // Crea un secondo amministratore
  let secondAdmin = await UserModel.findByUsername("SecondAdmin");
  if (!secondAdmin) {
    const createdSecondAdmin = await UserModel.create("SecondAdmin", "password123", "admin");
    secondAdmin = await UserModel.findById(createdSecondAdmin.id);
    console.log("Creato secondo utente Admin.");
  }

  // Imposta i dettagli per il primo admin
  await run(
    `UPDATE users
       SET password_hash = ?,
           role = 'admin',
           plan = 'admin',
           status = 'active',
           display_name = ?,
           date_of_birth = ?,
           born_city = ?,
           location_country = ?,
           subscription_expiry = ?
     WHERE id = ?`,
    [
      await bcrypt.hash("admin123", 10),
      "Soundlly Admin",
      formatDateOnly(birthDate),
      "Milano",
      "Italia",
      null, // subscription_expiry
      admin.id,
    ]
  );

  // Imposta i dettagli per il secondo admin
  await run(
    `UPDATE users
       SET password_hash = ?,
           role = 'admin',
           plan = 'admin',
           status = 'active',
           display_name = ?,
           date_of_birth = ?,
           born_city = ?,
           location_country = ?,
           subscription_expiry = ?
     WHERE id = ?`,
    [
      await bcrypt.hash("password123", 10),
      "Second Admin",
      formatDateOnly(birthDate),
      "Milano",
      "Italia",
      null, // subscription_expiry
      secondAdmin.id,
    ]
  );

  console.log("Utenti Admin configurati.");
  return { admin, secondAdmin };
}

async function ensureGenres(names) {
  const map = {};
  for (const name of names) {
    let row = await get("SELECT id FROM genres WHERE name = ?", [name]);
    if (!row) {
      const res = await run("INSERT INTO genres (name) VALUES (?)", [name]);
      map[name] = res.lastID;
    } else {
      map[name] = row.id;
    }
  }
  return map;
}

async function ensureSound(adminId, sound, genreMap) {
  let row = await get(
    "SELECT id FROM sounds WHERE owner_id = ? AND title = ?",
    [adminId, sound.title]
  );
  if (!row) {
    const res = await run(
      `INSERT INTO sounds (title, description, filename, owner_id, media_type, access_level, restricted, duration_seconds, mood)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        sound.title,
        sound.description || null,
        sound.filename || null,
        adminId,
        sound.media_type || "audio",
        sound.access_level || "public",
        sound.restricted ? 1 : 0,
        sound.duration_seconds || null,
        sound.mood || null,
      ]
    );
    row = { id: res.lastID };
  } else {
    await run(
      `UPDATE sounds
          SET description = ?,
              filename = ?,
              media_type = ?,
              access_level = ?,
              restricted = ?,
              duration_seconds = ?,
              mood = ?
        WHERE id = ?`,
      [
        sound.description || null,
        sound.filename || null,
        sound.media_type || "audio",
        sound.access_level || "public",
        sound.restricted ? 1 : 0,
        sound.duration_seconds || null,
        sound.mood || null,
        row.id,
      ]
    );
  }

  await run("DELETE FROM sound_genres WHERE sound_id = ?", [row.id]);
  for (const genreName of sound.genres || []) {
    const genreId = genreMap[genreName];
    if (!genreId) continue;
    await run(
      "INSERT OR IGNORE INTO sound_genres (sound_id, genre_id) VALUES (?, ?)",
      [row.id, genreId]
    );
  }

  return row.id;
}

async function ensurePlaylist(adminId, playlist, genreMap) {
  let row = await get(
    "SELECT id FROM playlists WHERE owner_id = ? AND name = ?",
    [adminId, playlist.name]
  );
  if (!row) {
    const res = await run(
      `INSERT INTO playlists (name, owner_id, visibility, description, mood)
       VALUES (?, ?, ?, ?, ?)` ,
      [
        playlist.name,
        adminId,
        playlist.visibility || "private",
        playlist.description || null,
        playlist.mood || null,
      ]
    );
    row = { id: res.lastID };
  } else {
    await run(
      `UPDATE playlists
          SET visibility = ?,
              description = ?,
              mood = ?
        WHERE id = ?`,
      [
        playlist.visibility || "private",
        playlist.description || null,
        playlist.mood || null,
        row.id,
      ]
    );
  }

  await run("DELETE FROM playlist_genres WHERE playlist_id = ?", [row.id]);
  for (const genreName of playlist.genres || []) {
    const genreId = genreMap[genreName];
    if (!genreId) continue;
    await run(
      "INSERT OR IGNORE INTO playlist_genres (playlist_id, genre_id) VALUES (?, ?)",
      [row.id, genreId]
    );
  }

  const existingItems = await all(
    "SELECT sound_id FROM playlist_items WHERE playlist_id = ?",
    [row.id]
  );
  const currentIds = new Set(existingItems.map((i) => i.sound_id));
  let position = 0;
  for (const soundId of playlist.items || []) {
    if (!currentIds.has(soundId)) {
      await run(
        "INSERT INTO playlist_items (playlist_id, sound_id, position) VALUES (?, ?, ?)",
        [row.id, soundId, position]
      );
    } else {
      await run(
        "UPDATE playlist_items SET position = ? WHERE playlist_id = ? AND sound_id = ?",
        [position, row.id, soundId]
      );
    }
    position += 1;
  }

  return row.id;
}

async function ensureFavorites(adminId, soundIds) {
  await run("DELETE FROM favorites WHERE user_id = ?", [adminId]);
  for (const soundId of soundIds) {
    await run("INSERT INTO favorites (user_id, sound_id) VALUES (?, ?)", [adminId, soundId]);
  }
}

async function ensureUserGenrePreferences(adminId, preferences, genreMap) {
  await run("DELETE FROM user_genre_preferences WHERE user_id = ?", [adminId]);
  for (const pref of preferences) {
    const genreId = genreMap[pref.genre];
    if (!genreId) continue;
    await run(
      `INSERT INTO user_genre_preferences (user_id, genre_id, score, last_updated)
       VALUES (?, ?, ?, ?)` ,
      [adminId, genreId, pref.score, formatDateTime(new Date())]
    );
  }
}

async function ensureMoodEntries(adminId, entries) {
  await run("DELETE FROM user_mood_entries WHERE user_id = ?", [adminId]);
  for (const entry of entries) {
    await run(
      `INSERT INTO user_mood_entries (user_id, mood, energy_level, note, created_at)
       VALUES (?, ?, ?, ?, ?)` ,
      [adminId, entry.mood, entry.energy_level, entry.note || null, formatDateTime(entry.date)]
    );
  }
}

async function ensureFocusSessions(adminId, sessions) {
  await run("DELETE FROM focus_sessions WHERE user_id = ?", [adminId]);
  for (const session of sessions) {
    await run(
      `INSERT INTO focus_sessions (user_id, session_type, planned_minutes, completed_minutes, status, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [
        adminId,
        session.session_type,
        session.planned_minutes,
        session.completed_minutes || null,
        session.status,
        formatDateTime(session.started_at),
        session.ended_at ? formatDateTime(session.ended_at) : null,
      ]
    );
  }
}

async function ensureListeningHistory(adminId, events) {
  await run("DELETE FROM listening_history WHERE user_id = ?", [adminId]);
  for (const event of events) {
    await run(
      `INSERT INTO listening_history (user_id, sound_id, playlist_id, listened_seconds, device, created_at)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [
        adminId,
        event.sound_id,
        event.playlist_id || null,
        event.listened_seconds || null,
        event.device || null,
        formatDateTime(event.date),
      ]
    );
  }
}

async function ensureUserLikes(adminId, likes) {
  await run("DELETE FROM user_likes WHERE user_id = ?", [adminId]);
  for (const like of likes) {
    await run(
      `INSERT OR IGNORE INTO user_likes (user_id, target_type, target_id, created_at)
       VALUES (?, ?, ?, ?)` ,
      [adminId, like.target_type, like.target_id, formatDateTime(like.date)]
    );
  }
}

async function ensureFeedback(adminId, feedbacks) {
  await run("DELETE FROM feedback WHERE user_id = ?", [adminId]);
  for (const fb of feedbacks) {
    await run(
      `INSERT INTO feedback (user_id, target_type, target_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)` ,
      [
        adminId,
        fb.target_type,
        fb.target_id,
        fb.rating,
        fb.comment || null,
        formatDateTime(fb.date),
      ]
    );
  }
}

async function ensureSearchHistory(adminId, searches) {
  await run("DELETE FROM search_history WHERE user_id = ?", [adminId]);
  for (const search of searches) {
    await run(
      `INSERT INTO search_history (user_id, query, filters, results_count, created_at)
       VALUES (?, ?, ?, ?, ?)` ,
      [
        adminId,
        search.query,
        search.filters ? JSON.stringify(search.filters) : null,
        search.results_count || null,
        formatDateTime(search.date),
      ]
    );
  }
}

async function main() {
  try {
    await ensureSchema();
    const admin = await ensureAdminUser();

    const genresNeeded = [
      "Ambient",
      "Nature",
      "Focus",
      "Drone",
      "Meditation",
      "Rain",
      "Calm"
    ];
    const genreMap = await ensureGenres(genresNeeded);

    const soundsData = [
      {
        title: "Forest Ambience",
        description: "Registrazione ambientale della foresta con pioggia leggera.",
        filename: null,
        media_type: "audio",
        access_level: "public",
        restricted: false,
        duration_seconds: 900,
        mood: "relax",
        genres: ["Ambient", "Nature", "Calm"],
      },
      {
        title: "Deep Focus Drone",
        description: "Suono drone continuo per massima concentrazione.",
        filename: null,
        media_type: "audio",
        access_level: "premium",
        restricted: false,
        duration_seconds: 1200,
        mood: "focus",
        genres: ["Drone", "Focus"],
      },
      {
        title: "Ocean Waves Slow",
        description: "Onde dell'oceano a ritmo lento per meditare.",
        filename: null,
        media_type: "audio",
        access_level: "registered",
        restricted: false,
        duration_seconds: 840,
        mood: "relax",
        genres: ["Nature", "Meditation", "Calm"],
      },
      {
        title: "Night Stories",
        description: "Raccolta di storie rilassanti con temi adulti, accesso riservato.",
        filename: null,
        media_type: "audio",
        access_level: "premium",
        restricted: true,
        duration_seconds: 1800,
        mood: "sleep",
        genres: ["Meditation", "Calm"],
      }
    ];

    const soundIds = {};
    for (const sound of soundsData) {
      const id = await ensureSound(admin.id, sound, genreMap);
      soundIds[sound.title] = id;
    }

    const playlistsData = [
      {
        name: "Relax Totale",
        visibility: "public",
        description: "Selezione di suoni naturali per rilassarsi.",
        mood: "relax",
        items: [soundIds["Forest Ambience"], soundIds["Ocean Waves Slow"]],
        genres: ["Ambient", "Nature"],
      },
      {
        name: "Focus Giornaliero",
        visibility: "premium",
        description: "Sessioni per concentrarsi durante il lavoro.",
        mood: "focus",
        items: [soundIds["Deep Focus Drone"], soundIds["Forest Ambience"]],
        genres: ["Focus", "Drone"],
      },
      {
        name: "Sogni Protetti",
        visibility: "premium",
        description: "Playlist con contenuti ad accesso riservato.",
        mood: "sleep",
        items: [soundIds["Night Stories"], soundIds["Ocean Waves Slow"]],
        genres: ["Calm"],
      }
    ];

    const playlistIds = {};
    for (const playlist of playlistsData) {
      const id = await ensurePlaylist(admin.id, playlist, genreMap);
      playlistIds[playlist.name] = id;
    }

    await ensureFavorites(admin.id, [
      soundIds["Forest Ambience"],
      soundIds["Deep Focus Drone"],
    ]);

    await ensureUserGenrePreferences(
      admin.id,
      [
        { genre: "Ambient", score: 5 },
        { genre: "Focus", score: 4 },
        { genre: "Meditation", score: 3 },
      ],
      genreMap
    );

    const baseDate = new Date();
    const moodEntries = [
      { mood: "centrato", energy_level: 4, note: "Sessione mattutina di meditazione.", date: new Date(baseDate.getTime() - 2 * 86400000) },
      { mood: "rilassato", energy_level: 3, note: "Passeggiata nella natura.", date: new Date(baseDate.getTime() - 1 * 86400000) },
      { mood: "focalizzato", energy_level: 5, note: "Lavoro profondo con tecnica Pomodoro.", date: baseDate }
    ];
    await ensureMoodEntries(admin.id, moodEntries);

    const focusSessions = [
      {
        session_type: "pomodoro",
        planned_minutes: 25,
        completed_minutes: 25,
        status: "completed",
        started_at: new Date(baseDate.getTime() - 3 * 3600000),
        ended_at: new Date(baseDate.getTime() - 3 * 3600000 + 25 * 60000),
      },
      {
        session_type: "break",
        planned_minutes: 5,
        completed_minutes: 5,
        status: "completed",
        started_at: new Date(baseDate.getTime() - 2.5 * 3600000),
        ended_at: new Date(baseDate.getTime() - 2.5 * 3600000 + 5 * 60000),
      },
      {
        session_type: "relax",
        planned_minutes: 15,
        completed_minutes: 12,
        status: "completed",
        started_at: new Date(baseDate.getTime() - 7200000),
        ended_at: new Date(baseDate.getTime() - 7200000 + 12 * 60000),
      }
    ];
    await ensureFocusSessions(admin.id, focusSessions);

    const listeningEvents = [
      {
        sound_id: soundIds["Forest Ambience"],
        playlist_id: playlistIds["Relax Totale"],
        listened_seconds: 600,
        device: "web",
        date: new Date(baseDate.getTime() - 5400000),
      },
      {
        sound_id: soundIds["Deep Focus Drone"],
        playlist_id: playlistIds["Focus Giornaliero"],
        listened_seconds: 900,
        device: "desktop",
        date: new Date(baseDate.getTime() - 3600000),
      },
      {
        sound_id: soundIds["Night Stories"],
        playlist_id: playlistIds["Sogni Protetti"],
        listened_seconds: 1200,
        device: "mobile",
        date: new Date(baseDate.getTime() - 1800000),
      }
    ];
    await ensureListeningHistory(admin.id, listeningEvents);

    const likes = [
      { target_type: "sound", target_id: soundIds["Forest Ambience"], date: new Date(baseDate.getTime() - 5400000) },
      { target_type: "playlist", target_id: playlistIds["Relax Totale"], date: new Date(baseDate.getTime() - 3600000) },
      { target_type: "sound", target_id: soundIds["Deep Focus Drone"], date: new Date(baseDate.getTime() - 1800000) }
    ];
    await ensureUserLikes(admin.id, likes);

    const feedbacks = [
      {
        target_type: "sound",
        target_id: soundIds["Ocean Waves Slow"],
        rating: 5,
        comment: "Ottimo per meditare la sera.",
        date: new Date(baseDate.getTime() - 86400000),
      },
      {
        target_type: "playlist",
        target_id: playlistIds["Focus Giornaliero"],
        rating: 4,
        comment: "Perfetta per il lavoro profondo.",
        date: new Date(baseDate.getTime() - 43200000),
      }
    ];
    await ensureFeedback(admin.id, feedbacks);

    const searches = [
      {
        query: "suoni foresta",
        filters: { mood: "relax", duration: ">10min" },
        results_count: 5,
        date: new Date(baseDate.getTime() - 7000000),
      },
      {
        query: "playlist focus",
        filters: { visibility: "premium" },
        results_count: 3,
        date: new Date(baseDate.getTime() - 4000000),
      }
    ];
    await ensureSearchHistory(admin.id, searches);

    console.log("Popolamento dati admin completato.");
  } catch (err) {
    console.error("Errore durante il popolamento:", err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
