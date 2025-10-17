const fs = require('fs-extra');
const path = require('path');

/**
 * Advanced OST File Structure Analyzer
 * Reads and parses actual OST internal structures
 */
class OstAnalyzer {
  constructor() {
    // OST/PST format constants based on Microsoft documentation
    this.CONSTANTS = {
      // File signatures
      OST_SIGNATURE: Buffer.from([0x21, 0x42, 0x44, 0x4E]), // !BDN
      
      // Header offsets (512 bytes total) - Corrected Microsoft PST/OST format
      HEADER: {
        SIGNATURE: 0,           // 4 bytes: !BDN
        CRC: 4,                 // 4 bytes: CRC32 of header
        MINOR_VERSION: 8,       // 2 bytes: Minor version
        MAJOR_VERSION: 10,      // 2 bytes: Major version (0x0E=PST, 0x0F=OST)
        CREATE_VERSION: 12,     // 2 bytes: Create version
        ACCESS_VERSION: 14,     // 2 bytes: Access version
        RESERVED1: 16,          // 28 bytes: Reserved
        TOTAL_FILE_SIZE: 44,    // 8 bytes: Total file size
        ALLOC_TABLE_SIZE: 52,   // 8 bytes: Allocation table size
        // Node Database (NDB) Layer
        ROOT_FOLDER: 60,        // 4 bytes: Root folder NID
        NBT_OFFSET: 64,         // 8 bytes: Node B-tree offset
        NBT_SIZE: 72,           // 8 bytes: Node B-tree size  
        LAST_LEAF_OFFSET: 80,   // 8 bytes: Last leaf page offset
        LAST_LEAF_SIZE: 88,     // 8 bytes: Last leaf page size
        // Block Database (BDB) Layer  
        BBT_OFFSET: 96,         // 8 bytes: Block B-tree offset
        BBT_SIZE: 104,          // 8 bytes: Block B-tree size
        DENSITY_PERCENT: 112,   // 1 byte: Density percent
        RESERVED2: 113,         // 3 bytes: Reserved
        CHECKSUM: 508,          // 4 bytes: File checksum
      },
      
      // B-tree node types
      BTREE_TYPES: {
        INTERMEDIATE: 0x80,    // Intermediate node
        LEAF: 0x81,           // Leaf node
        HEADER: 0x82          // Header node
      },
      
      // Block types
      BLOCK_TYPES: {
        DATA: 0x01,           // Data block
        BTREE: 0x02,          // B-tree block
        SUBNODES: 0x03        // Subnodes block
      }
    };
  }
  
  /**
   * Analyze OST file structure in detail
   */
  async analyzeOstFile(filePath) {
    console.log('🔍 Analyzing OST file structure...');
    
    const results = {
      header: null,
      nodeBTree: null,
      blockBTree: null,
      encryption: null,
      issues: []
    };
    
    try {
      // Read and parse header
      results.header = await this.parseHeader(filePath);
      
      // Parse Node B-Tree
      if (results.header.nbtOffset && results.header.nbtSize) {
        results.nodeBTree = await this.parseNodeBTree(filePath, results.header);
      }
      
      // Parse Block B-Tree  
      if (results.header.bbtOffset && results.header.bbtSize) {
        results.blockBTree = await this.parseBlockBTree(filePath, results.header);
      }
      
      // Analyze encryption
      results.encryption = await this.analyzeEncryption(filePath, results.header);
      
      return results;
      
    } catch (error) {
      results.issues.push(`Analysis error: ${error.message}`);
      return results;
    }
  }
  
