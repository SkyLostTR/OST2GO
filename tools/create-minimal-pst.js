const fs = require('fs-extra');
const PstDatabaseWriter = require('./src/writer/PstDatabaseWriter');
const PstValidator = require('./src/validator/PstValidator');
const chalk = require('chalk');

/**
 * Create a minimal but VALID PST file
 * This creates the absolute minimum structure required for PST readers
 */
async function createMinimalValidPst(outputPath) {
  console.log(chalk.cyan('\n🔨 Creating Minimal Valid PST File...'));
  console.log('='.repeat(60));
  
  const writer = new PstDatabaseWriter();
  
  // Create required system nodes that we were missing
  console.log('📋 Creating required system nodes...');
  
  // 1. Message Store (NID 33/0x21)
  writer.createNode(33, 'messageStore', {
    0x35E0: 'Personal Folders',  // Display name
    0x3001: 'IPM',                // Display name
  });
  
  // 2. Name to ID Map (NID 97/0x61) - THIS WAS MISSING!
  console.log('  ✅ Creating NAME_TO_ID_MAP (node 97)');
  writer.createNode(97, 'nameToIdMap', {
    0x0001: 0x0000,  // Empty name to ID mapping for now
  });
  
  // 3. Root Folder (NID 290/0x122)
  writer.createNode(290, 'folder', {
    0x3001: 'Root',
    0x3600: 4,  // Container class
  });
  
  // 4. Inbox (NID 322/0x142)
  writer.createNode(322, 'folder', {
    0x3001: 'Inbox',
    0x3600: 4,
  });
  
  // Add a simple test message
  console.log('📧 Adding test message...');
  writer.addMessage(
    322, // Inbox
    'Test Message',
    'test@example.com',
    'This is a test message to verify PST validity.\n\nIf you can read this, the PST file structure is working!'
  );
  
  // Build and write
  console.log('🏗️  Building PST structure...');
  await writer.createPstFile(outputPath);
  
  console.log(chalk.green(`✅ Created: ${outputPath}`));
  
  // Validate
  console.log(chalk.yellow('\n🔍 Validating created PST...'));
  const validator = new PstValidator();
  const results = await validator.validate(outputPath);
  
  validator.displayReport();
  
  return results.isValid;
}

// Create the PST
createMinimalValidPst('minimal-valid.pst')
  .then(isValid => {
    if (isValid) {
      console.log(chalk.green('\n🎉 SUCCESS! Created a valid PST file: minimal-valid.pst'));
      console.log(chalk.cyan('You can now open this file in Outlook, XstReader, etc.'));
    } else {
      console.log(chalk.red('\n❌ PST is still invalid. Need more structural fixes.'));
    }
  })
  .catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    console.error(chalk.gray(error.stack));
  });
