PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    mood_theme TEXT DEFAULT 'default',
    location_city TEXT,
    location_country TEXT,
    date_of_birth DATE,
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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    focus_minutes INTEGER DEFAULT 25,
    short_break_minutes INTEGER DEFAULT 5,
    long_break_minutes INTEGER DEFAULT 15,
    birth_place TEXT,
    subscription_expiry DATETIME
);

-- Seed Users (Password is 'admin123' for all)
INSERT INTO
    users (
        id,
        username,
        email,
        password_hash,
        display_name,
        bio,
        role,
        plan,
        status
    )
VALUES (
        1,
        'admin',
        'admin@example.com',
        '$2b$10$KJcpvqJZI59hmOs4VD/2N.xXKy/gC/R2Q98x1mMuDHShCpd.vByrG',
        'Admin User',
        'System Administrator',
        'admin',
        'premium',
        'active'
    ),
    (
        2,
        'creator',
        'creator@example.com',
        '$2b$10$KJcpvqJZI59hmOs4VD/2N.xXKy/gC/R2Q98x1mMuDHShCpd.vByrG',
        'Creator User',
        'Content Creator',
        'creator',
        'premium',
        'active'
    ),
    (
        3,
        'user',
        'user@example.com',
        '$2b$10$KJcpvqJZI59hmOs4VD/2N.xXKy/gC/R2Q98x1mMuDHShCpd.vByrG',
        'Standard User',
        'Regular User',
        'user',
        'standard',
        'active'
    );

