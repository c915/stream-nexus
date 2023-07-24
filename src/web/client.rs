use actix::*;
use actix_web_actors::ws;
use std::time::Instant;

use super::message;
use super::ChatServer;
use super::CLIENT_TIMEOUT;
use super::HEARTBEAT_INTERVAL;

pub struct ChatClient {
    /// Connection ID
    pub id: usize,
    /// Chat server
    pub server: Addr<ChatServer>,
    /// Last Heartbeat
    /// Client must send ping at least once per 10 seconds (CLIENT_TIMEOUT), otherwise we drop connection.
    pub last_heartbeat_at: Instant,
    /// Last command (any) sent
    pub last_command_at: Instant,
}

impl ChatClient {
    /// helper method that sends ping to client every second.
    ///
    /// also this method checks heartbeats from client
    fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.last_heartbeat_at) > CLIENT_TIMEOUT {
                // heartbeat timed out

                // notify chat server
                act.send_or_reply(ctx, message::Disconnect { id: act.id });

                // stop actor
                ctx.stop();

                // don't try to send a ping
                return;
            }

            ctx.ping(b"");
        });
    }

    /// Try to send message
    ///
    /// This method fails if actor's mailbox is full or closed. This method
    /// register current task in receivers queue.
    fn send_or_reply<M>(&self, _: &mut ws::WebsocketContext<Self>, msg: M)
    where
        M: actix::Message + std::marker::Send + 'static,
        M::Result: Send,
        ChatServer: Handler<M>,
    {
        if let Err(err) = self.server.try_send(msg) {
            log::error!("Error sending message to server: {:?}", err);
        }
    }

    fn start_heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        // start heartbeat process on session start.
        self.heartbeat(ctx);

        // register self in chat server. `AsyncContext::wait` register
        // future within context, but context waits until this future resolves
        // before processing any other events.
        // HttpContext::state() is instance of WsConnectionState, state is shared
        // across all routes within application
        self.server
            .send(message::Connect {
                recipient: ctx.address().recipient(),
            })
            .into_actor(self)
            .then(|res, act, ctx| {
                match res {
                    Ok(res) => act.id = res,
                    Err(err) => {
                        // something is wrong with chat server
                        log::warn!("Failed to assign conection id: {:?}", err);
                        ctx.stop();
                    }
                }
                fut::ready(())
            })
            .wait(ctx);
    }
}

impl Actor for ChatClient {
    type Context = ws::WebsocketContext<Self>;

    /// Method is called on actor start.
    /// We register ws session with ChatServer
    fn started(&mut self, ctx: &mut Self::Context) {
        self.start_heartbeat(ctx);
    }

    fn stopping(&mut self, ctx: &mut Self::Context) -> Running {
        // notify chat server
        self.send_or_reply(ctx, message::Disconnect { id: self.id });
        Running::Stop
    }
}

/// Handle messages from chat server, we simply send it to peer websocket
impl Handler<message::Reply> for ChatClient {
    type Result = ();

    fn handle(&mut self, msg: message::Reply, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

/// WebSocket message handler
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for ChatClient {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };

        match msg {
            ws::Message::Ping(msg) => {
                self.last_heartbeat_at = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.last_heartbeat_at = Instant::now();
            }
            ws::Message::Text(text) => {
                let data_json = serde_json::from_str::<crate::message::Message>(&text.to_string());
                if let Err(err) = data_json {
                    log::error!("{err}");
                    log::error!("Failed to parse message: {text}");
                    return;
                }
                let msg = data_json.unwrap();
                self.server.do_send(message::Content { chat_message: msg });
            }
            ws::Message::Binary(_) => log::warn!("Unexpected ChatClient binary."),
            ws::Message::Close(reason) => {
                log::debug!("Client {} disconnecting with reason: {:?}", self.id, reason);
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Continuation(_) => {
                ctx.stop();
            }
            ws::Message::Nop => (),
        }
    }
}
