use std::time::SystemTime;
use serde::Serialize;
use sqlx::SqlitePool;
use crate::message::Message;

#[derive(Debug, Serialize)]
pub struct SuperChat {
    id: i64,
    platform: String,
    username: String,
    message: Option<String>,
    received_at: i64,
    amount: f64,
    currency: String,
    usd_amount: f64,
    read: i64,
    read_at: Option<i64>,
}

pub(crate) async fn add_super_chat(pool: &SqlitePool, message: &Message, usd_amount: f64) -> anyhow::Result<i64> {
    let mut conn = pool.acquire().await?;

    let id = sqlx::query!(
        r#"
        INSERT INTO super_chats
        (platform, username, message, received_at, amount, currency, usd_amount, read, read_at)
        VALUES ( ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        message.platform,
        message.username,
        message.message,
        message.received_at,
        message.amount,
        message.currency,
        usd_amount,
        false,
        None::<i64>,
    )
    .execute(&mut *conn)
    .await?
    .last_insert_rowid();

    Ok(id)
}

pub(crate) async fn get_super_chats(pool: &SqlitePool) -> anyhow::Result<Vec<SuperChat>> {
    let mut conn = pool.acquire().await?;

    let super_chats: Vec<SuperChat> = sqlx::query_as!(
        SuperChat,
        r#"SELECT id, platform, username, message, received_at, amount, currency, usd_amount, read, read_at FROM super_chats;"#
    )
    .fetch_all(&mut *conn)
    .await?;

    Ok(super_chats)
}

pub(crate) async fn get_unread_super_chats(pool: &SqlitePool) -> anyhow::Result<Vec<SuperChat>> {
    let mut conn = pool.acquire().await?;

    let super_chats: Vec<SuperChat> = sqlx::query_as!(
        SuperChat,
        r#"SELECT id, platform, username, message, received_at, amount, currency, usd_amount, read, read_at
            FROM super_chats
            WHERE read = 0;"#
    )
    .fetch_all(&mut *conn)
    .await?;

    Ok(super_chats)
}

pub(crate) async fn get_read_super_chats(pool: &SqlitePool) -> anyhow::Result<Vec<SuperChat>> {
    let mut conn = pool.acquire().await?;

    let super_chats: Vec<SuperChat> = sqlx::query_as!(
        SuperChat,
        r#"SELECT id, platform, username, message, received_at, amount, currency, usd_amount, read, read_at
            FROM super_chats
            WHERE read = 1;"#
    )
    .fetch_all(&mut *conn)
    .await?;

    Ok(super_chats)
}

pub(crate) async fn set_read_super_chat(pool: &SqlitePool, id: i64) -> anyhow::Result<u64> {
    let mut conn = pool.acquire().await?;

    let time = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    let rows_affected = sqlx::query!(
        r#"UPDATE super_chats SET read = TRUE, read_at = ?1 WHERE id = ?2"#,
        time,
        id
    )
    .execute(&mut *conn)
    .await?
    .rows_affected();

    Ok(rows_affected)
}

pub(crate) async fn set_unread_super_chat(pool: &SqlitePool, id: i64) -> anyhow::Result<u64> {
    let mut conn = pool.acquire().await?;

    let rows_affected = sqlx::query!(
        r#"UPDATE super_chats SET read = FALSE, read_at = NULL WHERE id = ?1"#,
        id
    )
        .execute(&mut *conn)
        .await?
        .rows_affected();

    Ok(rows_affected)
}