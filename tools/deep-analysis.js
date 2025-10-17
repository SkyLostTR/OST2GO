const fs = require('fs');

function deepAnalysis(filename) {
    console.log(`\n🔬 DEEP PST ANALYSIS: ${filename}`);
    console.log('='.repeat(60));
    
    const data = fs.readFileSync(filename);
    
    // Get B-tree locations
    const nbtOffset = data.readUInt32LE(240);
    const bbtOffset = data.readUInt32LE(256);
    
    console.log(`\n📊 NBT at offset: ${nbtOffset}`);
    console.log(`📊 BBT at offset: ${bbtOffset}`);
    
    // Read NBT entries
    const nbtData = nbtOffset + 16; // Skip block header
    const nbtCount = data.readUInt16LE(nbtData + 2);
    
    console.log(`\n🔍 DETAILED NBT->BBT->BLOCK CHAIN ANALYSIS:`);
    console.log('='.repeat(60));
    
    let entryOffset = nbtData + 16;
    for (let i = 0; i < nbtCount; i++) {
        const nid = data.readUInt32LE(entryOffset);
        const bidData = data.readUInt32LE(entryOffset + 8);
        
        console.log(`\n📌 NBT Entry ${i}: NID=${nid}, wants Block ID=${bidData}`);
        
        // Find this block in BBT
        const bbtData = bbtOffset + 16; // Skip block header
        const bbtCount = data.readUInt16LE(bbtData + 2);
        
        let found = false;
        let bbtEntryOffset = bbtData + 16;
        for (let j = 0; j < bbtCount; j++) {
            const blockId = data.readUInt32LE(bbtEntryOffset);
            const blockOffset = data.readUInt32LE(bbtEntryOffset + 8);
            
            if (blockId === bidData) {
                console.log(`  ✅ Found in BBT Entry ${j}: Block ID=${blockId}, Offset=${blockOffset}`);
                
                // Check the actual block at that offset
                if (blockOffset < data.length && blockOffset >= 564) {
                    const blockHeader = data.readUInt32LE(blockOffset);
                    const blockSize = data.readUInt32LE(blockOffset + 4);
                    const blockType = data.readUInt32LE(blockOffset + 8);
                    
                    console.log(`  📦 Block at offset ${blockOffset}:`);
                    console.log(`     - Header Block ID: 0x${blockHeader.toString(16)} (expected 0x${blockId.toString(16)})`);
                    console.log(`     - Data Size: ${blockSize} bytes`);
                    console.log(`     - Block Type: 0x${blockType.toString(16)}`);
                    
                    if (blockHeader !== blockId) {
                        console.log(`     ❌ MISMATCH! Block header says ${blockHeader} but BBT says ${blockId}`);
                    } else {
                        console.log(`     ✅ Block header matches BBT entry`);
                    }
                    
                    // Show first 32 bytes of actual data
                    const dataStart = blockOffset + 16;
                    if (dataStart + 32 < data.length) {
                        const sample = data.slice(dataStart, dataStart + 32);
                        console.log(`     - First 32 bytes: ${sample.toString('hex')}`);
                    }
                } else {
                    console.log(`  ❌ Block offset ${blockOffset} is invalid!`);
                }
                
                found = true;
                break;
            }
            bbtEntryOffset += 24;
        }
        
        if (!found) {
            console.log(`  ❌ NOT FOUND in BBT! XstReader will fail here.`);
        }
        
        entryOffset += 32;
    }
    
    // Check if BBT/NBT blocks reference themselves
    console.log(`\n\n🔄 CHECKING FOR SELF-REFERENCES:`);
    console.log(`NBT Block should be listed in BBT...`);
    
    const bbtData = bbtOffset + 16;
    const bbtCount = data.readUInt16LE(bbtData + 2);
    let bbtEntryOffset = bbtData + 16;
    
    for (let j = 0; j < bbtCount; j++) {
        const blockId = data.readUInt32LE(bbtEntryOffset);
        const blockOffset = data.readUInt32LE(bbtEntryOffset + 8);
        
        if (blockOffset === nbtOffset) {
            console.log(`✅ NBT block (offset ${nbtOffset}) is in BBT as Block ID ${blockId}`);
        }
        if (blockOffset === bbtOffset) {
            console.log(`✅ BBT block (offset ${bbtOffset}) is in BBT as Block ID ${blockId}`);
        }
        
        bbtEntryOffset += 24;
    }
}

deepAnalysis('corrected-blocks.pst');
