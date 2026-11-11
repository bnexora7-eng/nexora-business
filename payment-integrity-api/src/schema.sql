CREATE TABLE IF NOT EXISTS screened_events (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  amount NUMERIC(20,4) NOT NULL,
  currency CHAR(3) NOT NULL,
  event_status TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPT','REVIEW','REJECT')),
  reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, event_id)
);
CREATE TABLE IF NOT EXISTS screening_audit (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ACCEPT','REVIEW','REJECT')),
  reason TEXT NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  request_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS screening_audit_created_at_idx ON screening_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS screening_audit_provider_event_idx ON screening_audit (provider_id, event_id);