const fs = require('fs');

const buf = Buffer.alloc(512);
const fd = fs.openSync('your-ost-file.ost', 'r');
fs.readSync(fd, buf, 0, 512, 0);
fs.closeSync(fd);

console.log('First 512 bytes (OST header):');
console.log('=============================');

for(let i = 0; i < 512; i += 16) {
  const chunk = buf.slice(i, Math.min(i+16, 512));
  const hex = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
  const ascii = chunk.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
  console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(47)} | ${ascii}`);
}

// Check specific important offsets
console.log('\n=== Key Header Values ===');
console.log(`Signature (0-3): ${buf.slice(0,4).toString('ascii')} (${Array.from(buf.slice(0,4)).map(b => '0x'+b.toString(16)).join(', ')})`);
console.log(`Major Version (10-11): 0x${buf.readUInt16LE(10).toString(16)}`);
console.log(`File Size (44-51): ${buf.readBigUInt64LE(44)} bytes (${Number(buf.readBigUInt64LE(44))/1024/1024} MB)`);
console.log(`NBT Offset (64-71): ${buf.readBigUInt64LE(64)}`);
console.log(`NBT Size (72-79): ${buf.readBigUInt64LE(72)}`);
console.log(`BBT Offset (96-103): ${buf.readBigUInt64LE(96)}`);
console.log(`BBT Size (104-111): ${buf.readBigUInt64LE(104)}`);