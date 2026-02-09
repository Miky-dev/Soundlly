-- migrations/init-v3.sql
-- Schema Database V3 - Ottimizzato per Professionisti e Statistiche
-- Unifica Utenti, Profili, Grafo Sociale e Analisi Avanzate

PRAGMA foreign_keys = ON;

-- =================================================================
-- 1. UTENTI E AUTENTICAZIONE
-- =================================================================
CREATE TABLE IF NOT EXISTS users (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,

-- Credenziali
username TEXT NOT NULL UNIQUE COLLATE NOCASE,
email TEXT UNIQUE COLLATE NOCASE,
password_hash TEXT NOT NULL,

-- Informazioni Profilo
display_name TEXT,
bio TEXT,
avatar_url TEXT,
mood_theme TEXT DEFAULT 'default',
born_city TEXT,
location_country TEXT,
date_of_birth DATE,
mood TEXT,
subscription_expiry DATE,

-- Impostazioni Timer
focus_minutes INTEGER DEFAULT 25,
short_break_minutes INTEGER DEFAULT 5,
long_break_minutes INTEGER DEFAULT 15,

-- Stato Account
role TEXT NOT NULL DEFAULT 'user' CHECK (
    role IN ('user', 'creator', 'admin')
),
plan TEXT NOT NULL DEFAULT 'standard' CHECK (
    plan IN (
        'standard',
        'premium',
        'admin'
    )
),
status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN (
        'active',
        'suspended',
        'deleted'
    )
),

-- Timestamp Gestione Record
created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at         DATETIME
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- =================================================================
-- 1b. OBIETTIVI UTENTE
-- =================================================================
CREATE TABLE IF NOT EXISTS user_goals (
    user_id INTEGER PRIMARY KEY,
    daily_focus_goal INTEGER DEFAULT 60, -- Minutes
    weekly_focus_goal INTEGER DEFAULT 300, -- Minutes
    monthly_focus_goal INTEGER DEFAULT 1200, -- Minutes
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- =================================================================
-- 3. CONTENUTI AUDIO (SOUNDS)
-- =================================================================
CREATE TABLE IF NOT EXISTS sounds (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id              INTEGER NOT NULL,

-- Contenuti
title TEXT NOT NULL,
description TEXT,
filename TEXT NOT NULL, -- path
media_type TEXT NOT NULL DEFAULT 'audio',
duration_seconds INTEGER DEFAULT 0,

-- Categorizzazione
mood TEXT,
genre_primary TEXT, -- Tag semplice per filtraggio rapido

-- Controllo Accessi
access_level TEXT NOT NULL DEFAULT 'public' CHECK (
    access_level IN (
        'public',
        'registered',
        'premium',
        'private'
    )
),
category TEXT DEFAULT 'ambient' CHECK (
    category IN ('ambient', 'music', 'sound')
),

-- Icona/Copertina con vincolo per Musica
icon TEXT,
is_restricted INTEGER NOT NULL DEFAULT 0 CHECK (is_restricted IN (0, 1)),

-- Statistiche (Contatori in cache)
play_count INTEGER DEFAULT 0, like_count INTEGER DEFAULT 0,

-- Timestamp Gestione Record
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
deleted_at DATETIME,
FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,

-- VINCOLO: Se la categoria è musica, l'icona NON DEVE ESSERE NULLA
CONSTRAINT check_music_has_cover CHECK (
     category != 'music' OR icon IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_sounds_owner ON sounds (owner_id);

CREATE INDEX IF NOT EXISTS idx_sounds_access ON sounds (access_level);

CREATE INDEX IF NOT EXISTS idx_sounds_created ON sounds (created_at DESC);

-- =================================================================
-- 4. PLAYLISTS
-- =================================================================
CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    type TEXT NOT NULL DEFAULT 'playlist' CHECK (
        type IN (
            'playlist',
            'album',
            'compilation'
        )
    ),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (
        visibility IN (
            'private',
            'public',
            'unlisted'
        )
    ),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist_items (
    playlist_id INTEGER NOT NULL,
    sound_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, sound_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE CASCADE
) WITHOUT ROWID;

-- =================================================================
-- 5. INTERAZIONI (Foreign Key Strette)
-- =================================================================
CREATE TABLE IF NOT EXISTS sound_likes (
    user_id INTEGER NOT NULL,
    sound_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE CASCADE
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS playlist_likes (
    user_id INTEGER NOT NULL,
    playlist_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, playlist_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
) WITHOUT ROWID;

-- =================================================================
-- 6. ANALITICA E STATISTICHE
-- =================================================================

-- Storico Ascolti (Dettagliato)
CREATE TABLE IF NOT EXISTS listening_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- Opzionale per ascolti anonimi
    sound_id INTEGER NOT NULL,
    playlist_id INTEGER, -- Contesto: riprodotto da una playlist?
    listened_seconds INTEGER DEFAULT 0,
    completed_percent INTEGER DEFAULT 0,
    device_type TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE SET NULL,
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_listening_history_user ON listening_history (user_id);

CREATE INDEX IF NOT EXISTS idx_listening_history_sound ON listening_history (sound_id);

-- Sessioni Focus (Pomodoro)
CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    planned_minutes INTEGER NOT NULL,
    completed_minutes INTEGER DEFAULT 0,
    session_type TEXT DEFAULT 'pomodoro',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (
        status IN (
            'in_progress',
            'completed',
            'interrupted',
            'abandoned'
        )
    ),
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tracciamento Umore
CREATE TABLE IF NOT EXISTS mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mood TEXT NOT NULL,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- =================================================================
-- 7. FUNZIONALITÀ UTILI
-- =================================================================
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_done INTEGER DEFAULT 0,
    completed_at DATETIME, -- Aggiunto per le statistiche
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- =================================================================
-- 8. PREFERENZE SUONI AMBIENTALI E STATISTICHE
-- =================================================================
CREATE TABLE IF NOT EXISTS user_ambient_sounds (
    user_id INTEGER NOT NULL,
    sound_id TEXT NOT NULL,
    volume INTEGER DEFAULT 50, -- 0-100
    is_active INTEGER DEFAULT 0, -- 0 or 1
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS ambient_listening_stats (
    user_id INTEGER NOT NULL,
    sound_id TEXT NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    last_listened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) WITHOUT ROWID;