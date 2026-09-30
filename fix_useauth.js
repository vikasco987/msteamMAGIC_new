const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const appDir = path.join(__dirname, 'src/app');
let filesModified = 0;

walkDir(appDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    if (filePath.includes('ClientLayout.tsx') || filePath.includes('useUnifiedAuth.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    if (content.includes('useAuth')) {
        const importRegex = /import\s*\{([^}]*useAuth[^}]*)\}\s*from\s*['"]@clerk\/nextjs['"]/g;
        content = content.replace(importRegex, (match, importsStr) => {
            const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
            const filteredImports = imports.filter(i => i !== 'useAuth');
            
            let newLines = [];
            if (filteredImports.length > 0) {
                newLines.push(`import { ${filteredImports.join(', ')} } from "@clerk/nextjs";`);
            }
            newLines.push(`import { useAuth } from "@/lib/useUnifiedAuth";`);
            return newLines.join('\n');
        });
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Modified:", filePath);
        filesModified++;
    }
});

console.log("Total files modified:", filesModified);
