const OstFormatParser = require('../parser/OstFormatParser');
const EmailExtractor = require('../extractor/EmailExtractor');
const EmailContentScanner = require('../scanner/EmailContentScanner');
const PstDatabaseWriter = require('../writer/PstDatabaseWriter');
const PstValidator = require('../validator/PstValidator');
const chalk = require('chalk');

/**
 * Complete OST to PST Converter v2.0
 * Performs actual conversion by extracting email data and creating proper PST structures
 */
class RealOstToPstConverter {
  constructor() {
    this.parser = new OstFormatParser();
    this.extractor = new EmailExtractor();
    this.scanner = new EmailContentScanner();
    this.writer = new PstDatabaseWriter();
  }
  
  /**
   * Convert OST to PST with real email extraction
   */
  async convert(ostPath, pstPath, options = {}) {
    const maxEmails = options.maxEmails || 50;
    const analysisTimeout = options.analysisTimeout || 60000; // 1 minute
    
    console.log(chalk.blue('🚀 Starting REAL OST to PST Conversion'));
    console.log(chalk.gray('====================================='));
    
    try {
      // Step 1: Parse OST structure
      console.log(chalk.yellow('\n📋 Step 1: Parsing OST file structure...'));
      const header = await this.parser.parseHeader(ostPath);
      
      console.log(`  Format: ${header.format}`);
      console.log(`  Version: 0x${header.version.toString(16)}`);
      console.log(`  Unicode: ${header.isUnicode}`);
      
      // Step 2: Find data patterns (with timeout)
      console.log(chalk.yellow('\n🔍 Step 2: Discovering email data patterns...'));
      
      const patternPromise = this.parser.findDataPatterns(ostPath);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pattern analysis timeout')), analysisTimeout)
      );
      
      let patterns;
      try {
        patterns = await Promise.race([patternPromise, timeoutPromise]);
      } catch (error) {
        console.log(chalk.yellow('  ⚠️  Pattern analysis timed out, using header-based approach'));
        patterns = await this.generateFallbackPatterns(ostPath, header);
      }
      
      console.log(`  Found ${patterns.length} potential data locations`);
      
      // Step 3: Extract emails - try both methods
      console.log(chalk.yellow('\n📧 Step 3: Extracting email messages...'));
      
      let emails = await this.extractor.extractEmails(ostPath, patterns, maxEmails);
      
      if (emails.length === 0) {
        console.log(chalk.yellow('  🔄 Pattern-based extraction failed, trying content scan...'));
        emails = await this.scanner.scanForEmails(ostPath, maxEmails);
      }
      
      if (emails.length === 0) {
        console.log(chalk.red('  ❌ No emails could be extracted from the OST file'));
        console.log(chalk.yellow('  This could mean:'));
        console.log(chalk.yellow('  - The OST file is encrypted/corrupted'));
        console.log(chalk.yellow('  - The format is not supported'));
        console.log(chalk.yellow('  - Email data is compressed'));
        console.log(chalk.yellow('  - OST uses proprietary Exchange format'));
        return false;
      }
      
      console.log(chalk.green(`  ✅ Successfully extracted ${emails.length} emails`));
      
      // Step 4: Create PST file
      console.log(chalk.yellow('\n🏗️  Step 4: Creating PST database...'));
      await this.writer.createPstFile(pstPath);
      
      // Step 5: Add emails to PST
      console.log(chalk.yellow('\n💾 Step 5: Adding emails to PST...'));
      
      for (let i = 0; i < emails.length; i++) {
        const email = this.extractor.cleanEmail(emails[i]);
        
        this.writer.addMessage(
          this.writer.PST_CONSTANTS.NID_INBOX, // Add to Inbox
          email.subject,
          email.sender,
          email.body,
          email.bodyHtml
        );
        
        if ((i + 1) % 10 === 0) {
          console.log(`    Added ${i + 1}/${emails.length} messages...`);
        }
      }
      
      // Step 6: Finalize PST file
      console.log(chalk.yellow('\n🔧 Step 6: Finalizing PST file structure...'));
      
      // Rebuild B-trees to include the new messages
      await this.writer.buildBTrees();
      
      // Update the PST file with new B-tree information
      await this.writer.updatePstFile(pstPath);
      
      console.log(chalk.green('\n🎉 Conversion completed successfully!'));
      console.log(chalk.cyan(`📁 Output: ${pstPath}`));
      console.log(chalk.cyan(`📊 Messages: ${emails.length}`));
      
      // Show sample of converted emails
      console.log(chalk.yellow('\n📋 Converted emails sample:'));
      emails.slice(0, 5).forEach((email, idx) => {
        const cleaned = this.extractor.cleanEmail(email);
        console.log(`  ${idx + 1}. "${cleaned.subject}" from ${cleaned.sender}`);
      });
      
      return true;
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Conversion failed: ${error.message}`));
      console.error(chalk.gray(error.stack));
      return false;
    }
  }
  
  /**
   * Generate fallback patterns when full analysis times out
   */
  async generateFallbackPatterns(ostPath, header) {
    console.log('  🔄 Generating fallback search patterns...');
    
    const fs = require('fs-extra');
    const stats = await fs.stat(ostPath);
    const fileSize = stats.size;
    
    // Generate patterns based on file size and common OST structure
    const patterns = [];
    const stepSize = Math.floor(fileSize / 1000); // 1000 sample points
    
    for (let offset = 4096; offset < fileSize - 4096; offset += stepSize) {
      patterns.push({
        offset: offset,
        signature: '0x0',
        type: 'Estimated Data'
      });
    }
    
    console.log(`  Generated ${patterns.length} fallback patterns`);
    return patterns;
  }
  
  /**
   * Comprehensive validation of converted PST using pst-extractor
   */
  async validatePst(pstPath) {
    try {
      const validator = new PstValidator();
      const results = await validator.validate(pstPath);
      
      // Display the report
      validator.displayReport();
      
      return results.isValid;
    } catch (error) {
      console.log(chalk.red(`  ❌ Validation error: ${error.message}`));
      return false;
    }
  }
  
  /**
   * Quick basic header validation (fallback)
   */
  async validatePstBasic(pstPath) {
    try {
      const fs = require('fs-extra');
      const stats = await fs.stat(pstPath);
      
      console.log(chalk.blue('\n🔍 Basic PST Validation:'));
      console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB`);
      
      // Read header to validate structure
      const buffer = Buffer.alloc(564);
      const fd = await fs.promises.open(pstPath, 'r');
      
      try {
        const result = await fd.read(buffer, 0, 564, 0);
        
        const signature = buffer.slice(0, 4).toString('ascii');
        const version = buffer.readUInt16LE(10);
        
        console.log(`  Signature: ${signature}`);
        console.log(`  Version: 0x${version.toString(16)}`);
        
        if (signature === '!BDN' && version >= 0x17) {
          console.log(chalk.green('  ✅ PST structure appears valid'));
          return true;
        } else {
          console.log(chalk.red('  ❌ PST structure validation failed'));
          return false;
        }
        
      } finally {
        if (fd) {
          try {
            await fd.close();
          } catch (closeError) {
            // Ignore close errors
          }
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Validation error: ${error.message}`));
      return false;
    }
  }
}

module.exports = RealOstToPstConverter;