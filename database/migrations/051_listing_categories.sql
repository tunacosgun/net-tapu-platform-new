-- Migration 051: Hierarchical listing categories (sahibinden.com style tree)
CREATE TABLE IF NOT EXISTS listings.categories (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id    uuid NULL REFERENCES listings.categories(id) ON DELETE CASCADE,
  name         varchar(120) NOT NULL,
  slug         varchar(160) NOT NULL,
  description  text NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON listings.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON listings.categories(is_active, sort_order);

-- Link parcels to a category (optional)
ALTER TABLE listings.parcels
  ADD COLUMN IF NOT EXISTS category_id uuid NULL REFERENCES listings.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_parcels_category ON listings.parcels(category_id);

-- Seed a sensible starter tree (Emlak > Arsa/Tarla/Bağ/Bahçe/Konut/İşyeri)
INSERT INTO listings.categories (name, slug, sort_order)
VALUES ('Emlak', 'emlak', 0)
ON CONFLICT (parent_id, slug) DO NOTHING;

DO $$
DECLARE root_id uuid;
BEGIN
  SELECT id INTO root_id FROM listings.categories WHERE parent_id IS NULL AND slug = 'emlak';
  IF root_id IS NOT NULL THEN
    INSERT INTO listings.categories (parent_id, name, slug, sort_order) VALUES
      (root_id, 'Arsa',      'arsa',      1),
      (root_id, 'Tarla',     'tarla',     2),
      (root_id, 'Bağ',       'bag',       3),
      (root_id, 'Bahçe',     'bahce',     4),
      (root_id, 'Zeytinlik', 'zeytinlik', 5),
      (root_id, 'Konut',     'konut',     6),
      (root_id, 'İşyeri',    'isyeri',    7),
      (root_id, 'Devremülk', 'devremulk', 8)
    ON CONFLICT (parent_id, slug) DO NOTHING;
  END IF;
END$$;
