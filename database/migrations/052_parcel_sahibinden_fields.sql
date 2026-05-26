-- Migration 052: Sahibinden-style detail fields + per-field hide toggles
-- Adds pafta/kaks/gabari/credit/seller type/trade fields plus a JSONB array of
-- field keys the admin chose to hide on the public detail page.

ALTER TABLE listings.parcels
  ADD COLUMN IF NOT EXISTS pafta_no        VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS kaks_emsal      VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS gabari          VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS credit_eligible BOOLEAN      NULL,
  ADD COLUMN IF NOT EXISTS seller_type     VARCHAR(50)  NULL DEFAULT 'sahibinden',
  ADD COLUMN IF NOT EXISTS trade_accepted  BOOLEAN      NULL,
  ADD COLUMN IF NOT EXISTS hidden_fields   JSONB        NOT NULL DEFAULT '[]'::jsonb;
