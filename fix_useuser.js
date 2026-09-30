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
    
    // Don't modify ClientLayout or useUnifiedAuth itself
    if (filePath.includes('ClientLayout.tsx') || filePath.includes('useUnifiedAuth.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We need to replace import { useUser } from "@clerk/nextjs";
    // Or import { ..., useUser, ... } from "@clerk/nextjs";
    // With import { useUnifiedAuth } from "@/lib/useUnifiedAuth";
    
    if (content.includes('useUser')) {
        // If it's importing useUser from clerk
        const importRegex = /import\s*\{([^}]*useUser[^}]*)\}\s*from\s*['"]@clerk\/nextjs['"]/g;
        content = content.replace(importRegex, (match, importsStr) => {
            const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
            const filteredImports = imports.filter(i => i !== 'useUser');
            
            let newLines = [];
            if (filteredImports.length > 0) {
                newLines.push(`import { ${filteredImports.join(', ')} } from "@clerk/nextjs";`);
            }
            newLines.push(`import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";`);
            return newLines.join('\n');
        });
        
        // Ensure the replacement actually happened and it didn't miss something.
        // If they imported useUser directly without {}, wait, Clerk always uses `{ useUser }`.
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Modified:", filePath);
        filesModified++;
    }
});

console.log("Total files modified:", filesModified);
