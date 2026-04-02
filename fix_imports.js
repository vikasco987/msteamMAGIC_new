const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\VIKASH\\msteamMAGIC\\src';
const patterns = [
    { regex: /['"]\.\.\/.*lib\/prisma['"]/g, replacement: '"@/lib/prisma"' },
    { regex: /['"]\.\.\/.*lib\/colorUtils['"]/g, replacement: '"@/lib/colorUtils"' }
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let newContent = content;
            patterns.forEach(p => {
                newContent = newContent.replace(p.regex, p.replacement);
            });
            if (newContent !== content) {
                console.log(`Updating ${filePath}`);
                fs.writeFileSync(filePath, newContent, 'utf8');
            }
        }
    });
}

walk(rootDir);
