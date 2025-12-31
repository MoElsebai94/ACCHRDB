const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'client/public/logo.png');
try {
    const bitmap = fs.readFileSync(logoPath);
    const base64 = Buffer.from(bitmap).toString('base64');
    console.log(`data:image/png;base64,${base64}`);
} catch (e) {
    console.error('Error reading file:', e);
}
