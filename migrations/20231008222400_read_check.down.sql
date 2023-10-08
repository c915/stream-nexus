-- Add down migration script here
ALTER TABLE super_chats DROP COLUMN read;
ALTER TABLE super_chats DROP COLUMN read_at;