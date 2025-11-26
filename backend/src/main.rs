use aws_sdk_dynamodb::types::AttributeValue;
use axum::{
    routing::{get, post},
    Router, Json, extract::State,
};
use aws_config::BehaviorVersion;
use lambda_http::{run, Error};
use tower_http::cors::{Any, CorsLayer};
use std::sync::Arc;
use serde::Deserialize;
use std::env;
struct AppState{
    dynamo_client: aws_sdk_dynamodb::Client,
    http_client: reqwest::Client,
}



#[tokio::main]
async fn main() -> Result<(), Error> {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let dynamo_client  = aws_sdk_dynamodb::Client::new(&config);
    let http_client = reqwest::Client::new();
    let shared_state = Arc::new(AppState{
        dynamo_client,
        http_client,
    });

    //let cors = CorsLayer::new()
    //.allow_origin(Any)
    //.allow_methods(Any)
    //.allow_headers(Any);

    let app = Router::new()
        .route("/",get(root_handler))
        .route("/api/visitors", post(visitors_handler))
        .route("/api/github",get(github_handler))
        .route("/api/spotify",get(spotify_handler))
        .route("/api/email", post(email_handler))
        .route("/api/blog", get(blog_handler))
        //.layer(cors)
        .with_state(shared_state);

    run(app).await
}

async fn root_handler() -> &'static str {
    "Backend Rust Online!"
}

async fn visitors_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    //prende da dynamo
    let client = &state.dynamo_client;

    let res = client
    .update_item()
    .table_name("VisitorCount")
    .key("id", AttributeValue::S("count".to_string()))
    .update_expression("ADD visits :incr")
    .expression_attribute_values(":incr", AttributeValue::N("1".to_string()))
    .return_values(aws_sdk_dynamodb::types::ReturnValue::UpdatedNew)
    .send()
    .await;

    match res {
        Ok(output) => {
            let attributes = output.attributes.unwrap_or_default();
            let val = attributes.get("visits").unwrap();
            let count = val.as_n().unwrap_or(&"0".to_string()).to_string();
            Json(serde_json::json!({"visitors": count}))
        }
        
        Err(_) => Json(serde_json::json!({"error": "DB Error", "visitors": 0})),
    }
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
            let recent: Vec<serde_json::Value> = events.into_iter().take(5)
                .map(|event| {
                    let actor = event["actor"]["login"].as_str().unwrap_or_default();
                    let repo = event["repo"]["name"].as_str().unwrap_or_default();
                    let event_type = event["type"].as_str().unwrap_or_default();
                
                let message = if event_type == "PushEvent" {
                    event["payload"]["commits"]
                    .get(0)
                    .and_then(|c| c["message"].as_str())
                    .unwrap_or("Pushed updates")
                    .to_string()
                }else{
                    event_type.replace("Event", "")
                };
                serde_json::json!({
                    "actor": actor,
                    "repo": repo,
                    "event_type": event_type,
                    "message": message
                })
                })
                .collect();
            Json(serde_json::json!(recent))
            
        }
        Err(_) => Json(serde_json::json!({"error": "Impossibile contattare GitHub"})),
    }
}


#[derive(Deserialize)]
struct SpotifyToken{access_token: String}
#[derive(Deserialize)]
struct SpResponse{item: Option<SpItem>, is_playing: bool}
#[derive(Deserialize)]
struct SpItem{name: String, artists: Vec<SpArtist>, external_urls: SpUrl, album: SpAlbum}
#[derive(Deserialize)]
struct SpArtist{name: String}
#[derive(Deserialize)]
struct SpUrl{spotify: String}
#[derive(Deserialize)]
struct SpAlbum{images: Vec<SpImage>}
#[derive(Deserialize)]
struct SpImage{url: String}

async fn spotify_handler(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    let client_id = env::var("SPOTIFY_CLIENT_ID").unwrap_or_default();
    let client_secret = env::var("SPOTIFY_CLIENT_SECRET").unwrap_or_default();
    let refresh_token = env::var("SPOTIFY_REFRESH_TOKEN").unwrap_or_default();

    if client_id.is_empty() || client_secret.is_empty() || refresh_token.is_empty() {
        return Json(serde_json::json!({"error": "Credenziali Spotify mancanti"}));
    }

    let params = [
        ("grant_type", "refresh_token"),
        ("refresh_token", &refresh_token),
        ("client_id", &client_id),
        ("client_secret", &client_secret),
    ];

    let token_res = state.http_client.post("https://accounts.spotify.com/api/token")
        .form(&params)
        .send()
        .await;

    if let Ok(res) = token_res {
        if let Ok(token_data) = res.json::<SpotifyToken>().await {
            let access_token = token_data.access_token;

            let player_res = state.http_client.get("https://api.spotify.com/v1/me/player/currently-playing")
                .header("Authorization", format!("Bearer {}", access_token))
                .send()
                .await;
            if let Ok(resp) = player_res {
                if resp.status() == 204{
                    return Json(serde_json::json!({"is_playing": false}));
                }
                let data: SpResponse = resp.json().await.unwrap_or(SpResponse{item: None, is_playing: false});
            
                if let Some(track) = data.item{
                    return Json(serde_json::json!({
                        "is_playing": true,
                        "title": track.name,
                        "artist": track.artists.get(0).map_or("Unknown", |a| a.name.as_str()),
                        "url": track.external_urls.spotify,
                        "album_art": track.album.images.get(0).map_or("", |img| img.url.as_str())
                    }));
                }
            }
        }
    }
    Json(serde_json::json!({"is_playing": false}))
}

async fn email_handler() -> Json<serde_json::Value> {
    //invia email
    Json(serde_json::json!({"status": "Email sent successfully"}))
}

async fn blog_handler() -> Json<serde_json::Value> {
   
    Json(serde_json::json!({"posts": [{"title": "First Post", "date": "2024-01-01"}, {"title": "Second Post", "date": "2024-02-01"}]}))
}

