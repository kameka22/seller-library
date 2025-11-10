-- Table des dossiers pour gérer la structure de fichiers
CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- Ajouter une colonne folder_id à la table photos
ALTER TABLE photos ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;

-- Index pour la relation photos <-> folders
CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);

-- Peupler la table folders avec les dossiers existants extraits des photos
INSERT OR IGNORE INTO folders (path, name, parent_id)
SELECT DISTINCT
    RTRIM(SUBSTR(original_path, 1, LENGTH(original_path) - LENGTH(file_name) - 1), '/') as path,
    CASE
        WHEN INSTR(RTRIM(SUBSTR(original_path, 1, LENGTH(original_path) - LENGTH(file_name) - 1), '/'), '/') > 0
        THEN SUBSTR(RTRIM(SUBSTR(original_path, 1, LENGTH(original_path) - LENGTH(file_name) - 1), '/'),
                    INSTR(RTRIM(SUBSTR(original_path, 1, LENGTH(original_path) - LENGTH(file_name) - 1), '/'), '/') + 1)
        ELSE RTRIM(SUBSTR(original_path, 1, LENGTH(original_path) - LENGTH(file_name) - 1), '/')
    END as name,
    NULL as parent_id
FROM photos
WHERE LENGTH(TRIM(original_path)) > 0;

-- Mettre à jour folder_id pour les photos existantes
UPDATE photos
SET folder_id = (
    SELECT f.id
    FROM folders f
    WHERE f.path = RTRIM(SUBSTR(photos.original_path, 1, LENGTH(photos.original_path) - LENGTH(photos.file_name) - 1), '/')
)
WHERE LENGTH(TRIM(original_path)) > 0;
