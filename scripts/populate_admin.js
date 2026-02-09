const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");
const { db, run, get, all } = require("../db/sqlite");

// Helper per formattare le date
function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date) {
  return date.toISOString().replace("T", " ").replace("Z", "");
}

/**
 * Assicura che lo schema del database sia aggiornato caricando il file SQL di migrazione.
 */
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

/**
 * Funzione di utilità per aggiornare i dettagli di un utente amministratore.
 */
async function updateAdminDetails(userId, password, displayName, birthDate) {
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
      await bcrypt.hash(password, 10),
      displayName,
      formatDateOnly(birthDate),
      "Milano",
      "Italia",
      null,
      userId,
    ]
  );
}

/**
 * Crea o aggiorna gli utenti amministratori di test.
 */
async function ensureAdminUsers() {
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - 34);

  // Gestione primo Admin
  let admin = await UserModel.findByUsername("Admin");
  if (!admin) {
    const created = await UserModel.create("Admin", "admin123", "admin");
    admin = await UserModel.findById(created.id);
    console.log("Creato utente Admin.");
  }
  await updateAdminDetails(admin.id, "admin123", "Soundlly Admin", birthDate);

  // Gestione secondo Admin (SecondAdmin)
  let secondAdmin = await UserModel.findByUsername("SecondAdmin");
  if (!secondAdmin) {
    const created = await UserModel.create("SecondAdmin", "password123", "admin");
    secondAdmin = await UserModel.findById(created.id);
    console.log("Creato secondo utente Admin.");
  }
  await updateAdminDetails(secondAdmin.id, "password123", "Second Admin", birthDate);

  console.log("Configurazione utenti Admin completata.");
  return { admin, secondAdmin };
}

/**
 * Inserisce o aggiorna un suono nel database.
 */
