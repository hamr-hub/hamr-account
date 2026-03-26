use anyhow::Context;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expires_in: i64,
    pub refresh_token_expires_in: i64,
    pub port: u16,
    /// 允许跨域的来源列表，从 ALLOWED_ORIGINS 环境变量读取（逗号分隔）
    /// 示例: ALLOWED_ORIGINS=http://localhost:3000,https://account.hamr.store
    pub allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .context("DATABASE_URL must be set")?,
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "default-secret-change-in-production".to_string()),
            jwt_expires_in: std::env::var("JWT_EXPIRES_IN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(86400),
            refresh_token_expires_in: std::env::var("REFRESH_TOKEN_EXPIRES_IN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2592000),
            port: std::env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3001),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
        })
    }
}
