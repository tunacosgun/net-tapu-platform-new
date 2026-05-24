-- Migration 050: Add video URL, embed code, and city-guide link fields for parcels
ALTER TABLE listings.parcels
  ADD COLUMN IF NOT EXISTS video_url    TEXT NULL,
  ADD COLUMN IF NOT EXISTS embed_code   TEXT NULL,
  ADD COLUMN IF NOT EXISTS guide_url    TEXT NULL;
