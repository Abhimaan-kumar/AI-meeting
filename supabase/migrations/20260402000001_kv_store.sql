-- Create kv_store table for edge functions (if not already exists)
-- This table is used by the Supabase Edge Functions for key-value storage

CREATE TABLE IF NOT EXISTS kv_store_af44c8dd (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE kv_store_af44c8dd ENABLE ROW LEVEL SECURITY;

-- Allow service role to access everything
CREATE POLICY "Service role can do anything"
  ON kv_store_af44c8dd FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON kv_store_af44c8dd TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON kv_store_af44c8dd TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_af44c8dd(key);
