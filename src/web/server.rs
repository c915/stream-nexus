use actix::{Actor, AsyncContext, Context, fut, Handler, Recipient};
use std::collections::HashMap;
use sqlx::SqlitePool;
use crate::db::add_super_chat;

use super::message;
use crate::exchange::ExchangeRates;

pub struct Connection {
    pub id: usize,
    pub recipient: Recipient<message::Reply>,
}

/// Define HTTP actor
pub struct ChatServer {
    pub clients: HashMap<usize, Connection>,
    pub exchange_rates: ExchangeRates,
    pub database: SqlitePool,
}

impl ChatServer {
    pub fn new(exchange_rates: ExchangeRates, database: SqlitePool) -> Self {
        log::info!("Chat actor starting up.");

        Self {
            clients: HashMap::new(),
            exchange_rates,
            database,
        }
    }
}

// conn.recipient.do_send(message::Reply(message.to_owned()));

/// Make actor from `ChatServer`
impl Actor for ChatServer {
    /// We are going to use simple Context, we just need ability to communicate with other actors.
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        ctx.set_mailbox_capacity(256);
    }
}

/// Handler for Connect message.
impl Handler<message::Connect> for ChatServer {
    type Result = usize;

    fn handle(&mut self, msg: message::Connect, _: &mut Context<Self>) -> Self::Result {
        log::debug!("New client connected to chat.");
        // random usize
        let id: usize = rand::random();
        self.clients.insert(
            id,
            Connection {
                id,
                recipient: msg.recipient,
            },
        );
        id
    }
}

/// Handler for Disconnect message.
impl Handler<message::Disconnect> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: message::Disconnect, _: &mut Context<Self>) {
        // Remove Client from HashMap.
        self.clients.remove(&msg.id);
    }
}

/// Handler for a new Chat Message from the browser.
impl Handler<message::Content> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: message::Content, ctx: &mut Context<Self>) -> Self::Result {
        log::debug!("[ChatServer] {}", msg.chat_message.to_console_msg());

        let usd = self
            .exchange_rates
            .get_usd(&msg.chat_message.currency, &msg.chat_message.amount);

        // Record super chats/premium chats to database
        // https://stackoverflow.com/a/64576921
        if msg.chat_message.is_premium {
            let database = self.database.clone();
            let message = msg.chat_message.clone();
            let fut = async move {
                match add_super_chat(&database, &message, usd).await {
                    Ok(id) => {
                        log::debug!("[Database] Added super chat {} to database.", id);
                    },
                    Err(e) => {
                        log::error!("[Database] Could not add super chat to database: {}", e);
                    }
                }
            };
            let fut = fut::wrap_future::<_, Self>(fut);
            ctx.spawn(fut);
        }

        let mut chat_msg = msg.chat_message;
        chat_msg.amount = usd;
        chat_msg.currency = "USD".to_string();

        // Send message to all clients.
        for (_, conn) in &self.clients {
            conn.recipient.do_send(message::Reply(chat_msg.to_json()));
        }
    }
}
