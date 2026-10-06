-- Polls schema for the real-time poll demo project

CREATE TABLE IF NOT EXISTS polls (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS poll_options (
  id        UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id   UUID      NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  label     TEXT      NOT NULL,
  position  SMALLINT  NOT NULL,
  UNIQUE (poll_id, position)
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options (poll_id);

CREATE TABLE IF NOT EXISTS poll_votes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id    UUID        NOT NULL REFERENCES poll_options (id) ON DELETE CASCADE,
  voter_fingerprint TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_option_id, voter_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes (poll_option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_fingerprint ON poll_votes (voter_fingerprint);
