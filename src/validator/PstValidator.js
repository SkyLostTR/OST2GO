const { PSTFile } = require('pst-extractor');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * PST File Validator
 * Uses pst-extractor library to validate PST file integrity and contents
 */
class PstValidator {
  constructor() {
    this.validationResults = {
      isValid: false,
      errors: [],
      warnings: [],
      info: {}
    };
  }

  /**
   * Validate a PST file
   * @param {string} pstPath - Path to the PST file
   * @returns {Object} Validation results
   */
  async validate(pstPath) {
    console.log(chalk.cyan('\n🔍 Validating PST file with pst-extractor...'));
    
    this.validationResults = {
      isValid: false,
      errors: [],
      warnings: [],
      info: {}
    };

    try {
      // Check if file exists
      if (!await fs.pathExists(pstPath)) {
        this.validationResults.errors.push('PST file does not exist');
        return this.validationResults;
      }

      const stats = await fs.stat(pstPath);
      this.validationResults.info.fileSize = stats.size;
      
      console.log(`  📁 File: ${pstPath}`);
      console.log(`  📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);

      // Try to open and read the PST file
      const pstFile = new PSTFile(pstPath);
      
      // Validate basic structure
      console.log('  🔍 Checking PST structure...');
      
      // Get message store
      let messageStore;
      try {
        messageStore = pstFile.getMessageStore();
        this.validationResults.info.hasMessageStore = true;
        console.log(chalk.green('  ✅ Message store is accessible'));
      } catch (error) {
        this.validationResults.errors.push(`Message store error: ${error.message}`);
        console.log(chalk.red(`  ❌ Message store error: ${error.message}`));
        return this.validationResults;
      }

      // Get root folder
      let rootFolder;
      try {
        rootFolder = pstFile.getRootFolder();
        this.validationResults.info.hasRootFolder = true;
        console.log(chalk.green('  ✅ Root folder is accessible'));
      } catch (error) {
        this.validationResults.errors.push(`Root folder error: ${error.message}`);
        console.log(chalk.red(`  ❌ Root folder error: ${error.message}`));
        return this.validationResults;
      }

      // Count folders and messages
      console.log('  📊 Analyzing contents...');
      const analysis = this.analyzeFolderTree(rootFolder, pstFile);
      
      this.validationResults.info.totalFolders = analysis.folderCount;
      this.validationResults.info.totalMessages = analysis.messageCount;
      this.validationResults.info.folderTree = analysis.folderTree;

      console.log(chalk.cyan(`  📂 Total folders: ${analysis.folderCount}`));
      console.log(chalk.cyan(`  📧 Total messages: ${analysis.messageCount}`));

      // Display folder tree
      if (analysis.folderTree.length > 0) {
        console.log(chalk.yellow('\n  📁 Folder Structure:'));
        this.displayFolderTree(analysis.folderTree, '    ');
      }

      // Try to read messages
      if (analysis.messageCount > 0) {
        console.log(chalk.yellow('\n  📧 Sample Messages:'));
        const sampleMessages = this.readSampleMessages(rootFolder, pstFile, 3);
        this.validationResults.info.sampleMessages = sampleMessages;
        
        sampleMessages.forEach((msg, idx) => {
          console.log(chalk.gray(`    ${idx + 1}. "${msg.subject}" from ${msg.sender}`));
        });
      }

      // Check for common issues
      this.performHealthChecks(analysis);

      // If we got here without errors, the PST is valid
      if (this.validationResults.errors.length === 0) {
        this.validationResults.isValid = true;
        console.log(chalk.green('\n  ✅ PST file is valid and readable!'));
      } else {
        console.log(chalk.red('\n  ❌ PST file has validation errors'));
      }

    } catch (error) {
      this.validationResults.errors.push(`Validation error: ${error.message}`);
      console.log(chalk.red(`  ❌ Validation failed: ${error.message}`));
      
      // More detailed error info
      if (error.stack) {
        console.log(chalk.gray(`     ${error.stack.split('\n')[1]?.trim()}`));
      }
    }

    return this.validationResults;
  }

  /**
   * Analyze folder tree recursively
   */
  analyzeFolderTree(folder, pstFile, depth = 0) {
    let folderCount = 1;
    let messageCount = 0;
    const folderInfo = {
      name: folder.displayName,
      messageCount: 0,
      subfolders: []
    };

    try {
      // Count messages in this folder
      if (folder.contentCount > 0) {
        messageCount = folder.contentCount;
        folderInfo.messageCount = folder.contentCount;
      }

      // Process subfolders
      if (folder.hasSubfolders) {
        const subfolders = folder.getSubFolders();
        for (const subfolder of subfolders) {
          const subAnalysis = this.analyzeFolderTree(subfolder, pstFile, depth + 1);
          folderCount += subAnalysis.folderCount;
          messageCount += subAnalysis.messageCount;
          folderInfo.subfolders.push(subAnalysis.folderTree[0]);
        }
      }
    } catch (error) {
      this.validationResults.warnings.push(`Error analyzing folder "${folder.displayName}": ${error.message}`);
    }

    return {
      folderCount,
      messageCount,
      folderTree: [folderInfo]
    };
  }

  /**
   * Display folder tree in a nice format
   */
  displayFolderTree(tree, indent = '') {
    for (const folder of tree) {
      const msgInfo = folder.messageCount > 0 ? chalk.cyan(` (${folder.messageCount} msgs)`) : '';
      console.log(`${indent}📁 ${folder.name}${msgInfo}`);
      
      if (folder.subfolders && folder.subfolders.length > 0) {
        this.displayFolderTree(folder.subfolders, indent + '  ');
      }
    }
  }

  /**
   * Read sample messages from the PST
   */
  readSampleMessages(folder, pstFile, maxSamples = 3) {
    const messages = [];
    
    try {
      // Try to find folders with messages
      const foldersToCheck = [folder];
      
      if (folder.hasSubfolders) {
        const subfolders = folder.getSubFolders();
        foldersToCheck.push(...subfolders);
      }

      for (const checkFolder of foldersToCheck) {
        if (messages.length >= maxSamples) break;
        
        try {
          if (checkFolder.contentCount > 0) {
            // Try to get messages from this folder
            let msg = checkFolder.getNextChild();
            while (msg && messages.length < maxSamples) {
              try {
                messages.push({
                  subject: msg.subject || 'No Subject',
                  sender: msg.senderName || msg.senderEmailAddress || 'Unknown',
                  date: msg.messageDeliveryTime || null,
                  size: msg.messageSize || 0
                });
              } catch (msgError) {
                // Skip this message
              }
              msg = checkFolder.getNextChild();
            }
          }
        } catch (folderError) {
          // Skip this folder
        }
      }
    } catch (error) {
      this.validationResults.warnings.push(`Error reading messages: ${error.message}`);
    }

    return messages;
  }

  /**
   * Perform health checks on the PST
   */
  performHealthChecks(analysis) {
    // Check for empty PST
    if (analysis.folderCount === 0) {
      this.validationResults.warnings.push('PST file has no folders');
    }

    if (analysis.messageCount === 0) {
      this.validationResults.warnings.push('PST file has no messages');
    }

    // Check for reasonable structure
    if (analysis.folderCount > 1000) {
      this.validationResults.warnings.push(`Very large number of folders (${analysis.folderCount})`);
    }

    if (analysis.messageCount > 100000) {
      this.validationResults.warnings.push(`Very large number of messages (${analysis.messageCount})`);
    }
  }

  /**
   * Get validation summary
   */
  getSummary() {
    const summary = {
      valid: this.validationResults.isValid,
      errors: this.validationResults.errors.length,
      warnings: this.validationResults.warnings.length,
      folders: this.validationResults.info.totalFolders || 0,
      messages: this.validationResults.info.totalMessages || 0
    };

    return summary;
  }

  /**
   * Display validation report
   */
  displayReport() {
    console.log(chalk.cyan('\n📊 VALIDATION REPORT'));
    console.log('='.repeat(50));

    if (this.validationResults.isValid) {
      console.log(chalk.green('✅ Status: VALID'));
    } else {
      console.log(chalk.red('❌ Status: INVALID'));
    }

    console.log(`📂 Folders: ${this.validationResults.info.totalFolders || 0}`);
    console.log(`📧 Messages: ${this.validationResults.info.totalMessages || 0}`);
    console.log(`📁 File Size: ${((this.validationResults.info.fileSize || 0) / 1024).toFixed(1)} KB`);

    if (this.validationResults.errors.length > 0) {
      console.log(chalk.red(`\n❌ Errors (${this.validationResults.errors.length}):`));
      this.validationResults.errors.forEach(err => {
        console.log(chalk.red(`  • ${err}`));
      });
    }

    if (this.validationResults.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Warnings (${this.validationResults.warnings.length}):`));
      this.validationResults.warnings.forEach(warn => {
        console.log(chalk.yellow(`  • ${warn}`));
      });
    }

    console.log('='.repeat(50));
  }
}

module.exports = PstValidator;
