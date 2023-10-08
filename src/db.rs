use sqlx::SqlitePool;
use crate::message::Message;

pub(crate) async fn add_super_chat(pool: &SqlitePool, message: &Message, usd_amount: f64) -> anyhow::Result<i64> {
    let mut conn = pool.acquire().await?;

    let message_id = message.id.as_bytes().as_ref();
    let id = sqlx::query!(
        r#"
        INSERT INTO super_chats
        (id, platform, username, message, received_at, amount, currency, usd_amount)
        VALUES ( ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        message_id,
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