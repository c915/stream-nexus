-- Add up migration script here
BEGIN;

CREATE TABLE IF NOT EXISTS messages (
    received_at TIMESTAMPTZ NOT NULL,
    platform    TEXT NOT NULL,
    username    TEXT NOT NULL,
    message     TEXT,
    avatar      TEXT,
    is_premium  BOOLEAN NOT NULL,
    amount      DOUBLE PRECISION,
    currency    TEXT,
    is_verified BOOLEAN,
    is_sub      BOOLEAN,
    is_mod      BOOLEAN,
    is_owner    BOOLEAN,
    is_staff    BOOLEAN
);

SELECT create_hypertable('messages', 'received_at');

CREATE INDEX platform_idx ON public.messages (platform);

CREATE INDEX username_idx ON public.messages (username);

COMMIT;