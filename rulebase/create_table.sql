-- Create pgx_rulebase table to store pharmacogenomics rules
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pgx_rulebase (
  id BIGSERIAL PRIMARY KEY,
  dna_type VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  alleles JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_rule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pgx_rulebase_dna_type ON pgx_rulebase(dna_type);

-- Add comment
COMMENT ON TABLE pgx_rulebase IS 'Stores pharmacogenomics rulebase data for DNA type predictions';

-- Enable RLS (Row Level Security)
ALTER TABLE pgx_rulebase ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on pgx_rulebase" 
ON pgx_rulebase 
FOR ALL 
USING (true) 
WITH CHECK (true);
