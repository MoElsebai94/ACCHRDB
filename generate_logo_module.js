const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'client/public/logo.png');
const outputPath = path.join(__dirname, 'client/src/assets/logoBase64.js');

try {
    const bitmap = fs.readFileSync(logoPath);
    const base64 = Buffer.from(bitmap).toString('base64');
    const content = `export const logoBase64 = "data:image/png;base64,${base64}";`;

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    console.log('Successfully created client/src/assets/logoBase64.js');
} catch (e) {
    console.error('Error:', e);
}
