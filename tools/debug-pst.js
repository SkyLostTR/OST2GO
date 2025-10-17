const fs = require('fs');

function analyzePST(filename) {
    console.log(`\n🔍 PST Analysis: ${filename}`);
    console.log('='.repeat(50));
    
    const data = fs.readFileSync(filename);
    
    // Header analysis
    console.log('\n📋 HEADER ANALYSIS:');
    console.log(`File size: ${data.length} bytes`);
    console.log(`Signature: ${data.slice(0, 4).toString()}`);
    console.log(`Version: 0x${data.readUInt16LE(10).toString(16)}`);
    console.log(`Format type: ${data.readUInt8(8)}`);
    
    // B-tree offsets
    const nbtOffset = data.readUInt32LE(240);
    const nbtSize = data.readUInt32LE(248);
    const bbtOffset = data.readUInt32LE(256);
    const bbtSize = data.readUInt32LE(264);
    
    console.log(`\n🌳 B-TREE LOCATIONS:`);
    console.log(`NBT offset: ${nbtOffset}, size: ${nbtSize}`);
    console.log(`BBT offset: ${bbtOffset}, size: ${bbtSize}`);
    
    // Analyze NBT (Node B-Tree)
    if (nbtOffset > 0 && nbtOffset < data.length) {
        console.log('\n📊 NODE B-TREE ANALYSIS:');
        analyzeNBT(data, nbtOffset);
    }
    
    // Analyze BBT (Block B-Tree)
    if (bbtOffset > 0 && bbtOffset < data.length) {
        console.log('\n🧱 BLOCK B-TREE ANALYSIS:');
        analyzeBBT(data, bbtOffset);
    }
}

function analyzeNBT(data, offset) {
    try {
        // Skip to NBT data (after block header)
        const nbtData = offset + 16;
        
        const btype = data.readUInt8(nbtData);
        const level = data.readUInt8(nbtData + 1);
        const entryCount = data.readUInt16LE(nbtData + 2);
        
        console.log(`Type: 0x${btype.toString(16)}, Level: ${level}, Entries: ${entryCount}`);
        
        // Read NBT entries (32 bytes each)
        let entryOffset = nbtData + 16;
        console.log('\nNBT Entries:');
        for (let i = 0; i < Math.min(entryCount, 10); i++) {
            const nid = data.readUInt32LE(entryOffset);
            const bidData = data.readUInt32LE(entryOffset + 8);
            const bidSub = data.readUInt32LE(entryOffset + 16);
            const parentNid = data.readUInt32LE(entryOffset + 24);
            
            console.log(`  Entry ${i}: NID=${nid}, BID_DATA=${bidData}, BID_SUB=${bidSub}, PARENT=${parentNid}`);
            entryOffset += 32;
        }
    } catch (error) {
        console.log(`❌ Error reading NBT: ${error.message}`);
    }
}

function analyzeBBT(data, offset) {
    try {
        // Skip to BBT data (after block header)
        const bbtData = offset + 16;
        
        const btype = data.readUInt8(bbtData);
        const level = data.readUInt8(bbtData + 1);
        const entryCount = data.readUInt16LE(bbtData + 2);
        
        console.log(`Type: 0x${btype.toString(16)}, Level: ${level}, Entries: ${entryCount}`);
        
        // Read BBT entries (24 bytes each)
        let entryOffset = bbtData + 16;
        console.log('\nBBT Entries:');
        for (let i = 0; i < Math.min(entryCount, 10); i++) {
            const blockId = data.readUInt32LE(entryOffset);
            const blockOffset = data.readUInt32LE(entryOffset + 8);
            const refCount = data.readUInt16LE(entryOffset + 16);
            
            console.log(`  Entry ${i}: BLOCK_ID=${blockId}, OFFSET=${blockOffset}, REF_COUNT=${refCount}`);
            
            // Check if block actually exists at that offset
            if (blockOffset < data.length) {
                const blockHeader = data.readUInt32LE(blockOffset);
                console.log(`    Block at ${blockOffset}: header=0x${blockHeader.toString(16)}`);
            } else {
                console.log(`    ❌ Block offset ${blockOffset} is beyond file size!`);
            }
            
            entryOffset += 24;
        }
    } catch (error) {
        console.log(`❌ Error reading BBT: ${error.message}`);
    }
}

// Analyze the fixed PST file
analyzePST('fixed-node-blocks.pst');