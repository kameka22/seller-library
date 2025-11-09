#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Object {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub year: Option<i32>,
    pub weight: Option<f64>,
    pub category_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateObject {
    pub name: String,
    pub description: Option<String>,
    pub year: Option<i32>,
    pub weight: Option<f64>,
    pub category_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateObject {
    pub name: Option<String>,
    pub description: Option<String>,
    pub year: Option<i32>,
    pub weight: Option<f64>,
    pub category_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategory {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Photo {
    pub id: i64,
    pub file_path: String,
    pub original_path: String,
    pub file_name: String,
    pub file_size: Option<i64>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ObjectPhoto {
    pub id: i64,
    pub object_id: i64,
    pub photo_id: i64,
    pub display_order: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Platform {
    pub id: i64,
    pub name: String,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub token_expires_at: Option<String>,
    pub environment: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlatform {
    pub name: String,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub environment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlatform {
    pub name: Option<String>,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub token_expires_at: Option<String>,
    pub environment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ObjectPlatform {
    pub id: i64,
    pub object_id: i64,
    pub platform_id: i64,
    pub platform_url: Option<String>,
    pub status: String,
    pub listed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
