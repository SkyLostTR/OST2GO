const fs = require('fs-extra');
const path = require('path');
const OstToPstConverter = require('../src/converter/OstToPstConverter');

/**
 * Simple test suite for the OST to PST converter
 */

async function runTests() {
  console.log('Running OST to PST Converter Tests');
  console.log('==================================\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Constructor
  try {
    const converter = new OstToPstConverter();
    console.log('✓ Test 1: Constructor - PASSED');
    passed++;
  } catch (error) {
    console.log('✗ Test 1: Constructor - FAILED:', error.message);
    failed++;
  }
  
  // Test 2: Constructor with options
  try {
    const converter = new OstToPstConverter({
      utf8Support: false,
      overwrite: true,
      chunkSize: 2048
    });
    
    if (converter.options.utf8Support === false && 
        converter.options.overwrite === true &&
        converter.options.chunkSize === 2048) {
      console.log('✓ Test 2: Constructor with options - PASSED');
      passed++;
    } else {
      throw new Error('Options not set correctly');
    }
  } catch (error) {
    console.log('✗ Test 2: Constructor with options - FAILED:', error.message);
    failed++;
  }
  
  // Test 3: processChunkAdvanced method
  try {
    const converter = new OstToPstConverter();
    const testChunk = Buffer.from('Hello, World!');
    const processedChunk = converter.processChunkAdvanced(testChunk, 1024);
    
    if (Buffer.isBuffer(processedChunk)) {
      console.log('✓ Test 3: processChunkAdvanced method - PASSED');
      passed++;
    } else {
      throw new Error('processChunkAdvanced did not return a Buffer');
    }
  } catch (error) {
    console.log('✗ Test 3: processChunkAdvanced method - FAILED:', error.message);
    failed++;
  }
  
  // Test 4: isBlockHeader method
  try {
    const converter = new OstToPstConverter();
    const blockBuffer = Buffer.alloc(20);
    blockBuffer.writeUInt32LE(0x01010101, 0); // Block signature
    const nonBlockBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
    
    if (converter.isBlockHeader(blockBuffer, 0) && !converter.isBlockHeader(nonBlockBuffer, 0)) {
      console.log('✓ Test 4: isBlockHeader method - PASSED');
      passed++;
    } else {
      throw new Error('Block header detection not working correctly');
    }
  } catch (error) {
    console.log('✗ Test 4: isBlockHeader method - FAILED:', error.message);
    failed++;
  }
  
  // Test 5: ensureUtf8Encoding method
  try {
    const converter = new OstToPstConverter();
    const testText = 'Test with special chars: ñáéíóú';
    const testBuffer = Buffer.from(testText, 'utf8');
    const result = converter.ensureUtf8Encoding(testBuffer);
    
    if (Buffer.isBuffer(result) && result.toString('utf8') === testText) {
      console.log('✓ Test 5: ensureUtf8Encoding method - PASSED');
      passed++;
    } else {
      throw new Error('UTF-8 encoding not working correctly');
    }
  } catch (error) {
    console.log('✗ Test 5: ensureUtf8Encoding method - FAILED:', error.message);
    failed++;
  }
  
  // Test 6: isPstFormat method
  try {
    const converter = new OstToPstConverter();
    const pstBuffer = Buffer.from([0x21, 0x42, 0x44, 0x4E, 0x00, 0x01]);
    const nonPstBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
    
    if (converter.isPstFormat(pstBuffer) && !converter.isPstFormat(nonPstBuffer)) {
      console.log('✓ Test 6: isPstFormat method - PASSED');
      passed++;
    } else {
      throw new Error('PST format detection not working correctly');
    }
  } catch (error) {
    console.log('✗ Test 6: isPstFormat method - FAILED:', error.message);
    failed++;
  }
  
  // Test 7: File info validation
  try {
    const converter = new OstToPstConverter();
    
    // Create a temporary test file
    const testFilePath = path.join(__dirname, 'temp_test.ost');
    await fs.writeFile(testFilePath, 'Test OST content');
    
    const info = await converter.getFileInfo(testFilePath);
    
    // Clean up
    await fs.remove(testFilePath);
    
    if (info.path && info.size && info.created && info.modified && info.type) {
      console.log('✓ Test 7: getFileInfo method - PASSED');
      passed++;
    } else {
      throw new Error('File info not complete');
    }
  } catch (error) {
    console.log('✗ Test 7: getFileInfo method - FAILED:', error.message);
    failed++;
  }
  
  // Test Summary
  console.log('\n==================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`Total Tests: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = runTests;