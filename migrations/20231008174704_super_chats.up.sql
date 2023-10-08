-- Add up migration script here
CREATE TABLE IF NOT EXISTS super_chats
(
    id INTEGER PRIMARY KEY NOT NULL,
    platform TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT,
    received_at INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    usd_amount REAL NOT NULL
);