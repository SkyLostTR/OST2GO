const fs = require('fs');

/**
 * Better OST Format Parser based on libpst and Microsoft documentation
 */
class OstFormatParser {
  constructor() {
    // PST format constants from libpst and Microsoft docs
    this.CONSTANTS = {
      // Signatures
      PST_SIGNATURE: 0x4E44422D, // "!BDN" as little endian
      
      // Format versions (wVer field at offset 10)
      PST_VER_ANSI: 14,         // 0x0E
      PST_VER_ANSI_2: 15,       // 0x0F  
      PST_VER_UNICODE: 23,      // 0x17
      PST_VER_UNICODE_2003: 36, // 0x24
      
      // Header layout for different versions
      ANSI_HEADER_SIZE: 516,
      UNICODE_HEADER_SIZE: 564,
      
      // Common offsets (all formats)
      OFFSET_SIGNATURE: 0,      // 4 bytes
      OFFSET_CRC: 4,            // 4 bytes
      OFFSET_VER: 10,           // 2 bytes
      
      // ANSI format offsets
      ANSI: {
        TOTAL_SIZE: 44,         // 4 bytes (not 8!)
        NBT_OFFSET: 60,         // 4 bytes 
        NBT_SIZE: 64,           // 4 bytes
        BBT_OFFSET: 68,         // 4 bytes
        BBT_SIZE: 72,           // 4 bytes
      },
      
      // Unicode format offsets  
      UNICODE: {
        TOTAL_SIZE: 44,         // 8 bytes
        NBT_OFFSET: 240,        // 8 bytes
        NBT_SIZE: 248,          // 8 bytes
        BBT_OFFSET: 256,        // 8 bytes
        BBT_SIZE: 264,          // 8 bytes
      }
    };
  }
  
  /**
   * Parse OST/PST header with proper format detection
   */
  async parseHeader(filePath) {
    console.log(`📋 Reading header from ${filePath}...`);
    const buffer = Buffer.alloc(600); // Read more to handle both formats
    const fd = await fs.promises.open(filePath, 'r');
    
    try {
      await fd.read(buffer, 0, 600, 0);
      
      // Basic validation
      const signature = buffer.readUInt32LE(0);
      console.log(`🔍 Read signature: 0x${signature.toString(16)}`);
      
      // The signature should be "!BDN" but let's be more flexible
      const sigBytes = buffer.slice(0, 4);
      const sigString = sigBytes.toString('ascii');
      console.log(`📝 Signature string: "${sigString}"`);
      
      if (sigString !== '!BDN') {
        console.warn(`⚠️  Non-standard signature: "${sigString}" (continuing anyway)`);
      }
      
      // Get format version
      const version = buffer.readUInt16LE(10);
      const isUnicode = version >= 23;
      
      console.log(`📋 Detected format: ${isUnicode ? 'Unicode' : 'ANSI'} (version ${version}/0x${version.toString(16)})`);
      
      let header;
      
      if (isUnicode) {
        header = this.parseUnicodeHeader(buffer);
      } else {
        header = this.parseAnsiHeader(buffer);
      }
      
      header.version = version;
      header.isUnicode = isUnicode;
      header.signature = signature;
      
      return header;
      
    } finally {
      await fd.close();
    }
  }
  
  /**
   * Parse ANSI format header (Outlook 97-2002)
   */
  parseAnsiHeader(buffer) {
    return {
      format: 'ANSI',
      totalSize: buffer.readUInt32LE(this.CONSTANTS.ANSI.TOTAL_SIZE),
      nbtOffset: buffer.readUInt32LE(this.CONSTANTS.ANSI.NBT_OFFSET),
      nbtSize: buffer.readUInt32LE(this.CONSTANTS.ANSI.NBT_SIZE),
      bbtOffset: buffer.readUInt32LE(this.CONSTANTS.ANSI.BBT_OFFSET),
      bbtSize: buffer.readUInt32LE(this.CONSTANTS.ANSI.BBT_SIZE),
    };
  }
  
