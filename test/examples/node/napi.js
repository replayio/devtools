const isValidUTF8 = require('utf-8-validate');
const buf = Buffer.from([0xf0, 0x90, 0x80, 0x80]);
console.log(isValidUTF8(buf));
