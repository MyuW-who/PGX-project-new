# Rulebase Management System - Quick Start

## 🚀 What's New?

Your PGx application now supports **Excel-to-Supabase rulebase management**! Update pharmacogenomics rules by simply editing an Excel file and importing it.

## ⚡ Quick Setup (3 Steps)

### Step 1: Create Database Table
Open Supabase SQL Editor and run:
```bash
# File location: rulebase/create_table.sql
```

### Step 2: Prepare Excel File
Create Excel file with sheets named after DNA types:
- Sheet "CYP2D6" → CYP2D6 rules
- Sheet "CYP2C19" → CYP2C19 rules
- Sheet "VKORC1" → VKORC1 rules
- etc.

Save as: `rulebase/pgx_rulebase.xlsx`

### Step 3: Import Data
1. Run the app: `npm start`
2. Navigate to: **Rulebase Management** page
3. Enter filename: `pgx_rulebase.xlsx`
4. Click: **Import to Supabase**
5. Click: **Refresh Cache**

## 📊 Excel Format Example

**Sheet Name: CYP2D6**
```
| *10 | *4  | *41 | *5       | Genotype | Phenotype              |
|-----|-----|-----|----------|----------|------------------------|
| C/C | G/G | G/G | Negative | *1/*1    | Normal Metabolizer     |
| C/T | G/G | G/G | Negative | *1/*10   | Normal Metabolizer     |
| C/C | G/A | G/G | Negative | *1/*4    | Intermediate Metabolizer|
```

## 🔄 How to Update Rules

1. **Edit** Excel file → Update rows/add new combinations
2. **Save** Excel file
3. **Import** via Rulebase Management page
4. **Refresh** cache
5. **Test** predictions in verify_step2

## 📁 New Files

| File | Purpose |
|------|---------|
| `controllers/rulebaseImportController.js` | Excel import logic |
| `view/rulebase_management.html` | Admin import UI |
| `rulebase/create_table.sql` | Database schema |
| `RULEBASE_MANAGEMENT.md` | Full documentation |

## 🎯 Benefits

- ✅ Edit rules in Excel (familiar interface)
- ✅ No manual JSON editing
- ✅ Centralized database storage
- ✅ Easy updates for non-developers
- ✅ Automatic fallback to JSON file
- ✅ Version tracking with timestamps

## 🔧 Access Rulebase Management

Add a button in your admin page:
```html
<button onclick="window.electronAPI.navigate('rulebase_management')">
  📊 Manage Rulebase
</button>
```

## 📝 Important Notes

- **Backup**: Keep `cyp_rulebase.json` as fallback
- **Cache**: Data is cached for 5 minutes (refresh manually if needed)
- **Sheet Names**: Must match DNA types exactly (CYP2D6, not cyp2d6)
- **Columns**: Must include allele columns + Genotype + Phenotype

## 🆘 Troubleshooting

**Import fails?**
- Check Excel file is in `rulebase/` folder
- Verify sheet names match DNA types
- Check column headers have allele markers

**No predictions?**
- Click "Refresh Cache" after import
- Check Supabase table: `SELECT * FROM pgx_rulebase`
- Verify allele values match exactly

**Cache not updating?**
- Wait 5 minutes OR
- Click "Refresh Cache" button OR
- Restart application

## 📚 Full Documentation

See `RULEBASE_MANAGEMENT.md` for complete details.

---

**Ready to use!** The system automatically switches between Supabase (primary) and JSON (fallback).
