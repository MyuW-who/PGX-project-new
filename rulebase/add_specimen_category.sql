-- Add category column to Specimen table
-- Categories: 
-- 1. SNP genotyping test
-- 2. HLA/Drug-related SCAR screening test
-- 3. Functional genomics test
-- 4. Drug/Gene-related toxicity test

ALTER TABLE "Specimen"
ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN "Specimen".category IS 'Test category from Rule base Excel file';
