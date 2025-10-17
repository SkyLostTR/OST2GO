/**
 * OST2GO - Complete OST/PST Management Toolkit
 * 
 * Convert, extract, and manage Microsoft Outlook OST files
 * 
 * @author SkyLostTR (@Keeftraum)
 * @version 2.0.0
 * @license SEE LICENSE IN LICENSE
 * @repository https://github.com/SkyLostTR/OST2GO
 */

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ProgressBar = require('progress');
const OstToPstConverter = require('./converter/OstToPstConverter');
const RealOstToPstConverter = require('./converter/RealOstToPstConverter');
const PstValidator = require('./validator/PstValidator');
const { PSTFile } = require('pst-extractor');

const program = new Command();

/**
 * Helper function to format ETA in seconds and minutes
 * @param {number} eta - ETA in seconds
 * @returns {string} Formatted ETA string
 */
function formatETA(eta) {
  if (isNaN(eta) || eta === Infinity || eta < 0 || eta === 0) {
    return '--';
  }
  
  const totalSeconds = Math.round(eta);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Create a custom ProgressBar with formatted ETA in minutes and seconds
 */
function createProgressBar(format, options) {
  // We'll manually manage the progress display
  let bar = null;
  let startTime = Date.now();
  let lastRenderTime = 0;
  const renderThrottle = options.renderThrottle || 16;
  
  // Create a wrapper object that mimics ProgressBar interface
  const wrapper = {
    curr: 0,
    total: options.total,
    startTime: startTime,
    
    tick: function(len = 1, tokens = {}) {
      this.curr += len;
      if (this.curr > this.total) this.curr = this.total;
      
      // Throttle rendering
      const now = Date.now();
      if (now - lastRenderTime < renderThrottle && this.curr < this.total) {
        return;
      }
      lastRenderTime = now;
      
      // Calculate ETA
      const elapsed = (now - startTime) / 1000;
      const rate = this.curr / elapsed;
      const remaining = this.total - this.curr;
      const eta = remaining > 0 && rate > 0 ? remaining / rate : 0;
      
      // Build the progress bar manually
      const percent = Math.floor((this.curr / this.total) * 100);
      const ratio = this.curr / this.total;
      const width = options.width || 40;
      const complete = Math.floor(width * ratio);
      const incomplete = width - complete;
      
      const completeChar = options.complete || '█';
      const incompleteChar = options.incomplete || '░';
      
      let bar = '[';
      for (let i = 0; i < complete; i++) bar += completeChar;
      for (let i = 0; i < incomplete; i++) bar += incompleteChar;
      bar += ']';
      
      // Build the display line
      let line = format
        .replace(':bar', bar)
        .replace(':current', this.curr.toString())
        .replace(':total', this.total.toString())
        .replace(':percent', percent + '%');
      
      // Add ETA
      line += chalk.magenta(' ETA: ' + formatETA(eta));
      
      // Clear line and write
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(line);
    },
    
    update: function(ratio, tokens = {}) {
      this.curr = Math.floor(ratio * this.total);
      this.tick(0, tokens);
    },
    
    terminate: function() {
      process.stdout.write('\n');
    }
  };
  
  return wrapper;
}

/**
 * Display credits header for commands
 */
function showCredits() {
  console.log(chalk.gray('┌────────────────────────────────────────────────────────────┐'));
  console.log(chalk.gray('│ ') + chalk.cyan('Author:   ') + chalk.white('SkyLostTR (@Keeftraum)') + chalk.gray('                       │'));
  console.log(chalk.gray('│ ') + chalk.cyan('GitHub:   ') + chalk.white('https://github.com/SkyLostTR/OST2GO') + chalk.gray('        │'));
  console.log(chalk.gray('│ ') + chalk.cyan('Project:  ') + chalk.white('OST2GO - OST/PST Management Toolkit') + chalk.gray('        │'));
  console.log(chalk.gray('└────────────────────────────────────────────────────────────┘'));
}

program
  .name('ost2go')
  .description('OST2GO by SkyLostTR (@Keeftraum) - Complete OST/PST management toolkit')
  .version('2.0.0');

program
  .command('convert')
  .description('Convert OST file to PST format')
  .requiredOption('-i, --input <path>', 'Input OST file path')
  .requiredOption('-o, --output <path>', 'Output PST file path')
  .option('--utf8', 'Ensure UTF-8 encoding support', true)
  .option('--overwrite', 'Overwrite output file if it exists', false)
  .option('--force', 'Skip format compatibility warnings', false)
  .option('--real', 'Use real converter (extracts actual emails)', false)
  .option('--max-emails <number>', 'Maximum emails to extract', '50')
  .action(async (options) => {
    const startTime = Date.now();

    try {
      console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white('              🚀 OST to PST Converter v2.0') + chalk.bold.cyan('               ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
      showCredits();

      // Check if user wants real conversion
      if (options.real) {
        console.log(chalk.bold.green('\n🧠 REAL CONVERTER MODE'));
        console.log(chalk.green('Extracting actual emails and creating proper PST structure\n'));

        const realConverter = new RealOstToPstConverter();
        const maxEmails = parseInt(options.maxEmails) || 50;

        // Setup progress bar for real conversion
        const progressBar = createProgressBar(
          chalk.cyan('🔄 Converting: ') + chalk.white('[:bar] ') + chalk.yellow(':current/:total ') + chalk.gray('(:percent)'),
          {
            total: 4, // 4 main steps
            width: 40,
            complete: chalk.green('█'),
            incomplete: chalk.gray('░'),
            renderThrottle: 100
          }
        );

        // Override console.log to update progress
        const originalLog = console.log;
        let stepCount = 0;
        console.log = function(...args) {
          const message = args.join(' ');
          if (message.includes('Step 1:') || message.includes('Step 2:') ||
              message.includes('Step 3:') || message.includes('Step 4:')) {
            stepCount++;
            progressBar.update(stepCount / 4);
          }
          originalLog.apply(console, args);
        };

        const success = await realConverter.convert(options.input, options.output, {
          maxEmails: maxEmails,
          analysisTimeout: 120000 // 2 minutes
        });

        // Restore console.log
        console.log = originalLog;
        progressBar.update(1);
        progressBar.terminate();

        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;

        if (success) {
          console.log(chalk.bold.green('\n╔══════════════════════════════════════════════════════════════╗'));
          console.log(chalk.bold.green('║') + chalk.bold.white('              🎉 REAL CONVERSION COMPLETED!') + chalk.bold.green('              ║'));
          console.log(chalk.bold.green('╚══════════════════════════════════════════════════════════════╝'));

          console.log(chalk.bold.cyan('\n📊 CONVERSION SUMMARY:'));
          console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
          console.log(chalk.green('✓ ') + chalk.white(`Processing time: `) + chalk.yellow(`${totalTime.toFixed(1)}s`));
          console.log(chalk.green('✓ ') + chalk.white(`Output file: `) + chalk.cyan(options.output));

          console.log(chalk.bold.yellow('\n� NEXT STEPS:'));
          console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
          console.log(chalk.white('1. ') + chalk.cyan('Test the PST file in Outlook or another email client'));
          console.log(chalk.white('2. ') + chalk.cyan('Verify that emails display correctly'));
          console.log(chalk.white('3. ') + chalk.cyan('Import additional emails if needed'));

          // Validate the created PST
          console.log(chalk.blue('\n🔍 Validating created PST file...'));
          await realConverter.validatePst(options.output);
        } else {
          console.log(chalk.bold.red('\n❌ REAL CONVERSION FAILED'));
          console.log(chalk.yellow('Consider using --max-emails with a smaller number'));
        }

        return;
      }

      // Display critical warning for legacy converter unless --force is used
      if (!options.force) {
        console.log(chalk.bold.red('\n🚨 LEGACY CONVERTER WARNING 🚨'));
        console.log(chalk.red('This is the OLD surface-level converter!'));
        console.log(chalk.red('Generated PST files are NOT readable by PST readers.\n'));

        console.log(chalk.bold.green('🚀 NEW: Try --real flag for ACTUAL email conversion!'));
        console.log(chalk.green('Example: node src/index.js convert -i file.ost -o file.pst --real\n'));

        console.log(chalk.bold.yellow('❌ LEGACY CONVERTER ISSUES:'));
        console.log(chalk.yellow('- Output PST files crash in Outlook, XstReader, etc.'));
        console.log(chalk.yellow('- Internal OST database structures remain unchanged'));
        console.log(chalk.yellow('- Only file header is modified to PST format\n'));

        console.log(chalk.bold.blue('✅ FOR BEST RESULTS:'));
        console.log(chalk.blue('1. Use --real flag with this tool'));
        console.log(chalk.blue('2. Or use Outlook: File → Import/Export → Export to PST'));
        console.log(chalk.blue('3. Or use commercial tools: Aspose.Email, Stellar Converter\n'));

        console.log(chalk.bold.yellow('Use --force to continue with legacy converter.\n'));

        // Give user time to read the warning
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Validate input file
      if (!await fs.pathExists(options.input)) {
        console.error(chalk.bold.red(`❌ Error: Input file does not exist: ${options.input}`));
        process.exit(1);
      }

      // Check if output file exists
      if (await fs.pathExists(options.output) && !options.overwrite) {
        console.error(chalk.bold.red(`❌ Error: Output file already exists: ${options.output}`));
        console.log(chalk.yellow('Use --overwrite flag to overwrite existing file'));
        process.exit(1);
      }

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(options.output);
      await fs.ensureDir(outputDir);

      console.log(chalk.bold.blue('\n📋 CONVERSION DETAILS:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan('📁 ') + chalk.white(`Input:  `) + chalk.yellow(options.input));
      console.log(chalk.cyan('📂 ') + chalk.white(`Output: `) + chalk.yellow(options.output));
      console.log(chalk.cyan('🔤 ') + chalk.white(`UTF-8:  `) + chalk.yellow(options.utf8 ? 'Enabled' : 'Disabled'));
      console.log();

      // Setup progress bar for legacy conversion
      const progressBar = createProgressBar(
        chalk.cyan('🔄 Converting: ') + chalk.white('[:bar] ') + chalk.gray('(:percent)'),
        {
          total: 100, // Simulate progress for legacy converter
          width: 40,
          complete: chalk.green('█'),
          incomplete: chalk.gray('░'),
          renderThrottle: 200
        }
      );

      // Initialize converter
      const converter = new OstToPstConverter({
        utf8Support: options.utf8,
        overwrite: options.overwrite,
        progressCallback: (progress) => {
          progressBar.update(progress / 100);
        }
      });

      // Start conversion
      await converter.convert(options.input, options.output);

      progressBar.update(1);
      progressBar.terminate();

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      console.log(chalk.bold.green('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.green('║') + chalk.bold.white('        ✓ SURFACE-LEVEL CONVERSION COMPLETED!') + chalk.bold.green('         ║'));
      console.log(chalk.bold.green('╚══════════════════════════════════════════════════════════════╝'));

      console.log(chalk.bold.cyan('\n📊 CONVERSION SUMMARY:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.green('✓ ') + chalk.white(`Processing time: `) + chalk.yellow(`${totalTime.toFixed(1)}s`));
      console.log(chalk.green('✓ ') + chalk.white(`Output file: `) + chalk.cyan(options.output));

      console.log(chalk.bold.red('\n⚠️  IMPORTANT LIMITATIONS:'));
      console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.red('- Generated file has PST header but OST internal structure'));
      console.log(chalk.red('- File will NOT open in Outlook, XstReader, or other PST tools'));
      console.log(chalk.red('- This is for educational demonstration only'));

      console.log(chalk.bold.yellow('\n📧 FOR ACTUAL PST CONVERSION:'));
      console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.white('1. ') + chalk.cyan('Use Outlook\'s built-in Export feature'));
      console.log(chalk.white('2. ') + chalk.cyan('Use commercial OST to PST conversion tools'));
      console.log(chalk.white('3. ') + chalk.cyan('Keep the original OST file as your primary backup'));

    } catch (error) {
      console.error(chalk.bold.red(`\n❌ Conversion failed: ${error.message}`));
      if (process.env.NODE_ENV === 'development') {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Display information about an OST file')
  .requiredOption('-i, --input <path>', 'Input OST file path')
  .action(async (options) => {
    const startTime = Date.now();

    try {
      console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white('               📊 OST FILE INFORMATION') + chalk.bold.cyan('                  ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
      showCredits();

      if (!await fs.pathExists(options.input)) {
        console.error(chalk.bold.red(`❌ Error: Input file does not exist: ${options.input}`));
        process.exit(1);
      }

      console.log(chalk.blue('\n🔍 Analyzing file...'));

      // Setup progress bar for analysis
      const progressBar = createProgressBar(
        chalk.cyan('📋 Analyzing: ') + chalk.white('[:bar] ') + chalk.gray('(:percent)'),
        {
          total: 100,
          width: 40,
          complete: chalk.green('█'),
          incomplete: chalk.gray('░'),
          renderThrottle: 50
        }
      );

      // Simulate progress for file analysis
      for (let i = 0; i <= 100; i += 10) {
        progressBar.update(i / 100);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const converter = new OstToPstConverter();
      const info = await converter.getFileInfo(options.input);

      progressBar.update(1);
      progressBar.terminate();

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      console.log(chalk.bold.green('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.green('║') + chalk.bold.white('              📋 FILE ANALYSIS COMPLETE') + chalk.bold.green('               ║'));
      console.log(chalk.bold.green('╚══════════════════════════════════════════════════════════════╝'));

      console.log(chalk.bold.cyan('\n📁 FILE INFORMATION:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan('📄 ') + chalk.white(`File:       `) + chalk.yellow(info.path));
      console.log(chalk.cyan('📏 ') + chalk.white(`Size:       `) + chalk.yellow(`${info.size} bytes`) + chalk.gray(` (${(info.size / 1024 / 1024).toFixed(2)} MB)`));
      console.log(chalk.cyan('📅 ') + chalk.white(`Created:    `) + chalk.yellow(info.created));
      console.log(chalk.cyan('🔄 ') + chalk.white(`Modified:   `) + chalk.yellow(info.modified));
      console.log(chalk.cyan('🏷️  ') + chalk.white(`Type:       `) + chalk.yellow(info.type));
      console.log(chalk.cyan('⏱️  ') + chalk.white(`Analysis:   `) + chalk.yellow(`${totalTime.toFixed(1)}s`));

      console.log(chalk.bold.blue('\n💡 RECOMMENDATIONS:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      if (info.type.includes('OST')) {
        console.log(chalk.white('• ') + chalk.green('Valid OST file detected'));
        console.log(chalk.white('• ') + chalk.cyan('Ready for conversion using: ') + chalk.yellow('ost2go convert --real'));
        console.log(chalk.white('• ') + chalk.cyan('For extraction use: ') + chalk.yellow('ost2go extract'));
      } else {
        console.log(chalk.white('• ') + chalk.red('File may not be a valid OST file'));
        console.log(chalk.white('• ') + chalk.yellow('Verify file format before conversion'));
      }

    } catch (error) {
      console.error(chalk.bold.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Add extract command
program
  .command('extract')
  .description('Extract emails from OST/PST file to EML, MBOX, and JSON formats')
  .requiredOption('-i, --input <path>', 'Input OST/PST file path')
  .option('-o, --output <dir>', 'Output directory', 'extracted-emails')
  .option('--max <number>', 'Maximum emails to extract', '100')
  .option('--verbose', 'Show detailed extraction information', false)
  .action(async (options) => {
    const startTime = Date.now();

    // Suppress expected error messages from pst-extractor library
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('PSTNodeInputStream::detectZlib') || 
          message.includes('Error: incorrect header check') ||
          message.includes('Error: invalid window size') ||
          message.includes('Error: invalid stored block lengths') ||
          message.includes('Error: invalid distance too far back')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    try {
      console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white('                  📧 OST Email Extractor') + chalk.bold.cyan('                  ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
      showCredits();

      const inputPath = path.resolve(options.input);
      const outputDir = path.resolve(options.output);
      const maxEmails = parseInt(options.max) || 100;

      if (!await fs.pathExists(inputPath)) {
        console.error(chalk.bold.red(`\n❌ Error: Input file does not exist: ${inputPath}`));
        process.exit(1);
      }

      console.log(chalk.blue(`📁 Input:  `) + chalk.white(inputPath));
      console.log(chalk.blue(`📂 Output: `) + chalk.white(`${outputDir}/`));
      console.log(chalk.blue(`📊 Max:    `) + chalk.white(`${maxEmails} emails`));
      if (options.verbose) {
        console.log(chalk.blue(`🔧 Mode:   `) + chalk.yellow('Verbose (showing attachment warnings)'));
      }
      console.log();

      // Open OST/PST file
      console.log(chalk.blue('📂 Opening file...'));
      const pstFile = new PSTFile(inputPath);
      const rootFolder = pstFile.getRootFolder();

      // Create output directory
      await fs.ensureDir(outputDir);
      await fs.ensureDir(path.join(outputDir, 'eml'));

      let emailCount = 0;
      const emails = [];
      let skippedAttachments = 0;
      let totalAttachments = 0;
      let mboxContent = '';

      // Setup progress bar
      const progressBar = createProgressBar(
        chalk.cyan('📧 Extracting: ') + chalk.white('[:bar] ') + chalk.yellow(':current/:total ') + chalk.gray('(:percent)'),
        {
          total: maxEmails,
          width: 40,
          complete: chalk.green('█'),
          incomplete: chalk.gray('░'),
          renderThrottle: 100
        }
      );

      // Helper function to create EML content
      function createEMLContent(email) {
        const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        let eml = '';
        
        eml += `From: ${email.from} <${email.fromEmail}>\r\n`;
        eml += `To: ${email.to}\r\n`;
        if (email.cc) eml += `Cc: ${email.cc}\r\n`;
        eml += `Subject: ${email.subject}\r\n`;
        eml += `Date: ${email.date.toUTCString()}\r\n`;
        eml += `MIME-Version: 1.0\r\n`;
        
        if (email.attachments && email.attachments.length > 0) {
          eml += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
          eml += `--${boundary}\r\n`;
        }
        
        if (email.bodyHTML) {
          eml += `Content-Type: text/html; charset="UTF-8"\r\n`;
          eml += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
          eml += email.bodyHTML + '\r\n';
        } else {
          eml += `Content-Type: text/plain; charset="UTF-8"\r\n`;
          eml += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
          eml += email.body + '\r\n';
        }
        
        if (email.attachments && email.attachments.length > 0) {
          for (const attachment of email.attachments) {
            if (attachment.data) {
              eml += `\r\n--${boundary}\r\n`;
              eml += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n`;
              eml += `Content-Transfer-Encoding: base64\r\n`;
              eml += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
              eml += attachment.data.toString('base64') + '\r\n';
            }
          }
          eml += `--${boundary}--\r\n`;
        }
        
        return eml;
      }

      // Recursive function to extract emails
      function extractFromFolder(folder, folderPath = '') {
        if (emailCount >= maxEmails) return;

        const currentPath = folderPath ? `${folderPath}/${folder.displayName}` : folder.displayName;

        if (folder.contentCount > 0) {
          console.log(chalk.blue(`📁 Processing: `) + chalk.white(`${currentPath} (${folder.contentCount} messages)`));

          let msg = folder.getNextChild();
          while (msg && emailCount < maxEmails) {
            try {
              const attachments = [];
              const numAttach = msg.numberOfAttachments || 0;
              totalAttachments += numAttach;
              
              for (let i = 0; i < numAttach; i++) {
                try {
                  const attach = msg.getAttachment(i);
                  if (attach) {
                    let attachData = null;
                    try {
                      const stream = attach.fileInputStream;
                      if (stream) {
                        const chunks = [];
                        let totalSize = 0;
                        const bufferSize = 8176;
                        const buffer = Buffer.alloc(bufferSize);

                        try {
                          let bytesRead = stream.read(buffer);
                          while (bytesRead > 0) {
                            chunks.push(Buffer.from(buffer.slice(0, bytesRead)));
                            totalSize += bytesRead;
                            bytesRead = stream.read(buffer);
                          }

                          if (totalSize > 0) {
                            attachData = Buffer.concat(chunks, totalSize);
                          }
                        } catch (zlibErr) {
                          skippedAttachments++;
                          if (options.verbose) {
                            console.log(chalk.gray(`    ⚠️  Skipping attachment ${i} (compression error)`));
                          }
                        }
                      }
                    } catch (streamErr) {
                      skippedAttachments++;
                      if (options.verbose) {
                        console.log(chalk.gray(`    ⚠️  Attachment ${i} stream error`));
                      }
                    }

                    attachments.push({
                      filename: attach.longFilename || attach.filename || `attachment${i}`,
                      mimeType: attach.mimeTag || 'application/octet-stream',
                      size: attach.attachSize || 0,
                      data: attachData
                    });
                  }
                } catch (e) {
                  skippedAttachments++;
                  if (options.verbose) {
                    console.log(chalk.gray(`    ⚠️  Attachment ${i} error`));
                  }
                }
              }

              const email = {
                id: emailCount + 1,
                folder: currentPath,
                subject: msg.subject || 'No Subject',
                from: msg.senderName || msg.senderEmailAddress || 'Unknown',
                fromEmail: msg.senderEmailAddress || '',
                to: msg.displayTo || '',
                cc: msg.displayCC || '',
                date: msg.messageDeliveryTime ? new Date(msg.messageDeliveryTime) : new Date(),
                body: msg.body || '',
                bodyHTML: msg.bodyHTML || '',
                attachmentCount: attachments.length,
                attachments: attachments
              };

              emails.push({
                ...email,
                attachments: email.attachments.map(a => ({
                  filename: a.filename,
                  mimeType: a.mimeType,
                  size: a.size
                }))
              });
              emailCount++;

              // Save as EML file
              const emlContent = createEMLContent(email);
              const safeSubject = email.subject.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
              const emlPath = path.join(outputDir, 'eml', `${emailCount}_${safeSubject}.eml`);
              fs.writeFileSync(emlPath, emlContent);

              // Add to MBOX
              mboxContent += `From ${email.fromEmail} ${email.date.toUTCString()}\r\n`;
              mboxContent += emlContent + '\r\n';

              progressBar.update(emailCount / maxEmails);

              if (options.verbose && emailCount % 10 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = emailCount / elapsed;
                console.log(chalk.gray(`    📊 Progress: ${emailCount}/${maxEmails} emails (${rate.toFixed(1)}/sec)`));
              }
            } catch (err) {
              if (options.verbose) {
                console.log(chalk.yellow(`    ⚠️  Error processing email: ${err.message}`));
              }
            }

            msg = folder.getNextChild();
          }
        }

        if (emailCount < maxEmails && folder.hasSubfolders) {
          const subfolders = folder.getSubFolders();
          for (const subfolder of subfolders) {
            extractFromFolder(subfolder, currentPath);
            if (emailCount >= maxEmails) break;
          }
        }
      }

      // Start extraction
      extractFromFolder(rootFolder);

      progressBar.update(1);
      progressBar.terminate();

      // Save JSON
      console.log(chalk.blue('\n💾 Saving JSON backup...'));
      await fs.writeJson(path.join(outputDir, 'emails.json'), emails, { spaces: 2 });

      // Save MBOX
      console.log(chalk.blue('💾 Saving MBOX file...'));
      await fs.writeFile(path.join(outputDir, 'emails.mbox'), mboxContent);

      // Create import instructions
      const instructions = `
╔══════════════════════════════════════════════════════════════╗
║               📧 EMAIL EXTRACTION COMPLETE                   ║
╚══════════════════════════════════════════════════════════════╝

Extracted ${emailCount} emails from: ${path.basename(inputPath)}
Output directory: ${outputDir}

FILES CREATED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 ${emailCount} EML files in ${outputDir}/eml/
📦 emails.mbox (MBOX format for email clients)
📄 emails.json (JSON backup with metadata)

IMPORT METHODS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 1: Import EML files to Outlook (RECOMMENDED)
────────────────────────────────────────────────────
1. Open Microsoft Outlook
2. Create a new folder for imported emails
3. Drag and drop .eml files from ${outputDir}/eml/ into Outlook
4. Emails will be imported with full formatting and attachments
5. Export to PST: File → Open & Export → Import/Export

METHOD 2: Import MBOX to Mozilla Thunderbird
─────────────────────────────────────────────
1. Install Thunderbird
2. Install "ImportExportTools NG" add-on
3. Tools → ImportExportTools NG → Import mbox file
4. Select ${outputDir}/emails.mbox

METHOD 3: Import to Gmail
──────────────────────────
1. Use email clients that support MBOX import
2. Or use "Got Your Back" (gyb) tool for Gmail upload

💡 RECOMMENDED WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Import EML files to Outlook
2. Organize emails in folders
3. Export to PST: File → Open & Export → Import/Export
4. This gives you a WORKING PST file!
`;

      await fs.writeFile(path.join(outputDir, 'IMPORT_INSTRUCTIONS.txt'), instructions);

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      console.log(chalk.bold.green('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.green('║') + chalk.bold.white('              ✅ EXTRACTION COMPLETED!') + chalk.bold.green('                   ║'));
      console.log(chalk.bold.green('╚══════════════════════════════════════════════════════════════╝'));

      console.log(chalk.bold.cyan('\n📊 EXTRACTION SUMMARY:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.green('✓ ') + chalk.white(`Emails extracted: `) + chalk.yellow(emailCount));
      console.log(chalk.green('✓ ') + chalk.white(`Total attachments: `) + chalk.yellow(totalAttachments));
      console.log(chalk.green('✓ ') + chalk.white(`Skipped attachments: `) + chalk.yellow(skippedAttachments));
      console.log(chalk.green('✓ ') + chalk.white(`Processing time: `) + chalk.yellow(`${totalTime.toFixed(1)}s`));
      console.log(chalk.green('✓ ') + chalk.white(`Output directory: `) + chalk.cyan(outputDir));

      console.log(chalk.bold.yellow('\n📧 NEXT STEPS:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.white('1. ') + chalk.cyan(`Read ${outputDir}/IMPORT_INSTRUCTIONS.txt for import methods`));
      console.log(chalk.white('2. ') + chalk.cyan('Drag .eml files into Outlook (EASIEST METHOD)'));
      console.log(chalk.white('3. ') + chalk.cyan('Or import emails.mbox to Thunderbird/other clients'));

      console.error = originalConsoleError;
    } catch (error) {
      console.error(chalk.bold.red(`\n❌ Extraction failed: ${error.message}`));
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Add validate command
program
  .command('validate')
  .description('Validate PST file integrity and contents using pst-extractor library')
  .requiredOption('-i, --input <path>', 'PST file to validate')
  .option('--verbose', 'Show detailed validation information', false)
  .action(async (options) => {
    const startTime = Date.now();

    try {
      console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white('           🔍 PST FILE VALIDATION TOOL') + chalk.bold.cyan('              ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
      showCredits();

      const inputPath = path.resolve(options.input);

      // Check if file exists
      if (!await fs.pathExists(inputPath)) {
        console.log(chalk.bold.red(`\n❌ File not found: ${inputPath}`));
        process.exit(1);
      }

      console.log(chalk.bold.blue('\n📋 VALIDATION DETAILS:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan('📁 ') + chalk.white(`File: `) + chalk.yellow(inputPath));
      console.log(chalk.cyan('🔧 ') + chalk.white(`Mode: `) + chalk.yellow(options.verbose ? 'Verbose' : 'Standard'));
      console.log();

      // Setup progress bar for validation
      const progressBar = createProgressBar(
        chalk.cyan('🔍 Validating: ') + chalk.white('[:bar] ') + chalk.gray('(:percent)'),
        {
          total: 100,
          width: 40,
          complete: chalk.green('█'),
          incomplete: chalk.gray('░'),
          renderThrottle: 100
        }
      );

      // Simulate progress updates during validation
      let progressInterval = setInterval(() => {
        const current = progressBar.curr;
        if (current < 90) {
          progressBar.update(current + 5);
        }
      }, 200);

      // Validate the PST file
      const validator = new PstValidator();
      const results = await validator.validate(inputPath);

      clearInterval(progressInterval);
      progressBar.update(1);
      progressBar.terminate();

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      // Display the report
      validator.displayReport();

      console.log(chalk.bold.cyan('\n📊 VALIDATION SUMMARY:'));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.green('✓ ') + chalk.white(`Processing time: `) + chalk.yellow(`${totalTime.toFixed(1)}s`));

      // Exit with appropriate code
      if (results.isValid) {
        console.log(chalk.bold.green('\n╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.green('║') + chalk.bold.white('           ✅ PST FILE IS VALID AND USABLE!') + chalk.bold.green('           ║'));
        console.log(chalk.bold.green('╚══════════════════════════════════════════════════════════════╝'));

        console.log(chalk.bold.blue('\n🎯 NEXT STEPS:'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white('• ') + chalk.green('File can be safely opened in Outlook'));
        console.log(chalk.white('• ') + chalk.green('All emails should be accessible'));
        console.log(chalk.white('• ') + chalk.green('Ready for import/export operations'));

        process.exit(0);
      } else {
        console.log(chalk.bold.red('\n╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.red('║') + chalk.bold.white('         ❌ PST FILE HAS VALIDATION ERRORS') + chalk.bold.red('          ║'));
        console.log(chalk.bold.red('╚══════════════════════════════════════════════════════════════╝'));

        console.log(chalk.bold.yellow('\n⚠️  RECOMMENDATIONS:'));
        console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white('• ') + chalk.red('Do not use this PST file in production'));
        console.log(chalk.white('• ') + chalk.yellow('Try recreating from original OST file'));
        console.log(chalk.white('• ') + chalk.yellow('Use Outlook export for reliable conversion'));
        console.log(chalk.white('• ') + chalk.yellow('Consider commercial conversion tools'));

        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.bold.red(`\n❌ Validation error: ${error.message}`));
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

// Show help when no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);