  /**
   * Parse Unicode format header (Outlook 2003+)
   */
  parseUnicodeHeader(buffer) {
    return {
      format: 'Unicode',
      totalSize: this.readUInt64LE(buffer, this.CONSTANTS.UNICODE.TOTAL_SIZE),
      nbtOffset: this.readUInt64LE(buffer, this.CONSTANTS.UNICODE.NBT_OFFSET),
      nbtSize: this.readUInt64LE(buffer, this.CONSTANTS.UNICODE.NBT_SIZE),
      bbtOffset: this.readUInt64LE(buffer, this.CONSTANTS.UNICODE.BBT_OFFSET),
      bbtSize: this.readUInt64LE(buffer, this.CONSTANTS.UNICODE.BBT_SIZE),
    };
  }
  
  /**
   * Safe 64-bit read for JavaScript
   */
  readUInt64LE(buffer, offset) {
    const low = buffer.readUInt32LE(offset);
    const high = buffer.readUInt32LE(offset + 4);
    
    // Check if the value is too large for JavaScript numbers
    if (high > 0x1FFFFF) {
      return `0x${high.toString(16).padStart(8, '0')}${low.toString(16).padStart(8, '0')} (too large)`;
    }
    
    return high * 0x100000000 + low;
  }
  
  /**
   * Find data patterns in the file to locate actual structures
   */
  async findDataPatterns(filePath) {
    const fd = await fs.promises.open(filePath, 'r');
    const stats = await fd.stat();
    const fileSize = stats.size;
    
    console.log(`🔍 Scanning ${Math.round(fileSize/1024/1024)}MB file for B-tree patterns...`);
    
    const chunkSize = 64 * 1024; // 64KB chunks
    const buffer = Buffer.alloc(chunkSize);
    const patterns = [];
    
    try {
      for (let offset = 0; offset < fileSize; offset += chunkSize) {
        const { bytesRead } = await fd.read(buffer, 0, chunkSize, offset);
        
        // Look for B-tree node signatures
        for (let i = 0; i < bytesRead - 4; i++) {
          const sig = buffer.readUInt32LE(i);
          
          // Common B-tree node signatures
          if (sig === 0x01010101 || sig === 0x02020202 || 
              sig === 0x80808080 || sig === 0x81818181) {
            patterns.push({
              offset: offset + i,
              signature: `0x${sig.toString(16)}`,
              type: this.guessNodeType(sig)
            });
          }
        }
        
        // Progress indicator
        if (offset % (10 * 1024 * 1024) === 0) {
          process.stdout.write(`\r📊 Scanned ${Math.round(offset/1024/1024)}MB...`);
        }
      }
      
      console.log(`\n🎯 Found ${patterns.length} potential B-tree nodes`);
      return patterns.slice(0, 50); // Return first 50 matches
      
    } finally {
      await fd.close();
    }
  }
  
  /**
   * Guess node type from signature
   */
  guessNodeType(signature) {
    switch(signature) {
      case 0x01010101: return 'Data Block';
      case 0x02020202: return 'B-tree Block';  
      case 0x80808080: return 'Intermediate Node';
      case 0x81818181: return 'Leaf Node';
      default: return 'Unknown';
    }
  }
  
  /**
   * Try to read actual email data from known locations
   */
  async sampleEmailData(filePath, patterns) {
    if (patterns.length === 0) return [];
    
    console.log('📧 Sampling email data from discovered patterns...');
    
    const fd = await fs.promises.open(filePath, 'r');
    const samples = [];
    
    try {
      // Check a few promising locations
      for (let i = 0; i < Math.min(5, patterns.length); i++) {
        const pattern = patterns[i];
        const buffer = Buffer.alloc(1024);
        
        await fd.read(buffer, 0, 1024, pattern.offset);
        
        // Look for email-like strings
        const text = buffer.toString('utf8', 0, 1024);
        const emailIndicators = [
          'From:', 'To:', 'Subject:', 'Date:', 
          '@', '.com', '.org', 'Received:',
          'Message-ID:', 'Content-Type:'
        ];
        
        let score = 0;
        const matches = [];
        
        for (const indicator of emailIndicators) {
          if (text.toLowerCase().includes(indicator.toLowerCase())) {
            score++;
            matches.push(indicator);
          }
        }
        
        if (score > 2) {
          samples.push({
            offset: pattern.offset,
            score: score,
            matches: matches,
            preview: text.substring(0, 200).replace(/[\x00-\x1F]/g, '.')
          });
        }
      }
      
      return samples;
      
    } finally {
      await fd.close();
    }
  }
}

module.exports = OstFormatParser;