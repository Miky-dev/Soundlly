PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

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

INSERT INTO
    users
VALUES (
        1,
        'admin',
        'admin@example.com',
        '$2b$10$KJcpvqJZI59hmOs4VD/2N.xXKy/gC/R2Q98x1mMuDHShCpd.vByrG',
        'Admin User',
        'System Administrator',
        NULL,
        'default',
        NULL,
        NULL,
        NULL,
        'admin',
        'premium',
        'active',
        '2026-02-10 10:18:40',
        '2026-02-10 10:18:40',
        NULL,
        25,
        5,
        15,
        NULL,
        NULL
    );

INSERT INTO
    users
VALUES (
        2,
        'creator',
        'creator@example.com',
        '$2b$10$KJcpvqJZI59hmOs4VD/2N.xXKy/gC/R2Q98x1mMuDHShCpd.vByrG',
        'Creator User',
        'Content Creator',
        NULL,
        'default',
        NULL,
        NULL,
        NULL,
        'creator',
        'premium',
        'active',
        '2026-02-10 10:18:40',
        '2026-02-10 10:18:40',
        NULL,
        25,
        5,
        15,
        NULL,
        NULL
    );

INSERT INTO
    users
VALUES (
        3,
        'user',
        'user@example.com',
        '$2b$10$KJcpvqJZI59hmOs4VD/2N.xXKy/gC/R2Q98x1mMuDHShCpd.vByrG',
        'Standard User',
        'Regular User',
        NULL,
        'default',
        NULL,
        NULL,
        NULL,
        'user',
        'standard',
        'active',
        '2026-02-10 10:18:40',
        '2026-02-10 10:18:40',
        NULL,
        25,
        5,
        15,
        NULL,
        NULL
    );

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

CREATE TABLE playlist_likes (
    user_id INTEGER NOT NULL,
    playlist_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, playlist_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
) WITHOUT ROWID;

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

INSERT INTO
    focus_sessions
VALUES (
        1,
        1,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-10 09:18:40',
        '2026-02-10 09:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        2,
        1,
        45,
        45,
        'pomodoro',
        'completed',
        '2026-02-10 07:18:40',
        '2026-02-10 08:03:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        3,
        1,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-09 09:18:40',
        '2026-02-09 09:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        4,
        1,
        25,
        10,
        'pomodoro',
        'abandoned',
        '2026-02-09 07:18:40',
        '2026-02-09 07:30:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        5,
        1,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-09 05:18:40',
        '2026-02-09 05:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        6,
        1,
        50,
        50,
        'pomodoro',
        'completed',
        '2026-02-08 01:18:40',
        '2026-02-08 02:18:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        7,
        1,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-07 02:18:40',
        '2026-02-07 02:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        8,
        1,
        25,
        5,
        'pomodoro',
        'abandoned',
        '2026-02-04 23:18:40',
        '2026-02-04 23:24:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        9,
        1,
        60,
        60,
        'pomodoro',
        'completed',
        '2026-02-03 21:18:40',
        '2026-02-03 22:18:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        10,
        1,
        25,
        15,
        'pomodoro',
        'in_progress',
        '2026-02-10 11:08:40',
        NULL
    );

INSERT INTO
    focus_sessions
VALUES (
        11,
        2,
        45,
        45,
        'pomodoro',
        'completed',
        '2026-02-09 08:18:40',
        '2026-02-09 09:03:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        12,
        2,
        45,
        20,
        'pomodoro',
        'abandoned',
        '2026-02-08 07:18:40',
        '2026-02-08 07:42:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        13,
        2,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-07 01:18:40',
        '2026-02-07 01:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        14,
        2,
        90,
        90,
        'pomodoro',
        'completed',
        '2026-02-06 02:18:40',
        '2026-02-06 03:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        15,
        2,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-05 00:18:40',
        '2026-02-05 00:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        16,
        3,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-08 15:18:40',
        '2026-02-08 15:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        17,
        3,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-10 09:18:40',
        '2026-02-10 09:48:40'
    );

INSERT INTO
    focus_sessions
VALUES (
        18,
        1,
        25,
        19,
        'pomodoro',
        'abandoned',
        '2026-02-13 14:51:00',
        '2026-02-13 15:10:00'
    );

INSERT INTO
    focus_sessions
VALUES (
        19,
        1,
        45,
        45,
        'pomodoro',
        'completed',
        '2026-02-13 14:28:00',
        '2026-02-13 15:13:00'
    );

INSERT INTO
    focus_sessions
