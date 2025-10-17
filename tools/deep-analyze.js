#!/usr/bin/env node

const OstFormatParser = require('./src/parser/OstFormatParser');

async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node deep-analyze.js <path-to-ost-file>');
    process.exit(1);
  }
  
  const ostPath = process.argv[2];
  const parser = new OstFormatParser();
  
  try {
    console.log(`🔍 Deep analysis of OST file: ${ostPath}`);
    console.log('==========================================');
    
    // Parse header with correct format detection
    const header = await parser.parseHeader(ostPath);
    
    console.log('\n📄 Header Analysis:');
    console.log(`  Format: ${header.format}`);
    console.log(`  Version: ${header.version} (0x${header.version.toString(16)})`);
    console.log(`  File Size (claimed): ${typeof header.totalSize === 'number' ? 
      (header.totalSize / 1024 / 1024).toFixed(2) + ' MB' : 
      header.totalSize}`);
    console.log(`  NBT Offset: ${header.nbtOffset}`);
    console.log(`  NBT Size: ${header.nbtSize}`);
    console.log(`  BBT Offset: ${header.bbtOffset}`);
    console.log(`  BBT Size: ${header.bbtSize}`);
    
    // Scan for actual data patterns
    const patterns = await parser.findDataPatterns(ostPath);
    
    if (patterns.length > 0) {
      console.log('\n🎯 Discovered B-tree Patterns:');
      patterns.slice(0, 10).forEach((pattern, idx) => {
        console.log(`  ${idx + 1}. Offset: ${pattern.offset}, Type: ${pattern.type}, Sig: ${pattern.signature}`);
      });
    }
    
    // Sample email data
    const emailSamples = await parser.sampleEmailData(ostPath, patterns);
    
    if (emailSamples.length > 0) {
      console.log('\n📧 Email Data Samples Found:');
      emailSamples.forEach((sample, idx) => {
        console.log(`\n  Sample ${idx + 1} (offset ${sample.offset}, score ${sample.score}):`);
        console.log(`  Matches: ${sample.matches.join(', ')}`);
        console.log(`  Preview: "${sample.preview}"`);
      });
    }
    
    console.log('\n✅ Deep analysis completed!');
    
  } catch (error) {
    console.error('❌ Deep analysis failed:', error.message);
    process.exit(1);
  }
}

main();