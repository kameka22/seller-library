use crate::models::{Object, CreateObject, UpdateObject, Photo, Platform, CreatePlatform, UpdatePlatform, ObjectPhoto, ObjectPlatform, Category, CreateCategory};
use sqlx::SqlitePool;
use tauri::State;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;
use base64::{Engine as _, engine::general_purpose};
use chrono::Local;

// ========== OBJECTS COMMANDS ==========

#[tauri::command]
pub async fn list_objects(pool: State<'_, SqlitePool>) -> Result<Vec<Object>, String> {
    sqlx::query_as::<_, Object>("SELECT * FROM objects ORDER BY created_at DESC")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_object(pool: State<'_, SqlitePool>, id: i64) -> Result<Object, String> {
    sqlx::query_as::<_, Object>("SELECT * FROM objects WHERE id = ?")
        .bind(id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Object not found".to_string())
}

#[tauri::command]
pub async fn create_object(
    pool: State<'_, SqlitePool>,
    object: CreateObject,
) -> Result<Object, String> {
    let result = sqlx::query(
        "INSERT INTO objects (name, description, year, weight, category_id) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&object.name)
    .bind(&object.description)
    .bind(object.year)
    .bind(object.weight)
    .bind(object.category_id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    sqlx::query_as::<_, Object>("SELECT * FROM objects WHERE id = ?")
        .bind(id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_object(
    pool: State<'_, SqlitePool>,
    id: i64,
    object: UpdateObject,
) -> Result<Object, String> {
    let mut query = String::from("UPDATE objects SET updated_at = CURRENT_TIMESTAMP");

    if let Some(name) = &object.name {
        query.push_str(", name = '");
        query.push_str(&name.replace("'", "''"));
        query.push('\'');
    }
    if let Some(desc) = &object.description {
        query.push_str(", description = '");
        query.push_str(&desc.replace("'", "''"));
        query.push('\'');
    }
    if let Some(year) = object.year {
        query.push_str(&format!(", year = {}", year));
    }
    if let Some(weight) = object.weight {
        query.push_str(&format!(", weight = {}", weight));
    }
    if let Some(category_id) = object.category_id {
        query.push_str(&format!(", category_id = {}", category_id));
    }

    query.push_str(&format!(" WHERE id = {}", id));

    sqlx::query(&query)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    get_object(pool, id).await
}

#[tauri::command]
pub async fn delete_object(pool: State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM objects WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if result.rows_affected() == 0 {
        Err("Object not found".to_string())
    } else {
        Ok(())
    }
}

// ========== PHOTOS COMMANDS ==========

#[tauri::command]
pub async fn list_photos(pool: State<'_, SqlitePool>) -> Result<Vec<Photo>, String> {
    sqlx::query_as::<_, Photo>("SELECT * FROM photos ORDER BY created_at DESC")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct ScanRequest {
    pub source_path: String,
}

#[tauri::command]
pub async fn scan_photos(
    pool: State<'_, SqlitePool>,
    request: ScanRequest,
) -> Result<serde_json::Value, String> {
    let source_path = Path::new(&request.source_path);

    if !source_path.exists() {
        return Err("Source path does not exist".to_string());
    }

    let mut imported_count = 0;
    let mut errors = vec![];

    scan_directory_recursive(pool.inner(), source_path, &mut imported_count, &mut errors)
        .await
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "imported": imported_count,
        "errors": errors
    }))
}

fn scan_directory_recursive<'a>(
    pool: &'a SqlitePool,
    path: &'a Path,
    count: &'a mut i32,
    errors: &'a mut Vec<String>,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = std::io::Result<()>> + Send + 'a>> {
    Box::pin(async move {
        if path.is_dir() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();

                if path.is_dir() {
                    scan_directory_recursive(pool, &path, count, errors).await?;
                } else if is_image_file(&path) {
                    if let Err(e) = import_photo(pool, &path).await {
                        errors.push(format!("{}: {}", path.display(), e));
                    } else {
                        *count += 1;
                    }
                }
            }
        }
        Ok(())
    })
}

fn is_image_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        matches!(ext.as_str(), "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp")
    } else {
        false
    }
}

