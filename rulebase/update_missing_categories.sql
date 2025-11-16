-- Manually update the remaining specimens that had duplicate key errors

-- Update specimens without category to their correct categories
UPDATE "Specimen" SET category = 'SNP genotyping test' WHERE "Specimen_Name" = 'PGx for CYP2E1';
UPDATE "Specimen" SET category = 'HLA/Drug-related SCAR screening test' WHERE "Specimen_Name" = 'PGx for HLA-B*57:01 อัลลีล' AND category IS NULL;
UPDATE "Specimen" SET category = 'Functional genomics test' WHERE "Specimen_Name" = 'Tamoxifen (Functional)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Functional genomics test' WHERE "Specimen_Name" = 'G-MP Metabolites' AND category IS NULL;
UPDATE "Specimen" SET category = 'Functional genomics test' WHERE "Specimen_Name" = 'Nifedipine (Functional)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Aripiprazole (CYP2D6)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Carvedilol (CYP2D6)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Citalopram (CYP2D6)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Clopidogrel (CYP2C19)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Warfarin* (CYP2C9/VKORC1)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Escitalopram (CYP2D6)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Haloperidol (CYP2D6)' AND category IS NULL;
UPDATE "Specimen" SET category = 'Drug/Gene-related toxicity test' WHERE "Specimen_Name" = 'PGx for Tramipramine (CYP2D6)' AND category IS NULL;

-- Verify updates
SELECT "Specimen_Name", category FROM "Specimen" WHERE category IS NULL ORDER BY "Specimen_Name";
