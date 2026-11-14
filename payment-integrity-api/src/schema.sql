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
  user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  mollie_payment_id TEXT UNIQUE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 1 AND amount <= 5000),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  description VARCHAR(100) NOT NULL,
  status TEXT NOT NULL,
  checkout_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE own_payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE own_payments DROP CONSTRAINT IF EXISTS own_payments_user_id_fkey;
ALTER TABLE own_payments
  ADD CONSTRAINT own_payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS own_payments_user_created_idx ON own_payments (user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS community_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  body VARCHAR(1000) NOT NULL CHECK (length(trim(body)) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_posts_created_idx ON community_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  category VARCHAR(40) NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0 AND price <= 1000000),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS marketplace_listings_created_idx ON marketplace_listings (status, created_at DESC);

CREATE TABLE IF NOT EXISTS business_workspaces (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  business_name VARCHAR(100) NOT NULL DEFAULT '',
  tagline VARCHAR(180) NOT NULL DEFAULT '',
  goals TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS mollie_customer_id TEXT UNIQUE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS mollie_subscription_id TEXT UNIQUE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS subscription_access_until TIMESTAMPTZ;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_subscription_status_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_subscription_status_check
  CHECK (subscription_status IN ('inactive','activation_pending','active','past_due','canceled'));

CREATE TABLE IF NOT EXISTS email_action_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_action_tokens_user_purpose_idx
  ON email_action_tokens (user_id, purpose, created_at DESC);
