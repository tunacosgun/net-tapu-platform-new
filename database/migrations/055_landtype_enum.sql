-- Migration 055: Constrain parcels.land_type to a fixed slug enum.
-- Previously free-text varchar(100), which let listings be filed under
-- "trla" / "Tarla" / "tarla " etc. and fall out of filters. Normalize
-- existing rows (Turkish chars + casing), then add a CHECK constraint.

BEGIN;

-- 1) Normalize legacy values to ASCII slugs.
UPDATE listings.parcels SET land_type = lower(trim(land_type)) WHERE land_type IS NOT NULL;
UPDATE listings.parcels SET land_type = 'bag'    WHERE land_type IN ('bağ', 'bag');
UPDATE listings.parcels SET land_type = 'bahce'  WHERE land_type IN ('bahçe', 'bahce');
UPDATE listings.parcels SET land_type = 'diger'  WHERE land_type IN ('diğer', 'diger');
UPDATE listings.parcels SET land_type = 'imarli' WHERE land_type IN ('imarlı', 'imarli');
UPDATE listings.parcels SET land_type = 'imarsiz' WHERE land_type IN ('imarsız', 'imarsiz');

-- 2) Anything outside the allowed set → 'diger' (admin can re-categorize later).
UPDATE listings.parcels
   SET land_type = 'diger'
 WHERE land_type IS NOT NULL
   AND land_type NOT IN ('arsa','tarla','bag','bahce','zeytinlik','orman','mera','imarli','imarsiz','diger');

-- 3) Enforce going forward.
ALTER TABLE listings.parcels
  DROP CONSTRAINT IF EXISTS parcels_land_type_check;

ALTER TABLE listings.parcels
  ADD CONSTRAINT parcels_land_type_check
  CHECK (
    land_type IS NULL
    OR land_type IN ('arsa','tarla','bag','bahce','zeytinlik','orman','mera','imarli','imarsiz','diger')
  );

COMMIT;
