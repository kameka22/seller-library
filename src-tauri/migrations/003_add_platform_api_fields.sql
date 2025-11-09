-- Ajouter les champs API pour les plateformes (notamment eBay)
ALTER TABLE platforms ADD COLUMN api_key TEXT;
ALTER TABLE platforms ADD COLUMN api_secret TEXT;
ALTER TABLE platforms ADD COLUMN access_token TEXT;
ALTER TABLE platforms ADD COLUMN refresh_token TEXT;
ALTER TABLE platforms ADD COLUMN token_expires_at TIMESTAMP;
ALTER TABLE platforms ADD COLUMN environment TEXT DEFAULT 'production'; -- 'sandbox' ou 'production'
ALTER TABLE platforms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
