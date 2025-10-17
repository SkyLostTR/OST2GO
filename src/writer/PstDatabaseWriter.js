const fs = require('fs-extra');
const crypto = require('crypto');

/**
 * PST Database Writer - Creates proper PST files from scratch
 * Based on Microsoft's PST format specification and libpst
 */
class PstDatabaseWriter {
  constructor() {
    this.PST_CONSTANTS = {
      // File signature
      SIGNATURE: Buffer.from([0x21, 0x42, 0x44, 0x4E]), // !BDN
      
      // PST format version (Unicode 2003+)
      VERSION_UNICODE: 0x17,
      VERSION_UNICODE_2003: 0x24,
      
      // Header size
      HEADER_SIZE: 564,
      
      // Block and page sizes
      BLOCK_SIZE: 512,
      PAGE_SIZE: 512,
      
      // Node IDs (NIDs) - these are specific PST identifiers
      NID_ROOT_FOLDER: 0x21,
      NID_MESSAGE_STORE: 0x61,
      NID_INBOX: 0x122,
      NID_OUTBOX: 0x142,
      NID_SENT_ITEMS: 0x162,
      NID_DELETED_ITEMS: 0x182,
      
      // Property tags (MAPI properties) - Using hex values for safety
      PROPS: {
        DISPLAY_NAME: 0x3001001F,        // PR_DISPLAY_NAME
        SUBJECT: 0x0037001F,             // PR_SUBJECT
        SENDER_NAME: 0x0C1A001F,         // PR_SENDER_NAME
        SENDER_EMAIL: 0x0C1F001F,        // PR_SENDER_EMAIL_ADDRESS
        MESSAGE_CLASS: 0x001A001F,       // PR_MESSAGE_CLASS
        CREATION_TIME: 0x30070040,       // PR_CREATION_TIME
        LAST_MODIFICATION_TIME: 0x30080040, // PR_LAST_MODIFICATION_TIME
        MESSAGE_SIZE: 0x0E080003,        // PR_MESSAGE_SIZE
        BODY: 0x1000001F,                // PR_BODY
        BODY_HTML: 0x1013001F,           // PR_BODY_HTML
        CONTAINER_CLASS: 0x3613001F,     // PR_CONTAINER_CLASS
      },
      
      // Block types
      BLOCK_TYPE_INTERNAL: 1,
      BLOCK_TYPE_DATA: 2,
      BLOCK_TYPE_SUBALLOC: 3,
    };
    
    // Initialize empty PST structures
    this.nodes = new Map();
    this.blocks = new Map();
    this.nextNid = 0x1000;
    this.nextBlockId = 0x100;
    this.fileSize = this.PST_CONSTANTS.HEADER_SIZE;
  }
  
  /**
   * Create a new PST file from scratch
   */
  async createPstFile(outputPath) {
    console.log('🏗️  Creating new PST file structure...');
    
    // Create the file header
    const header = this.createPstHeader();
    
    // Create fundamental PST structures
    await this.createRootStructures();
    
    // Build B-tree indexes
    await this.buildBTrees();
    
    // Write everything to file
    await this.writePstFile(outputPath, header);
    
    console.log('✅ PST file structure created successfully');
  }
  
  /**
   * Create proper PST header
   */
  createPstHeader() {
    const header = Buffer.alloc(this.PST_CONSTANTS.HEADER_SIZE);
    header.fill(0);
    
    // Signature
    this.PST_CONSTANTS.SIGNATURE.copy(header, 0);
    
    // Version information
    header.writeUInt16LE(this.PST_CONSTANTS.VERSION_UNICODE_2003, 10); // wVer
    header.writeUInt16LE(this.PST_CONSTANTS.VERSION_UNICODE, 12);      // wVerClient
    header.writeUInt8(1, 14); // bPlatformCreate
    header.writeUInt8(1, 15); // bPlatformAccess
    
    // File size (will be updated later)
    header.writeUInt32LE(this.fileSize & 0xFFFFFFFF, 44);
    header.writeUInt32LE((this.fileSize >> 32) & 0xFFFFFFFF, 48);
    
    // Root folder NID
    header.writeUInt32LE(this.PST_CONSTANTS.NID_ROOT_FOLDER, 52);
    
    // Placeholder offsets (will be filled when we create the trees)
    header.writeUInt32LE(0, 240); // NBT offset (8 bytes)
    header.writeUInt32LE(0, 244);
    header.writeUInt32LE(0, 248); // NBT size (8 bytes)  
    header.writeUInt32LE(0, 252);
    
    header.writeUInt32LE(0, 256); // BBT offset (8 bytes)
    header.writeUInt32LE(0, 260);
    header.writeUInt32LE(0, 264); // BBT size (8 bytes)
    header.writeUInt32LE(0, 268);
    
    // Calculate CRC
    const crc = this.calculateCRC(header.slice(8, 516));
    header.writeUInt32LE(crc, 4);
    
    return header;
  }
  
