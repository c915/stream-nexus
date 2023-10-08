use sqlx::SqlitePool;
use crate::message::Message;

pub struct SuperChat {
    id: i64,
    platform: String,
    username: String,
    message: Option<String>,
    received_at: i64,
    amount: f64,
    currency: String,
    usd_amount: f64,
}

pub(crate) async fn add_super_chat(pool: &SqlitePool, message: &Message, usd_amount: f64) -> anyhow::Result<i64> {
    let mut conn = pool.acquire().await?;

    let id = sqlx::query!(
        r#"
        INSERT INTO super_chats
        (platform, username, message, received_at, amount, currency, usd_amount)
        VALUES ( ?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#,
        message.platform,
        message.username,
        message.message,
        message.received_at,
        message.amount,
        message.currency,
        usd_amount
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
        r#"SELECT id, platform, username, message, received_at, amount, currency, usd_amount FROM super_chats;"#
    )
        .fetch_all(&mut *conn)
        .await?;

    Ok(super_chats)
}