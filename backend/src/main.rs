mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;

use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub use config::Config;
pub use db::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;
    let state = AppState::new(&config.database_url).await?;

    state.run_migrations().await?;

    // CORS: 从环境变量 ALLOWED_ORIGINS 读取允许的来源（逗号分隔）
    // 示例: ALLOWED_ORIGINS=http://localhost:3000,https://account.hamr.store
    let cors = build_cors_layer(&config.allowed_origins);

    let app = routes::build_router(state)
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("HamR Account Server listening on {}", addr);
    tracing::info!("CORS allowed origins: {:?}", config.allowed_origins);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn build_cors_layer(allowed_origins: &[String]) -> CorsLayer {
    use tower_http::cors::AllowOrigin;
    use axum::http::HeaderValue;

    let origins: Vec<HeaderValue> = allowed_origins
        .iter()
        .filter_map(|o| o.parse().ok())
        .collect();

    if origins.is_empty() {
        // 没有配置时仅允许 localhost 开发环境
        tracing::warn!("No ALLOWED_ORIGINS configured, defaulting to localhost:3000");
        CorsLayer::new()
            .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any)
    } else {
        CorsLayer::new()
            .allow_origin(AllowOrigin::list(origins))
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any)
    }
}
