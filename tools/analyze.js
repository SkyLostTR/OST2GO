#!/usr/bin/env node

const path = require('path');
const OstAnalyzer = require('./src/analyzer/OstAnalyzer');

async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node analyze.js <path-to-ost-file>');
    process.exit(1);
  }
  
  const ostPath = process.argv[2];
  const analyzer = new OstAnalyzer();
  
  try {
    console.log(`🔍 Analyzing OST file: ${ostPath}`);
    const results = await analyzer.analyzeOstFile(ostPath);
    analyzer.printAnalysis(results);
    
    // Save detailed results to JSON for further analysis
    const fs = require('fs-extra');
    await fs.writeJSON('./ost-analysis.json', results, { spaces: 2 });
    console.log('\n💾 Detailed analysis saved to ost-analysis.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

main();