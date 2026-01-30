BEGIN TRANSACTION;

CREATE TABLE sounds_new (
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
    sounds_new (
        id,
        owner_id,
        title,
        description,
        filename,
        media_type,
        access_level,
        category,
        mood,
        genre_primary,
        icon,
        duration_seconds,
        total_play_seconds,
        created_at,
        updated_at
    )
SELECT
    id,
    owner_id,
    title,
    description,
    filename,
    media_type,
    access_level,
    CASE
        WHEN category = 'creator_ambient' THEN 'sound'
        WHEN category = 'effect' THEN 'sound'
        ELSE category
    END,
    mood,
    genre_primary,
    icon,
    duration_seconds,
    total_play_seconds,
    created_at,
    updated_at
FROM sounds;

-- Ensure all non-admin ambient sounds are migrated to sound if not already
UPDATE sounds_new
SET
    category = 'sound'
WHERE
    category = 'ambient'
    AND owner_id IN (
        SELECT id
        FROM users
        WHERE
            role != 'admin'
    )
    AND owner_id IS NOT NULL;

DROP TABLE sounds;

ALTER TABLE sounds_new RENAME TO sounds;

CREATE INDEX IF NOT EXISTS idx_sounds_owner ON sounds (owner_id);

CREATE INDEX IF NOT EXISTS idx_sounds_category ON sounds (category);

COMMIT;