VALUES (
        20,
        1,
        45,
        45,
        'pomodoro',
        'completed',
        '2026-02-13 11:50:00',
        '2026-02-13 12:35:00'
    );

INSERT INTO
    focus_sessions
VALUES (
        36,
        2,
        60,
        46,
        'pomodoro',
        'abandoned',
        '2026-02-13 08:22:00',
        '2026-02-13 09:08:00'
    );

INSERT INTO
    focus_sessions
VALUES (
        37,
        2,
        25,
        25,
        'pomodoro',
        'completed',
        '2026-02-13 09:44:00',
        '2026-02-13 10:09:00'
    );

INSERT INTO
    focus_sessions
VALUES (
        52,
        3,
        45,
        45,
        'pomodoro',
        'completed',
        '2026-02-13 09:41:00',
        '2026-02-13 10:26:00'
    );

INSERT INTO
    focus_sessions
VALUES (
        53,
        3,
        60,
        60,
        'pomodoro',
        'completed',
        '2026-02-13 12:39:00',
        '2026-02-13 13:39:00'
    );

CREATE TABLE mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mood TEXT NOT NULL,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO
    mood_entries
VALUES (
        1,
        1,
        'stanco',
        'Nota del 13/02/2026',
        '2026-02-13 17:00:00'
    );

INSERT INTO
    mood_entries
VALUES (
        7,
        2,
        'produttivo',
        'Nota del 13/02/2026',
        '2026-02-13 17:00:00'
    );

INSERT INTO
    mood_entries
VALUES (
        13,
        3,
        'concentrato',
        'Nota del 13/02/2026',
        '2026-02-13 17:00:00'
    );

CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_done INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO
    todos
VALUES (
        1,
        1,
        'Controllare i log del server',
        1,
        '2026-02-07 11:18:40',
        '2026-02-07 12:18:40'
    );

INSERT INTO
    todos
VALUES (
        2,
        1,
        'Aggiornare la documentazione',
        1,
        '2026-02-08 11:18:40',
        '2026-02-08 13:18:40'
    );

INSERT INTO
    todos
VALUES (
        3,
        1,
        'Backup del database',
        1,
        '2026-02-09 11:18:40',
        '2026-02-09 11:33:40'
    );

INSERT INTO
    todos
VALUES (
        4,
        1,
        'Rispondere alle email di supporto',
        0,
        '2026-02-10 06:18:40',
        NULL
    );

INSERT INTO
    todos
VALUES (
        5,
        1,
        'Pianificare la prossima release',
        0,
        '2026-02-10 10:18:40',
        NULL
    );

INSERT INTO
    todos
VALUES (
        6,
        2,
        'Registrare nuovo brano piano',
        1,
        '2026-02-06 11:18:40',
        '2026-02-07 11:18:40'
    );

INSERT INTO
    todos
VALUES (
        7,
        2,
        'Scrivere testo per la nuova canzone',
        0,
        '2026-02-08 11:18:40',
        NULL
    );

INSERT INTO
    todos
VALUES (
        8,
        2,
        'Caricare album su Soundlly',
        0,
        '2026-02-10 06:18:40',
        NULL
    );

INSERT INTO
    todos
VALUES (
        9,
        3,
        'Studiare per esame di storia',
        0,
        '2026-02-09 11:18:40',
        NULL
    );

INSERT INTO
    todos
VALUES (
        10,
        3,
        'Fare la spesa',
        0,
        '2026-02-10 13:18:40',
        NULL
    );

INSERT INTO
    todos
VALUES (
        11,
        1,
        'Task demo 1 del 13/02/2026',
        1,
        '2026-02-13 09:00:00',
        '2026-02-13 13:00:00'
    );

INSERT INTO
    todos
VALUES (
        12,
        1,
        'Task demo 2 del 13/02/2026',
        0,
        '2026-02-13 09:00:00',
        NULL
    );

INSERT INTO
    todos
VALUES (
        21,
        2,
        'Task demo 1 del 13/02/2026',
        1,
        '2026-02-13 09:00:00',
        '2026-02-13 13:00:00'
    );

INSERT INTO
    todos
VALUES (
        22,
        2,
        'Task demo 2 del 13/02/2026',
        1,
        '2026-02-13 09:00:00',
        '2026-02-13 13:00:00'
    );

CREATE TABLE user_ambient_sounds (
    user_id INTEGER NOT NULL,
    sound_id TEXT NOT NULL,
    volume INTEGER DEFAULT 50, -- 0-100
    is_active INTEGER DEFAULT 0, -- 0 or 1
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) WITHOUT ROWID;

