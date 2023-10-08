-- Add up migration script here
ALTER TABLE super_chats
    ADD COLUMN read INTEGER NOT NULL DEFAULT FALSE;
ALTER TABLE super_chats
    ADD COLUMN read_at INTEGER;