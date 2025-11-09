use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::fs;

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    // Utiliser le répertoire home de l'utilisateur
    let home_dir = dirs::home_dir().expect("Unable to determine home directory");

    let mut db_path = home_dir;
    db_path.push(".seller-library");

    println!(
        "Creating .seller-library directory at: {}",
        db_path.display()
    );
    // Créer le dossier .seller-library s'il n'existe pas
    fs::create_dir_all(&db_path).expect("Failed to create .seller-library directory");

    db_path.push("seller_library.db");
    println!("Database path: {}", db_path.display());

    // Créer le fichier s'il n'existe pas
    if !db_path.exists() {
        println!("Creating database file...");
        fs::File::create(&db_path).expect("Failed to create database file");
    }

    let db_url = format!("sqlite:{}", db_path.display());
    println!("Database URL: {}", db_url);

    // Créer la pool de connexions
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Exécuter les migrations - instruction par instruction
    let migration_sql = include_str!("../migrations/001_init.sql");

    // Nettoyer les commentaires et diviser par instructions
    let lines: Vec<&str> = migration_sql.lines().collect();
    let mut current_statement = String::new();

    for line in lines {
        let trimmed = line.trim();

        // Ignorer les commentaires et lignes vides
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }

        current_statement.push_str(line);
        current_statement.push(' ');

        // Si la ligne se termine par un point-virgule, exécuter l'instruction
        if trimmed.ends_with(';') {
            let stmt = current_statement.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                sqlx::query(stmt).execute(&pool).await?;
            }
            current_statement.clear();
        }
    }

    // Essayer d'ajouter la colonne category_id si elle n'existe pas
    let _ = sqlx::query("ALTER TABLE objects ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL")
        .execute(&pool)
        .await; // Ignore l'erreur si la colonne existe déjà

    let migration_sql_002 = include_str!("../migrations/002_add_categories.sql");
    let lines_002: Vec<&str> = migration_sql_002.lines().collect();
    let mut current_statement_002 = String::new();

    for line in lines_002 {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        current_statement_002.push_str(line);
        current_statement_002.push(' ');
        if trimmed.ends_with(';') {
            let stmt = current_statement_002.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                let _ = sqlx::query(stmt).execute(&pool).await;
            }
            current_statement_002.clear();
        }
    }

    // Migration 003: Ajouter les champs API pour les plateformes (un par un car SQLite)
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN api_key TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN api_secret TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN access_token TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN refresh_token TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN token_expires_at TIMESTAMP").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN environment TEXT DEFAULT 'production'").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP").execute(&pool).await;

    println!("Database initialized successfully at {}", db_path.display());
    Ok(pool)
}
