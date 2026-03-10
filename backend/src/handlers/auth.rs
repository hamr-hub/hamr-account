use axum::{extract::State, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use uuid::Uuid;

use crate::{
    db::AppState,
    errors::{AppError, AppResult},
    models::{
        AuthResponse, Claims, LoginRequest, RefreshTokenRequest, RegisterRequest, User, UserProfile,
    },
};

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<AuthResponse>> {
    if req.email.is_empty() || req.password.len() < 8 || req.username.is_empty() {
        return Err(AppError::ValidationError(
            "Email, username required; password must be at least 8 characters".to_string(),
        ));
    }

    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE email = $1 OR username = $2",
    )
    .bind(&req.email)
    .bind(&req.username)
    .fetch_one(&state.db)
    .await?;

    if existing > 0 {
        return Err(AppError::Conflict("Email or username already exists".to_string()));
    }

    let password_hash = hash(&req.password, DEFAULT_COST)?;
    let user_id = Uuid::new_v4();

    let user = sqlx::query_as::<_, User>(
        r#"INSERT INTO users (id, email, username, password_hash, display_name, email_verified, is_active)
           VALUES ($1, $2, $3, $4, $5, false, true)
           RETURNING *"#,
    )
    .bind(user_id)
    .bind(&req.email)
    .bind(&req.username)
    .bind(&password_hash)
    .bind(&req.display_name)
    .fetch_one(&state.db)
    .await?;

    let response = generate_auth_response(&state, user).await?;
    Ok(Json(response))
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1 AND is_active = true")
        .bind(&req.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::Unauthorized)?;

    let valid = verify(&req.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized);
    }

    let response = generate_auth_response(&state, user).await?;
    Ok(Json(response))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshTokenRequest>,
) -> AppResult<Json<AuthResponse>> {
    use bcrypt::verify;

    let tokens = sqlx::query_as::<_, crate::models::RefreshToken>(
        "SELECT * FROM refresh_tokens WHERE revoked = false AND expires_at > NOW()",
    )
    .fetch_all(&state.db)
    .await?;

    let matched = tokens
        .into_iter()
        .find(|t| verify(&req.refresh_token, &t.token_hash).unwrap_or(false));

    let token_record = matched.ok_or(AppError::Unauthorized)?;

    sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE id = $1")
        .bind(token_record.id)
        .execute(&state.db)
        .await?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1 AND is_active = true")
        .bind(token_record.user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::Unauthorized)?;

    let response = generate_auth_response(&state, user).await?;
    Ok(Json(response))
}

pub async fn logout(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<Claims>,
    Json(req): Json<RefreshTokenRequest>,
) -> AppResult<Json<serde_json::Value>> {
    use bcrypt::verify;

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let tokens = sqlx::query_as::<_, crate::models::RefreshToken>(
        "SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = false",
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await?;

    for token in tokens {
        if verify(&req.refresh_token, &token.token_hash).unwrap_or(false) {
            sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE id = $1")
                .bind(token.id)
                .execute(&state.db)
                .await?;
            break;
        }
    }

    Ok(Json(serde_json::json!({ "message": "Logged out successfully" })))
}

pub async fn me(
    axum::Extension(claims): axum::Extension<Claims>,
    State(state): State<AppState>,
) -> AppResult<Json<UserProfile>> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;

    Ok(Json(user.into()))
}

async fn generate_auth_response(state: &AppState, user: User) -> AppResult<AuthResponse> {
    let now = Utc::now().timestamp();
    let exp = now + state.config.jwt_expires_in;

    let claims = Claims {
        sub: user.id.to_string(),
        email: user.email.clone(),
        username: user.username.clone(),
        exp,
        iat: now,
    };

    let access_token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
    )?;

    let raw_refresh = Uuid::new_v4().to_string();
    let refresh_hash = hash(&raw_refresh, DEFAULT_COST)?;
    let refresh_expires = chrono::DateTime::<Utc>::from_timestamp(
        now + state.config.refresh_token_expires_in,
        0,
    )
    .unwrap_or_else(Utc::now);

    sqlx::query(
        "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
    )
    .bind(Uuid::new_v4())
    .bind(user.id)
    .bind(&refresh_hash)
    .bind(refresh_expires)
    .execute(&state.db)
    .await?;

    Ok(AuthResponse {
        access_token,
        refresh_token: raw_refresh,
        token_type: "Bearer".to_string(),
        expires_in: state.config.jwt_expires_in,
        user: user.into(),
    })
}
