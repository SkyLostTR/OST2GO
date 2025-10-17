/**
 * OST2GO - Extract Single Attachment Debug Tool
 * 
 * Extract a specific attachment with detailed debugging
 * 
 * @author SkyLostTR (@Keeftraum)
 * @repository https://github.com/SkyLostTR/OST2GO
 */

const { PSTFile } = require('pst-extractor');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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
let outputPath = null;
let emailNumber = 4431; // Default
let searchTerm = 'your-term.pdf'; // Default

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-i' && i + 1 < args.length) {
    ostPath = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '-o' && i + 1 < args.length) {
    outputPath = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '-e' && i + 1 < args.length) {
    emailNumber = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '-s' && i + 1 < args.length) {
    searchTerm = args[i + 1].toLowerCase();
    i++;
  }
}

// Show usage if required args missing
if (!ostPath || !outputPath) {
  console.log('Usage: node extract-single-attachment.js -i <ost-file> -o <output-file> [-e <email-number>] [-s <search-term>]');
  console.log('');
  console.log('Options:');
  console.log('  -i <ost-file>      Input OST/PST file path (required)');
  console.log('  -o <output-file>   Output file path (required)');
  console.log('  -e <email-number>  Email number to extract from (default: 4431)');
  console.log('  -s <search-term>   Search term for attachment filename (default: your-term.pdf)');
  console.log('');
  console.log('Example:');
  console.log('  node extract-single-attachment.js -i data/your-file.ost -o data/extracted-pdf.pdf');
  console.log('  node extract-single-attachment.js -i data/your-file.ost -o data/invoice.pdf -e 100 -s invoice.pdf');
  process.exit(1);
}

console.log(`🔍 Opening OST file: ${ostPath}`);
console.log(`📁 Looking for Email #${emailNumber} with attachment matching: ${searchTerm}`);
console.log(`📄 Output file: ${outputPath}`);
console.log();

const pstFile = new PSTFile(ostPath);
console.log(`🔐 PST Encryption Type: ${pstFile.encryptionType}`);
console.log(`   (0=None, 1=Compressible Encryption, 2=High Encryption)`);
console.log();

const rootFolder = pstFile.getRootFolder();

let emailCount = 0;
let found = false;

