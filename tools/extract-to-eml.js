const { PSTFile } = require('pst-extractor');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const ProgressBar = require('progress');

/**
 * WORKING SOLUTION:
 * Extract emails from OST using pst-extractor,
 * then save them in a format that can be easily imported.
 * 
 * Since creating a valid PST from scratch is complex,
 * we'll export to multiple formats:
 * 1. EML files (can be imported to Outlook/Thunderbird)
 * 2. MBOX format (standard email format)
 * 3. JSON for backup
 */

// Suppress expected error messages from pst-extractor library
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  // Suppress known zlib decompression warnings
  if (message.includes('PSTNodeInputStream::detectZlib') || 
      message.includes('Error: incorrect header check') ||
      message.includes('Error: invalid window size') ||
      message.includes('Error: invalid stored block lengths') ||
      message.includes('Error: invalid distance too far back')) {
    return; // Silently skip these expected errors
  }
  originalConsoleError.apply(console, args);
};

async function extractEmailsFromOst(ostPath, options = {}) {
  const maxEmails = options.maxEmails || 100;
  const outputDir = options.outputDir || 'extracted-emails';
  const verbose = options.verbose || false;

  // Start time tracking
  const startTime = Date.now();

  // Colorful header
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('                  📧 OST Email Extractor') + chalk.bold.cyan('                  ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));

  console.log(chalk.blue(`📁 Input:  `) + chalk.white(ostPath));
  console.log(chalk.blue(`📂 Output: `) + chalk.white(`${outputDir}/`));
  console.log(chalk.blue(`📊 Max:    `) + chalk.white(`${maxEmails} emails`));
  if (verbose) {
    console.log(chalk.blue(`🔧 Mode:   `) + chalk.yellow('Verbose (showing attachment warnings)'));
  }
  console.log();

  try {
    // Open OST file
    console.log(chalk.blue('� Opening OST file...'));
    const pstFile = new PSTFile(ostPath);
    const rootFolder = pstFile.getRootFolder();

    // Create output directory
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(outputDir, 'eml'));

    let emailCount = 0;
    const emails = [];
    let skippedAttachments = 0;
    let totalAttachments = 0;

    // Setup progress bar
    const progressBar = new ProgressBar(
      chalk.cyan('📧 Extracting: ') + chalk.white('[:bar] ') + chalk.yellow(':current/:total ') + chalk.gray('(:percent)') + chalk.magenta(' ETA: :etas'),
      {
        total: maxEmails,
        width: 40,
        complete: chalk.green('█'),
        incomplete: chalk.gray('░'),
        renderThrottle: 100
      }
    );

    // Recursive function to extract emails
    function extractFromFolder(folder, folderPath = '') {
      if (emailCount >= maxEmails) return;

      const currentPath = folderPath ? `${folderPath}/${folder.displayName}` : folder.displayName;

      if (folder.contentCount > 0) {
        console.log(chalk.blue(`📁 Processing: `) + chalk.white(`${currentPath} (${folder.contentCount} messages)`));

        let msg = folder.getNextChild();
        while (msg && emailCount < maxEmails) {
          try {
            // Extract attachments
            const attachments = [];
            const numAttach = msg.numberOfAttachments || 0;
            totalAttachments += numAttach;
            for (let i = 0; i < numAttach; i++) {
              try {
                const attach = msg.getAttachment(i);
                if (attach) {
                  let attachData = null;
                  try {
                    // Try to get attachment data
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
                        // Handle zlib decompression errors (corrupt or incompatible compression)
                        skippedAttachments++;
                        if (verbose) {
                          if (zlibErr.message && (zlibErr.message.includes('header check') ||
                                                   zlibErr.message.includes('window size') ||
                                                   zlibErr.message.includes('stored block'))) {
                            console.log(chalk.gray(`    ⚠️  Skipping attachment ${i} (compression error)`));
                          } else {
                            console.log(chalk.gray(`    ⚠️  Attachment ${i} error: ${zlibErr.message}`));
                          }
                        }
                        // Continue without throwing - attachment will be skipped
                      }
                    }
                  } catch (streamErr) {
                    // Attachment data not available
                    skippedAttachments++;
                    if (verbose) {
                      console.log(chalk.gray(`    ⚠️  Attachment ${i} stream error: ${streamErr.message}`));
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
                if (verbose) {
                  console.log(chalk.gray(`    ⚠️  Attachment ${i} error: ${e.message}`));
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

            // Save as EML file with proper MIME structure
            const emlContent = createEMLContent(email);
            const safeSubject = email.subject.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            const emlPath = path.join(outputDir, 'eml', `${emailCount}_${safeSubject}.eml`);
            fs.writeFileSync(emlPath, emlContent);

            // Update progress bar
            progressBar.update(emailCount / maxEmails);

            if (verbose && emailCount % 10 === 0) {
              const elapsed = (Date.now() - startTime) / 1000;
              const rate = emailCount / elapsed;
              const remaining = (maxEmails - emailCount) / rate;
              console.log(chalk.gray(`    📊 Progress: ${emailCount}/${maxEmails} emails (${(rate).toFixed(1)}/sec, ${(remaining/60).toFixed(1)}min left)`));
            }

          } catch (error) {
            if (verbose) {
              console.log(chalk.red(`  ⚠️  Error extracting message: ${error.message}`));
            }
          }

          msg = folder.getNextChild();
        }
      }

      // Process subfolders
      if (emailCount < maxEmails && folder.hasSubfolders) {
        const subfolders = folder.getSubFolders();
        for (const subfolder of subfolders) {
          extractFromFolder(subfolder, currentPath);
          if (emailCount >= maxEmails) break;
        }
      }
    }

    // Start extraction
    console.log(chalk.cyan('� Starting email extraction...\n'));
    extractFromFolder(rootFolder);

    // Complete progress bar
    progressBar.update(1);
    progressBar.terminate();

    // Calculate final statistics
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    const emailsPerSecond = emailCount / totalTime;

    // Save files
    console.log(chalk.blue('\n💾 Saving output files...'));

    const jsonPath = path.join(outputDir, 'emails.json');
    await fs.writeJSON(jsonPath, emails, { spaces: 2 });

    const mboxPath = path.join(outputDir, 'emails.mbox');
    const mboxContent = createMBOXContent(emails);
    await fs.writeFile(mboxPath, mboxContent);

    const instructionsPath = path.join(outputDir, 'IMPORT_INSTRUCTIONS.txt');
    const instructions = createInstructions(emailCount, outputDir);
    await fs.writeFile(instructionsPath, instructions);

    // Colorful success summary
    console.log(chalk.bold.green('\n╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.green('║') + chalk.bold.white('                 ✅ EXTRACTION COMPLETE!') + chalk.bold.green('                   ║'));
    console.log(chalk.bold.green('╚══════════════════════════════════════════════════════════════╝'));

    console.log(chalk.bold.cyan('\n📊 EXTRACTION SUMMARY:'));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('✓ ') + chalk.white(`Emails extracted: `) + chalk.yellow(`${emailCount}`));
    console.log(chalk.green('✓ ') + chalk.white(`Total attachments: `) + chalk.yellow(`${totalAttachments}`));
    if (skippedAttachments > 0) {
      console.log(chalk.yellow('⚠ ') + chalk.white(`Skipped attachments: `) + chalk.red(`${skippedAttachments} (corrupt/incompatible)`));
    } else {
      console.log(chalk.green('✓ ') + chalk.white(`Skipped attachments: `) + chalk.green('0'));
    }
    console.log(chalk.green('✓ ') + chalk.white(`Processing time: `) + chalk.yellow(`${totalTime.toFixed(1)}s`));
    console.log(chalk.green('✓ ') + chalk.white(`Speed: `) + chalk.yellow(`${emailsPerSecond.toFixed(1)} emails/sec`));

    console.log(chalk.bold.cyan('\n📁 OUTPUT FILES:'));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.magenta('📄 ') + chalk.white(`EML files: `) + chalk.cyan(`${path.join(outputDir, 'eml')}/`));
    console.log(chalk.magenta('📦 ') + chalk.white(`MBOX file: `) + chalk.cyan(mboxPath));
    console.log(chalk.magenta('💾 ') + chalk.white(`JSON backup: `) + chalk.cyan(jsonPath));
    console.log(chalk.magenta('📋 ') + chalk.white(`Instructions: `) + chalk.cyan(instructionsPath));

    console.log(chalk.bold.yellow('\n📖 NEXT STEPS:'));
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('1. ') + chalk.cyan('Import EML files to Outlook:'));
    console.log(chalk.gray('   └─ Drag & drop .eml files into Outlook folders'));
    console.log(chalk.white('2. ') + chalk.cyan('Import MBOX to Thunderbird:'));
    console.log(chalk.gray('   └─ Tools → ImportExportTools → Import mbox file'));
    console.log(chalk.white('3. ') + chalk.cyan('Create PST in Outlook:'));
    console.log(chalk.gray('   └─ After importing, File → Export → PST'));

    return { success: true, count: emailCount, outputDir, time: totalTime, speed: emailsPerSecond };

  } catch (error) {
    console.error(chalk.bold.red('\n❌ EXTRACTION FAILED'));
    console.error(chalk.red(`Error: ${error.message}`));
    if (verbose) {
      console.error(chalk.gray(error.stack));
    }
    return { success: false, error: error.message };
  }
}

function createEMLContent(email) {
  const date = email.date.toUTCString();
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const hasHTML = email.bodyHTML && email.bodyHTML.trim().length > 0;
  const hasAttachments = email.attachments && email.attachments.length > 0;
  
  // Clean email addresses
  const fromEmail = email.fromEmail || extractEmail(email.from) || 'unknown@example.com';
  const fromName = email.from.replace(/<.*>/, '').trim() || email.from;
  
  let content = '';
  
  // Headers with proper encoding
  content += `From: ${encodeHeader(fromName)} <${fromEmail}>\r\n`;
  content += `To: ${encodeHeader(email.to)}\r\n`;
  if (email.cc) content += `Cc: ${encodeHeader(email.cc)}\r\n`;
  content += `Subject: ${encodeHeader(email.subject)}\r\n`;
  content += `Date: ${date}\r\n`;
  content += `MIME-Version: 1.0\r\n`;
  
  // If we have attachments or HTML, use multipart
  if (hasAttachments || hasHTML) {
    content += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
    content += `\r\n`;
    content += `This is a multi-part message in MIME format.\r\n`;
    content += `\r\n`;
    
    // Body part (text and/or HTML)
    if (hasHTML) {
      const altBoundary = `----=_Part_Alt_${Date.now()}`;
      content += `--${boundary}\r\n`;
      content += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n`;
      content += `\r\n`;
      
      // Plain text version
      content += `--${altBoundary}\r\n`;
      content += `Content-Type: text/plain; charset=UTF-8\r\n`;
      content += `Content-Transfer-Encoding: quoted-printable\r\n`;
      content += `\r\n`;
      content += `${email.body || 'No plain text version available.'}\r\n`;
      content += `\r\n`;
      
      // HTML version
      content += `--${altBoundary}\r\n`;
      content += `Content-Type: text/html; charset=UTF-8\r\n`;
      content += `Content-Transfer-Encoding: quoted-printable\r\n`;
      content += `\r\n`;
      content += `${email.bodyHTML}\r\n`;
      content += `\r\n`;
      content += `--${altBoundary}--\r\n`;
    } else {
      // Plain text only
      content += `--${boundary}\r\n`;
      content += `Content-Type: text/plain; charset=UTF-8\r\n`;
      content += `Content-Transfer-Encoding: quoted-printable\r\n`;
      content += `\r\n`;
      content += `${email.body}\r\n`;
      content += `\r\n`;
    }
    
    // Attachments
    if (hasAttachments) {
      for (const attach of email.attachments) {
        if (attach.data) {
          content += `--${boundary}\r\n`;
          content += `Content-Type: ${attach.mimeType}; name="${attach.filename}"\r\n`;
          content += `Content-Transfer-Encoding: base64\r\n`;
          content += `Content-Disposition: attachment; filename="${attach.filename}"\r\n`;
          content += `\r\n`;
          
          // Base64 encode attachment
          const base64 = attach.data.toString('base64');
          // Split into 76-character lines
          for (let i = 0; i < base64.length; i += 76) {
            content += base64.substring(i, i + 76) + '\r\n';
          }
          content += `\r\n`;
        }
      }
    }
    
    content += `--${boundary}--\r\n`;
  } else {
    // Simple plain text message
    content += `Content-Type: text/plain; charset=UTF-8\r\n`;
    content += `Content-Transfer-Encoding: quoted-printable\r\n`;
    content += `\r\n`;
    content += `${email.body}\r\n`;
  }
  
  return content;
}

function extractEmail(str) {
  const match = str.match(/<([^>]+)>/);
  return match ? match[1] : str;
}

function encodeHeader(str) {
  if (!str) return '';
  
  // Check if string contains non-ASCII characters
  if (!/[^\x00-\x7F]/.test(str)) {
    return str; // Pure ASCII, no encoding needed
  }
  
  // RFC 2047 encoding for headers with UTF-8
  // Split by email addresses to preserve them
  return str.split(/([<>])/).map(part => {
    if (part === '<' || part === '>' || !part || /^[\x00-\x7F]*$/.test(part)) {
      return part;
    }
    // Encode non-ASCII parts
    const encoded = Buffer.from(part, 'utf8').toString('base64');
    return `=?UTF-8?B?${encoded}?=`;
  }).join('');
}

function createMBOXContent(emails) {
  let mbox = '';
  for (const email of emails) {
    const date = email.date.toString();
    mbox += `From - ${date}\n`;
    mbox += createEMLContent(email);
    mbox += '\n\n';
  }
  return mbox;
}

function createInstructions(count, outputDir) {
  return `
╔═══════════════════════════════════════════════════════════════════╗
║                 EMAIL EXTRACTION COMPLETE                         ║
╚═══════════════════════════════════════════════════════════════════╝

📊 EXTRACTION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total emails extracted: ${count}
Output directory: ${outputDir}/

📁 FILES CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ${outputDir}/eml/*.eml      - Individual email files
2. ${outputDir}/emails.mbox     - All emails in MBOX format
3. ${outputDir}/emails.json     - Structured data backup

📥 HOW TO IMPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 1: Import EML files to Microsoft Outlook
────────────────────────────────────────────────
1. Open Microsoft Outlook
2. Navigate to the folder where you want to import
3. Drag and drop the .eml files from ${outputDir}/eml/ folder
4. Outlook will import each email
5. After importing, create PST: File → Export → PST

METHOD 2: Import MBOX to Mozilla Thunderbird
─────────────────────────────────────────────
1. Install Thunderbird
2. Install "ImportExportTools NG" add-on
3. Tools → ImportExportTools NG → Import mbox file
4. Select ${outputDir}/emails.mbox
5. Choose destination folder

METHOD 3: Import to Gmail
──────────────────────────
1. Install "Got Your Back" (gyb) tool
2. Use gyb to upload MBOX to Gmail
3. Access via web or any email client

METHOD 4: Create PST using commercial tools
────────────────────────────────────────────
1. Use "Aid4Mail" to convert MBOX to PST
2. Use "MailStore Home" to archive and export
3. Use "Stellar Converter" for MBOX to PST

💡 RECOMMENDED WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Import EML files to Outlook
2. Organize emails in folders
3. Export to PST: File → Open & Export → Import/Export
4. Choose "Export to a file" → "Outlook Data File (.pst)"
5. Select folders to export
6. Save as .pst file

This gives you a WORKING, VALID PST file that opens in all readers!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by OST to PST Converter
For more information, see README.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

// CLI interface
const args = process.argv.slice(2);
const inputFile = args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 
                  args.find(arg => arg.startsWith('-i='))?.split('=')[1] || 
                  'example.ost';
const maxEmails = parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 100;
const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'extracted-emails';
const verbose = args.includes('--verbose') || args.includes('-v');

// Display usage if no valid input
if (!fs.existsSync(inputFile)) {
  console.error(chalk.red(`\n❌ Error: Input file not found: ${inputFile}\n`));
  console.log(chalk.cyan('Usage:'));
  console.log(chalk.white('  node extract-to-eml.js --input=<ost-file> [options]\n'));
  console.log(chalk.cyan('Options:'));
  console.log(chalk.white('  --input=<file>   Input OST file (required)'));
  console.log(chalk.white('  -i=<file>        Short form of --input'));
  console.log(chalk.white('  --max=<number>   Maximum emails to extract (default: 100)'));
  console.log(chalk.white('  --output=<dir>   Output directory (default: extracted-emails)'));
  console.log(chalk.white('  --verbose, -v    Show detailed attachment warnings\n'));
  console.log(chalk.cyan('Examples:'));
  console.log(chalk.gray('  node extract-to-eml.js --input=yourfile.ost --max=100 --output=my-emails'));
  console.log(chalk.gray('  node extract-to-eml.js -i=myfile.ost --max=500 --verbose\n'));
  process.exit(1);
}

extractEmailsFromOst(inputFile, { maxEmails, outputDir, verbose });
