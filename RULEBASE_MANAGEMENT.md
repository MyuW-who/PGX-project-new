# Rulebase Management System

## Overview
This system allows you to manage pharmacogenomics rulebase data by importing Excel files directly into Supabase database, making updates easier and more scalable.

## Setup Steps

### 1. Create Supabase Table
Run the SQL script in your Supabase SQL Editor:
```sql
-- File: rulebase/create_table.sql
```

This creates the `pgx_rulebase` table with the following structure:
- `id`: Primary key
- `dna_type`: DNA type name (CYP2D6, CYP2C19, etc.)
- `description`: Description of the rulebase
- `alleles`: JSON array of allele names
- `rules`: JSON array of prediction rules
- `default_rule`: Default prediction when no match found
- `created_at`, `updated_at`: Timestamps

### 2. Prepare Excel File

#### Excel File Format
Your Excel file should have **one sheet per DNA type** with the following structure:

**Example: CYP2D6 Sheet**
| *10 (100C>T) | *4 (1846G>A) | *41 (2988G>A) | *5 (del) | Genotype | Predicted Phenotype |
|--------------|--------------|---------------|----------|----------|---------------------|
| C/C          | G/G          | G/G           | Negative | *1/*1    | Normal Metabolizer  |
| C/C          | G/A          | G/G           | Negative | *1/*4 or | Intermediate Metabolizer |

**Requirements:**
- Sheet name = DNA Type (e.g., "CYP2D6", "CYP2C19", "VKORC1")
- Columns with allele names (e.g., "*10 (100C>T)", "*2", "*3C")
- Column with "Genotype" or "Haplotype"
- Column with "Phenotype" or "Likely Phenotype"
- Each row represents one prediction rule

### 3. Place Excel File
Save your Excel file in the `rulebase/` folder:
```
PGX-project-new/
  └── rulebase/
      ├── pgx_rulebase.xlsx  ← Your Excel file here
      ├── cyp_rulebase.json  (fallback)
      └── create_table.sql
```

### 4. Import to Supabase

#### Option A: Using UI
1. Navigate to Rulebase Management page in the app
2. Enter the Excel filename (e.g., `pgx_rulebase.xlsx`)
3. Click "Import to Supabase"
4. Click "Refresh Cache" to load new data

#### Option B: Using Code
```javascript
// In main process or via IPC
const { importExcelToSupabase } = require('./controllers/rulebaseImportController');

async function importData() {
  const result = await importExcelToSupabase('pgx_rulebase.xlsx');
  console.log(result);
}
```

## How It Works

### Data Flow
1. **Excel File** → Read by `rulebaseImportController.js`
2. **Parse Sheets** → Convert each sheet to JSON format
3. **Format Rules** → Transform to rulebase structure
4. **Upload** → Insert/update in Supabase `pgx_rulebase` table
5. **Cache** → Application loads from Supabase with 5-minute cache

### Automatic Fallback
The system automatically falls back to JSON file if Supabase is unavailable:
```
Supabase (primary) → JSON file (fallback)
```

### Caching System
- Rulebase data is cached for **5 minutes** in memory
- Reduces database queries
- Can be refreshed manually via "Refresh Cache" button

## Updating Rulebase

### When to Update
- Adding new DNA types (e.g., TPMT, CYP3A5)
- Correcting prediction rules
- Adding more genotype combinations
- Updating phenotype descriptions

### Update Process
1. **Edit Excel file** with updated data
2. **Save** to `rulebase/` folder
3. **Import** via Rulebase Management page
4. **Refresh Cache** in the application
5. **Verify** by testing predictions in verify_step2

### Update vs Insert
- If DNA type exists → **Updates** existing record
- If DNA type is new → **Inserts** new record
- All updates are timestamped (`updated_at`)

## Excel Column Mapping

The system automatically converts Excel column names to database format:

| Excel Column | Database Key | Example |
|--------------|--------------|---------|
| *10 (100C>T) | allele10 | C/C, C/T, T/T |
| *4 (1846G>A) | allele4 | G/G, G/A, A/A |
| *3C (719A>G) | allele3C | A/A, A/G, G/G |
| VKORC1 (1173C>T) | alleleVKORC1_1173 | C/C, C/T, T/T |
| Genotype | genotype | *1/*1, *1/*2 |
| Predicted Phenotype | phenotype | Normal Metabolizer |

## API Functions

### Import Functions
```javascript
// Import Excel to Supabase
importExcelToSupabase(excelFileName)

// Get rulebase from Supabase
getRulebaseFromSupabase(dnaType)  // dnaType optional
```

### Prediction Functions
```javascript
// Predict phenotype (now async)
await predictPhenotype(dnaType, alleles)

// Get available alleles
await getAvailableAlleles(dnaType)

// Refresh cache
await refreshRulebase()
```

### IPC Channels
```javascript
// From renderer process
window.electronAPI.importExcelToSupabase('file.xlsx')
window.electronAPI.refreshRulebase()
window.electronAPI.getRulebase()
```

## Troubleshooting

### Import Fails
- **Check Excel file exists** in `rulebase/` folder
- **Verify sheet names** match DNA types exactly
- **Check column headers** have allele markers (*10, *2, etc.)
- **Review console logs** for specific error messages

### No Predictions
- **Refresh cache** after importing new data
- **Check Supabase** table has data: `SELECT * FROM pgx_rulebase`
- **Verify** allele values match Excel exactly (case-sensitive)

### Cache Not Updating
- **Wait 5 minutes** for automatic refresh
- **Click Refresh Cache** button for immediate update
- **Restart application** to clear all caches

## Database Queries

### View All DNA Types
```sql
SELECT dna_type, description, jsonb_array_length(rules) as rule_count 
FROM pgx_rulebase;
```

### Get Specific Rulebase
```sql
SELECT * FROM pgx_rulebase WHERE dna_type = 'CYP2D6';
```

### Update Rules Manually
```sql
UPDATE pgx_rulebase 
SET rules = '[...]'::jsonb, updated_at = NOW() 
WHERE dna_type = 'CYP2D6';
```

## Benefits

✅ **Easy Updates**: Edit Excel, import, done
✅ **Version Control**: Database timestamps track changes
✅ **Centralized**: One database for all users
✅ **Scalable**: Add unlimited DNA types
✅ **Reliable**: Automatic fallback to JSON file
✅ **Fast**: 5-minute caching reduces queries

## Files Created/Modified

### New Files
- `controllers/rulebaseImportController.js` - Import logic
- `view/rulebase_management.html` - Admin UI
- `rulebase/create_table.sql` - Database schema
- `RULEBASE_MANAGEMENT.md` - This documentation

### Modified Files
- `controllers/rulebaseController.js` - Now loads from Supabase
- `main.js` - Added IPC handlers for import
- `preload.js` - Exposed import functions
- `package.json` - Added xlsx dependency

## Next Steps

1. ✅ Create Supabase table
2. ✅ Prepare Excel file with your data
3. ✅ Import Excel to Supabase
4. ✅ Test predictions in verify_step2
5. ✅ Update Excel as needed for corrections

---

**Note**: Keep the JSON file (`cyp_rulebase.json`) as backup in case Supabase is temporarily unavailable.
