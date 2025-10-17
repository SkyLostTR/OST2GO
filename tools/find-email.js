/**
 * OST2GO - Email Finder Tool
 * 
 * Find specific emails by sender or subject
 * 
 * @author SkyLostTR (@Keeftraum)
 * @repository https://github.com/SkyLostTR/OST2GO
 */

const { PSTFile } = require('pst-extractor');
const path = require('path');

// Suppress compression error messages
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

// Parse command-line arguments
const args = process.argv.slice(2);
let ostPath = null;
let searchTerm = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-i' && i + 1 < args.length) {
    ostPath = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '-s' && i + 1 < args.length) {
    searchTerm = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '-h' || args[i] === '--help') {
    console.log('OST2GO - Email Finder Tool');
    console.log('');
    console.log('Usage: node find-email.js -i <ost-file> -s <search-term>');
    console.log('');
    console.log('Options:');
    console.log('  -i <ost-file>    Input OST/PST file path (required)');
    console.log('  -s <search-term> Search term to find in emails (required)');
    console.log('  -h, --help       Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node find-email.js -i data/your-file.ost -s "term"');
    console.log('  node find-email.js -i data/your-file.ost -s "your-term içeriği"');
    console.log('');
    console.log('The tool will search for emails where the search term appears in:');
    console.log('  - Subject line');
    console.log('  - Sender name');
    console.log('  - Sender email address');
    console.log('  - Recipients (To field)');
    process.exit(0);
  }
}

// Show usage if required args missing
if (!ostPath || !searchTerm) {
  console.log('Usage: node find-email.js -i <ost-file> -s <search-term>');
  console.log('');
  console.log('Options:');
  console.log('  -i <ost-file>    Input OST/PST file path (required)');
  console.log('  -s <search-term> Search term to find in emails (required)');
  console.log('  -h, --help       Show this help message');
  console.log('');
  console.log('Example:');
  console.log('  node find-email.js -i data/your-file.ost -s "term"');
  process.exit(1);
}

console.log(`🔍 Searching for emails matching: "${searchTerm}"`);
console.log(`📁 OST file: ${ostPath}`);
console.log();

const pstFile = new PSTFile(ostPath);
const rootFolder = pstFile.getRootFolder();

let foundCount = 0;
let totalScanned = 0;

function searchFolder(folder, folderPath = '') {
  const currentPath = folderPath ? `${folderPath}/${folder.displayName}` : folder.displayName;

  if (folder.contentCount > 0) {
    let msg = folder.getNextChild();
    while (msg) {
      try {
        totalScanned++;
        
        const subject = (msg.subject || '').toLowerCase();
        const from = (msg.senderName || '').toLowerCase();
        const fromEmail = (msg.senderEmailAddress || '').toLowerCase();
        const to = (msg.displayTo || '').toLowerCase();
        
        if (subject.includes(searchTerm) || from.includes(searchTerm) || 
            fromEmail.includes(searchTerm) || to.includes(searchTerm)) {
          foundCount++;
          
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📧 Match #${foundCount} (Email #${totalScanned})`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📁 Folder: ${currentPath}`);
          console.log(`📨 Subject: ${msg.subject || 'No Subject'}`);
          console.log(`👤 From: ${msg.senderName || 'Unknown'} <${msg.senderEmailAddress || ''}>`);
          console.log(`📮 To: ${msg.displayTo || ''}`);
          console.log(`📅 Date: ${msg.messageDeliveryTime ? new Date(msg.messageDeliveryTime).toLocaleString() : 'Unknown'}`);
          console.log(`📎 Attachments: ${msg.numberOfAttachments || 0}`);
          
          if (msg.numberOfAttachments > 0) {
            console.log(`\n📎 Attachment Details:`);
            for (let i = 0; i < msg.numberOfAttachments; i++) {
              try {
                const attach = msg.getAttachment(i);
                if (attach) {
                  console.log(`  ${i + 1}. ${attach.longFilename || attach.filename || 'Unknown'}`);
                  console.log(`     Type: ${attach.mimeTag || 'Unknown'}`);
                  console.log(`     Size: ${attach.attachSize || 0} bytes`);
                  console.log(`     Method: ${attach.attachMethod || 'Unknown'} (1=by-value, 5=embedded, 6=by-ref)`);
                  
                  // Try to extract the attachment
                  let extracted = false;
                  let extractionMethod = '';
                  
                  // Method 1: Try fileInputStream
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
                          console.log(`     ✅ Extracted successfully! (${totalSize} bytes) [stream method]`);
                          extracted = true;
                          extractionMethod = 'stream';
                        }
                      } catch (zlibErr) {
                        console.log(`     ⚠️  Compression error: ${zlibErr.message}`);
                      }
                    }
                  } catch (streamErr) {
                    console.log(`     ⚠️  Stream error: ${streamErr.message}`);
                  }
                  
                  // Method 2: Try attachDataBinary
                  if (!extracted && attach.attachDataBinary) {
                    try {
                      const size = attach.attachDataBinary.length;
                      console.log(`     ✅ Extracted successfully! (${size} bytes) [binary method]`);
                      extracted = true;
                      extractionMethod = 'binary';
                    } catch (binaryErr) {
                      console.log(`     ⚠️  Binary method error: ${binaryErr.message}`);
                    }
                  }
                  
                  // Method 3: Try property access
                  if (!extracted) {
                    try {
                      const dataProperty = attach.pstTableItems?.get(0x3701);
                      if (dataProperty && dataProperty.data) {
                        console.log(`     ✅ Extracted successfully! (${dataProperty.data.length} bytes) [property method]`);
                        extracted = true;
                        extractionMethod = 'property';
                      }
                    } catch (propErr) {
                      // Silent fail
                    }
                  }
                  
                  if (!extracted) {
                    console.log(`     ❌ All extraction methods failed`);
                  }
                }
              } catch (e) {
                console.log(`  ${i + 1}. ❌ Error reading attachment: ${e.message}`);
              }
            }
          }
          
          // Show a snippet of the body
          if (msg.body && msg.body.length > 0) {
            const bodySnippet = msg.body.substring(0, 200).replace(/\s+/g, ' ').trim();
            console.log(`\n📄 Body snippet: ${bodySnippet}${msg.body.length > 200 ? '...' : ''}`);
          }
        }
        
        if (totalScanned % 1000 === 0) {
          process.stdout.write(`\r⏳ Scanned: ${totalScanned} emails, Found: ${foundCount} matches`);
        }
      } catch (err) {
        // Skip problematic emails
      }

      msg = folder.getNextChild();
    }
  }

  if (folder.hasSubfolders) {
    const subfolders = folder.getSubFolders();
    for (const subfolder of subfolders) {
      searchFolder(subfolder, currentPath);
    }
  }
}

searchFolder(rootFolder);

console.log(`\n\n✅ Search complete!`);
console.log(`📊 Total scanned: ${totalScanned} emails`);
console.log(`🎯 Found: ${foundCount} matches`);
