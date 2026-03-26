use axum::{
    extract::{Path, State},
    Extension, Json,
};
use uuid::Uuid;

use crate::{
    db::AppState,
    errors::{AppError, AppResult},
    models::{
        Claims, CreateFamilyRequest, Family, FamilyMember, FamilyMemberResponse, FamilyResponse,
        JoinFamilyRequest, User,
    },
};

pub async fn create_family(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Json(req): Json<CreateFamilyRequest>,
) -> AppResult<Json<FamilyResponse>> {
    if req.name.trim().is_empty() {
        return Err(AppError::ValidationError("Family name is required".to_string()));
    }

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;
    let invite_code = generate_invite_code();

    let family = sqlx::query_as::<_, Family>(
        r#"INSERT INTO families (id, name, description, owner_id, invite_code)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#,
    )
    .bind(Uuid::new_v4())
    .bind(&req.name)
    .bind(&req.description)
    .bind(user_id)
    .bind(&invite_code)
    .fetch_one(&state.db)
    .await?;

    sqlx::query(
        "INSERT INTO family_members (id, family_id, user_id, role) VALUES ($1, $2, $3, 'admin')",
    )
    .bind(Uuid::new_v4())
    .bind(family.id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    Ok(Json(to_family_response(family, 1)))
}

pub async fn get_my_families(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
) -> AppResult<Json<Vec<FamilyResponse>>> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let rows = sqlx::query_as::<_, (Family, i64)>(
        r#"SELECT f.*, COUNT(fm2.id) as member_count
           FROM families f
           JOIN family_members fm ON f.id = fm.family_id AND fm.user_id = $1
           JOIN family_members fm2 ON f.id = fm2.family_id
           GROUP BY f.id
           ORDER BY f.created_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let families = rows
                .into_iter()
                .map(|(f, count)| to_family_response(f, count))
                .collect();
            Ok(Json(families))
        }
        Err(_) => {
            let families = sqlx::query_as::<_, Family>(
                r#"SELECT f.*
                   FROM families f
                   JOIN family_members fm ON f.id = fm.family_id AND fm.user_id = $1
                   ORDER BY f.created_at DESC"#,
            )
            .bind(user_id)
            .fetch_all(&state.db)
            .await?;

            let result = families
                .into_iter()
                .map(|f| to_family_response(f, 0))
                .collect();
            Ok(Json(result))
        }
    }
}

pub async fn join_family(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Json(req): Json<JoinFamilyRequest>,
) -> AppResult<Json<FamilyResponse>> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let family = sqlx::query_as::<_, Family>("SELECT * FROM families WHERE invite_code = $1")
        .bind(&req.invite_code)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;

    let already_member = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM family_members WHERE family_id = $1 AND user_id = $2",
    )
    .bind(family.id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    if already_member > 0 {
        return Err(AppError::Conflict("Already a member of this family".to_string()));
    }

    sqlx::query(
        "INSERT INTO family_members (id, family_id, user_id, role) VALUES ($1, $2, $3, 'member')",
    )
    .bind(Uuid::new_v4())
    .bind(family.id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM family_members WHERE family_id = $1",
    )
    .bind(family.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(to_family_response(family, count)))
}

pub async fn get_family_members(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Path(family_id): Path<Uuid>,
) -> AppResult<Json<Vec<FamilyMemberResponse>>> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let is_member = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM family_members WHERE family_id = $1 AND user_id = $2",
    )
    .bind(family_id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    if is_member == 0 {
        return Err(AppError::Forbidden);
    }

    let members = sqlx::query_as::<
        _,
        (Uuid, String, String, Option<String>, Option<String>, String, chrono::DateTime<chrono::Utc>),
    >(
        r#"SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, fm.role, fm.joined_at
           FROM family_members fm
           JOIN users u ON fm.user_id = u.id
           WHERE fm.family_id = $1
           ORDER BY fm.joined_at ASC"#,
    )
    .bind(family_id)
    .fetch_all(&state.db)
    .await?;

    let result = members
        .into_iter()
        .map(|(user_id, email, username, display_name, avatar_url, role, joined_at)| {
            FamilyMemberResponse {
                user_id,
                email,
                username,
                display_name,
                avatar_url,
                role,
                joined_at,
            }
        })
        .collect();

    Ok(Json(result))
}

pub async fn leave_family(
    Extension(claims): Extension<Claims>,
    State(state): State<AppState>,
    Path(family_id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let family = sqlx::query_as::<_, Family>("SELECT * FROM families WHERE id = $1")
        .bind(family_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;

    if family.owner_id == user_id {
        return Err(AppError::ValidationError(
            "Owner cannot leave family. Transfer ownership or delete the family first.".to_string(),
        ));
    }

    sqlx::query("DELETE FROM family_members WHERE family_id = $1 AND user_id = $2")
        .bind(family_id)
        .bind(user_id)
        .execute(&state.db)
        .await?;

    Ok(Json(serde_json::json!({ "message": "Left family successfully" })))
}

fn to_family_response(f: Family, member_count: i64) -> FamilyResponse {
    FamilyResponse {
        id: f.id,
        name: f.name,
        description: f.description,
        owner_id: f.owner_id,
        invite_code: f.invite_code,
        member_count,
        created_at: f.created_at,
    }
}

fn generate_invite_code() -> String {
    // 使用 UUID v4 的前 8 位（大写），碰撞概率极低（16^8 = 4,294,967,296 种组合）
    // 数据库层已有 UNIQUE 约束兜底，INSERT 冲突时会返回 Conflict 错误
    Uuid::new_v4().to_string()[..8].to_uppercase().replace('-', "")
}
