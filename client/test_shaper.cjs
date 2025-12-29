
const reshaper = require('./node_modules/arabic-persian-reshaper/index.js');

const safeReshape = (text) => {
    if (!text || typeof text !== 'string') return text || '-';
    // Logic: 
    // 1. Check for Arabic characters.
    // 2. If present, shape (connect letters) then REVERSE the string.
    //    Reversing is strictly necessary because jsPDF renders LTR. 
    //    By reversing the shaped string, the last letter (leftmost in RTL word) 
    //    is drawn first (leftmost in LTR draw), resulting in correct RTL visual order.
    // 3. If no Arabic, return as is (preserves English/Numbers).
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (!hasArabic) return text;

    try {
        const shaped = reshaper.ArabicShaper.convertArabic(text);
        return shaped.split('').reverse().join('');
    } catch (e) {
        console.error('Shaping failed:', e);
        return text;
    }
};

const text = "المقاولون العرب";
const shapedReversed = safeReshape(text);

console.log("Original:", text);
console.log("Shaped & Reversed (Visual representation in LTR terminal might look weird):", shapedReversed);

// Analyze hex codes
console.log("\nHex Codes:");
for (let i = 0; i < shapedReversed.length; i++) {
    console.log(shapedReversed.charCodeAt(i).toString(16));
}
