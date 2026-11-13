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


-- Server-owned product catalogue and access grants.
CREATE TABLE IF NOT EXISTS product_catalog (
  product_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_eur NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (price_eur IS NULL OR price_eur >= 1)
);
INSERT INTO product_catalog (product_id,name,description,price_eur,currency,active)
VALUES ('payment-integrity','NEXORA Payment Integrity','Payment-event screening prototype with explainable ACCEPT, REVIEW and REJECT outcomes and duplicate-event awareness. Synthetic data only; no live bank or payment-provider integrations. ',NULL,'EUR',FALSE)
ON CONFLICT (product_id) DO NOTHING;

ALTER TABLE own_payments ADD COLUMN IF NOT EXISTS product_id TEXT
  REFERENCES product_catalog(product_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS own_payments_product_idx ON own_payments (product_id);

CREATE TABLE IF NOT EXISTS product_entitlements (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES product_catalog(product_id),
  order_id UUID NOT NULL UNIQUE REFERENCES own_payments(order_id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS product_entitlements_active_user_product_idx
  ON product_entitlements(user_id,product_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS product_entitlements_user_idx
  ON product_entitlements(user_id,granted_at DESC);
