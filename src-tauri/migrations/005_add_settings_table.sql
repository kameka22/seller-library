-- Table de configuration de l'application
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index sur la clé
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
