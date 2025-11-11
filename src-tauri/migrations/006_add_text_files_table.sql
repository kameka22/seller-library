-- Add text_files table to manage text description files
CREATE TABLE IF NOT EXISTS text_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    folder_id INTEGER,
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_text_files_folder_id ON text_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_text_files_file_path ON text_files(file_path);