  /**
   * Parse OST header structure
   */
  async parseHeader(filePath) {
    const headerBuffer = Buffer.alloc(512);
    const fd = await fs.open(filePath, 'r');
    
    try {
      await fs.read(fd, headerBuffer, 0, 512, 0);
      
      const header = {
        signature: headerBuffer.slice(0, 4),
        crc: headerBuffer.readUInt32LE(4),
        minorVersion: headerBuffer.readUInt16LE(8),
        majorVersion: headerBuffer.readUInt16LE(10),
        createVersion: headerBuffer.readUInt16LE(12), 
        accessVersion: headerBuffer.readUInt16LE(14),
        totalFileSize: this.readUInt64LE(headerBuffer, 44),
        allocTableSize: this.readUInt64LE(headerBuffer, 52),
        rootFolder: headerBuffer.readUInt32LE(60),
        nbtOffset: this.readUInt64LE(headerBuffer, 64),
        nbtSize: this.readUInt64LE(headerBuffer, 72),
        lastLeafOffset: this.readUInt64LE(headerBuffer, 80),
        lastLeafSize: this.readUInt64LE(headerBuffer, 88),  
        bbtOffset: this.readUInt64LE(headerBuffer, 96),
        bbtSize: this.readUInt64LE(headerBuffer, 104),
        densityPercent: headerBuffer[112],
        checksum: headerBuffer.readUInt32LE(508)
      };
      
      // Validate signature
      header.validSignature = header.signature.equals(this.CONSTANTS.OST_SIGNATURE);
      
      // Determine format based on major version
      header.isOst = header.majorVersion === 0x0F;
      header.isPst = header.majorVersion === 0x0E;
      header.isUnicode = header.majorVersion >= 0x17 || header.createVersion >= 0x17;
      
      return header;
      
    } finally {
      await fs.close(fd);
    }
  }
  
  /**
   * Parse Node B-Tree structure
   */
  async parseNodeBTree(filePath, header) {
    if (!header.nbtOffset || !header.nbtSize) {
      return { error: 'No Node B-Tree found' };
    }
    
    console.log(`📊 Parsing Node B-Tree at offset ${header.nbtOffset}, size ${header.nbtSize}`);
    
    const buffer = Buffer.alloc(header.nbtSize);
    const fd = await fs.open(filePath, 'r');
    
    try {
      await fs.read(fd, buffer, 0, header.nbtSize, Number(header.nbtOffset));
      
      // Parse B-tree header
      const btreeHeader = {
        nodeType: buffer[0],
        level: buffer[1],
        entryCount: buffer.readUInt16LE(2),
        maxEntries: buffer.readUInt16LE(4)
      };
      
      // Parse entries based on format
      const entries = [];
      let offset = 8; // Start after header
      
      for (let i = 0; i < btreeHeader.entryCount && offset < buffer.length - 16; i++) {
        const entry = this.parseNodeBTreeEntry(buffer, offset, header.isUnicode);
        if (entry) {
          entries.push(entry);
          offset += header.isUnicode ? 32 : 16; // Unicode entries are larger
        }
      }
      
      return {
        header: btreeHeader,
        entries: entries,
        totalEntries: entries.length
      };
      
    } finally {
      await fs.close(fd);
    }
  }
  