async function ensureSound(adminId, sound) {
  let row = await get(
    "SELECT id FROM sounds WHERE owner_id = ? AND title = ?",
    [adminId, sound.title]
  );

  if (!row) {
    const res = await run(
      `INSERT INTO sounds (title, description, filename, owner_id, media_type, access_level, is_restricted, duration_seconds, mood, category, genre_primary, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sound.title,
        sound.description || null,
        sound.filename || 'placeholder.mp3',
        adminId,
        sound.media_type || "audio",
        sound.access_level || "public",
        sound.restricted ? 1 : 0,
        sound.duration_seconds || 0,
        sound.mood || null,
        sound.category || 'ambient',
        sound.genre_primary || null,
        sound.icon || null
      ]
    );
    row = { id: res.lastID };
  } else {
    await run(
      `UPDATE sounds
          SET description = ?,
              access_level = ?,
              is_restricted = ?,
              duration_seconds = ?,
              mood = ?,
              category = ?,
              genre_primary = ?,
              icon = ?
        WHERE id = ?`,
      [
        sound.description || null,
        sound.access_level || "public",
        sound.restricted ? 1 : 0,
        sound.duration_seconds || 0,
        sound.mood || null,
        sound.category || 'ambient',
        sound.genre_primary || null,
        sound.icon || null,
        row.id,
      ]
    );
  }
  return row.id;
}

/**
 * Crea una playlist e vi aggiunge i brani specificati.
 */
async function ensurePlaylist(adminId, playlist) {
  let row = await get(
    "SELECT id FROM playlists WHERE owner_id = ? AND name = ?",
    [adminId, playlist.name]
  );

  if (!row) {
    const res = await run(
      `INSERT INTO playlists (name, owner_id, visibility, description)
       VALUES (?, ?, ?, ?)`,
      [
        playlist.name,
        adminId,
        playlist.visibility || "private",
        playlist.description || null
      ]
    );
    row = { id: res.lastID };
  }

  // Sincronizzazione dei contenuti della playlist
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

/**
 * Imposta i "Mi piace" ai suoni per l'utente specificato.
 */
async function ensureSoundLikes(userId, soundIds) {
  await run("DELETE FROM sound_likes WHERE user_id = ?", [userId]);
  for (const soundId of soundIds) {
    await run("INSERT INTO sound_likes (user_id, sound_id) VALUES (?, ?)", [userId, soundId]);
  }
}

/**
 * Inserisce le annotazioni dell'umore (Mood) per l'utente.
 */
async function ensureMoodEntries(userId, entries) {
  await run("DELETE FROM mood_entries WHERE user_id = ?", [userId]);
  for (const entry of entries) {
    await run(
      `INSERT INTO mood_entries (user_id, mood, note, created_at)
       VALUES (?, ?, ?, ?)`,
      [userId, entry.mood, entry.note || null, formatDateTime(entry.date)]
    );
  }
}

/**
 * Popola le sessioni di focus per l'utente.
 */
async function ensureFocusSessions(userId, sessions) {
  await run("DELETE FROM focus_sessions WHERE user_id = ?", [userId]);
  for (const session of sessions) {
    await run(
      `INSERT INTO focus_sessions (user_id, session_type, planned_minutes, completed_minutes, status, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
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

/**
 * Script principale per il popolamento dei dati admin.
 */
async function main() {
  try {
    // Inizializzazione schema e utenti base
    await ensureSchema();
    const { admin } = await ensureAdminUsers();

    // Dati dei suoni da inserire
    const soundsData = [
      {
        title: "Forest Ambience",
        description: "Suoni ambientali della foresta con pioggia leggera.",
        category: 'ambient',
        genre_primary: 'Nature',
        access_level: "public",
        restricted: false,
        duration_seconds: 900,
        mood: "relax",
      },
      {
        title: "Deep Focus Drone",
        description: "Suono drone per massimizzare la concentrazione.",
        category: 'music',
        genre_primary: 'Drone',
        access_level: "premium",
        restricted: false,
        duration_seconds: 1200,
        mood: "focus",
        icon: "/immagini/logo.png"
      },
      {
        title: "Ocean Waves Slow",
        description: "Onde dell'oceano a ritmo lento per la meditazione.",
        category: 'ambient',
        genre_primary: 'Nature',
        access_level: "registered",
        restricted: false,
        duration_seconds: 840,
        mood: "relax",
      }
    ];

    // Inserimento suoni e salvataggio degli ID per dopo
    const soundIds = {};
    for (const sound of soundsData) {
      const id = await ensureSound(admin.id, sound);
      soundIds[sound.title] = id;
    }

    // Creazione playlist
    const playlistsData = [
      {
        name: "Relax Totale",
        visibility: "public",
        description: "Suoni naturali per staccare la spina.",
        items: [soundIds["Forest Ambience"], soundIds["Ocean Waves Slow"]],
      },
      {
        name: "Focus Giornaliero",
        visibility: "public",
        description: "Playlist per lo studio o il lavoro profondo.",
        items: [soundIds["Deep Focus Drone"]],
      }
    ];

    for (const playlist of playlistsData) {
      await ensurePlaylist(admin.id, playlist);
    }

    // Aggiunta di alcuni 'Like'
    await ensureSoundLikes(admin.id, [
      soundIds["Forest Ambience"],
      soundIds["Deep Focus Drone"],
    ]);

    // Inserimento dati umore
    const baseDate = new Date();
    const moodEntries = [
      { mood: "centrato", note: "Ottima sessione mattutina.", date: new Date(baseDate.getTime() - 2 * 86400000) },
      { mood: "rilassato", note: "Passeggiata pomeridiana.", date: new Date(baseDate.getTime() - 1 * 86400000) },
      { mood: "focalizzato", note: "Sessione Pomodoro molto produttiva.", date: baseDate }
    ];
    await ensureMoodEntries(admin.id, moodEntries);

    // Inserimento sessioni focus
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

    console.log("Popolamento dati Admin completato.");
  } catch (err) {
    console.error("Si è verificato un errore durante il popolamento:", err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();
