use axum::{extract::State, Extension, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;

use crate::{
    db::AppState,
    errors::{AppError, AppResult},
    models::{ChangePasswordRequest, Claims, UpdateProfileRequest, User, UserProfile},
};

pub async fn get_profile(
    Extension(claims): Extension<Claims>,
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

pub async fn update_profile(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Json(req): Json<UpdateProfileRequest>,
) -> AppResult<Json<UserProfile>> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let user = sqlx::query_as::<_, User>(
        r#"UPDATE users
           SET display_name = COALESCE($2, display_name),
               avatar_url = COALESCE($3, avatar_url),
               updated_at = NOW()
           WHERE id = $1
           RETURNING *"#,
    )
    .bind(user_id)
    .bind(&req.display_name)
    .bind(&req.avatar_url)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(user.into()))
}

pub async fn change_password(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Json(req): Json<ChangePasswordRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if req.new_password.len() < 8 {
        return Err(AppError::ValidationError(
            "New password must be at least 8 characters".to_string(),
        ));
    }

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;

    let valid = verify(&req.old_password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized);
    }

    let new_hash = hash(&req.new_password, DEFAULT_COST)?;
    sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(&new_hash)
        .bind(user_id)
        .execute(&state.db)
        .await?;

    sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE user_id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "message": "Password changed successfully" })))
}
