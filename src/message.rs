use actix::prelude::Message as ActixMessage;
use askama::Template;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use uuid::Uuid;

#[derive(Template)]
#[template(path = "message.html")]
struct MessageTemplate<'a> {
    message: &'a Message,
}

#[derive(Serialize, Deserialize, Debug, ActixMessage)]
#[rtype(result = "()")]
pub struct Message {
    pub id: Uuid,
    pub platform: String,
    pub message: String,
    pub sent_at: i64,     // Display timestamp
    pub received_at: i64, // Our system received timestamp
    pub username: String,
    pub avatar: String, // URL
    // Superchat
    pub is_premium: bool,
    pub amount: f64,
    pub currency: String,
    // Display
    pub is_verified: bool,
    pub is_sub: bool,
    pub is_mod: bool,
    pub is_owner: bool,
    pub is_staff: bool,
}

#[derive(Debug, Serialize)]
struct JsonWrapper<'a> {
    #[serde(flatten)]
    message: &'a Message,
    html: String,
}

impl Default for Message {
    fn default() -> Self {
        let time = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64;

        Message {
            id: Uuid::new_v4(),
            platform: "NONE".to_string(),
            message: "DEFAULT_MESSAGE".to_string(),
            sent_at: time,
            received_at: time,
            username: "NO_USERNAME".to_string(),
            avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                .to_string(),
            is_premium: false,
            amount: 0.0,
            currency: "ZWL".to_string(),
            is_verified: false,
            is_sub: false,
            is_mod: false,
            is_owner: false,
            is_staff: false,
        }
    }
}

impl Message {
    pub fn get_badge_string(&self) -> String {
        let mut badges = Vec::new();
        if self.is_verified {
            badges.push("verified");
        }
        if self.is_sub {
            badges.push("sub");
        }
        if self.is_mod {
            badges.push("mod");
        }
        if self.is_owner {
            badges.push("owner");
        }
        if self.is_staff {
            badges.push("staff");
        }

        if badges.len() == 0 {
            return "".to_string();
        }

        format!("msg--b-{}", badges.join(" msg--b-"))
    }

    pub fn get_letter(&self) -> String {
        self.username.chars().next().unwrap().to_string()
    }

    pub fn get_paid_readable_amount(&self) -> String {
        if self.is_premium {
            format!("{} {}", format!("{:.2}", self.amount), self.currency)
        } else {
            String::new()
        }
    }

    pub fn get_paid_string(&self) -> String {
        if self.is_premium {
            format!(
                "msg--t msg--ta-{} msg--tc-{}",
                self.get_paid_tier(),
                self.currency
            )
        } else {
            String::new()
        }
    }

    pub fn get_paid_tier(&self) -> u8 {
        // https://support.google.com/youtube/answer/7277005?hl=en
        // Added some flexibility so people get what they pay for.
        if self.amount >= 99.0 {
            100
        } else if self.amount >= 49.0 {
            50
        } else if self.amount >= 19.0 {
            20
        } else if self.amount >= 9.0 {
            10
        } else if self.amount >= 4.75 {
            5
        } else if self.amount >= 1.9 {
            2
        } else {
            1
        }
    }

    pub fn get_platform_string(&self) -> String {
        format!("msg--p-{}", self.platform)
    }

    pub fn to_console_msg(&self) -> String {
        if self.is_premium {
            format!(
                "[{}] [${} {}] ({}): {}",
                self.platform, self.currency, self.amount, self.username, self.message
            )
        } else {
            format!("[{}] {}: {}", self.platform, self.username, self.message)
        }
    }

    pub fn to_html(&self) -> String {
        MessageTemplate { message: &self }
            .render()
            .expect("Failed to render chat message.")
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(&JsonWrapper {
            message: self,
            html: self.to_html(),
        })
        .expect("Failed to serialize chat message wrapper.")
    }
}
