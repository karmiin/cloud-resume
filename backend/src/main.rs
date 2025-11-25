use axum::{
    routing::{get, post},
    Router, Json, extract::State,
};
use lambda_http::{run, Error};
use tower_http::cors::{Any, CorsLayer};
use std::sync::Arc;

struct AppState{

}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let shared_state = Arc::new(AppState{});

    let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);

    let app = Router::new()
        .route("/",get(root_handler))
        .route("/api/visitors", post(visitors_handler))
        .route("api/github",get(github_handler))
        .route("api/spotify",get(spotify_handler))
        .route("api/email", post(email_handler))
        .route("/api/blog", get(blog_handler))
        .layer(cors)
        .with_state(shared_state);

    run(app).await
}

async fn root_handler() -> &'static str {
    "Backend Rust Online!"
}

async fn visitors_handler() -> Json<serde_json::Value> {
    //prende da dynamo
    Json(serde_json::json!({"visitors": 10}))
}

async fn github_handler() -> Json<serde_json::Value> {

    let client = reqwest::Client::new();
    //username usa variaible di ambiente

    let username = "karmiin";


    let res = client
        .get(format!("https://api.github.com/users/{}/events/public", username))
        .header("User-Agent", "Rust-Lambda-Backend")
        .send()
        .await;

     match res {
        Ok(response) => {
            let events: Vec<serde_json::Value> = response.json().await.unwrap_or_default();
            let recent = events.into_iter().take(5).collect::<Vec<_>>();
            Json(serde_json::json!(recent))
        }
        Err(_) => Json(serde_json::json!({"error": "Impossibile contattare GitHub"})),
    }
}

async fn spotify_handler() -> Json<serde_json::Value> {
    //prende da spotify
    Json(serde_json::json!({"currently_playing": "Song Title", "artist": "Artist Name"}))
}

async fn email_handler() -> Json<serde_json::Value> {
    //invia email
    Json(serde_json::json!({"status": "Email sent successfully"}))
}

async fn blog_handler() -> Json<serde_json::Value> {
    //prende da dynamo
    Json(serde_json::json!({"posts": [{"title": "First Post", "date": "2024-01-01"}, {"title": "Second Post", "date": "2024-02-01"}]}))
}

