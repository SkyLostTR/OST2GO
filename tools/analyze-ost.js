const { PSTFile, PSTMessage } = require('pst-extractor');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * PRAGMATIC APPROACH:
 * Since we can't create a valid PST from scratch easily,
 * let's try to read the OST with pst-extractor and extract emails,
 * then suggest using Outlook or a commercial tool for the actual PST creation.
 */

async function analyzeOstWithExtractor(ostPath) {
  console.log(chalk.cyan('\n🔍 Analyzing OST file with pst-extractor...'));
  console.log('='.repeat(60));
  
  try {
    // Try to open the OST file (OST and PST have similar structures)
    console.log(`📁 Opening: ${ostPath}`);
    const pstFile = new PSTFile(ostPath);
    
    console.log(chalk.green('✅ File opened successfully!'));
    
    // Get message store
    const messageStore = pstFile.getMessageStore();
    console.log(chalk.green('✅ Message store accessible'));
    
    // Get root folder
    const rootFolder = pstFile.getRootFolder();
    console.log(chalk.green(`✅ Root folder: ${rootFolder.displayName}`));
    
    // Count folders and messages
    let folderCount = 0;
    let messageCount = 0;
    
    function countFolder(folder, depth = 0) {
      folderCount++;
      const indent = '  '.repeat(depth);
      console.log(`${indent}📁 ${folder.displayName} (${folder.contentCount} messages)`);
      messageCount += folder.contentCount;
      
      if (folder.hasSubfolders) {
        const subfolders = folder.getSubFolders();
        for (const subfolder of subfolders) {
          countFolder(subfolder, depth + 1);
        }
      }
    }
    
    console.log(chalk.yellow('\n📂 Folder Structure:'));
    countFolder(rootFolder);
    
    console.log(chalk.cyan(`\n📊 Total Folders: ${folderCount}`));
    console.log(chalk.cyan(`📊 Total Messages: ${messageCount}`));
    
    // Try to extract a few messages
    console.log(chalk.yellow('\n📧 Sample Messages:'));
    let extracted = 0;
    
    function extractMessages(folder, max = 5) {
      if (extracted >= max) return;
      
      if (folder.contentCount > 0) {
        let msg = folder.getNextChild();
        while (msg && extracted < max) {
          try {
            console.log(`  ${extracted + 1}. "${msg.subject || 'No Subject'}" from ${msg.senderName || msg.senderEmailAddress || 'Unknown'}`);
            extracted++;
          } catch (e) {
            // Skip
          }
          msg = folder.getNextChild();
        }
      }
      
      if (extracted < max && folder.hasSubfolders) {
        const subfolders = folder.getSubFolders();
        for (const subfolder of subfolders) {
          extractMessages(subfolder, max);
          if (extracted >= max) break;
        }
      }
    }
    
    extractMessages(rootFolder);
    
    return true;
    
  } catch (error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}`));
    console.log(chalk.yellow('\nThis OST file may have Exchange-specific encryption or structures.'));
    return false;
  }
}

// Try to analyze the OST
analyzeOstWithExtractor('your-ost-file.ost')
  .then(success => {
    if (success) {
      console.log(chalk.green('\n✅ OST file is readable!'));
      console.log(chalk.yellow('\n💡 RECOMMENDATION:'));
      console.log(chalk.cyan('Since the OST is readable, you have these options:\n'));
      console.log(chalk.white('1. Use Microsoft Outlook (BEST):'));
      console.log(chalk.gray('   File → Open & Export → Import/Export → Export to PST\n'));
      console.log(chalk.white('2. Use commercial tools:'));
      console.log(chalk.gray('   - Stellar OST to PST Converter'));
      console.log(chalk.gray('   - Kernel for OST to PST'));
      console.log(chalk.gray('   - SysTools OST Converter\n'));
      console.log(chalk.white('3. Use our converter for partial extraction:'));
      console.log(chalk.gray('   node src/index.js convert -i your-ost-file.ost -o output.pst --real --max-emails 50'));
    } else {
      console.log(chalk.yellow('\n💡 The OST file has Exchange-specific structures.'));
      console.log(chalk.cyan('You MUST use one of these methods:\n'));
      console.log(chalk.white('1. Microsoft Outlook (REQUIRED for encrypted OST)'));
      console.log(chalk.white('2. Microsoft Exchange Admin Center'));
      console.log(chalk.white('3. Commercial Exchange-compatible converters'));
    }
  })
  .catch(error => {
    console.error(chalk.red('\n❌ Fatal error:'), error.message);
  });