INSERT INTO
    user_ambient_sounds
VALUES (
        1,
        '1',
        50,
        0,
        '2026-02-10 10:19:27'
    );

INSERT INTO
    user_ambient_sounds
VALUES (
        1,
        '2',
        50,
        0,
        '2026-02-10 10:19:28'
    );

INSERT INTO
    user_ambient_sounds
VALUES (
        1,
        '5',
        50,
        0,
        '2026-02-10 10:20:26'
    );

CREATE TABLE ambient_listening_stats (
    user_id INTEGER NOT NULL,
    sound_id TEXT NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    last_listened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) WITHOUT ROWID;

INSERT INTO
    ambient_listening_stats
VALUES (
        1,
        '1',
        3600,
        '2026-02-08 11:18:40'
    );

INSERT INTO
    ambient_listening_stats
VALUES (
        1,
        '2',
        500,
        '2026-02-10 07:18:40'
    );

INSERT INTO
    ambient_listening_stats
VALUES (
        1,
        '3',
        1800,
        '2026-02-09 11:18:40'
    );

INSERT INTO
    ambient_listening_stats
VALUES (
        2,
        '1',
        1200,
        '2026-02-10 06:18:40'
    );

INSERT INTO
    ambient_listening_stats
VALUES (
        2,
        '3',
        7200,
        '2026-02-08 11:18:40'
    );

INSERT INTO
    ambient_listening_stats
VALUES (
        3,
        '2',
        5400,
        '2026-02-10 10:18:40'
    );

CREATE TABLE user_goals (
    user_id INTEGER PRIMARY KEY,
    daily_focus_goal INTEGER DEFAULT 60, -- Minutes
    weekly_focus_goal INTEGER DEFAULT 300, -- Minutes
    monthly_focus_goal INTEGER DEFAULT 1200, -- Minutes
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO
    user_goals
VALUES (
        1,
        60,
        300,
        1200,
        '2026-02-10 10:18:40'
    );

INSERT INTO
    user_goals
VALUES (
        2,
        60,
        300,
        1200,
        '2026-02-10 10:18:40'
    );

INSERT INTO
    user_goals
VALUES (
        3,
        60,
        300,
        1200,
        '2026-02-10 10:18:40'
    );

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
        5,
        1,
        'Messaggio',
        'Suono Ambientale',
        'messaggitelefono1.mp3',
        'audio',
        'public',
        'ambient',
        NULL,
        NULL,
        'fa-phone',
        0,
        0,
        '2026-02-10 10:20:15',
        '2026-02-10 10:20:15'
    );

INSERT INTO
    sounds
VALUES (
        6,
        1,
        'Piano premium',
        '',
        'piano1.mp3',
        'audio',
        'premium',
        'sound',
        'Rilassante',
        'Piano',
        'fa-music',
        20,
        0,
        '2026-02-10 10:20:53',
        '2026-02-10 10:20:53'
    );

INSERT INTO
    sounds
VALUES (
        7,
        1,
        'Piano solo registrati',
        '',
        'piano1.mp3',
        'audio',
        'registered',
        'sound',
        'Rilassante',
        'Piano',
        'fa-music',
        20,
        0,
        '2026-02-10 10:21:14',
        '2026-02-10 10:21:14'
    );

CREATE TABLE IF NOT EXISTS "playlist_items" (
    playlist_id INTEGER NOT NULL,
    sound_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, sound_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE CASCADE
) WITHOUT ROWID;

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

CREATE TABLE sound_likes (
    user_id INTEGER NOT NULL,
    sound_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sound_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE CASCADE
);

INSERT INTO sound_likes VALUES (1, 3, '2026-02-10 10:21:19');

INSERT INTO sqlite_sequence VALUES ('users', 3);

INSERT INTO sqlite_sequence VALUES ('sounds', 7);

INSERT INTO sqlite_sequence VALUES ('focus_sessions', 53);

INSERT INTO sqlite_sequence VALUES ('todos', 39);

INSERT INTO sqlite_sequence VALUES ('mood_entries', 13);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_sounds_owner ON sounds (owner_id);

CREATE INDEX idx_sounds_category ON sounds (category);

CREATE INDEX idx_sounds_access ON sounds (access_level);

CREATE INDEX idx_sounds_created ON sounds (created_at DESC);

CREATE INDEX idx_listening_history_user ON listening_history (user_id);

CREATE INDEX idx_listening_history_sound ON listening_history (sound_id);

COMMIT;