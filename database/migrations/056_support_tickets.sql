-- Migration 056: Support ticket / live chat system.
-- Users (or contact requests promoted by an admin) open a ticket; admins
-- and the user trade messages until the ticket is resolved. Optional file
-- attachments are stored on disk (reusing the parcel upload pattern) and
-- referenced by URL on the message row.

BEGIN;

CREATE TABLE IF NOT EXISTS crm.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  subject         VARCHAR(500) NOT NULL,
  -- open: awaiting first admin reply
  -- in_progress: under active conversation
  -- waiting_user: admin replied, waiting on user
  -- closed: resolved/archived
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','waiting_user','closed')),
  -- How the ticket entered the system. 'contact' / 'consultant_application'
  -- back-reference the originating crm.contact_requests row.
  source          VARCHAR(30) NOT NULL DEFAULT 'direct'
                  CHECK (source IN ('direct','contact','consultant_application','parcel_inquiry')),
  source_ref_id   UUID NULL,
  parcel_id       UUID NULL REFERENCES listings.parcels(id) ON DELETE SET NULL,
  assigned_to     UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Guest tickets (created via contact-request before user signed up) keep
  -- the original contact details on the ticket so admin can still reach out.
  guest_name      VARCHAR(255) NULL,
  guest_email     VARCHAR(255) NULL,
  guest_phone     VARCHAR(50)  NULL,
  unread_admin    INTEGER NOT NULL DEFAULT 0,
  unread_user     INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user      ON crm.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON crm.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned  ON crm.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_msg  ON crm.support_tickets(last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS crm.support_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id         UUID NOT NULL REFERENCES crm.support_tickets(id) ON DELETE CASCADE,
  sender_id         UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 'user' | 'admin' | 'system' | 'consultant'
  sender_role       VARCHAR(20) NOT NULL,
  body              TEXT NULL,
  attachment_url    TEXT NULL,
  attachment_type   VARCHAR(50)  NULL,
  attachment_name   VARCHAR(255) NULL,
  attachment_size   INTEGER      NULL,
  read_at           TIMESTAMPTZ  NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (body IS NOT NULL OR attachment_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket    ON crm.support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread    ON crm.support_messages(ticket_id) WHERE read_at IS NULL;

COMMIT;
