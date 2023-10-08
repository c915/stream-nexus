use actix_web::{Error, HttpResponse, web};
use sqlx::{Pool, Sqlite};
use crate::db;

pub fn api_resources() -> actix_web::Scope {
    web::scope("/api")
        .service(get_super_chats)
        .service(get_read_super_chats)
        .service(get_unread_super_chats)
        .service(set_read_super_chat)
        .service(set_unread_super_chat)
}

#[actix_web::get("/super_chats")]
async fn get_super_chats(pool: web::Data<Pool<Sqlite>>) -> Result<HttpResponse, Error> {
    let pool = pool.into_inner();
    let super_chats = db::get_super_chats(&pool).await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Could not retrieve super chats."))?;

    Ok(HttpResponse::Ok().json(super_chats))
}

#[actix_web::get("/super_chats/read")]
async fn get_read_super_chats(pool: web::Data<Pool<Sqlite>>) -> Result<HttpResponse, Error> {
    let pool = pool.into_inner();
    let super_chats = db::get_read_super_chats(&pool).await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Could not retrieve read super chats."))?;

    Ok(HttpResponse::Ok().json(super_chats))
}

#[actix_web::get("/super_chats/unread")]
async fn get_unread_super_chats(pool: web::Data<Pool<Sqlite>>) -> Result<HttpResponse, Error> {
    let pool = pool.into_inner();
    let super_chats = db::get_unread_super_chats(&pool).await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Could not retrieve unread super chats."))?;

    Ok(HttpResponse::Ok().json(super_chats))
}

#[actix_web::patch("/super_chats/read/{id}")]
async fn set_read_super_chat(pool: web::Data<Pool<Sqlite>>, id: web::Path<i64>) -> Result<HttpResponse, Error> {
    let pool = pool.into_inner();
    let id = id.into_inner();
    let _rows_affected = db::set_read_super_chat(&pool, id).await
        .map_err(|_| actix_web::error::ErrorInternalServerError(format!("Could not set super chat {} as read.", id)))?;

    Ok(HttpResponse::Ok().finish())
}

#[actix_web::patch("/super_chats/unread/{id}")]
async fn set_unread_super_chat(pool: web::Data<Pool<Sqlite>>, id: web::Path<i64>) -> Result<HttpResponse, Error> {
    let pool = pool.into_inner();
    let id = id.into_inner();
    let _rows_affected = db::set_unread_super_chat(&pool, id).await
        .map_err(|_| actix_web::error::ErrorInternalServerError(format!("Could not set super chat {} as unread.", id)))?;

    Ok(HttpResponse::Ok().finish())
}