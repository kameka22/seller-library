use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::process::Command;

const GITHUB_REPO: &str = "kameka22/seller-library";
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: String,
    pub current_version: String,
    pub download_url: String,
}

#[derive(Debug, Deserialize)]
struct LatestRelease {
    version: String,
    notes: String,
    platforms: Platforms,
}

#[derive(Debug, Deserialize)]
struct Platforms {
    #[serde(rename = "darwin-aarch64")]
    darwin_aarch64: Option<PlatformInfo>,
    #[serde(rename = "darwin-x86_64")]
    darwin_x86_64: Option<PlatformInfo>,
}

#[derive(Debug, Deserialize)]
struct PlatformInfo {
    url: String,
}

#[tauri::command]
pub async fn check_for_updates() -> Result<Option<UpdateInfo>, String> {
    println!("Checking for updates...");

    let url = format!(
        "https://github.com/{}/releases/download/{}/latest.json",
        GITHUB_REPO, CURRENT_VERSION
    );

    let client = reqwest::Client::builder()
        .user_agent("seller-library-updater")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = match client.get(&url).send().await {
        Ok(resp) => resp,
        Err(e) => {
            println!("Failed to fetch update info: {}", e);
            return Ok(None); // Silently fail
        }
    };

    if !response.status().is_success() {
        println!("Update check failed with status: {}", response.status());
        return Ok(None); // Silently fail
    }

    let latest: LatestRelease = match response.json().await {
        Ok(data) => data,
        Err(e) => {
            println!("Failed to parse update info: {}", e);
            return Ok(None); // Silently fail
        }
    };

    // Comparer les versions
    let current = semver::Version::parse(CURRENT_VERSION)
        .map_err(|e| format!("Invalid current version: {}", e))?;
    let remote = semver::Version::parse(&latest.version)
        .map_err(|e| format!("Invalid remote version: {}", e))?;

    if remote > current {
        // Déterminer l'architecture
        let platform_info = if cfg!(target_arch = "aarch64") {
            latest.platforms.darwin_aarch64
        } else {
            latest.platforms.darwin_x86_64
        };

        if let Some(platform) = platform_info {
            Ok(Some(UpdateInfo {
                version: latest.version,
                notes: latest.notes,
                current_version: CURRENT_VERSION.to_string(),
                download_url: platform.url,
            }))
        } else {
            Ok(None)
        }
    } else {
        println!("App is up to date");
        Ok(None)
    }
}

#[tauri::command]
pub async fn download_and_install_update(download_url: String) -> Result<(), String> {
    println!("Starting update download from: {}", download_url);

    // Télécharger le fichier
    let client = reqwest::Client::builder()
        .user_agent("seller-library-updater")
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download update: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // Créer un fichier temporaire
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("seller-library-update.tar.gz");

    let mut file =
        fs::File::create(&temp_file).map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    println!("Update downloaded to: {:?}", temp_file);

    // Extraire l'archive
    let extract_dir = temp_dir.join("seller-library-update");
    if extract_dir.exists() {
        fs::remove_dir_all(&extract_dir)
            .map_err(|e| format!("Failed to clean extract dir: {}", e))?;
    }
    fs::create_dir_all(&extract_dir).map_err(|e| format!("Failed to create extract dir: {}", e))?;

    let tar_gz =
        fs::File::open(&temp_file).map_err(|e| format!("Failed to open archive: {}", e))?;
    let tar = flate2::read::GzDecoder::new(tar_gz);
    let mut archive = tar::Archive::new(tar);
    archive
        .unpack(&extract_dir)
        .map_err(|e| format!("Failed to extract archive: {}", e))?;

    println!("Update extracted to: {:?}", extract_dir);

    // Trouver le fichier .app dans le dossier extrait
    let app_name = "Seller Library.app";
    let new_app_path = extract_dir.join(app_name);

    if !new_app_path.exists() {
        return Err(format!(
            "App bundle not found in archive: {:?}",
            new_app_path
        ));
    }

    // Obtenir le chemin de l'application actuelle
    let current_exe =
        std::env::current_exe().map_err(|e| format!("Failed to get current exe path: {}", e))?;

    // Remonter jusqu'au .app (current_exe est dans Contents/MacOS/seller-library)
    let current_app = current_exe
        .parent() // MacOS
        .and_then(|p| p.parent()) // Contents
        .and_then(|p| p.parent()) // Seller Library.app
        .ok_or("Failed to determine app bundle path")?;

    println!("Current app path: {:?}", current_app);
    println!("New app path: {:?}", new_app_path);

    // Créer un script shell pour remplacer l'application et la relancer
    let script = format!(
        r#"#!/bin/bash
sleep 2
rm -rf "{}"
cp -R "{}" "{}"
open "{}"
"#,
        current_app.display(),
        new_app_path.display(),
        current_app.display(),
        current_app.display()
    );

    let script_path = temp_dir.join("update-script.sh");
    fs::write(&script_path, script)
        .map_err(|e| format!("Failed to create update script: {}", e))?;

    // Rendre le script exécutable
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&script_path)
            .map_err(|e| format!("Failed to get script permissions: {}", e))?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_path, perms)
            .map_err(|e| format!("Failed to set script permissions: {}", e))?;
    }

    // Lancer le script en arrière-plan et quitter l'application
    Command::new("sh")
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("Failed to launch update script: {}", e))?;

    // Quitter l'application (le script la relancera)
    std::process::exit(0);
}
