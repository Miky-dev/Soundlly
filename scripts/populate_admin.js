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
  if (fs.existsSync(migrationsPath)) {
    const sql = fs.readFileSync(migrationsPath, "utf8");
    await new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

async function ensureAdminUser() {
  // Cerchiamo utente 'Admin'
  let admin = await UserModel.findByUsername("Admin");
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - 34); // 34 anni
  const now = new Date();

  if (!admin) {
    // crea l'utente con password temporanea
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
      null,
      secondAdmin.id,
    ]
  );

  console.log("Utenti Admin configurati.");
  return { admin, secondAdmin };
}

async function ensureSound(adminId, sound) {
  let row = await get(
    "SELECT id FROM sounds WHERE owner_id = ? AND title = ?",
    [adminId, sound.title]
  );
  if (!row) {
    const res = await run(
      `INSERT INTO sounds (title, description, filename, owner_id, media_type, access_level, is_restricted, duration_seconds, mood, category, genre_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        sound.title,
        sound.description || null,
        sound.filename || 'placeholder.mp3', // Placeholder if null
        adminId,
        sound.media_type || "audio",
        sound.access_level || "public",
        sound.restricted ? 1 : 0,
        sound.duration_seconds || 0,
        sound.mood || null,
        sound.category || 'ambient',
        sound.genre_primary || null
      ]
    );
    row = { id: res.lastID };
  } else {
    // Optional update
    await run(
      `UPDATE sounds
          SET description = ?,
              access_level = ?,
              is_restricted = ?,
              duration_seconds = ?,
              mood = ?,
              category = ?,
              genre_primary = ?
        WHERE id = ?`,
      [
        sound.description || null,
        sound.access_level || "public",
        sound.restricted ? 1 : 0,
        sound.duration_seconds || 0,
        sound.mood || null,
        sound.category || 'ambient',
        sound.genre_primary || null,
        row.id,
      ]
    );
  }
  return row.id;
}

// Helper per Playlist
async function ensurePlaylist(adminId, playlist) {
  let row = await get(
    "SELECT id FROM playlists WHERE owner_id = ? AND name = ?",
    [adminId, playlist.name]
  );
  if (!row) {
    const res = await run(
      `INSERT INTO playlists (name, owner_id, visibility, description)
       VALUES (?, ?, ?, ?)` ,
      [
        playlist.name,
        adminId,
        playlist.visibility || "private",
        playlist.description || null
      ]
    );
    row = { id: res.lastID };
  }

  // Gestione items playlist
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
    }
    position += 1;
  }
  return row.id;
}

async function ensureSoundLikes(adminId, soundIds) {
  await run("DELETE FROM sound_likes WHERE user_id = ?", [adminId]);
  for (const soundId of soundIds) {
    await run("INSERT INTO sound_likes (user_id, sound_id) VALUES (?, ?)", [adminId, soundId]);
  }
}

async function ensureMoodEntries(adminId, entries) {
  await run("DELETE FROM mood_entries WHERE user_id = ?", [adminId]);
  for (const entry of entries) {
    await run(
      `INSERT INTO mood_entries (user_id, mood, note, created_at)
       VALUES (?, ?, ?, ?)` ,
      [adminId, entry.mood, entry.note || null, formatDateTime(entry.date)]
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

async function main() {
  try {
    await ensureSchema();
    const { admin } = await ensureAdminUser();

    // Dati mock per V3
    const soundsData = [
      {
        title: "Forest Ambience",
        description: "Registrazione ambientale della foresta con pioggia leggera.",
        category: 'ambient',
        genre_primary: 'Nature',
        access_level: "public",
        restricted: false,
        duration_seconds: 900,
        mood: "relax",
      },
      {
        title: "Deep Focus Drone",
        description: "Suono drone continuo per massima concentrazione.",
        category: 'music',
        genre_primary: 'Drone',
        access_level: "premium",
        restricted: false,
        duration_seconds: 1200,
        mood: "focus",
      },
      {
        title: "Ocean Waves Slow",
        description: "Onde dell'oceano a ritmo lento per meditare.",
        category: 'ambient',
        genre_primary: 'Nature',
        access_level: "registered",
        restricted: false,
        duration_seconds: 840,
        mood: "relax",
      }
    ];

    const soundIds = {};
    for (const sound of soundsData) {
      const id = await ensureSound(admin.id, sound);
      soundIds[sound.title] = id;
    }

    const playlistsData = [
      {
        name: "Relax Totale",
        visibility: "public",
        description: "Selezione di suoni naturali per rilassarsi.",
        items: [soundIds["Forest Ambience"], soundIds["Ocean Waves Slow"]],
      },
      {
        name: "Focus Giornaliero",
        visibility: "premium",
        description: "Sessioni per concentrarsi durante il lavoro.",
        items: [soundIds["Deep Focus Drone"]],
      }
    ];

    for (const playlist of playlistsData) {
      await ensurePlaylist(admin.id, playlist);
    }

    await ensureSoundLikes(admin.id, [
      soundIds["Forest Ambience"],
      soundIds["Deep Focus Drone"],
    ]);

    const baseDate = new Date();
    const moodEntries = [
      { mood: "centrato", note: "Sessione mattutina di meditazione.", date: new Date(baseDate.getTime() - 2 * 86400000) },
      { mood: "rilassato", note: "Passeggiata nella natura.", date: new Date(baseDate.getTime() - 1 * 86400000) },
      { mood: "focalizzato", note: "Lavoro profondo con tecnica Pomodoro.", date: baseDate }
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
      }
    ];
    await ensureFocusSessions(admin.id, focusSessions);

    console.log("Popolamento dati admin V3 completato.");
  } catch (err) {
    console.error("Errore durante il popolamento:", err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