async fn import_photo(pool: &SqlitePool, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let file_path = path.to_string_lossy().to_string();
    let file_name = path.file_name()
        .ok_or("Invalid file name")?
        .to_string_lossy()
        .to_string();

    let metadata = fs::metadata(path)?;
    let file_size = metadata.len() as i64;

    let (width, height) = if let Ok(img) = image::open(path) {
        (Some(img.width() as i32), Some(img.height() as i32))
    } else {
        (None, None)
    };

    sqlx::query(
        "INSERT OR IGNORE INTO photos (file_path, original_path, file_name, file_size, width, height)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&file_path)
    .bind(&file_path)
    .bind(&file_name)
    .bind(file_size)
    .bind(width)
    .bind(height)
    .execute(pool)
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_photo(pool: State<'_, SqlitePool>, photo_id: i64) -> Result<(), String> {
    // Get the file path before deleting from the DB
    let photo = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE id = ?")
        .bind(photo_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if let Some(photo) = photo {
        // Delete the physical file
        if Path::new(&photo.file_path).exists() {
            fs::remove_file(&photo.file_path)
                .map_err(|e| format!("Failed to delete file: {}", e))?;
        }

        // Delete from the database
        let result = sqlx::query("DELETE FROM photos WHERE id = ?")
            .bind(photo_id)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;

        if result.rows_affected() == 0 {
            Err("Photo not found in database".to_string())
        } else {
            Ok(())
        }
    } else {
        Err("Photo not found".to_string())
    }
}

#[derive(Deserialize)]
pub struct DeleteFolderRequest {
    pub folder_path: String,
}

#[tauri::command]
pub async fn delete_photo_db_only(pool: State<'_, SqlitePool>, photo_id: i64) -> Result<(), String> {
    // Delete only from the database, not the physical file
    let result = sqlx::query("DELETE FROM photos WHERE id = ?")
        .bind(photo_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if result.rows_affected() == 0 {
        Err("Photo not found".to_string())
    } else {
        Ok(())
    }
}

#[tauri::command]
pub async fn delete_folder_recursive(
    pool: State<'_, SqlitePool>,
    request: DeleteFolderRequest,
) -> Result<serde_json::Value, String> {
    let folder_path = Path::new(&request.folder_path);

    if !folder_path.exists() {
        return Err("Folder does not exist".to_string());
    }

    // Get all photos in this folder and its subfolders
    let photos = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE file_path LIKE ?")
        .bind(format!("{}%", request.folder_path))
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    let mut deleted_count = 0;
    let mut errors = vec![];

    // Delete each photo from the DB
    for photo in &photos {
        match sqlx::query("DELETE FROM photos WHERE id = ?")
            .bind(photo.id)
            .execute(pool.inner())
            .await
        {
            Ok(_) => deleted_count += 1,
            Err(e) => errors.push(format!("DB error for {}: {}", photo.file_name, e)),
        }
    }

    // Delete the physical folder with all its contents
    if let Err(e) = fs::remove_dir_all(folder_path) {
        errors.push(format!("Failed to delete folder: {}", e));
    }

    Ok(serde_json::json!({
        "deleted": deleted_count,
        "errors": errors
    }))
}

#[tauri::command]
pub async fn delete_folder_recursive_db_only(
    pool: State<'_, SqlitePool>,
    request: DeleteFolderRequest,
) -> Result<serde_json::Value, String> {
    // Get all photos in this folder and its subfolders
    let photos = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE file_path LIKE ?")
        .bind(format!("{}%", request.folder_path))
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    let mut deleted_count = 0;
    let mut errors = vec![];

    // Delete each photo from the DB only (not the physical files)
    for photo in &photos {
        match sqlx::query("DELETE FROM photos WHERE id = ?")
            .bind(photo.id)
            .execute(pool.inner())
            .await
        {
            Ok(_) => deleted_count += 1,
            Err(e) => errors.push(format!("DB error for {}: {}", photo.file_name, e)),
        }
    }

    Ok(serde_json::json!({
        "deleted": deleted_count,
        "errors": errors
    }))
}

#[derive(Deserialize)]
pub struct SaveEditedPhotoRequest {
    pub base64_data: String,
    pub create_copy: bool,
}

#[tauri::command]
pub async fn save_edited_photo(
    pool: State<'_, SqlitePool>,
    photo_id: i64,
    request: SaveEditedPhotoRequest,
) -> Result<Photo, String> {
    // Get the photo from the DB
    let photo = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE id = ?")
        .bind(photo_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Photo not found".to_string())?;

    // Decode the base64 data
    let image_data = general_purpose::STANDARD
        .decode(&request.base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let file_size = image_data.len() as i64;
    let target_path: String;
    let target_file_name: String;
    let target_original_path: String;

    if request.create_copy {
        // Create a copy with numbering
        let original_path = Path::new(&photo.file_path);
        let parent = original_path.parent().ok_or("Invalid file path")?;
        let stem = original_path.file_stem().ok_or("Invalid file name")?.to_string_lossy();
        let extension = original_path.extension().map(|e| e.to_string_lossy()).unwrap_or_default();

        // Find the next available number
        let mut copy_number = 2;
        loop {
            let new_file_name = if extension.is_empty() {
                format!("{} ({})", stem, copy_number)
            } else {
                format!("{} ({}).{}", stem, copy_number, extension)
            };

            let new_path = parent.join(&new_file_name);

            if !new_path.exists() {
                target_path = new_path.to_string_lossy().to_string();
                target_file_name = new_file_name;

                // Build the original_path for the copy
                let original_parent = Path::new(&photo.original_path).parent().ok_or("Invalid original path")?;
                target_original_path = original_parent.join(&target_file_name).to_string_lossy().to_string();
                break;
            }

            copy_number += 1;
        }

        // Write the copy file
        fs::write(&target_path, &image_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        // Get the dimensions
        let (width, height) = if let Ok(img) = image::open(&target_path) {
            (Some(img.width() as i32), Some(img.height() as i32))
        } else {
            (None, None)
        };

        // Create a new entry in the DB
        let result = sqlx::query(
            "INSERT INTO photos (file_path, original_path, file_name, file_size, width, height) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&target_path)
        .bind(&target_original_path)
        .bind(&target_file_name)
        .bind(file_size)
        .bind(width)
        .bind(height)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

        let new_photo_id = result.last_insert_rowid();

        // Return the new photo
        sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE id = ?")
            .bind(new_photo_id)
            .fetch_one(pool.inner())
            .await
            .map_err(|e| e.to_string())
    } else {
        // Overwrite the original file
        fs::write(&photo.file_path, &image_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        // Get the new dimensions
        let (width, height) = if let Ok(img) = image::open(&photo.file_path) {
            (Some(img.width() as i32), Some(img.height() as i32))
        } else {
            (photo.width, photo.height)
        };

        // Update the DB
        sqlx::query(
            "UPDATE photos SET file_size = ?, width = ?, height = ? WHERE id = ?"
        )
        .bind(file_size)
        .bind(width)
        .bind(height)
        .bind(photo_id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

        // Return the updated photo
        sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE id = ?")
            .bind(photo_id)
            .fetch_one(pool.inner())
            .await
            .map_err(|e| e.to_string())
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PhotoWithAssociation {
    pub id: i64,
    pub file_name: String,
    pub file_path: String,
    pub original_path: String,
    pub file_size: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub created_at: String,
    pub association_id: i64,
}

#[tauri::command]
pub async fn get_object_photos(
    pool: State<'_, SqlitePool>,
    object_id: i64,
) -> Result<Vec<PhotoWithAssociation>, String> {
    sqlx::query_as::<_, PhotoWithAssociation>(
        "SELECT p.*, op.id as association_id FROM photos p
         INNER JOIN object_photos op ON p.id = op.photo_id
         WHERE op.object_id = ?
         ORDER BY op.display_order, p.created_at"
    )
    .bind(object_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct AssociatePhotoRequest {
    pub photo_id: i64,
}

#[tauri::command]
pub async fn associate_photo(
    pool: State<'_, SqlitePool>,
    object_id: i64,
    request: AssociatePhotoRequest,
) -> Result<ObjectPhoto, String> {
    sqlx::query(
        "INSERT INTO object_photos (object_id, photo_id) VALUES (?, ?)"
    )
    .bind(object_id)
    .bind(request.photo_id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, ObjectPhoto>(
        "SELECT * FROM object_photos WHERE object_id = ? AND photo_id = ?"
    )
    .bind(object_id)
    .bind(request.photo_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn dissociate_photo(pool: State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM object_photos WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if result.rows_affected() == 0 {
        Err("Association not found".to_string())
    } else {
        Ok(())
    }
}

// ========== PLATFORMS COMMANDS ==========

#[tauri::command]
pub async fn list_platforms(pool: State<'_, SqlitePool>) -> Result<Vec<Platform>, String> {
    sqlx::query_as::<_, Platform>("SELECT * FROM platforms ORDER BY name")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_platform(
    pool: State<'_, SqlitePool>,
    request: CreatePlatform,
) -> Result<Platform, String> {
    let result = sqlx::query(
        "INSERT INTO platforms (name, base_url, api_key, api_secret, environment)
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&request.name)
    .bind(&request.base_url)
    .bind(&request.api_key)
    .bind(&request.api_secret)
    .bind(request.environment.unwrap_or_else(|| "production".to_string()))
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let platform_id = result.last_insert_rowid();

    sqlx::query_as::<_, Platform>("SELECT * FROM platforms WHERE id = ?")
        .bind(platform_id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_platform(
    pool: State<'_, SqlitePool>,
    id: i64,
    request: UpdatePlatform,
) -> Result<Platform, String> {
    let mut updates = Vec::new();
    let mut bindings = Vec::new();

    if let Some(name) = &request.name {
        updates.push("name = ?");
        bindings.push(name.clone());
    }
    if let Some(base_url) = &request.base_url {
        updates.push("base_url = ?");
        bindings.push(base_url.clone());
    }
    if let Some(api_key) = &request.api_key {
        updates.push("api_key = ?");
        bindings.push(api_key.clone());
    }
    if let Some(api_secret) = &request.api_secret {
        updates.push("api_secret = ?");
        bindings.push(api_secret.clone());
    }
    if let Some(access_token) = &request.access_token {
        updates.push("access_token = ?");
        bindings.push(access_token.clone());
    }
    if let Some(refresh_token) = &request.refresh_token {
        updates.push("refresh_token = ?");
        bindings.push(refresh_token.clone());
    }
    if let Some(token_expires_at) = &request.token_expires_at {
        updates.push("token_expires_at = ?");
        bindings.push(token_expires_at.clone());
    }
    if let Some(environment) = &request.environment {
        updates.push("environment = ?");
        bindings.push(environment.clone());
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    let query_str = format!(
        "UPDATE platforms SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut query = sqlx::query(&query_str);
    for binding in bindings {
        query = query.bind(binding);
    }
    query = query.bind(id);

    query.execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Platform>("SELECT * FROM platforms WHERE id = ?")
        .bind(id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_platform(pool: State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM platforms WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_object_platforms(
    pool: State<'_, SqlitePool>,
    object_id: i64,
) -> Result<Vec<ObjectPlatform>, String> {
    sqlx::query_as::<_, ObjectPlatform>(
        "SELECT op.* FROM object_platforms op
         WHERE op.object_id = ?
         ORDER BY op.created_at DESC"
    )
    .bind(object_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct CreateObjectPlatform {
    pub platform_id: i64,
    pub platform_url: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub async fn add_object_to_platform(
    pool: State<'_, SqlitePool>,
    object_id: i64,
    request: CreateObjectPlatform,
) -> Result<ObjectPlatform, String> {
    let status = request.status.unwrap_or_else(|| "draft".to_string());

    let result = sqlx::query(
        "INSERT INTO object_platforms (object_id, platform_id, platform_url, status, listed_at)
         VALUES (?, ?, ?, ?, CASE WHEN ? = 'listed' THEN CURRENT_TIMESTAMP ELSE NULL END)"
    )
    .bind(object_id)
    .bind(request.platform_id)
    .bind(&request.platform_url)
    .bind(&status)
    .bind(&status)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    sqlx::query_as::<_, ObjectPlatform>(
        "SELECT * FROM object_platforms WHERE id = ?"
    )
    .bind(id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_object_from_platform(pool: State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM object_platforms WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if result.rows_affected() == 0 {
        Err("Platform association not found".to_string())
    } else {
        Ok(())
    }
}

// ========== CATEGORIES COMMANDS ==========

#[tauri::command]
pub async fn list_categories(pool: State<'_, SqlitePool>) -> Result<Vec<Category>, String> {
    sqlx::query_as::<_, Category>("SELECT * FROM categories ORDER BY name ASC")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_category(
    pool: State<'_, SqlitePool>,
    category: CreateCategory,
) -> Result<Category, String> {
    let result = sqlx::query("INSERT INTO categories (name) VALUES (?)")
        .bind(&category.name)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE id = ?")
        .bind(id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_category(pool: State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    let result = sqlx::query("DELETE FROM categories WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if result.rows_affected() == 0 {
        Err("Category not found".to_string())
    } else {
        Ok(())
    }
}

// ========== PHOTO IMPORT COMMANDS ==========

#[derive(Debug, Serialize, Deserialize)]
pub struct Volume {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanVolumeResult {
    pub photos: Vec<String>,
    pub previews: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportPhotosResult {
    pub imported: i32,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn list_volumes() -> Result<Vec<Volume>, String> {
    let mut volumes = Vec::new();

    #[cfg(target_os = "macos")]
    {
        // On macOS, external volumes are mounted under /Volumes
        let volumes_path = Path::new("/Volumes");

        if volumes_path.exists() {
            match fs::read_dir(volumes_path) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        let path = entry.path();

                        // Skip if it's not a directory
                        if !path.is_dir() {
                            continue;
                        }

                        // Get the volume name
                        if let Some(name) = path.file_name() {
                            let name_str = name.to_string_lossy().to_string();

                            // Filter out system volumes
                            if name_str != "Macintosh HD" && name_str != "Data" && !name_str.starts_with('.') {
                                volumes.push(Volume {
                                    name: name_str.clone(),
                                    path: path.to_string_lossy().to_string(),
                                });
                            }
                        }
                    }
                }
                Err(e) => return Err(format!("Failed to read /Volumes: {}", e)),
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, check for removable drives
        use std::os::windows::fs::MetadataExt;

        for letter in 'A'..='Z' {
            let drive_path = format!("{}:\\", letter);
            let path = Path::new(&drive_path);

            if path.exists() {
                // Try to determine if it's a removable drive
                // This is a simple check; more sophisticated detection could be added
                volumes.push(Volume {
                    name: format!("Drive {}", letter),
                    path: drive_path,
                });
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, check common mount points
        let media_path = Path::new("/media");
        let mnt_path = Path::new("/mnt");

        for mount_base in &[media_path, mnt_path] {
            if mount_base.exists() {
                if let Ok(entries) = fs::read_dir(mount_base) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            if let Some(name) = path.file_name() {
                                volumes.push(Volume {
                                    name: name.to_string_lossy().to_string(),
                                    path: path.to_string_lossy().to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(volumes)
}

fn is_photo_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        matches!(
            ext.as_str(),
            "jpg" | "jpeg" | "png" | "heic" | "raw" | "cr2" | "nef" | "orf" | "arw" | "dng" | "tif" | "tiff" | "gif" | "bmp" | "webp"
        )
    } else {
        false
    }
}

fn scan_for_photos_recursive(dir: &Path, photos: &mut Vec<String>, max_depth: usize, current_depth: usize) -> std::io::Result<()> {
    if current_depth > max_depth {
        return Ok(());
    }

    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            // Skip hidden files and directories (starting with .)
            if let Some(name) = path.file_name() {
                let name_str = name.to_string_lossy();
                if name_str.starts_with('.') {
                    continue; // Skip hidden files/folders
                }
            }

            if path.is_dir() {
                // Recursively scan subdirectories
                scan_for_photos_recursive(&path, photos, max_depth, current_depth + 1)?;
            } else if is_photo_file(&path) {
                // Only add if not already in the list (avoid duplicates)
                let path_str = path.to_string_lossy().to_string();
                if !photos.contains(&path_str) {
                    photos.push(path_str);
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn scan_volume_for_photos(volume_path: String) -> Result<ScanVolumeResult, String> {
    let path = Path::new(&volume_path);

    if !path.exists() {
        return Err("Volume path does not exist".to_string());
    }

    let mut photos = Vec::new();

    // Scan recursively with max depth of 10 to avoid infinite loops
    scan_for_photos_recursive(path, &mut photos, 10, 0)
        .map_err(|e| format!("Failed to scan volume: {}", e))?;

    // Get first 4 photos as previews (as base64)
    let mut previews = Vec::new();
    for photo_path in photos.iter().take(4) {
        // Read the image file and convert to base64
        if let Ok(image_data) = fs::read(photo_path) {
            // Try to open as image to get format
            if let Ok(img) = image::load_from_memory(&image_data) {
                // Resize to thumbnail for preview (max 300px)
                let thumbnail = img.resize(300, 300, image::imageops::FilterType::Lanczos3);

                // Encode as JPEG
                let mut buffer = Vec::new();
                let mut cursor = std::io::Cursor::new(&mut buffer);

                if thumbnail.write_to(&mut cursor, image::ImageOutputFormat::Jpeg(80)).is_ok() {
                    let base64_string = general_purpose::STANDARD.encode(&buffer);
                    previews.push(format!("data:image/jpeg;base64,{}", base64_string));
                }
            }
        }
    }

    Ok(ScanVolumeResult { photos, previews })
}

#[tauri::command]
pub async fn import_photos(
    pool: State<'_, SqlitePool>,
    photos: Vec<String>,
    destination: String,
    folder_format: String,
    custom_folder_name: Option<String>,
    description: Option<String>,
    delete_after: bool,
) -> Result<ImportPhotosResult, String> {
    let dest_path = Path::new(&destination);

    if !dest_path.exists() {
        return Err("Destination path does not exist".to_string());
    }

    // Create folder name based on format
    let folder_name = if folder_format == "automatic" {
        // Format: YY-MM-dd HH-mm
        let now = Local::now();
        now.format("%y-%m-%d %H-%M").to_string()
    } else {
        custom_folder_name.unwrap_or_else(|| "imported_photos".to_string())
    };

    // Create the destination folder
    let import_folder = dest_path.join(&folder_name);
    fs::create_dir_all(&import_folder)
        .map_err(|e| format!("Failed to create import folder: {}", e))?;

    // Write description file if provided
    if let Some(desc) = description {
        if !desc.trim().is_empty() {
            let desc_file = import_folder.join("description.txt");
            fs::write(&desc_file, desc)
                .map_err(|e| format!("Failed to write description file: {}", e))?;
        }
    }

    let mut imported_count = 0;
    let mut errors = Vec::new();

    // Import each photo
    for photo_path in photos {
        let source = Path::new(&photo_path);

        if !source.exists() {
            errors.push(format!("Source file not found: {}", photo_path));
            continue;
        }

        // Get the file name
        let file_name = match source.file_name() {
            Some(name) => name.to_string_lossy().to_string(),
            None => {
                errors.push(format!("Invalid file name: {}", photo_path));
                continue;
            }
        };

        // Destination file path
        let dest_file = import_folder.join(&file_name);

        // Check if destination file already exists to avoid overwrite
        let mut final_dest_file = dest_file.clone();
        let mut copy_number = 1;

        while final_dest_file.exists() {
            // Create a new filename with copy number
            let stem = source.file_stem().ok_or("Invalid file name").map_err(|e| e.to_string()).unwrap_or_default();
            let extension = source.extension().map(|e| e.to_string_lossy()).unwrap_or_default();
            let new_file_name = if extension.is_empty() {
                format!("{} ({})", stem.to_string_lossy(), copy_number)
            } else {
                format!("{} ({}).{}", stem.to_string_lossy(), copy_number, extension)
            };
            final_dest_file = import_folder.join(&new_file_name);
            copy_number += 1;
        }

        // Copy the file
        match fs::copy(source, &final_dest_file) {
            Ok(_) => {
                // Add to database
                let file_path = final_dest_file.to_string_lossy().to_string();
                let file_size = match fs::metadata(&final_dest_file) {
                    Ok(meta) => meta.len() as i64,
                    Err(_) => 0,
                };

                let (width, height) = if let Ok(img) = image::open(&final_dest_file) {
                    (Some(img.width() as i32), Some(img.height() as i32))
                } else {
                    (None, None)
                };

                // Check if already exists in database (by file_path)
                let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM photos WHERE file_path = ?")
                    .bind(&file_path)
                    .fetch_one(pool.inner())
                    .await
                    .unwrap_or(0);

                if exists == 0 {
                    // Insert into database only if not exists
                    // Use file_path for both file_path AND original_path since the photo is now in its final location
                    match sqlx::query(
                        "INSERT INTO photos (file_path, original_path, file_name, file_size, width, height)
                         VALUES (?, ?, ?, ?, ?, ?)"
                    )
                    .bind(&file_path)
                    .bind(&file_path) // Use destination path as original_path, not source path
                    .bind(final_dest_file.file_name().unwrap().to_string_lossy().to_string())
                    .bind(file_size)
                    .bind(width)
                    .bind(height)
                    .execute(pool.inner())
                    .await {
                        Ok(_) => {
                            imported_count += 1;
                        }
                        Err(e) => {
                            errors.push(format!("Failed to add to database {}: {}", photo_path, e));
                        }
                    }
                } else {
                    imported_count += 1; // Count as imported even if already in DB
                }

                // Delete source file if requested
                if delete_after {
                    if let Err(e) = fs::remove_file(source) {
                        errors.push(format!("Failed to delete source file {}: {}", photo_path, e));
                    }
                }
            }
            Err(e) => {
                errors.push(format!("Failed to copy {}: {}", photo_path, e));
            }
        }
    }

    Ok(ImportPhotosResult {
        imported: imported_count,
        errors,
    })
}

// ========== MOVE PHOTOS AND FOLDERS COMMAND ==========

#[derive(Deserialize)]
pub struct MoveItemsRequest {
    pub photo_ids: Vec<i64>,
    pub folder_paths: Vec<String>,
    pub destination_path: String,
}

#[derive(Serialize)]
pub struct MoveItemsResult {
    pub moved: i32,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn move_photos_and_folders(
    pool: State<'_, SqlitePool>,
    request: MoveItemsRequest,
) -> Result<MoveItemsResult, String> {
    let dest_path = Path::new(&request.destination_path);

    if !dest_path.exists() {
        fs::create_dir_all(dest_path)
            .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    }

    let mut moved_count = 0;
    let mut errors = Vec::new();

    // Move individual photos
    for photo_id in request.photo_ids {
        let photo = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE id = ?")
            .bind(photo_id)
            .fetch_optional(pool.inner())
            .await
            .map_err(|e| e.to_string())?;

        if let Some(photo) = photo {
            let source_path = Path::new(&photo.file_path);

            if !source_path.exists() {
                errors.push(format!("Source file not found: {}", photo.file_path));
                continue;
            }

            let file_name = source_path.file_name().unwrap().to_string_lossy().to_string();
            let mut dest_file = dest_path.join(&file_name);

            // Handle duplicates
            let mut copy_number = 1;
            while dest_file.exists() {
                let stem = source_path.file_stem().ok_or("Invalid file name").map_err(|e| e.to_string())?;
                let extension = source_path.extension().map(|e| e.to_string_lossy()).unwrap_or_default();
                let new_name = if extension.is_empty() {
                    format!("{} ({})", stem.to_string_lossy(), copy_number)
                } else {
                    format!("{} ({}).{}", stem.to_string_lossy(), copy_number, extension)
                };
                dest_file = dest_path.join(&new_name);
                copy_number += 1;
            }

            // Move the file
            match fs::rename(source_path, &dest_file) {
                Ok(_) => {
                    // Update database with new paths
                    let new_file_path = dest_file.to_string_lossy().to_string();
                    match sqlx::query(
                        "UPDATE photos SET file_path = ?, original_path = ? WHERE id = ?"
                    )
                    .bind(&new_file_path)
                    .bind(&new_file_path)
                    .bind(photo_id)
                    .execute(pool.inner())
                    .await {
                        Ok(_) => moved_count += 1,
                        Err(e) => errors.push(format!("Failed to update database for photo {}: {}", photo_id, e)),
                    }
                }
                Err(e) => errors.push(format!("Failed to move file {}: {}", photo.file_path, e)),
            }
        } else {
            errors.push(format!("Photo {} not found", photo_id));
        }
    }

    // Move folders
    for folder_path in request.folder_paths {
        let source_folder = Path::new(&folder_path);

        if !source_folder.exists() {
            errors.push(format!("Source folder not found: {}", folder_path));
            continue;
        }

        let folder_name = source_folder.file_name().unwrap().to_string_lossy().to_string();
        let mut dest_folder = dest_path.join(&folder_name);

        // Handle duplicates
        let mut copy_number = 1;
        while dest_folder.exists() {
            let new_name = format!("{} ({})", folder_name, copy_number);
            dest_folder = dest_path.join(&new_name);
            copy_number += 1;
        }

        // Get all photos in this folder before moving
        let photos_in_folder = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE file_path LIKE ?")
            .bind(format!("{}%", folder_path))
            .fetch_all(pool.inner())
            .await
            .map_err(|e| e.to_string())?;

        // Move the entire folder
        match fs::rename(source_folder, &dest_folder) {
            Ok(_) => {
                // Update all photos in this folder
                for photo in photos_in_folder {
                    let old_path = photo.file_path.clone();
                    let new_path = old_path.replace(&folder_path, &dest_folder.to_string_lossy().to_string());

                    match sqlx::query(
                        "UPDATE photos SET file_path = ?, original_path = ? WHERE id = ?"
                    )
                    .bind(&new_path)
                    .bind(&new_path)
                    .bind(photo.id)
                    .execute(pool.inner())
                    .await {
                        Ok(_) => moved_count += 1,
                        Err(e) => errors.push(format!("Failed to update database for photo in folder: {}", e)),
                    }
                }
            }
            Err(e) => errors.push(format!("Failed to move folder {}: {}", folder_path, e)),
        }
    }

    Ok(MoveItemsResult {
        moved: moved_count,
        errors,
    })
}

#[derive(Deserialize)]
pub struct CreateFolderRequest {
    pub folder_path: String,
}

#[tauri::command]
pub async fn create_folder(
    request: CreateFolderRequest,
) -> Result<String, String> {
    let folder_path = Path::new(&request.folder_path);

    fs::create_dir_all(folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(request.folder_path)
}

#[derive(Deserialize)]
pub struct ScanFolderStructureRequest {
    pub root_path: String,
}

#[derive(Serialize)]
pub struct FolderInfo {
    pub path: String,
    pub name: String,
    pub has_subfolders: bool,
}

#[derive(Serialize)]
pub struct ScanFolderStructureResult {
    pub folders: Vec<FolderInfo>,
}

fn scan_folders_recursive(root: &Path, base: &Path) -> Result<Vec<FolderInfo>, String> {
    let mut folders = Vec::new();

    if !root.exists() || !root.is_dir() {
        return Ok(folders);
    }

    let entries = fs::read_dir(root)
        .map_err(|e| format!("Failed to read directory {}: {}", root.display(), e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_dir() {
                // Check if this folder has subfolders
                let has_subfolders = fs::read_dir(&path)
                    .map(|entries| entries.filter_map(|e| e.ok()).any(|e| e.path().is_dir()))
                    .unwrap_or(false);

                let relative_path = path.strip_prefix(base)
                    .map_err(|e| format!("Failed to get relative path: {}", e))?;

                folders.push(FolderInfo {
                    path: format!("/{}", relative_path.to_string_lossy().replace("\\", "/")),
                    name: path.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string(),
                    has_subfolders,
                });

                // Recursively scan subfolders
                let subfolders = scan_folders_recursive(&path, base)?;
                folders.extend(subfolders);
            }
        }
    }

    Ok(folders)
}

#[tauri::command]
pub async fn scan_folder_structure(
    request: ScanFolderStructureRequest,
) -> Result<ScanFolderStructureResult, String> {
    let root_path = Path::new(&request.root_path);

    let folders = scan_folders_recursive(root_path, root_path)?;

    Ok(ScanFolderStructureResult { folders })
}
