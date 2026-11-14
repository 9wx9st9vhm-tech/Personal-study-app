//! The Mac side of the app. The interface (TypeScript) calls these commands
//! to save and load your data. Everything stays in files on this Mac:
//!
//! - Your data:        ~/Library/Application Support/com.personalstudy.desktop/study-data.json
//! - Daily backups:    .../com.personalstudy.desktop/backups/
//! - Manual backups:   ~/Documents/Personal Study Backups/

use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const DATA_FILE: &str = "study-data.json";
const KEEP_DAILY_BACKUPS: usize = 14;

type Result<T> = std::result::Result<T, String>;

fn data_dir(app: &AppHandle) -> Result<PathBuf> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn daily_backup_dir(app: &AppHandle) -> Result<PathBuf> {
    let dir = data_dir(app)?.join("backups");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn export_dir(app: &AppHandle) -> Result<PathBuf> {
    let dir = app
        .path()
        .document_dir()
        .map_err(|e| e.to_string())?
        .join("Personal Study Backups");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Only allow names made of digits, letters and dashes (no "../" tricks).
fn safe_stamp(s: &str) -> Result<&str> {
    if !s.is_empty() && s.len() <= 40 && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        Ok(s)
    } else {
        Err("bad name".into())
    }
}

/// Write a file safely: write a temporary copy first, then swap it in, so a
/// crash halfway through can never leave a half-written data file.
fn write_atomic(path: &Path, contents: &str) -> Result<()> {
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, contents).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_data(app: AppHandle) -> Result<Option<String>> {
    let path = data_dir(&app)?.join(DATA_FILE);
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_data(app: AppHandle, json: String, day: String) -> Result<()> {
    // Refuse to save anything that isn't valid JSON.
    serde_json::from_str::<serde_json::Value>(&json).map_err(|e| format!("not valid data: {e}"))?;
    let path = data_dir(&app)?.join(DATA_FILE);

    // Once a day, keep a copy of the data as it was before today's changes.
    if path.exists() {
        let backups = daily_backup_dir(&app)?;
        let daily = backups.join(format!("daily-{}.json", safe_stamp(&day)?));
        if !daily.exists() {
            fs::copy(&path, &daily).map_err(|e| e.to_string())?;
            prune_daily_backups(&backups);
        }
    }
    write_atomic(&path, &json)
}

fn prune_daily_backups(dir: &Path) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    let mut names: Vec<PathBuf> = entries
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.file_name().and_then(|n| n.to_str()).is_some_and(|n| n.starts_with("daily-")))
        .collect();
    names.sort();
    while names.len() > KEEP_DAILY_BACKUPS {
        let _ = fs::remove_file(names.remove(0));
    }
}

#[tauri::command]
fn data_location(app: AppHandle) -> Result<String> {
    Ok(data_dir(&app)?.join(DATA_FILE).display().to_string())
}

#[tauri::command]
fn export_backup(app: AppHandle, json: String, stamp: String) -> Result<String> {
    serde_json::from_str::<serde_json::Value>(&json).map_err(|e| e.to_string())?;
    let path = export_dir(&app)?.join(format!("personal-study-{}.json", safe_stamp(&stamp)?));
    write_atomic(&path, &json)?;
    Ok(path.display().to_string())
}

#[derive(serde::Serialize)]
struct BackupFile {
    name: String,
    path: String,
}

#[tauri::command]
fn list_backups(app: AppHandle) -> Result<Vec<BackupFile>> {
    let mut files: Vec<(std::time::SystemTime, BackupFile)> = Vec::new();
    for (label, dir) in [("saved", export_dir(&app)?), ("daily", daily_backup_dir(&app)?)] {
        let Ok(entries) = fs::read_dir(&dir) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("json") {
                continue;
            }
            let modified = entry.metadata().and_then(|m| m.modified()).unwrap_or(std::time::UNIX_EPOCH);
            let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
            files.push((modified, BackupFile { name: format!("{name}  ({label})"), path: path.display().to_string() }));
        }
    }
    files.sort_by(|a, b| b.0.cmp(&a.0));
    Ok(files.into_iter().map(|(_, f)| f).collect())
}

#[tauri::command]
fn read_backup(app: AppHandle, path: String) -> Result<String> {
    // Only read files from the two backup folders.
    let wanted = fs::canonicalize(&path).map_err(|e| e.to_string())?;
    let allowed = [export_dir(&app)?, daily_backup_dir(&app)?];
    let inside = allowed
        .iter()
        .filter_map(|d| fs::canonicalize(d).ok())
        .any(|d| wanted.starts_with(d));
    if !inside {
        return Err("That file isn't in a backup folder.".into());
    }
    fs::read_to_string(wanted).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            data_location,
            export_backup,
            list_backups,
            read_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running Personal Study");
}