-- Playlists Table
CREATE TABLE playlists (
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

-- Playlist Likes Table
CREATE TABLE playlist_likes (
    user_id INTEGER NOT NULL,
    playlist_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, playlist_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Focus Sessions Table
CREATE TABLE focus_sessions (
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

-- Mood Entries Table
CREATE TABLE mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mood TEXT NOT NULL,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Todos Table
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_done INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- User Ambient Sounds Table
CREATE TABLE user_ambient_sounds (
    user_id INTEGER NOT NULL,
    sound_id TEXT NOT NULL,
    volume INTEGER DEFAULT 50, -- 0-100
    is_active INTEGER DEFAULT 0, -- 0 or 1
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Ambient Listening Stats Table
CREATE TABLE ambient_listening_stats (
    user_id INTEGER NOT NULL,
    sound_id TEXT NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    last_listened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) WITHOUT ROWID;

-- User Goals Table
CREATE TABLE user_goals (
    user_id INTEGER PRIMARY KEY,
    daily_focus_goal INTEGER DEFAULT 60, -- Minutes
    weekly_focus_goal INTEGER DEFAULT 300, -- Minutes
    monthly_focus_goal INTEGER DEFAULT 1200, -- Minutes
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Default Goals for Seed Users
INSERT INTO user_goals (user_id) VALUES (1), (2), (3);

-- Sounds Table
CREATE TABLE IF NOT EXISTS "sounds" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    media_type TEXT CHECK (
        media_type IN ('audio', 'video', 'image')
    ) DEFAULT 'audio',
    access_level TEXT CHECK (
        access_level IN (
            'public',
            'registered',
            'premium'
        )
    ) DEFAULT 'public',
    category TEXT CHECK (
        category IN ('ambient', 'music', 'sound')
    ),
    mood TEXT,
    genre_primary TEXT,
    icon TEXT,
    duration_seconds INTEGER DEFAULT 0,
    total_play_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id)
);

INSERT INTO
    sounds
VALUES (
        1,
        1,
        'Fuoco',
        'Suono Ambientale',
        'camino.mp3',
        'audio',
        'public',
        'ambient',
        NULL,
        NULL,
        'fa-fire',
        0,
        0,
        '2026-02-09 15:46:09',
        '2026-02-09 15:46:09'
    );

INSERT INTO
    sounds
VALUES (
        2,
        1,
        'Pioggia',
        'Suono Ambientale',
        'pioggia1.mp3',
        'audio',
        'public',
        'ambient',
        NULL,
        NULL,
        'fa-cloud-rain',
        0,
        0,
        '2026-02-09 15:46:36',
        '2026-02-09 15:46:36'
    );

INSERT INTO
    sounds
VALUES (
        3,
        1,
        'Pianoforte',
        'Musica al pianoforte',
        'piano1.mp3',
        'audio',
        'public',
        'music',
        'Rilassante',
        'Piano',
        'fa-music',
        20,
        0,
        '2026-02-09 15:48:05',
        '2026-02-09 15:48:05'
    );

INSERT INTO
    sounds
VALUES (
        4,
        1,
        'Oceano',
        'Suono rilassante dell''oceano',
        'oceano1.mp3',
        'audio',
        'premium',
        'music',
        'Rilassante',
        'Natura',
        'fa-music',
        20,
        0,
        '2026-02-09 16:42:05',
        '2026-02-09 16:42:05'
    );

-- Playlist Items Table
CREATE TABLE IF NOT EXISTS "playlist_items" (
    playlist_id INTEGER NOT NULL,
    sound_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, sound_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Listening History Table
CREATE TABLE IF NOT EXISTS "listening_history" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    sound_id INTEGER NOT NULL,
    playlist_id INTEGER,
    listened_seconds INTEGER DEFAULT 0,
    completed_percent INTEGER DEFAULT 0,
    device_type TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE SET NULL,
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE SET NULL
);

-- Sound Likes Table
CREATE TABLE sound_likes (
    user_id INTEGER NOT NULL,
    sound_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_sounds_owner ON sounds (owner_id);

CREATE INDEX idx_sounds_category ON sounds (category);

CREATE INDEX idx_sounds_access ON sounds (access_level);

CREATE INDEX idx_sounds_created ON sounds (created_at DESC);

CREATE INDEX idx_listening_history_user ON listening_history (user_id);

CREATE INDEX idx_listening_history_sound ON listening_history (sound_id);

--
-- POPULATING STATS DATA
--

-- 1. Focus Sessions
-- Admin (User 1): ~10 sessions (Mix of completed/abandoned)
INSERT INTO
    focus_sessions (
        user_id,
        planned_minutes,
        completed_minutes,
        session_type,
        status,
        started_at,
        ended_at
    )
VALUES
    -- Today (2 completed sessions)
    (
        1,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-2 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1.5 hours',
            'localtime'
        )
    ),
    (
        1,
        45,
        45,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-4 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-3.25 hours',
            'localtime'
        )
    ),
    -- Yesterday (3 sessions)
    (
        1,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-1 day',
            '-2 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1 day',
            '-1.5 hours',
            'localtime'
        )
    ),
    (
        1,
        25,
        10,
        'pomodoro',
        'abandoned',
        datetime(
            'now',
            '-1 day',
            '-4 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1 day',
            '-3.8 hours',
            'localtime'
        )
    ),
    (
        1,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-1 day',
            '-6 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1 day',
            '-5.5 hours',
            'localtime'
        )
    ),
    -- 2 Days Ago
    (
        1,
        50,
        50,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-2 days',
            '-10 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-2 days',
            '-9 hours',
            'localtime'
        )
    ),
    -- 3 Days Ago
    (
        1,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-3 days',
            '-9 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-3 days',
            '-8.5 hours',
            'localtime'
        )
    ),
    -- 5 Days Ago
    (
        1,
        25,
        5,
        'pomodoro',
        'abandoned',
        datetime(
            'now',
            '-5 days',
            '-12 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-5 days',
            '-11.9 hours',
            'localtime'
        )
    ),
    -- Last Week
    (
        1,
        60,
        60,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-6 days',
            '-14 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-6 days',
            '-13 hours',
            'localtime'
        )
    ),
    -- Today (In Progress)
    (
        1,
        25,
        15,
        'pomodoro',
        'in_progress',
        datetime(
            'now',
            '-10 minutes',
            'localtime'
        ),
        NULL
    );

-- Creator (User 2): ~5 sessions
INSERT INTO
    focus_sessions (
        user_id,
        planned_minutes,
        completed_minutes,
        session_type,
        status,
        started_at,
        ended_at
    )
VALUES (
        2,
        45,
        45,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-1 day',
            '-3 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1 day',
            '-2.25 hours',
            'localtime'
        )
    ),
    (
        2,
        45,
        20,
        'pomodoro',
        'abandoned',
        datetime(
            'now',
            '-2 days',
            '-4 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-2 days',
            '-3.6 hours',
            'localtime'
        )
    ),
    (
        2,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-3 days',
            '-10 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-3 days',
            '-9.5 hours',
            'localtime'
        )
    ),
    (
        2,
        90,
        90,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-4 days',
            '-9 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-4 days',
            '-7.5 hours',
            'localtime'
        )
    ),
    (
        2,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-5 days',
            '-11 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-5 days',
            '-10.5 hours',
            'localtime'
        )
    );

