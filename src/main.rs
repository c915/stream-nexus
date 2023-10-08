extern crate dotenvy;
extern crate reqwest;
extern crate serde;
extern crate serde_json;

mod exchange;
mod message;
mod web;
mod db;

use std::env;
use crate::web::ChatServer;

use actix::Actor;
use actix_web::{App, HttpServer};
use anyhow::Result;
use sqlx::SqlitePool;

#[actix_web::main]
async fn main() -> Result<(), std::io::Error> {
    dotenvy::dotenv().expect("Could not load .env file");
    env_logger::init();

    let db_url = env::var("DATABASE_URL").expect("'DATABASE_URL' must be set.");
    let db = SqlitePool::connect(&db_url).await
        .expect("Could not connect to database.");

    let chat = ChatServer::new(
        exchange::fetch_exchange_rates()
            .await
            .expect("Failed to fetch exchange rates."),
        db.clone(),
    )
    .start();
    let chat_for_server = chat.clone();

    HttpServer::new(move || {
        App::new()
            .app_data(chat_for_server.clone())
            .service(web::javascript)
            .service(web::stylesheet)
            .service(web::colors)
            .service(web::index)
            .service(web::websocket)
            .service(web::logo)
    })
    .workers(1)
    .bind(("127.0.0.1", 1350))
    .expect("Could not bind requested address.")
    .run()
    .await
}
