-- Add is_main field to photos table to mark main photo per folder
ALTER TABLE photos ADD COLUMN is_main BOOLEAN DEFAULT 0;

-- Create index for better performance when querying main photos
CREATE INDEX IF NOT EXISTS idx_photos_is_main ON photos(is_main);
CREATE INDEX IF NOT EXISTS idx_photos_folder_id_is_main ON photos(folder_id, is_main);
