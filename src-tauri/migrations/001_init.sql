-- Table des objets à vendre
CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    year INTEGER,
    weight REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de la collection globale de photos
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,
    original_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table d'association objets <-> photos
CREATE TABLE IF NOT EXISTS object_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    UNIQUE(object_id, photo_id)
);

-- Table des plateformes de vente
CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    base_url TEXT,
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    environment TEXT DEFAULT 'production',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de référencement des objets sur les plateformes
CREATE TABLE IF NOT EXISTS object_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    platform_url TEXT,
    status TEXT DEFAULT 'draft',
    listed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    UNIQUE(object_id, platform_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON objects(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_file_path ON photos(file_path);
CREATE INDEX IF NOT EXISTS idx_object_photos_object_id ON object_photos(object_id);
CREATE INDEX IF NOT EXISTS idx_object_photos_photo_id ON object_photos(photo_id);
CREATE INDEX IF NOT EXISTS idx_object_platforms_object_id ON object_platforms(object_id);
CREATE INDEX IF NOT EXISTS idx_object_platforms_platform_id ON object_platforms(platform_id);

-- Données initiales : plateformes
INSERT OR IGNORE INTO platforms (name, base_url) VALUES ('eBay', 'https://www.ebay.fr');
INSERT OR IGNORE INTO platforms (name, base_url) VALUES ('Leboncoin', 'https://www.leboncoin.fr');
