const PstValidator = require('./src/validator/PstValidator');

async function testValidator() {
  const validator = new PstValidator();
  
  console.log('Testing PST Validator on our generated files...\n');
  
  // Test the latest working file
  const testFiles = [
    'final-fix.pst',
    'production-ready.pst'
  ];
  
  for (const file of testFiles) {
    console.log('\n' + '='.repeat(60));
    console.log(`Testing: ${file}`);
    console.log('='.repeat(60));
    
    const results = await validator.validate(file);
    validator.displayReport();
    
    if (results.isValid) {
      console.log(`\n✅ ${file} is VALID and ready for use!`);
    } else {
      console.log(`\n❌ ${file} has issues that need attention`);
    }
  }
}

testValidator().catch(console.error);
