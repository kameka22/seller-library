-- Table de configuration de l'application et utilisateur
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index sur la clé
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Note: Les settings possibles sont:
-- - root_folder: Dossier racine de la collection de photos
-- - first_name: Prénom de l'utilisateur
-- - last_name: Nom de l'utilisateur
-- - language: Langue de l'interface (en, fr)
