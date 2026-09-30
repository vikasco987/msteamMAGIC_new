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
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Check if it starts with an import we added
    const importRegex = /^(import\s*\{\s*(useUnifiedAuth as useUser|useUnifiedAuth as useUser, useAuth|useAuth|useAuth, useUnifiedAuth as useUser)\s*\}\s*from\s*['"]@\/lib\/useUnifiedAuth['"];?\n)/;
    const match = content.match(importRegex);
    
    if (match) {
        const importStatement = match[1];
        let remainingContent = content.slice(importStatement.length);
        
        // Find if the remaining content has "use client" near the top (ignoring comments)
        const lines = remainingContent.split('\n');
        let useClientIndex = -1;
        
        for (let i = 0; i < Math.min(15, lines.length); i++) {
            if (lines[i].trim() === '"use client"' || lines[i].trim() === "'use client'" || lines[i].trim() === '"use client";' || lines[i].trim() === "'use client';") {
                useClientIndex = i;
                break;
            }
        }
        
        if (useClientIndex !== -1) {
            // We need to move the import BELOW the "use client" line
            const beforeUseClient = lines.slice(0, useClientIndex + 1).join('\n');
            const afterUseClient = lines.slice(useClientIndex + 1).join('\n');
            content = beforeUseClient + '\n' + importStatement + afterUseClient;
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Modified to push import down:", filePath);
            filesModified++;
        }
    }
});

console.log("Total files modified:", filesModified);