  /**
   * Create fundamental PST structures (folders, message store, etc.)
   */
  async createRootStructures() {
    console.log('📁 Creating root folder structures...');
    
    // Create message store node
    this.createNode(this.PST_CONSTANTS.NID_MESSAGE_STORE, 'messageStore', {
      [this.PST_CONSTANTS.PROPS.DISPLAY_NAME]: 'Personal Folders',
      [this.PST_CONSTANTS.PROPS.CONTAINER_CLASS]: 'IPF.Note'
    });
    
    // Create root folder
    this.createNode(this.PST_CONSTANTS.NID_ROOT_FOLDER, 'folder', {
      [this.PST_CONSTANTS.PROPS.DISPLAY_NAME]: 'Root',
      [this.PST_CONSTANTS.PROPS.CONTAINER_CLASS]: 'IPF.Note'
    });
    
    // Create standard folders
    this.createNode(this.PST_CONSTANTS.NID_INBOX, 'folder', {
      [this.PST_CONSTANTS.PROPS.DISPLAY_NAME]: 'Inbox',
      [this.PST_CONSTANTS.PROPS.CONTAINER_CLASS]: 'IPF.Note'
    });
    
    this.createNode(this.PST_CONSTANTS.NID_OUTBOX, 'folder', {
      [this.PST_CONSTANTS.PROPS.DISPLAY_NAME]: 'Outbox', 
      [this.PST_CONSTANTS.PROPS.CONTAINER_CLASS]: 'IPF.Note'
    });
    
    this.createNode(this.PST_CONSTANTS.NID_SENT_ITEMS, 'folder', {
      [this.PST_CONSTANTS.PROPS.DISPLAY_NAME]: 'Sent Items',
      [this.PST_CONSTANTS.PROPS.CONTAINER_CLASS]: 'IPF.Note'
    });
    
    this.createNode(this.PST_CONSTANTS.NID_DELETED_ITEMS, 'folder', {
      [this.PST_CONSTANTS.PROPS.DISPLAY_NAME]: 'Deleted Items',
      [this.PST_CONSTANTS.PROPS.CONTAINER_CLASS]: 'IPF.Note'
    });
  }
  
  /**
   * Create a new node (folder or message)
   */
  createNode(nid, type, properties) {
    const node = {
      nid: nid,
      type: type,
      properties: properties,
      blockId: this.nextBlockId++,
      parentNid: type === 'folder' && nid !== this.PST_CONSTANTS.NID_ROOT_FOLDER ? 
        this.PST_CONSTANTS.NID_ROOT_FOLDER : 0,
      children: []
    };
    
    this.nodes.set(nid, node);
    
    // Create corresponding data block
    this.createDataBlock(node.blockId, this.serializeNodeProperties(properties));
    
    return node;
  }
  
  /**
   * Add a message to a folder
   */
  addMessage(folderNid, subject, sender, body, htmlBody = null) {
    const messageNid = this.nextNid++;
    const creationTime = new Date();
    
    const messageProperties = {
      [this.PST_CONSTANTS.PROPS.MESSAGE_CLASS]: 'IPM.Note',
      [this.PST_CONSTANTS.PROPS.SUBJECT]: subject,
      [this.PST_CONSTANTS.PROPS.SENDER_NAME]: sender,
      [this.PST_CONSTANTS.PROPS.CREATION_TIME]: creationTime,
      [this.PST_CONSTANTS.PROPS.LAST_MODIFICATION_TIME]: creationTime,
      [this.PST_CONSTANTS.PROPS.BODY]: body,
      [this.PST_CONSTANTS.PROPS.MESSAGE_SIZE]: body.length
    };
    
    if (htmlBody) {
      messageProperties[this.PST_CONSTANTS.PROPS.BODY_HTML] = htmlBody;
    }
    
    const message = this.createNode(messageNid, 'message', messageProperties);
    message.parentNid = folderNid;
    
    // Add to parent folder
    const folder = this.nodes.get(folderNid);
    if (folder) {
      folder.children.push(messageNid);
    }
    
    console.log(`📧 Added message: "${subject}" to folder ${folderNid}`);
    return messageNid;
  }
  
