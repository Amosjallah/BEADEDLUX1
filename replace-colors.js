const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (/\.(tsx|ts|jsx|js|css)$/.test(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;

            // Replace blue with sky
            content = content.replace(/\b(?:text|bg|border|ring|shadow|from|to|via)-blue-([1-9]00|50)\b/g, (match) => {
                return match.replace('blue', 'sky');
            });
            content = content.replace(/\bhover:(?:text|bg|border|ring|shadow)-blue-([1-9]00|50)\b/g, (match) => {
                return match.replace('blue', 'sky');
            });

            // Specific background grey changes for buttons/banners
            content = content.replace(/\bbg-gray-900\b/g, 'bg-sky-600');
            content = content.replace(/\bbg-gray-800\b/g, 'bg-sky-500');
            content = content.replace(/\bbg-black\b/g, 'bg-sky-600');
            content = content.replace(/\bhover:bg-black\b/g, 'hover:bg-sky-700');
            content = content.replace(/\bhover:bg-gray-[89]00\b/g, 'hover:bg-sky-700');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInFiles(path.join(__dirname, 'app'));
replaceInFiles(path.join(__dirname, 'components'));
console.log('done');
