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

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions (user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expiry_idx ON app_sessions (expires_at);

CREATE TABLE IF NOT EXISTS own_payments (
  order_id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  mollie_payment_id TEXT UNIQUE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 1 AND amount <= 5000),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  description VARCHAR(100) NOT NULL,
  status TEXT NOT NULL,
  checkout_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS own_payments_user_created_idx ON own_payments (user_id, created_at DESC);