  /**
   * Serialize node properties to binary format
   */
  serializeNodeProperties(properties) {
    const data = Buffer.alloc(64 * 1024); // Allocate 64KB for safety
    let offset = 0;
    
    // Property count
    const propCount = Object.keys(properties).length;
    data.writeUInt32LE(propCount, offset);
    offset += 4;
    
    // Property entries
    for (const [propTag, value] of Object.entries(properties)) {
      if (offset + 100 > data.length) break; // Safety check
      
      const tag = parseInt(propTag);
      // Ensure tag is positive by using unsigned conversion
      const unsignedTag = tag >>> 0; // Convert to unsigned 32-bit
      data.writeUInt32LE(unsignedTag, offset);
      offset += 4;
      
      // Encode value based on property type
      const propType = unsignedTag & 0xFFFF;
      
      switch (propType) {
        case 0x001F: // Unicode string
          const str = String(value).substring(0, 1000); // Limit string length
          const strBytes = Buffer.from(str, 'utf16le');
          if (offset + 4 + strBytes.length < data.length) {
            data.writeUInt32LE(strBytes.length, offset);
            offset += 4;
            strBytes.copy(data, offset);
            offset += strBytes.length;
          }
          break;
          
        case 0x0003: // 32-bit integer
          if (offset + 4 < data.length) {
            data.writeUInt32LE(Number(value) || 0, offset);
            offset += 4;
          }
          break;
          
        case 0x0040: // FILETIME (date)
          if (offset + 8 < data.length) {
            const filetime = this.dateToFiletime(value instanceof Date ? value : new Date());
            data.writeUInt32LE(filetime.low, offset);
            data.writeUInt32LE(filetime.high, offset + 4);
            offset += 8;
          }
          break;
          
        default:
          // String fallback
          const fallbackStr = String(value).substring(0, 500);
          const bytes = Buffer.from(fallbackStr, 'utf8');
          if (offset + 4 + bytes.length < data.length) {
            data.writeUInt32LE(bytes.length, offset);
            offset += 4;
            bytes.copy(data, offset);
            offset += bytes.length;
          }
      }
    }
    
    return data.slice(0, Math.min(offset, data.length));
  }
  
  /**
   * Convert JavaScript Date to Windows FILETIME
   */
  dateToFiletime(date) {
    const timestamp = date.getTime();
    // FILETIME is 100-nanosecond intervals since January 1, 1601
    const filetime = BigInt(timestamp + 11644473600000) * BigInt(10000);
    
    return {
      low: Number(filetime & BigInt(0xFFFFFFFF)) >>> 0,
      high: Number((filetime >> BigInt(32)) & BigInt(0xFFFFFFFF)) >>> 0
    };
  }
  
  /**
   * Create a data block with proper PST formatting
   */
  createDataBlock(blockId, data) {
    // Ensure minimum block size and proper alignment
    const minSize = Math.max(data.length + 16, this.PST_CONSTANTS.BLOCK_SIZE); // +16 for block header
    const alignedSize = Math.ceil(minSize / this.PST_CONSTANTS.BLOCK_SIZE) * this.PST_CONSTANTS.BLOCK_SIZE;
    
    // Create properly formatted block data
    const blockData = Buffer.alloc(alignedSize);
    blockData.fill(0);
    
    // Block header (first 16 bytes)
    blockData.writeUInt32LE(blockId, 0);                    // Block ID
    blockData.writeUInt32LE(data.length, 4);               // Data size
    blockData.writeUInt32LE(this.PST_CONSTANTS.BLOCK_TYPE_DATA, 8); // Block type
    blockData.writeUInt32LE(0, 12);                        // Reserved
    
    // Copy actual data after header
    data.copy(blockData, 16, 0, Math.min(data.length, alignedSize - 16));
    
    const block = {
      blockId: blockId,
      offset: this.fileSize,
      size: alignedSize,
      dataSize: data.length,
      data: blockData
    };
    
    this.blocks.set(blockId, block);
    this.fileSize += alignedSize;
    
    return block;
  }
  
