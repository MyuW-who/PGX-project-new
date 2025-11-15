/**
 * One-time script to import existing JSON rulebase to Supabase
 * Run this with: node scripts/importJsonToSupabase.js
 */

// Load environment variables from parent directory
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');

async function importJsonToSupabase() {
  try {
    console.log('📖 Reading JSON rulebase file...');
    
    // Read the existing JSON file
    const jsonPath = path.join(__dirname, '../rulebase/cyp_rulebase.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const rulebase = JSON.parse(jsonData);
    
    console.log('✅ JSON loaded. Found DNA types:', Object.keys(rulebase).join(', '));
    
    // Import each DNA type
    for (const [dnaType, typeData] of Object.entries(rulebase)) {
      console.log(`\n📤 Importing ${dnaType}...`);
      
      const record = {
        dna_type: dnaType,
        description: typeData.description || `${dnaType} Pharmacogenomics Rules`,
        alleles: typeData.alleles || [],
        rules: typeData.rules || [],
        default_rule: typeData.default || typeData.default_rule || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Check if already exists
      const { data: existing } = await supabase
        .from('pgx_rulebase')
        .select('id')
        .eq('dna_type', dnaType)
        .single();
      
      if (existing) {
        console.log(`   ⚠️  ${dnaType} already exists, updating...`);
        
        // Update existing record
        const { data: updated, error: updateError } = await supabase
          .from('pgx_rulebase')
          .update({
            description: record.description,
            alleles: record.alleles,
            rules: record.rules,
            default_rule: record.default_rule,
            updated_at: record.updated_at
          })
          .eq('dna_type', dnaType)
          .select();
        
        if (updateError) {
          console.error(`   ❌ Failed to update ${dnaType}:`, updateError.message);
        } else {
          console.log(`   ✅ ${dnaType} updated successfully! (${record.rules.length} rules)`);
        }
        continue;
      }
      
      // Insert new record
      const { data, error } = await supabase
        .from('pgx_rulebase')
        .insert([record])
        .select();
      
      if (error) {
        console.error(`   ❌ Failed to import ${dnaType}:`, error.message);
      } else {
        console.log(`   ✅ ${dnaType} imported successfully! (${record.rules.length} rules)`);
      }
    }
    
    console.log('\n🎉 Import completed!');
    console.log('\n📊 Verifying data in Supabase...');
    
    // Verify
    const { data: allRecords, error: verifyError } = await supabase
      .from('pgx_rulebase')
      .select('dna_type, description, rules');
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('\n✅ Records in database:');
      allRecords.forEach(record => {
        console.log(`   - ${record.dna_type}: ${record.rules.length} rules`);
      });
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  }
}

// Run the import
importJsonToSupabase()
  .then(() => {
    console.log('\n✅ Script finished. You can now start your app!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