  /**
   * Parse individual Node B-Tree entry
   */
  parseNodeBTreeEntry(buffer, offset, isUnicode) {
    if (offset + (isUnicode ? 32 : 16) > buffer.length) {
      return null;
    }
    
    try {
      const entry = {
        nodeId: buffer.readUInt32LE(offset),
        blockId: buffer.readUInt32LE(offset + 4),
        parentNodeId: buffer.readUInt32LE(offset + 8),
        subNodeId: buffer.readUInt32LE(offset + 12)
      };
      
      if (isUnicode) {
        // Unicode format has additional fields
        entry.blockOffset = this.readUInt64LE(buffer, offset + 16);
        entry.blockSize = buffer.readUInt32LE(offset + 24);
        entry.refCount = buffer.readUInt16LE(offset + 28);
      }
      
      return entry;
      
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Parse Block B-Tree structure  
   */
  async parseBlockBTree(filePath, header) {
    if (!header.bbtOffset || !header.bbtSize) {
      return { error: 'No Block B-Tree found' };
    }
    
    console.log(`📦 Parsing Block B-Tree at offset ${header.bbtOffset}, size ${header.bbtSize}`);
    
    const buffer = Buffer.alloc(header.bbtSize);
    const fd = await fs.open(filePath, 'r');
    
    try {
      await fs.read(fd, buffer, 0, header.bbtSize, Number(header.bbtOffset));
      
      const btreeHeader = {
        nodeType: buffer[0],
        level: buffer[1], 
        entryCount: buffer.readUInt16LE(2),
        maxEntries: buffer.readUInt16LE(4)
      };
      
      const entries = [];
      let offset = 8;
      
      for (let i = 0; i < btreeHeader.entryCount && offset < buffer.length - 20; i++) {
        const entry = this.parseBlockBTreeEntry(buffer, offset, header.isUnicode);
        if (entry) {
          entries.push(entry);
          offset += header.isUnicode ? 24 : 16;
        }
      }
      
      return {
        header: btreeHeader,
        entries: entries,
        totalBlocks: entries.length
      };
      
    } finally {
      await fs.close(fd);
    }
  }
  
  /**
   * Parse Block B-Tree entry
   */
  parseBlockBTreeEntry(buffer, offset, isUnicode) {
    if (offset + (isUnicode ? 24 : 16) > buffer.length) {
      return null;
    }
    
    try {
      const entry = {
        blockId: buffer.readUInt32LE(offset),
        blockOffset: this.readUInt64LE(buffer, offset + 4),
        blockSize: buffer.readUInt32LE(offset + 12),
        blockType: buffer[offset + 16] || 0
      };
      
      if (isUnicode) {
        entry.refCount = buffer.readUInt32LE(offset + 20);
      }
      
      return entry;
      
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Analyze encryption and compression
   */
  async analyzeEncryption(filePath, header) {
    return {
      encryptionType: header.encryptionType,
      isEncrypted: header.encryptionType !== 0,
      compressionDetected: false, // TODO: Implement compression detection
      notes: header.encryptionType !== 0 ? 
        'File appears to be encrypted - will need decryption' : 
        'No encryption detected'
    };
  }
  
  /**
   * Helper to read 64-bit little-endian integers
   */
  readUInt64LE(buffer, offset) {
    const low = buffer.readUInt32LE(offset);
    const high = buffer.readUInt32LE(offset + 4);
    return high * 0x100000000 + low;
  }
  
  /**
   * Print analysis results
   */
  printAnalysis(results) {
    console.log('\n📋 OST Analysis Results');
    console.log('=====================');
    
    if (results.header) {
      console.log('\n📄 Header Information:');
      console.log(`  Signature Valid: ${results.header.validSignature}`);
      console.log(`  File Type: ${results.header.isOst ? 'OST' : results.header.isPst ? 'PST' : 'Unknown'} (Major Version: 0x${results.header.majorVersion.toString(16)})`);
      console.log(`  Format: ${results.header.isUnicode ? 'Unicode' : 'ANSI'}`);
      console.log(`  File Size: ${(Number(results.header.totalFileSize) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Create Version: 0x${results.header.createVersion.toString(16)}`);
      console.log(`  Access Version: 0x${results.header.accessVersion.toString(16)}`);
      console.log(`  Root Folder NID: ${results.header.rootFolder}`);
    }
    
    if (results.nodeBTree) {
      console.log('\n🌳 Node B-Tree:');
      console.log(`  Entry Count: ${results.nodeBTree.totalEntries}`);
      console.log(`  Node Type: ${results.nodeBTree.header?.nodeType}`);
      console.log(`  Level: ${results.nodeBTree.header?.level}`);
    }
    
    if (results.blockBTree) {
      console.log('\n📦 Block B-Tree:');
      console.log(`  Block Count: ${results.blockBTree.totalBlocks}`);
      console.log(`  Node Type: ${results.blockBTree.header?.nodeType}`);
      console.log(`  Level: ${results.blockBTree.header?.level}`);
    }
    
    if (results.encryption) {
      console.log('\n🔐 Encryption Analysis:');
      console.log(`  Encrypted: ${results.encryption.isEncrypted}`);
      console.log(`  Notes: ${results.encryption.notes}`);
    }
    
    if (results.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      results.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }
}

module.exports = OstAnalyzer;