  /**
   * Build B-tree structures (simplified version)
   */
  async buildBTrees() {
    console.log('🌳 Building B-tree indexes...');
    
    // Create Node B-Tree (NBT) - this must reference existing blocks
    const nbtData = this.createNodeBTree();
    
    // Create Block B-Tree (BBT) - this includes all current blocks
    const bbtData = this.createBlockBTree();
    
    // Now create the B-tree blocks themselves (these will be at the end)
    this.nbtBlock = this.createDataBlock(this.nextBlockId++, nbtData);
    this.bbtBlock = this.createDataBlock(this.nextBlockId++, bbtData);
  }
  
  /**
   * Create Node B-Tree data with proper PST format
   */
  createNodeBTree() {
    const entries = Array.from(this.nodes.values());
    // Sort by NID (required for PST format)
    entries.sort((a, b) => a.nid - b.nid);
    
    // NBT entry size: 32 bytes for Unicode format
    const entrySize = 32;
    const headerSize = 16;
    const totalSize = headerSize + (entries.length * entrySize);
    const data = Buffer.alloc(Math.max(totalSize, this.PST_CONSTANTS.BLOCK_SIZE));
    data.fill(0);
    
    let offset = 0;
    
    // B-tree header (16 bytes)
    data.writeUInt8(0x81, offset++);                    // btype: Leaf node
    data.writeUInt8(0x01, offset++);                    // cLevel: Level 1
    data.writeUInt16LE(entries.length, offset); offset += 2;  // cEnt: Entry count
    data.writeUInt32LE(0, offset); offset += 4;        // dwPadding: Reserved
    data.writeUInt32LE(0, offset); offset += 4;        // Reserved part 1
    data.writeUInt32LE(0, offset); offset += 4;        // Reserved part 2
    
    // NBT entries (32 bytes each)
    for (const node of entries) {
      if (offset + entrySize > data.length) break;
      
      const block = this.blocks.get(node.blockId);
      if (!block) continue;
      
      // NBTENTRY structure for Unicode PST
      data.writeUInt32LE(node.nid, offset);              // nid: Node ID
      data.writeUInt32LE(0, offset + 4);                 // Padding
      this.writeUInt64LE(data, node.blockId, offset + 8); // bidData: Block ID (not offset!)
      this.writeUInt64LE(data, 0, offset + 16);          // bidSub: Sub-block (none)
      data.writeUInt32LE(node.parentNid, offset + 24);   // nidParent: Parent NID
      data.writeUInt32LE(0, offset + 28);                // dwPadding: Reserved
      
      offset += entrySize;
    }
    
    return data.slice(0, Math.max(totalSize, this.PST_CONSTANTS.BLOCK_SIZE));
  }
  
  /**
   * Create Block B-Tree data with proper PST format
   */
  createBlockBTree() {
    const blocks = Array.from(this.blocks.values());
    // Sort by Block ID (required for PST format)
    blocks.sort((a, b) => a.blockId - b.blockId);
    
    // BBT entry size: 24 bytes for Unicode format
    const entrySize = 24;
    const headerSize = 16;
    const totalSize = headerSize + (blocks.length * entrySize);
    const data = Buffer.alloc(Math.max(totalSize, this.PST_CONSTANTS.BLOCK_SIZE));
    data.fill(0);
    
    let offset = 0;
    
    // B-tree header (16 bytes)
    data.writeUInt8(0x81, offset++);                    // btype: Leaf node
    data.writeUInt8(0x01, offset++);                    // cLevel: Level 1
    data.writeUInt16LE(blocks.length, offset); offset += 2;   // cEnt: Entry count
    data.writeUInt32LE(0, offset); offset += 4;        // dwPadding: Reserved
    data.writeUInt32LE(0, offset); offset += 4;        // Reserved part 1  
    data.writeUInt32LE(0, offset); offset += 4;        // Reserved part 2
    
    // BBT entries (24 bytes each)
    for (const block of blocks) {
      if (offset + entrySize > data.length) break;
      
      // BBTENTRY structure for Unicode PST
      this.writeUInt64LE(data, block.blockId, offset);    // bref.bid: Block ID
      this.writeUInt64LE(data, block.offset, offset + 8);  // bref.ib: Block offset
      data.writeUInt16LE(1, offset + 16);                 // cRef: Reference count
      data.writeUInt16LE(0, offset + 18);                 // wPadding: Reserved
      data.writeUInt32LE(0, offset + 20);                 // dwPadding: Reserved
      
      offset += entrySize;
    }
    
    return data.slice(0, Math.max(totalSize, this.PST_CONSTANTS.BLOCK_SIZE));
  }
  
