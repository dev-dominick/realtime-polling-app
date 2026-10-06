-- Add IP-based fingerprint to poll_votes for anti-stuffing hardening.
-- Cookie-based voter_fingerprint alone can be bypassed by clearing cookies.

ALTER TABLE poll_votes ADD COLUMN IF NOT EXISTS ip_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_poll_votes_ip_fingerprint ON poll_votes (ip_fingerprint);
