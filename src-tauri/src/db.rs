use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::fs;

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    // Use the user's home directory
    let home_dir = dirs::home_dir().expect("Unable to determine home directory");

    let mut db_path = home_dir;
    db_path.push(".seller-library");

    println!(
        "Creating .seller-library directory at: {}",
        db_path.display()
    );
    // Create the .seller-library folder if it doesn't exist
    fs::create_dir_all(&db_path).expect("Failed to create .seller-library directory");

    db_path.push("seller_library.db");
    println!("Database path: {}", db_path.display());

    // Create the file if it doesn't exist
    if !db_path.exists() {
        println!("Creating database file...");
        fs::File::create(&db_path).expect("Failed to create database file");
    }

    let db_url = format!("sqlite:{}", db_path.display());
    println!("Database URL: {}", db_url);

    // Create the connection pool
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Execute migrations - statement by statement
    let migration_sql = include_str!("../migrations/001_init.sql");

    // Clean comments and divide by statements
    let lines: Vec<&str> = migration_sql.lines().collect();
    let mut current_statement = String::new();

    for line in lines {
        let trimmed = line.trim();

        // Ignore comments and empty lines
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }

        current_statement.push_str(line);
        current_statement.push(' ');

        // If the line ends with a semicolon, execute the statement
        if trimmed.ends_with(';') {
            let stmt = current_statement.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                sqlx::query(stmt).execute(&pool).await?;
            }
            current_statement.clear();
        }
    }

    // Try to add the category_id column if it doesn't exist
    let _ = sqlx::query("ALTER TABLE objects ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL")
        .execute(&pool)
        .await; // Ignore the error if the column already exists

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

    // Migration 003: Add API fields for platforms (one by one because SQLite)
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN api_key TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN api_secret TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN access_token TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN refresh_token TEXT").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN token_expires_at TIMESTAMP").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN environment TEXT DEFAULT 'production'").execute(&pool).await;
    let _ = sqlx::query("ALTER TABLE platforms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP").execute(&pool).await;

    // Migration 004: Add folders table
    let migration_sql_004 = include_str!("../migrations/004_add_folders_table.sql");
    let lines_004: Vec<&str> = migration_sql_004.lines().collect();
    let mut current_statement_004 = String::new();

    for line in lines_004 {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        current_statement_004.push_str(line);
        current_statement_004.push(' ');
        if trimmed.ends_with(';') {
            let stmt = current_statement_004.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                let _ = sqlx::query(stmt).execute(&pool).await;
            }
            current_statement_004.clear();
        }
    }

    // Migration 005: Add settings table
    let migration_sql_005 = include_str!("../migrations/005_add_settings_table.sql");
    let lines_005: Vec<&str> = migration_sql_005.lines().collect();
    let mut current_statement_005 = String::new();

    for line in lines_005 {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        current_statement_005.push_str(line);
        current_statement_005.push(' ');
        if trimmed.ends_with(';') {
            let stmt = current_statement_005.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                let _ = sqlx::query(stmt).execute(&pool).await;
            }
            current_statement_005.clear();
        }
    }

    // Migration 006: Add text_files table
    let migration_sql_006 = include_str!("../migrations/006_add_text_files_table.sql");
    let lines_006: Vec<&str> = migration_sql_006.lines().collect();
    let mut current_statement_006 = String::new();

    for line in lines_006 {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        current_statement_006.push_str(line);
        current_statement_006.push(' ');
        if trimmed.ends_with(';') {
            let stmt = current_statement_006.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                let _ = sqlx::query(stmt).execute(&pool).await;
            }
            current_statement_006.clear();
        }
    }

    // Migration 007: Add is_main field to photos table
    let migration_sql_007 = include_str!("../migrations/007_add_main_photo_field.sql");
    let lines_007: Vec<&str> = migration_sql_007.lines().collect();
    let mut current_statement_007 = String::new();

    for line in lines_007 {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        current_statement_007.push_str(line);
        current_statement_007.push(' ');
        if trimmed.ends_with(';') {
            let stmt = current_statement_007.trim().trim_end_matches(';');
            if !stmt.is_empty() {
                let _ = sqlx::query(stmt).execute(&pool).await;
            }
            current_statement_007.clear();
        }
    }

    println!("Database initialized successfully at {}", db_path.display());
    Ok(pool)
}