  /**
   * Write complete PST file
   */
  async writePstFile(outputPath, header) {
    console.log('💾 Writing PST file...');
    
    // Update header with B-tree information
    if (this.nbtBlock) {
      header.writeUInt32LE(this.nbtBlock.offset & 0xFFFFFFFF, 240);
      header.writeUInt32LE((this.nbtBlock.offset >> 32) & 0xFFFFFFFF, 244);
      header.writeUInt32LE(this.nbtBlock.size & 0xFFFFFFFF, 248);
      header.writeUInt32LE((this.nbtBlock.size >> 32) & 0xFFFFFFFF, 252);
    }
    
    if (this.bbtBlock) {
      header.writeUInt32LE(this.bbtBlock.offset & 0xFFFFFFFF, 256);
      header.writeUInt32LE((this.bbtBlock.offset >> 32) & 0xFFFFFFFF, 260);
      header.writeUInt32LE(this.bbtBlock.size & 0xFFFFFFFF, 264);
      header.writeUInt32LE((this.bbtBlock.size >> 32) & 0xFFFFFFFF, 268);
    }
    
    // Update total file size
    header.writeUInt32LE(this.fileSize & 0xFFFFFFFF, 44);
    header.writeUInt32LE((this.fileSize >> 32) & 0xFFFFFFFF, 48);
    
    // Recalculate CRC
    const crc = this.calculateCRC(header.slice(8, 516));
    header.writeUInt32LE(crc, 4);
    
    // Write file
    const fd = await fs.promises.open(outputPath, 'w');
    
    try {
      // Write header
      await fd.write(header, 0, header.length, 0);
      
      // Write all blocks with proper data
      for (const block of this.blocks.values()) {
        // Write the actual block data (which includes headers and content)
        await fd.write(block.data, 0, block.data.length, block.offset);
      }
      
    } finally {
      await fd.close();
    }
  }
  
  /**
   * Calculate CRC32 checksum
   */
  calculateCRC(data) {
    // Simple CRC32 - in production, use a proper CRC32 implementation
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc = (crc + data[i]) & 0xFFFFFFFF;
    }
    return crc;
  }

  /**
   * Update an existing PST file with new B-tree information
   */
  async updatePstFile(outputPath) {
    console.log('💾 Updating PST file with new B-trees...');
    
    // Create new header with updated B-tree references
    const header = this.createPstHeader();
    
    // Update header with B-tree information
    if (this.nbtBlock) {
      header.writeUInt32LE(this.nbtBlock.offset & 0xFFFFFFFF, 240);
      header.writeUInt32LE((this.nbtBlock.offset >> 32) & 0xFFFFFFFF, 244);
      header.writeUInt32LE(this.nbtBlock.size & 0xFFFFFFFF, 248);
      header.writeUInt32LE((this.nbtBlock.size >> 32) & 0xFFFFFFFF, 252);
    }
    
    if (this.bbtBlock) {
      header.writeUInt32LE(this.bbtBlock.offset & 0xFFFFFFFF, 256);
      header.writeUInt32LE((this.bbtBlock.offset >> 32) & 0xFFFFFFFF, 260);
      header.writeUInt32LE(this.bbtBlock.size & 0xFFFFFFFF, 264);
      header.writeUInt32LE((this.bbtBlock.size >> 32) & 0xFFFFFFFF, 268);
    }
    
    // Recalculate CRC
    const crc = this.calculateCRC(header.slice(8, 516));
    header.writeUInt32LE(crc, 4);
    
    // Write all blocks (including new message blocks)
    const fd = await fs.promises.open(outputPath, 'r+');
    
    try {
      // Update header
      await fd.write(header, 0, header.length, 0);
      
      // Write ALL blocks (this includes new message blocks added after initial creation)
      for (const block of this.blocks.values()) {
        await fd.write(block.data, 0, block.data.length, block.offset);
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
    
    console.log('✅ PST file updated successfully');
  }
  
  /**
   * Write 64-bit value to buffer at offset
   */
  writeUInt64LE(buffer, value, offset) {
    const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
    buffer.writeUInt32LE(Number(bigintValue & 0xFFFFFFFFn), offset);
    buffer.writeUInt32LE(Number(bigintValue >> 32n), offset + 4);
  }
}

module.exports = PstDatabaseWriter;