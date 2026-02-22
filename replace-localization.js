const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (/\.(tsx|ts|js|jsx)$/.test(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;

            // Phones
            content = content.replace(/\+233\s?54\s?501\s?0949/g, '+14696865468');
            content = content.replace(/\+1234567890/g, '+14696865468');

            // Address / Location
            content = content.replace(/Accra, Ghana/g, 'Texas USA');
            content = content.replace(/Accra location/g, 'Texas location');
            content = content.replace(/across Ghana/g, 'across the USA');
            content = content.replace(/anywhere in Ghana/g, 'anywhere in the USA');

            // Currency
            content = content.replace(/'GHS'/g, "'USD'");
            content = content.replace(/"GHS"/g, '"USD"');
            content = content.replace(/GH₵/g, '$');
            content = content.replace(/GHS\s?(\d+)/g, '$$$1'); // e.g. GHS 20 -> $20
            content = content.replace(/Ghana Cedis \(GHS\)/g, 'USA DOLLARS (USD)');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInFiles(path.join(__dirname, 'app'));
replaceInFiles(path.join(__dirname, 'components'));
replaceInFiles(path.join(__dirname, 'context'));
replaceInFiles(path.join(__dirname, 'lib'));
console.log('done');
