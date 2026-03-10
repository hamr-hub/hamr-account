use axum::{
    middleware,
    routing::{get, post, put},
    Router,
};

use crate::{
    db::AppState,
    handlers::{auth, family, user},
    middleware::auth_middleware,
};

pub fn build_router(state: AppState) -> Router {
    let public = Router::new()
        .route("/api/v1/auth/register", post(auth::register))
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/refresh", post(auth::refresh_token));

    let protected = Router::new()
        .route("/api/v1/auth/logout", post(auth::logout))
        .route("/api/v1/auth/me", get(auth::me))
        .route(
            "/api/v1/users/profile",
            get(user::get_profile).put(user::update_profile),
        )
        .route("/api/v1/users/password", put(user::change_password))
        .route(
            "/api/v1/families",
            post(family::create_family).get(family::get_my_families),
        )
        .route("/api/v1/families/join", post(family::join_family))
        .route("/api/v1/families/:id/members", get(family::get_family_members))
        .route("/api/v1/families/:id/leave", post(family::leave_family))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    Router::new()
        .merge(public)
        .merge(protected)
        .with_state(state)
}
