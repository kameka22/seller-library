#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;
mod models;
mod commands;
mod updater;

// SqlitePool is managed by Tauri State

#[tokio::main]
async fn main() {
    // Initialize the database
    let pool = db::init_db()
        .await
        .expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(pool)
        .invoke_handler(tauri::generate_handler![
            commands::list_objects,
            commands::get_object,
            commands::create_object,
            commands::update_object,
            commands::delete_object,
            commands::list_photos,
            commands::scan_photos,
            commands::delete_photo,
            commands::delete_photo_db_only,
            commands::delete_folder_recursive,
            commands::delete_folder_recursive_db_only,
            commands::save_edited_photo,
            commands::get_object_photos,
            commands::associate_photo,
            commands::dissociate_photo,
            commands::list_platforms,
            commands::create_platform,
            commands::update_platform,
            commands::delete_platform,
            commands::get_object_platforms,
            commands::add_object_to_platform,
            commands::remove_object_from_platform,
            commands::list_categories,
            commands::create_category,
            commands::delete_category,
            commands::list_volumes,
            commands::scan_volume_for_photos,
            commands::import_photos,
            updater::check_for_updates,
            updater::download_and_install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
