
const fs = require('fs');
const path = require('path');

const regularPath = path.join(__dirname, 'src/assets/fonts/NotoSansArabic-Regular.ttf');
const boldPath = path.join(__dirname, 'src/assets/fonts/NotoSansArabic-Bold.ttf');
const outputPath = path.join(__dirname, 'src/assets/fonts/noto_base64.js');

try {
    const regular = fs.readFileSync(regularPath);
    const bold = fs.readFileSync(boldPath);

    const content = `export const notoRegular = "${regular.toString('base64')}";\nexport const notoBold = "${bold.toString('base64')}";`;

    fs.writeFileSync(outputPath, content);
    console.log('Successfully created noto_base64.js');
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
