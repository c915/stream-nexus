extern crate dotenvy;

mod message;
mod web;

use actix::Actor;
use actix_web::{App, HttpServer};

use crate::web::ChatServer;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().expect("Could not load .env file");
    env_logger::init();

    let server_addr = std::env::var("SERVER_ADDR").expect("'SERVER_ADDR' must be set.");
    let server_port = std::env::var("SERVER_PORT")
        .expect("'SERVER_PORT' must be set.")
        .parse::<u16>()
        .expect("'SERVER_PORT' is not a valid port.");

    let chat = ChatServer::new().start();
    let chat_for_server = chat.clone();

    let server = HttpServer::new(move || {
        App::new()
            .app_data(chat_for_server.clone())
            .service(web::javascript)
            .service(web::stylesheet)
            .service(web::index)
            .service(web::websocket)
            .service(web::logo)
    })
    .workers(1)
    .bind((server_addr.as_ref(), server_port))
    .expect("Could not bind requested address.")
    .run();

    log::info!("Server running at http://{server_addr}:{server_port}/");

    server.await
}
