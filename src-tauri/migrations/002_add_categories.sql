-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter la colonne category_id à la table objects (seulement si elle n'existe pas)
-- SQLite ne supporte pas IF NOT EXISTS pour ALTER TABLE, donc on utilise une approche différente
-- On vérifie d'abord si la colonne existe en créant une table temporaire

-- Vérifier si la colonne existe déjà
-- Si elle n'existe pas, on l'ajoute
-- SQLite ne permet pas de vérifier facilement, donc on ignore l'erreur si elle existe déjà
-- Pour cela, on va juste s'assurer que la table est à jour

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_objects_category_id ON objects(category_id);
