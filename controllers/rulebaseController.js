const fs = require('fs');
const path = require('path');

// Load rulebase from JSON file
let rulebase = null;

function loadRulebase() {
  if (!rulebase) {
    try {
      const rulebasePath = path.join(__dirname, '../rulebase/cyp_rulebase.json');
      const data = fs.readFileSync(rulebasePath, 'utf8');
      rulebase = JSON.parse(data);
      console.log('✅ Rulebase loaded successfully');
    } catch (error) {
      console.error('❌ Error loading rulebase:', error.message);
      rulebase = {};
    }
  }
  return rulebase;
}

/**
 * Get prediction based on DNA type and allele values
 * @param {string} dnaType - CYP2D6, CYP2C19, or CYP2C9
 * @param {object} alleles - Object with allele values (e.g., { allele10: "C/C", allele4: "G/G", ... })
 * @returns {object} - { genotype, phenotype, activity_score, matched: boolean }
 */
function predictPhenotype(dnaType, alleles) {
  const rules = loadRulebase();
  
  if (!rules[dnaType]) {
    console.error(`❌ Unknown DNA type: ${dnaType}`);
    return {
      genotype: '-',
      phenotype: '-',
      activity_score: 0,
      matched: false,
      error: 'Unknown DNA type'
    };
  }

  const typeRules = rules[dnaType];
  
  // Try to find exact match in rules
  for (const rule of typeRules.rules) {
    let isMatch = true;
    
    // Check if all provided alleles match the rule
    for (const [key, value] of Object.entries(alleles)) {
      if (rule[key] && rule[key] !== value) {
        isMatch = false;
        break;
      }
    }
    
    if (isMatch) {
      return {
        genotype: rule.genotype,
        phenotype: rule.phenotype,
        activity_score: rule.activity_score,
        matched: true
      };
    }
  }
  
  // No match found, return default
  return {
    genotype: typeRules.default.genotype,
    phenotype: typeRules.default.phenotype,
    activity_score: typeRules.default.activity_score,
    matched: false,
    warning: 'No exact match found in rulebase, using default values'
  };
}

/**
 * Get available alleles for a DNA type
 * @param {string} dnaType - CYP2D6, CYP2C19, or CYP2C9
 * @returns {array} - Array of allele names
 */
function getAvailableAlleles(dnaType) {
  const rules = loadRulebase();
  
  if (!rules[dnaType]) {
    return [];
  }
  
  return rules[dnaType].alleles || [];
}

/**
 * Get all possible values for a specific allele
 * @param {string} dnaType - CYP2D6, CYP2C19, or CYP2C9
 * @param {string} alleleName - e.g., "*10", "*2", etc.
 * @returns {array} - Array of unique possible values
 */
function getAllelePossibleValues(dnaType, alleleName) {
  const rules = loadRulebase();
  
  if (!rules[dnaType]) {
    return [];
  }
  
  const alleleKey = 'allele' + alleleName.replace('*', '');
  const values = new Set();
  
  rules[dnaType].rules.forEach(rule => {
    if (rule[alleleKey]) {
      values.add(rule[alleleKey]);
    }
  });
  
  return Array.from(values);
}

/**
 * Get all supported DNA types
 * @returns {array} - Array of DNA type names
 */
function getSupportedDnaTypes() {
  const rules = loadRulebase();
  return Object.keys(rules);
}

/**
 * Get complete rulebase information
 * @returns {object} - Complete rulebase
 */
function getRulebase() {
  return loadRulebase();
}

module.exports = {
  predictPhenotype,
  getAvailableAlleles,
  getAllelePossibleValues,
  getSupportedDnaTypes,
  getRulebase
};