function searchFolder(folder) {
  if (found) return;
  
  if (folder.contentCount > 0) {
    let msg = folder.getNextChild();
    while (msg && !found) {
      try {
        emailCount++;
        
        if (emailCount === emailNumber) {
          console.log(`✅ Found Email #${emailNumber}!`);
          console.log(`📧 Subject: ${msg.subject}`);
          console.log(`👤 From: ${msg.senderName} <${msg.senderEmailAddress}>`);
          console.log(`📎 Attachments: ${msg.numberOfAttachments}`);
          console.log();
          
          // Find the PDF attachment
          for (let i = 0; i < msg.numberOfAttachments; i++) {
            const attach = msg.getAttachment(i);
            const filename = attach.longFilename || attach.filename || `attachment${i}`;
            
            console.log(`\n📎 Attachment ${i + 1}: ${filename}`);
            console.log(`   Type: ${attach.mimeTag || 'Unknown'}`);
            console.log(`   Size (reported): ${attach.attachSize || 0} bytes`);
            console.log(`   Method: ${attach.attachMethod} (1=by-value, 5=embedded, 6=by-ref)`);
            
            if (filename.toLowerCase().includes(searchTerm)) {
              console.log(`\n🎯 This is the attachment we're looking for!`);
              console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
              console.log(`Attempting extraction with multiple methods...`);
              console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
              
              let attachData = null;
              
              // METHOD 1: Try fileInputStream with manual block reading
              console.log(`\n[Method 1] Trying fileInputStream with direct block access...`);
              try {
                const stream = attach.fileInputStream;
                if (stream) {
                  console.log(`   ✓ Stream obtained`);
                  console.log(`   ✓ Stream length: ${stream.length.toNumber()} bytes`);
                  console.log(`   ✓ Stream encrypted: ${stream.encrypted}`);
                  console.log(`   ✓ Stream has allData: ${stream.allData !== null}`);
                  console.log(`   ✓ Stream index items: ${stream.indexItems ? stream.indexItems.length : 0}`);
                  
                  // Try to access allData directly (after decompression)
                  if (stream.allData && stream.allData.length > 0) {
                    attachData = stream.allData;
                    console.log(`   ✅ SUCCESS! Got ${attachData.length} bytes from stream.allData`);
                  } else if (stream.indexItems && stream.indexItems.length > 0) {
                    // Read blocks manually
                    console.log(`   ✓ Reading ${stream.indexItems.length} index items manually...`);
                    const chunks = [];
                    let totalSize = 0;
                    
                    for (let idx = 0; idx < stream.indexItems.length; idx++) {
                      const item = stream.indexItems[idx];
                      try {
                        const blockBuffer = Buffer.alloc(item.size);
                        pstFile.seek(item.fileOffset);
                        pstFile.readCompletely(blockBuffer);
                        
                        // Check if compressed
                        if (blockBuffer.length > 2 && blockBuffer[0] === 0x78 && blockBuffer[1] === 0x9c) {
                          try {
                            const decompressed = zlib.unzipSync(blockBuffer);
                            chunks.push(decompressed);
                            totalSize += decompressed.length;
                            console.log(`   ✓ Block ${idx + 1}: decompressed ${blockBuffer.length} → ${decompressed.length} bytes`);
                          } catch (err) {
                            chunks.push(blockBuffer);
                            totalSize += blockBuffer.length;
                            console.log(`   ⚠️  Block ${idx + 1}: decompression failed, using raw`);
                          }
                        } else {
                          chunks.push(blockBuffer);
                          totalSize += blockBuffer.length;
                          console.log(`   ✓ Block ${idx + 1}: ${blockBuffer.length} bytes (not compressed)`);
                        }
                      } catch (blockErr) {
                        console.log(`   ❌ Block ${idx + 1} error: ${blockErr.message}`);
                      }
                    }
                    
                    if (chunks.length > 0) {
                      attachData = Buffer.concat(chunks, totalSize);
                      console.log(`   ✅ SUCCESS! Assembled ${attachData.length} bytes from ${chunks.length} blocks`);
                    }
                  } else {
                    // Try normal stream reading
                    const chunks = [];
                    let totalSize = 0;
                    const bufferSize = 8176;
                    const buffer = Buffer.alloc(bufferSize);

                    try {
                      let bytesRead = stream.read(buffer);
                      let readCount = 0;
                      while (bytesRead > 0) {
                        chunks.push(Buffer.from(buffer.slice(0, bytesRead)));
                        totalSize += bytesRead;
                        readCount++;
                        bytesRead = stream.read(buffer);
                      }
                      
                      if (totalSize > 0) {
                        attachData = Buffer.concat(chunks, totalSize);
                        console.log(`   ✅ SUCCESS! Extracted ${attachData.length} bytes in ${readCount} reads`);
                      } else {
                        console.log(`   ❌ Stream returned 0 bytes`);
                      }
                    } catch (zlibErr) {
                      console.log(`   ❌ Stream read error: ${zlibErr.message}`);
                    }
                  }
                } else {
                  console.log(`   ❌ No stream available`);
                }
              } catch (streamErr) {
                console.log(`   ❌ Error getting stream: ${streamErr.message}`);
              }
              
              // METHOD 2: Try direct property access
              if (!attachData || attachData.length < 100) {
                console.log(`\n[Method 2] Trying direct property table access...`);
                try {
                  const dataProperty = attach.pstTableItems?.get(0x3701); // PR_ATTACH_DATA_BIN
                  console.log(`   Property 0x3701 found: ${!!dataProperty}`);
                  
                  if (dataProperty) {
                    console.log(`   Property is external reference: ${dataProperty.isExternalValueReference}`);
                    console.log(`   Entry value type: 0x${dataProperty.entryValueType?.toString(16)}`);
                    console.log(`   Entry value reference: ${dataProperty.entryValueReference}`);
                    
                    if (dataProperty.isExternalValueReference) {
                      const Long = require('long');
                      const descriptorItem = attach.localDescriptorItems?.get(dataProperty.entryValueReference);
                      console.log(`   Descriptor item found: ${!!descriptorItem}`);
                      
                      if (descriptorItem) {
                        console.log(`   Descriptor offset ID: ${descriptorItem.offsetIndexIdentifier}`);
                        console.log(`   Descriptor data size: ${descriptorItem.dataSize}`);
                        
                        const offsetId = Long.isLong(descriptorItem.offsetIndexIdentifier) 
                          ? descriptorItem.offsetIndexIdentifier 
                          : Long.fromNumber(descriptorItem.offsetIndexIdentifier);
                        
                        const offsetItem = pstFile.getOffsetIndexNode(offsetId);
                        console.log(`   Offset item found: ${!!offsetItem}`);
                        
                        if (offsetItem) {
                          console.log(`   Offset item size: ${offsetItem.size} bytes`);
                          console.log(`   File offset: ${offsetItem.fileOffset}`);
                          
                          const rawBuffer = Buffer.alloc(offsetItem.size);
                          pstFile.seek(offsetItem.fileOffset);
                          pstFile.readCompletely(rawBuffer);
                          
                          console.log(`   ✓ Read ${rawBuffer.length} bytes from file`);
                          console.log(`   First bytes: ${rawBuffer.slice(0, 16).toString('hex')}`);
                          
                          // Check if this is a block descriptor (xblock/xxblock)
                          if (rawBuffer[0] === 0x01) {
                            console.log(`   ✓ Detected block descriptor (xblock/xxblock)`);
                            const blockType = rawBuffer[0];
                            const level = rawBuffer[1];
                            const Long = require('long');
                            
                            // Read the total size from bytes 4-11
                            const totalSize = Long.fromBytesLE(Array.from(rawBuffer.slice(4, 12))).toNumber();
                            console.log(`   Block type: ${blockType}, Level: ${level}`);
                            console.log(`   Total data size: ${totalSize} bytes`);
                            
                            // Parse block entries starting at offset 16
                            const entries = [];
                            let offset = 16;
                            while (offset < rawBuffer.length - 8) {
                              const blockId = Long.fromBytesLE(Array.from(rawBuffer.slice(offset, offset + 8)));
                              if (blockId.isZero()) break;
                              entries.push(blockId);
                              offset += 8;
                            }
                            
                            console.log(`   Found ${entries.length} block entries`);
                            
                            // Read all blocks
                            const allChunks = [];
                            let totalRead = 0;
                            
                            for (let i = 0; i < entries.length; i++) {
                              try {
                                const blockOffsetItem = pstFile.getOffsetIndexNode(entries[i]);
                                if (blockOffsetItem) {
                                  const blockData = Buffer.alloc(blockOffsetItem.size);
                                  pstFile.seek(blockOffsetItem.fileOffset);
                                  pstFile.readCompletely(blockData);
                                  
                                  // Check if this block is compressed
                                  if (blockData.length > 2 && blockData[0] === 0x78 && blockData[1] === 0x9c) {
                                    try {
                                      const decompressed = zlib.unzipSync(blockData);
                                      allChunks.push(decompressed);
                                      totalRead += decompressed.length;
                                      console.log(`   ✓ Block ${i + 1}/${entries.length}: decompressed ${blockData.length} → ${decompressed.length} bytes`);
                                    } catch (err) {
                                      allChunks.push(blockData);
                                      totalRead += blockData.length;
                                      console.log(`   ⚠️  Block ${i + 1}/${entries.length}: decompression failed, using raw ${blockData.length} bytes`);
                                    }
                                  } else {
                                    allChunks.push(blockData);
                                    totalRead += blockData.length;
                                    console.log(`   ✓ Block ${i + 1}/${entries.length}: read ${blockData.length} bytes`);
                                  }
                                }
                              } catch (blockErr) {
                                console.log(`   ❌ Block ${i + 1} error: ${blockErr.message}`);
                              }
                            }
                            
                            if (allChunks.length > 0) {
                              attachData = Buffer.concat(allChunks, totalRead);
                              console.log(`   ✅ SUCCESS! Assembled ${attachData.length} bytes from ${allChunks.length} blocks`);
                            }
                          }
                          // Check if directly compressed
                          else if (rawBuffer.length > 2 && rawBuffer[0] === 0x78 && rawBuffer[1] === 0x9c) {
                            console.log(`   ✓ Data is zlib compressed`);
                            
                            try {
                              attachData = zlib.unzipSync(rawBuffer);
                              console.log(`   ✅ SUCCESS! Decompressed to ${attachData.length} bytes using unzipSync`);
                            } catch (unzipErr) {
                              console.log(`   ⚠️  unzipSync failed: ${unzipErr.message}`);
                              
                              try {
                                attachData = zlib.inflateSync(rawBuffer);
                                console.log(`   ✅ SUCCESS! Decompressed to ${attachData.length} bytes using inflateSync`);
                              } catch (inflateErr) {
                                console.log(`   ❌ inflateSync failed: ${inflateErr.message}`);
                                console.log(`   ⚠️  Using raw compressed data (${rawBuffer.length} bytes)`);
                                attachData = rawBuffer;
                              }
                            }
                          } else {
                            console.log(`   ✓ Data is NOT compressed (or different format)`);
                            attachData = rawBuffer;
                            console.log(`   ✅ Using raw uncompressed data (${attachData.length} bytes)`);
                          }
                        }
                      }
                    } else if (dataProperty.data) {
                      console.log(`   ✓ Data is internal (inline)`);
                      attachData = dataProperty.data;
                      console.log(`   ✅ Got ${attachData.length} bytes from inline data`);
                    }
                  }
                } catch (propErr) {
                  console.log(`   ❌ Property access error: ${propErr.message}`);
                  console.error(propErr);
                }
              }
              
              // Save the file
              console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
              if (attachData && attachData.length > 0) {
                fs.writeFileSync(outputPath, attachData);
                console.log(`✅ PDF saved to: ${outputPath}`);
                console.log(`📊 File size: ${attachData.length} bytes`);
                
                // Check if it's a valid PDF
                const header = attachData.slice(0, 5).toString();
                if (header === '%PDF-') {
                  console.log(`✅ Valid PDF header detected!`);
                } else {
                  console.log(`⚠️  Warning: File doesn't start with PDF header`);
                  console.log(`   First bytes: ${attachData.slice(0, 20).toString('hex')}`);
                  console.log(`   As text: ${attachData.slice(0, 20).toString('ascii')}`);
                }
              } else {
                console.log(`❌ Failed to extract attachment data`);
              }
              console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
              
              found = true;
              return;
            }
          }
        }
      } catch (err) {
        // Skip
      }

      msg = folder.getNextChild();
    }
  }

  if (!found && folder.hasSubfolders) {
    const subfolders = folder.getSubFolders();
    for (const subfolder of subfolders) {
      searchFolder(subfolder);
      if (found) break;
    }
  }
}

searchFolder(rootFolder);

if (!found) {
  console.log(`❌ Email #${emailNumber} not found or attachment matching "${searchTerm}" not found`);
}
