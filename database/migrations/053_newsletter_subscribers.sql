-- Migration 053: Newsletter subscribers (e-bülten aboneleri)
CREATE TABLE IF NOT EXISTS crm.newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL,
  name        VARCHAR(200),
  source      VARCHAR(50)  NOT NULL DEFAULT 'footer',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique
  ON crm.newsletter_subscribers (LOWER(email));
