-- Dealers table
CREATE TABLE IF NOT EXISTS crm.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  commission_rate DECIMAL(5,2) DEFAULT 2.5,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealers_status ON crm.dealers(status);
CREATE INDEX IF NOT EXISTS idx_dealers_user_id ON crm.dealers(user_id);