-- User (User 3): ~2 sessions
INSERT INTO
    focus_sessions (
        user_id,
        planned_minutes,
        completed_minutes,
        session_type,
        status,
        started_at,
        ended_at
    )
VALUES (
        3,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-1 day',
            '-20 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1 day',
            '-19.5 hours',
            'localtime'
        )
    ),
    (
        3,
        25,
        25,
        'pomodoro',
        'completed',
        datetime(
            'now',
            '-2 hours',
            'localtime'
        ),
        datetime(
            'now',
            '-1.5 hours',
            'localtime'
        )
    );

-- 2. Todos
-- Admin (User 1)
INSERT INTO
    todos (
        user_id,
        text,
        is_done,
        created_at,
        completed_at
    )
VALUES (
        1,
        'Controllare i log del server',
        1,
        datetime('now', '-3 days', 'localtime'),
        datetime(
            'now',
            '-3 days',
            '+1 hour',
            'localtime'
        )
    ),
    (
        1,
        'Aggiornare la documentazione',
        1,
        datetime('now', '-2 days', 'localtime'),
        datetime(
            'now',
            '-2 days',
            '+2 hours',
            'localtime'
        )
    ),
    (
        1,
        'Backup del database',
        1,
        datetime('now', '-1 day', 'localtime'),
        datetime(
            'now',
            '-1 day',
            '+15 minutes',
            'localtime'
        )
    ),
    (
        1,
        'Rispondere alle email di supporto',
        0,
        datetime(
            'now',
            '-5 hours',
            'localtime'
        ),
        NULL
    ),
    (
        1,
        'Pianificare la prossima release',
        0,
        datetime('now', '-1 hour', 'localtime'),
        NULL
    );

-- Creator (User 2)
INSERT INTO
    todos (
        user_id,
        text,
        is_done,
        created_at,
        completed_at
    )
VALUES (
        2,
        'Registrare nuovo brano piano',
        1,
        datetime('now', '-4 days', 'localtime'),
        datetime('now', '-3 days', 'localtime')
    ),
    (
        2,
        'Scrivere testo per la nuova canzone',
        0,
        datetime('now', '-2 days', 'localtime'),
        NULL
    ),
    (
        2,
        'Caricare album su Soundlly',
        0,
        datetime(
            'now',
            '-5 hours',
            'localtime'
        ),
        NULL
    );

-- User (User 3)
INSERT INTO
    todos (
        user_id,
        text,
        is_done,
        created_at,
        completed_at
    )
VALUES (
        3,
        'Studiare per esame di storia',
        0,
        datetime('now', '-1 day', 'localtime'),
        NULL
    ),
    (
        3,
        'Fare la spesa',
        0,
        datetime(
            'now',
            '+2 hours',
            'localtime'
        ),
        NULL
    );

-- 3. Ambient Listening Stats
-- Admin (User 1) - Listens to own sounds
INSERT INTO
    ambient_listening_stats (
        user_id,
        sound_id,
        total_seconds,
        last_listened_at
    )
VALUES (
        1,
        '1',
        3600,
        datetime('now', '-2 days', 'localtime')
    ), -- Fuoco
    (
        1,
        '3',
        1800,
        datetime('now', '-1 day', 'localtime')
    ), -- Pianoforte
    (
        1,
        '2',
        500,
        datetime(
            'now',
            '-4 hours',
            'localtime'
        )
    );
-- Pioggia

-- Creator (User 2)
INSERT INTO
    ambient_listening_stats (
        user_id,
        sound_id,
        total_seconds,
        last_listened_at
    )
VALUES (
        2,
        '3',
        7200,
        datetime('now', '-2 days', 'localtime')
    ), -- Pianoforte (inspiration)
    (
        2,
        '1',
        1200,
        datetime(
            'now',
            '-5 hours',
            'localtime'
        )
    );
-- Fuoco

-- User (User 3)
INSERT INTO
    ambient_listening_stats (
        user_id,
        sound_id,
        total_seconds,
        last_listened_at
    )
VALUES (
        3,
        '2',
        5400,
        datetime('now', '-1 hour', 'localtime')
    );
-- Pioggia for studying

COMMIT;